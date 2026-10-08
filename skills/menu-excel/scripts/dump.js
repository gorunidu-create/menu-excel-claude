// Relit un .xlsx et affiche les cellules remplies (vérification, ou lecture d'une carte client
// livrée en Excel). Zéro dépendance.
// Gère sharedStrings, inlineStr, t="str" et les balises préfixées (<x:row>) des fichiers
// générés par OpenXML SDK — sinon ces feuilles ressortent vides.
// Usage : node dump.js <fichier.xlsx>
const fs=require('fs'),zlib=require('zlib');
const buf=fs.readFileSync(process.argv[2]);
// --- mini lecteur zip (répertoire central)
const entries={};
let e=buf.length-22;while(e>=0&&buf.readUInt32LE(e)!==0x06054b50)e--;
let p=buf.readUInt32LE(e+16);const n=buf.readUInt16LE(e+10);
for(let i=0;i<n;i++){
 const method=buf.readUInt16LE(p+10),csize=buf.readUInt32LE(p+20),nl=buf.readUInt16LE(p+28),xl=buf.readUInt16LE(p+30),cl=buf.readUInt16LE(p+32),lo=buf.readUInt32LE(p+42);
 const name=buf.toString('utf8',p+46,p+46+nl);
 const ds=lo+30+buf.readUInt16LE(lo+26)+buf.readUInt16LE(lo+28);
 const raw=buf.subarray(ds,ds+csize);
 entries[name]=()=>(method===8?zlib.inflateRawSync(raw):raw).toString('utf8');
 p+=46+nl+xl+cl;
}
const get=f=>entries[f]&&entries[f]();
function unesc(s){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(m,d)=>String.fromCharCode(d)).replace(/&amp;/g,'&');}
// balise avec ou sans prefixe d'espace de noms
const R=(body,flags='g')=>new RegExp(body.replace(/@/g,'(?:\\w+:)?'),flags);
const texts=x=>[...x.matchAll(R('<@t(?:\\s[^>]*)?>([\\s\\S]*?)</@t>'))].map(t=>unesc(t[1])).join('');
let shared=[];
const ss=get('xl/sharedStrings.xml');
if(ss)shared=[...ss.matchAll(R('<@si>([\\s\\S]*?)</@si>'))].map(m=>texts(m[1]));
const names=[...(get('xl/workbook.xml')||'').matchAll(R('<@sheet\\b[^>]*name="([^"]*)"'))].map(m=>unesc(m[1]));
const sheets=Object.keys(entries).filter(f=>/^xl\/worksheets\/[^/]+\.xml$/.test(f)).sort((a,b)=>parseInt(a.match(/\d+/))-parseInt(b.match(/\d+/)));
sheets.forEach((f,i)=>{
 console.log('\n=== SHEET '+(names[i]||f)+' ===');
 const s=get(f);
 for(const r of s.matchAll(R('<@row\\b([^>]*)>([\\s\\S]*?)</@row>'))){
  const rn=(r[1].match(/\br="(\d+)"/)||[])[1]||'?';
  const cells=[...r[2].matchAll(R('<@c\\b([^>]*?)(?:/>|>([\\s\\S]*?)</@c>)'))].map(c=>{
   const ref=(c[1].match(/\br="([A-Z]+)\d+"/)||[])[1]||'?';
   const t=(c[1].match(/\bt="([^"]*)"/)||[])[1],body=c[2]||'';
   let v=(body.match(R('<@v>([\\s\\S]*?)</@v>',''))||[])[1];
   if(t==='s')v=shared[+v]; else if(t==='inlineStr')v=texts(body);
   else if(v!==undefined)v=unesc(v);
   return ref+':'+(v===undefined?'':v);
  });
  if(cells.length)console.log(rn+' | '+cells.join(' | '));
 }
});
