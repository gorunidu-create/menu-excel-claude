// Texte d'une carte livrée en Word (.docx) : paragraphes, tabulations conservées (prix alignés),
// lignes de tableau Word = une ligne, cellules séparées par une tabulation. Zéro dépendance.
// Usage : node docxtext.js <carte.docx>
const fs=require('fs'),zlib=require('zlib');
const buf=fs.readFileSync(process.argv[2]);
let e=buf.length-22;while(e>=0&&buf.readUInt32LE(e)!==0x06054b50)e--;
let p=buf.readUInt32LE(e+16);const n=buf.readUInt16LE(e+10);
let xml='';
for(let i=0;i<n;i++){
 const method=buf.readUInt16LE(p+10),csize=buf.readUInt32LE(p+20),nl=buf.readUInt16LE(p+28),xl=buf.readUInt16LE(p+30),cl=buf.readUInt16LE(p+32),lo=buf.readUInt32LE(p+42);
 const name=buf.toString('utf8',p+46,p+46+nl);
 if(name==='word/document.xml'){
  const ds=lo+30+buf.readUInt16LE(lo+26)+buf.readUInt16LE(lo+28);
  const raw=buf.subarray(ds,ds+csize);
  xml=(method===8?zlib.inflateRawSync(raw):raw).toString('utf8');
 }
 p+=46+nl+xl+cl;
}
if(!xml){console.error('word/document.xml introuvable : est-ce bien un .docx ?');process.exit(1);}
const para=s=>s.replace(/<w:tab\/>/g,'\t').replace(/<w:br\/>/g,'\n').replace(/<[^>]+>/g,'');
xml=xml.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g,tr=>'<w:p>'+[...tr.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)]
 .map(tc=>[...tc[0].matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map(x=>para(x[0])).join(' ').trim()).join('<w:tab/>')+'</w:p>');
const out=[...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map(x=>para(x[0])).join('\n')
 .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
console.log(out);
