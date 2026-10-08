const zlib=require('zlib');
let T=null;function crc32(b){if(!T){T=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;T[n]=c>>>0;}}
let c=0xFFFFFFFF;for(const x of b)c=T[(c^x)&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
module.exports=function zip(files){ // files: [{name, data:Buffer}]
 const locals=[],central=[];let off=0;
 for(const f of files){
  const nm=Buffer.from(f.name,'utf8'),raw=f.data,crc=crc32(raw),def=zlib.deflateRawSync(raw,{level:9});
  const lh=Buffer.alloc(30);lh.writeUInt32LE(0x04034b50,0);lh.writeUInt16LE(20,4);lh.writeUInt16LE(0,6);lh.writeUInt16LE(8,8);
  lh.writeUInt16LE(0,10);lh.writeUInt16LE(0x2821,12);lh.writeUInt32LE(crc,14);lh.writeUInt32LE(def.length,18);lh.writeUInt32LE(raw.length,22);
  lh.writeUInt16LE(nm.length,26);lh.writeUInt16LE(0,28);
  locals.push(lh,nm,def);
  const ch=Buffer.alloc(46);ch.writeUInt32LE(0x02014b50,0);ch.writeUInt16LE(20,4);ch.writeUInt16LE(20,6);ch.writeUInt16LE(0,8);ch.writeUInt16LE(8,10);
  ch.writeUInt16LE(0,12);ch.writeUInt16LE(0x2821,14);ch.writeUInt32LE(crc,16);ch.writeUInt32LE(def.length,20);ch.writeUInt32LE(raw.length,24);
  ch.writeUInt16LE(nm.length,28);ch.writeUInt32LE(0,42-4);ch.writeUInt32LE(off,42);
  central.push(ch,nm);
  off+=30+nm.length+def.length;
 }
 const cd=Buffer.concat(central),lo=Buffer.concat(locals);
 const eo=Buffer.alloc(22);eo.writeUInt32LE(0x06054b50,0);eo.writeUInt16LE(files.length,8);eo.writeUInt16LE(files.length,10);
 eo.writeUInt32LE(cd.length,12);eo.writeUInt32LE(lo.length,16);
 return Buffer.concat([lo,cd,eo]);
};
