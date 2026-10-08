const fs = require('fs'), zlib = require('zlib');
const raw = fs.readFileSync(process.argv[2]);
const s = raw.toString('latin1');

// --- index indirect objects
const objs = {};
const re = /(\d+)\s+(\d+)\s+obj/g;
let m;
const starts = [];
while ((m = re.exec(s))) starts.push([+m[1], m.index, re.lastIndex]);
starts.forEach(([num, st, bodyStart], i) => {
  const end = i + 1 < starts.length ? starts[i + 1][1] : s.length;
  const chunk = s.slice(bodyStart, end);
  const e = chunk.indexOf('endobj');
  objs[num] = { dict: chunk.slice(0, e < 0 ? chunk.length : e), off: bodyStart };
});

function streamData(num) {
  const o = objs[num]; if (!o) return null;
  const k = o.dict.indexOf('stream'); if (k < 0) return null;
  let p = o.off + k + 6;
  if (raw[p] === 13) p++; if (raw[p] === 10) p++;
  const e = raw.indexOf('endstream', p);
  let d = raw.slice(p, e);
  if (/FlateDecode/.test(o.dict)) { try { d = zlib.inflateSync(d); } catch (x) { try { d = zlib.inflateRawSync(d.slice(2)); } catch (y) { return null; } } }
  return d;
}

// --- ToUnicode maps
function parseCMap(txt) {
  const map = {};
  const hex = h => parseInt(h, 16);
  const uni = h => { let o = ''; for (let i = 0; i + 3 < h.length + 1; i += 4) o += String.fromCharCode(parseInt(h.substr(i, 4), 16)); return o; };
  let r;
  const bc = /beginbfchar([\s\S]*?)endbfchar/g;
  while ((r = bc.exec(txt))) {
    const pr = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g; let q;
    while ((q = pr.exec(r[1]))) map[hex(q[1])] = uni(q[2]);
  }
  const br = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((r = br.exec(txt))) {
    const pr = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:<([0-9A-Fa-f]+)>|\[([\s\S]*?)\])/g; let q;
    while ((q = pr.exec(r[1]))) {
      const a = hex(q[1]), b = hex(q[2]);
      if (q[3]) { const base = hex(q[3]); for (let c = a; c <= b; c++) map[c] = String.fromCharCode(base + (c - a)); }
      else { const items = q[4].match(/<([0-9A-Fa-f]+)>/g) || []; items.forEach((it, i) => map[a + i] = uni(it.replace(/[<>]/g, ''))); }
    }
  }
  return map;
}

// --- font resources: map font object num -> {map, twoByte}
const fontMaps = {};
for (const num in objs) {
  const d = objs[num].dict;
  if (!/\/Type\s*\/Font/.test(d)) continue;
  const tu = d.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
  const two = /\/Type0/.test(d);
  let map = {};
  if (tu) { const sd = streamData(+tu[1]); if (sd) map = parseCMap(sd.toString('latin1')); }
  fontMaps[num] = { map, two, name: (d.match(/\/BaseFont\s*\/([^\s\/\]>]+)/) || [])[1] || '?' };
}

// --- pages
const pageNums = starts.map(x => x[0]).filter(n => /\/Type\s*\/Page[^s]/.test(objs[n].dict));
function resFonts(pd) {
  // resolve /Resources (inline or ref) -> /Font dict -> names
  let resTxt = null;
  const rr = pd.match(/\/Resources\s+(\d+)\s+0\s+R/);
  if (rr) resTxt = objs[+rr[1]].dict;
  else { const k = pd.indexOf('/Resources'); if (k >= 0) resTxt = pd.slice(k, k + 3000); }
  if (!resTxt) return {};
  let fTxt = null;
  const fr = resTxt.match(/\/Font\s+(\d+)\s+0\s+R/);
  if (fr) fTxt = objs[+fr[1]].dict;
  else { const k = resTxt.indexOf('/Font'); if (k >= 0) { let depth = 0, i = resTxt.indexOf('<<', k); let j = i, d2 = 0; for (; j < resTxt.length; j++) { if (resTxt.substr(j, 2) === '<<') { d2++; j++; } else if (resTxt.substr(j, 2) === '>>') { d2--; j++; if (!d2) break; } } fTxt = resTxt.slice(i, j + 1); } }
  const out = {};
  if (fTxt) { const p = /\/(F\w+|C2_\d+|TT\d+|[A-Za-z0-9]+)\s+(\d+)\s+0\s+R/g; let q; while ((q = p.exec(fTxt))) out['/' + q[1]] = +q[2]; }
  return out;
}

pageNums.forEach((pn, pi) => {
  const pd = objs[pn].dict;
  const fonts = resFonts(pd);
  let contents = [];
  const c1 = pd.match(/\/Contents\s+(\d+)\s+0\s+R/);
  const c2 = pd.match(/\/Contents\s*\[([^\]]*)\]/);
  if (c1) contents = [+c1[1]];
  else if (c2) contents = (c2[1].match(/(\d+)\s+0\s+R/g) || []).map(x => parseInt(x));
  let t = '';
  contents.forEach(cn => { const d = streamData(cn); if (d) t += d.toString('latin1'); });
  console.log('\n########## PAGE ' + (pi + 1) + ' ##########');
  let cur = null;
  const tok = /\/([A-Za-z0-9_+.]+)\s+[\d.]+\s+Tf|\[((?:[^\[\]\\]|\\.)*)\]\s*TJ|\(((?:[^()\\]|\\.)*)\)\s*Tj|<([0-9A-Fa-f\s]+)>\s*Tj|(T\*|ET|Td|TD)/g;
  let q, line = '';
  const dec = str => str.replace(/\\(\d{1,3})/g, (x, o) => String.fromCharCode(parseInt(o, 8))).replace(/\\([()\\nrt])/g, '$1');
  function conv(bytesStr, hexMode) {
    const f = cur !== null ? fontMaps[cur] : null;
    let codes = [];
    if (hexMode) {
      const h = bytesStr.replace(/\s/g, '');
      const step = (f && f.two) ? 4 : 2;
      for (let i = 0; i < h.length; i += step) codes.push(parseInt(h.substr(i, step), 16));
    } else {
      const d = dec(bytesStr);
      if (f && f.two) { for (let i = 0; i + 1 < d.length; i += 2) codes.push((d.charCodeAt(i) << 8) | d.charCodeAt(i + 1)); }
      else for (let i = 0; i < d.length; i++) codes.push(d.charCodeAt(i));
    }
    return codes.map(c => (f && f.map[c] !== undefined) ? f.map[c] : String.fromCharCode(c)).join('');
  }
  while ((q = tok.exec(t))) {
    if (q[1] !== undefined) { cur = fonts['/' + q[1]] !== undefined ? fonts['/' + q[1]] : cur; }
    else if (q[2] !== undefined) {
      let out = '';
      const pr = /\(((?:[^()\\]|\\.)*)\)|<([0-9A-Fa-f\s]+)>|(-?[\d.]+)/g; let z;
      while ((z = pr.exec(q[2]))) {
        if (z[1] !== undefined) out += conv(z[1], false);
        else if (z[2] !== undefined) out += conv(z[2], true);
        else if (parseFloat(z[3]) < -180) out += ' ';
      }
      line += out;
    }
    else if (q[3] !== undefined) line += conv(q[3], false);
    else if (q[4] !== undefined) line += conv(q[4], true);
    else { if (line.trim()) console.log(line.replace(/\s+/g, ' ').trim()); line = ''; }
  }
  if (line.trim()) console.log(line.replace(/\s+/g, ' ').trim());
});
