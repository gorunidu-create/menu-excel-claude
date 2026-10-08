// Reprise d'un menu déjà livré : relit un .xlsx d'import articles et réécrit le fichier d'articles
// (items.js) correspondant, regroupé par catégorie + TVA. On complète ensuite items.js et on
// régénère avec build.js, sans rien perdre de l'existant. Zéro dépendance.
// Usage : node toitems.js <menu.xlsx> <items.js>
const fs=require('fs'),zlib=require('zlib');
const [src,dest]=process.argv.slice(2);
if(!src||!dest){console.error('Usage : node toitems.js <menu.xlsx> <items.js>');process.exit(1);}
const buf=fs.readFileSync(src);
let e=buf.length-22;while(e>=0&&buf.readUInt32LE(e)!==0x06054b50)e--;
let p=buf.readUInt32LE(e+16);const n=buf.readUInt16LE(e+10);
const files={};
for(let i=0;i<n;i++){
 const method=buf.readUInt16LE(p+10),csize=buf.readUInt32LE(p+20),nl=buf.readUInt16LE(p+28),xl=buf.readUInt16LE(p+30),cl=buf.readUInt16LE(p+32),lo=buf.readUInt32LE(p+42);
 const name=buf.toString('utf8',p+46,p+46+nl);
 const ds=lo+30+buf.readUInt16LE(lo+26)+buf.readUInt16LE(lo+28);
 const raw=buf.subarray(ds,ds+csize);
 files[name]=(method===8?zlib.inflateRawSync(raw):raw).toString('utf8');
 p+=46+nl+xl+cl;
}
const un=s=>s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(m,d)=>String.fromCharCode(d)).replace(/&amp;/g,'&');
const R=(b,f='g')=>new RegExp(b.replace(/@/g,'(?:\\w+:)?'),f);
const texts=x=>[...x.matchAll(R('<@t(?:\\s[^>]*)?>([\\s\\S]*?)</@t>'))].map(t=>un(t[1])).join('');
const shared=files['xl/sharedStrings.xml']?[...files['xl/sharedStrings.xml'].matchAll(R('<@si>([\\s\\S]*?)</@si>'))].map(m=>texts(m[1])):[];
const sheet=files['xl/worksheets/sheet1.xml']||files[Object.keys(files).find(f=>/^xl\/worksheets\/[^/]+\.xml$/.test(f))];
if(!sheet){console.error('Aucune feuille dans '+src);process.exit(1);}
const out=[];
for(const r of sheet.matchAll(R('<@row\\b[^>]*>([\\s\\S]*?)</@row>'))){
 const cells={};
 for(const c of r[1].matchAll(R('<@c\\b([^>]*?)(?:/>|>([\\s\\S]*?)</@c>)'))){
  const ref=(c[1].match(/\br="([A-Z]+)\d+"/)||[])[1];if(!ref)continue;
  const t=(c[1].match(/\bt="([^"]*)"/)||[])[1],body=c[2]||'';
  let v=(body.match(R('<@v>([\\s\\S]*?)</@v>',''))||[])[1];
  if(t==='s')v=shared[+v];else if(t==='inlineStr')v=texts(body);else if(v!==undefined)v=un(v);
  if(v!==undefined)cells[ref]=String(v);
 }
 if(!cells.D||cells.D==='name_fr')continue;
 out.push({name:cells.D,desc:cells.G||'',cat:cells.AB||'SANS CATEGORIE',v1:Number(cells.AF),v2:Number(cells.AG),price:Number(cells.AH)||0});
}
const groups=[];
for(const it of out){
 let g=groups.find(g=>g.cat===it.cat&&g.v1===it.v1&&g.v2===it.v2);
 if(!g){g={cat:it.cat,v1:it.v1,v2:it.v2,items:[]};groups.push(g);}
 g.items.push(it);
}
const q=s=>"'"+String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
const vat=(a,b)=>a===0.21&&b===0.21?'A':a===0.21&&b===0.06?'S':a===0.12&&b===0.06?'F':`[${a}, ${b}]`;
let js=`// Repris de ${src.split(/[\\/]/).pop()} — [nom, prix TTC, description?]\nconst A = [0.21, 0.21], S = [0.21, 0.06], F = [0.12, 0.06]; // Alcool / Soft & chaud / Food\nmodule.exports = [\n`;
for(const g of groups){
 js+=` [${q(g.cat)}, ${vat(g.v1,g.v2)}, [\n`;
 for(const it of g.items)js+=`   [${q(it.name)}, ${it.price.toFixed(2)}${it.desc?', '+q(it.desc):''}],\n`;
 js+=` ]],\n`;
}
js+=`];\n`;
fs.writeFileSync(dest,js);
console.log(out.length+' articles repris : '+groups.map(g=>g.cat+' ('+g.items.length+')').join(', ')+'\n-> '+dest);
