# Menu Excel — dépôt de travail

Ce dépôt sert à une seule chose : transformer la carte d'un restaurant en fichier Excel d'import
articles pour la caisse (Restomax / Plug&POS).

- Quand on te demande un menu Excel, ou qu'on te donne une carte (photos, PDF, Excel, Word, zip),
  suis **`skills/menu-excel/SKILL.md`** à la lettre, même si la skill n'est pas chargée
  automatiquement. Les scripts sont dans `skills/menu-excel/scripts/` (Node, zéro dépendance).
- Les cartes déposées par l'utilisateur sont dans `cartes/` (non versionné).
- Le fichier d'articles de travail (`items.js`) va dans `sortie/` (non versionné), jamais dans
  `skills/`. Le `.xlsx` final va sur le Bureau, sauf si l'utilisateur demande un autre dossier.
- Réponds en français.
- Si tu modifies la skill, relance `node tools/pack.js` pour mettre à jour `dist/menu-excel-skill.zip`.
