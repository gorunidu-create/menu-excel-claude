// Fabrique dist/menu-excel-skill.zip : la skill prête à importer dans l'app Claude / claude.ai
// (Paramètres > Capacités > Skills > Importer). À relancer après toute modification de skills/.
// Usage : node tools/pack.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const skill = path.join(root, 'skills', 'menu-excel');
const zip = require(path.join(skill, 'scripts', 'zipw.js'));

const files = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const abs = path.join(dir, e.name), r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) walk(abs, r);
    else files.push({ name: 'menu-excel/' + r, data: fs.readFileSync(abs) });
  }
})(skill, '');

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'menu-excel-skill.zip');
fs.writeFileSync(out, zip(files));
console.log(files.length + ' fichiers -> ' + path.relative(root, out));
