// Usage : node build.js <items.js> "<MENU CLIENT>" [dossier_sortie]
const fs=require('fs'),os=require('os'),path=require('path');
const [itemsArg,title,outDir]=process.argv.slice(2);
if(!itemsArg||!title){console.error('Usage : node build.js <items.js> "<MENU CLIENT>" [dossier_sortie]');process.exit(1);}
const cats=require(path.resolve(itemsArg));
const desktop=()=>{const h=os.homedir();for(const d of [path.join(h,'Desktop'),path.join(h,'OneDrive','Desktop'),path.join(h,'OneDrive','Bureau'),path.join(h,'Bureau')])if(fs.existsSync(d))return d;return process.cwd();};
const HDR=['id','active','stock','name_fr','name_nl','name_en','description_fr','description_nl','description_en','barcode','internal_reference','internal_reference2','azure_image1','idMapping','fidelity_percent_point','net_weight','compute_item_supplier_last_purchase_price','ask_price','category1','category2','category3','category4','category5','category6','category7','category8','category9','level1','level2','Level3','purchase_price','vat_rate','vat_rate_takeaway','price_vat_included','price_rrp','general_account_sale','general_account_purchase','supplier','supplier_purchase_price','supplier_main','picker_order_number','picker_ingredient_fr','picker_ingredient_en','picker_ingredient_nl','creation_date','modification_date','ask_weight','scale_connected','sale_quantity_decimal','purchase_quantity_decimal','price_vat_excluded'];
const col=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=(i-m-1)/26;}return s;};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const T=(r,i,v)=>`<c r="${col(i)}${r}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
const N=(r,i,v)=>`<c r="${col(i)}${r}"><v>${v}</v></c>`;
let rows=[`<row r="1" spans="1:51">`+HDR.map((h,i)=>T(1,i,h)).join('')+`</row>`];
let r=1;
for(const [lvl1,vat,items] of cats) for(const [name,price,desc] of items){
  r++;
  let c=N(r,1,1)+N(r,2,0)+T(r,3,name)+T(r,4,name)+T(r,5,name);
  if(desc) c+=T(r,6,desc);
  c+=T(r,27,lvl1)+N(r,31,vat[0])+N(r,32,vat[1])+N(r,33,price);
  rows.push(`<row r="${r}" spans="1:51">`+c+`</row>`);
}
const NS='xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet ${NS}><dimension ref="A1:AY${r}"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="14.4"/><cols><col min="4" max="6" width="34" customWidth="1"/><col min="7" max="7" width="40" customWidth="1"/><col min="28" max="28" width="26" customWidth="1"/><col min="32" max="34" width="18" customWidth="1"/></cols><sheetData>${rows.join('')}</sheetData></worksheet>`;
const out=fs.mkdtempSync(path.join(os.tmpdir(),'xlbuild'));
fs.mkdirSync(out+'/_rels',{recursive:true});fs.mkdirSync(out+'/xl/_rels',{recursive:true});fs.mkdirSync(out+'/xl/worksheets',{recursive:true});fs.mkdirSync(out+'/docProps',{recursive:true});
fs.writeFileSync(out+'/[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
fs.writeFileSync(out+'/_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
fs.writeFileSync(out+'/xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook ${NS}><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`);
fs.writeFileSync(out+'/xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
fs.writeFileSync(out+'/xl/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet ${NS}><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
fs.writeFileSync(out+'/docProps/core.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>UnidU</dc:creator><cp:lastModifiedBy>UnidU</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0,19)}Z</dcterms:created></cp:coreProperties>`);
fs.writeFileSync(out+'/docProps/app.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Microsoft Excel</Application></Properties>`);
fs.writeFileSync(out+'/xl/worksheets/sheet1.xml',sheet);
const zip=require("./zipw.js");const dest=path.join(outDir||desktop(),title+'.xlsx');

const files=["[Content_Types].xml","_rels/.rels","docProps/core.xml","docProps/app.xml","xl/workbook.xml","xl/_rels/workbook.xml.rels","xl/styles.xml","xl/worksheets/sheet1.xml"].map(n=>({name:n,data:fs.readFileSync(out+"/"+n)}));fs.writeFileSync(dest,zip(files));fs.rmSync(out,{recursive:true,force:true});
console.log('OK',r-1,'articles ->',dest);
