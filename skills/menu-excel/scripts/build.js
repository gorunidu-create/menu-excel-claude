// Usage : node build.js <items.js> "<MENU CLIENT>" [dossier_sortie]
// Produit le fichier d'import articles Restomax au format du template officiel BOW (20 colonnes) :
// le classeur part de template.json (feuilles Sheet1 / YES_NO / VAT, en-tetes en gras, listes
// deroulantes) et on n'ajoute que les lignes articles. Zero dependance.
const fs=require('fs'),os=require('os'),path=require('path');
const [itemsArg,title,outDir]=process.argv.slice(2);
if(!itemsArg||!title){console.error('Usage : node build.js <items.js> "<MENU CLIENT>" [dossier_sortie]');process.exit(1);}
const cats=require(path.resolve(itemsArg));
const desktop=()=>{const h=os.homedir();for(const d of [path.join(h,'Desktop'),path.join(h,'OneDrive','Desktop'),path.join(h,'OneDrive','Bureau'),path.join(h,'Bureau')])if(fs.existsSync(d))return d;return process.cwd();};
const TPL=require('./template.json');
const YES='oui / yes / ja',NO='non / no / nee';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
// s=4 : texte (@) ; s=6 : nombre 0.00 — memes styles que les colonnes du template
const T=(ref,v,s)=>`<c r="${ref}"${s?` s="${s}"`:''} t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
const N=(ref,v,s)=>`<c r="${ref}"${s?` s="${s}"`:''}><v>${v}</v></c>`;
let rows='',r=1;
for(const [lvl1,vat,items] of cats) for(const [name,price,desc] of items){
  r++;
  let c=T('B'+r,YES)+T('C'+r,name,4)+T('D'+r,name,4)+T('E'+r,name,4)+T('H'+r,lvl1,4)
    +N('I'+r,vat[0])+N('J'+r,vat[1])+N('K'+r,price,6);
  if(desc) c+=T('L'+r,desc,4);
  c+=T('Q'+r,NO);
  rows+=`<row r="${r}" spans="1:20">${c}</row>`;
}
const files=TPL.parts.map(([name,data])=>{
  if(name==='xl/worksheets/sheet1.xml') data=data.replace('{{DIM}}','A1:T'+r).replace('{{ROWS}}',()=>rows);
  if(name==='docProps/core.xml') data=data.replace('{{TITLE}}',()=>esc(title));
  return {name,data:Buffer.from(data,'utf8')};
});
const zip=require('./zipw.js');const dest=path.join(outDir||desktop(),title+'.xlsx');
fs.writeFileSync(dest,zip(files));
console.log('OK',r-1,'articles ->',dest);
