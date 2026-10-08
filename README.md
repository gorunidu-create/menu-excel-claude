# Menu Excel pour Claude

Une skill Claude qui transforme la **carte d'un restaurant** (photos, PDF, Excel, Word, .zip) en
**fichier Excel d'import articles** pour la caisse Restomax / Plug&POS : 51 colonnes, TVA belge
(nourriture 12/6, softs 21/6, alcool 21/21), libellés en majuscules sans accents, prix multiples
éclatés (verre / bouteille, XL…), doublons évités.

On envoie la carte à Claude, on demande « fais-moi l'Excel menu », il lit, encode, génère le
fichier et liste ce qu'il faut vérifier.

> Pas besoin de Claude pour un cas simple : la webapp
> **https://menu-xlsx-web-unid-u.vercel.app** fait la même chose dans le navigateur.

**Prérequis** : [Node.js](https://nodejs.org) (version 18 ou plus) pour Claude Code. Rien d'autre :
les scripts n'ont aucune dépendance.

## 3 façons de l'utiliser

### 1. Claude Code, le plus simple : ouvrir ce dossier

```sh
git clone https://github.com/gorunidu-create/menu-excel-claude.git
cd menu-excel-claude
claude
```

Dépose les cartes dans `cartes/`, puis demande par exemple :

> Fais-moi l'Excel menu de la Brasserie du Coin avec les photos dans cartes/

Le fichier `MENU BRASSERIE DU COIN.xlsx` arrive sur le Bureau.

### 2. Claude Code, partout : installer le plugin

Dans Claude Code, depuis n'importe quel dossier :

```
/plugin marketplace add gorunidu-create/menu-excel-claude
/plugin install menu-excel@menu-excel
```

La skill se déclenche ensuite toute seule dès qu'on parle de menu Excel ou qu'on envoie une carte.
Mise à jour : `/plugin marketplace update menu-excel`.

### 3. App Claude ou claude.ai : importer le zip

1. Télécharger [`dist/menu-excel-skill.zip`](dist/menu-excel-skill.zip).
2. Claude → **Paramètres → Capacités** : activer l'exécution de code, puis **Skills → Importer**
   et choisir le zip.
3. Dans une conversation : joindre les photos ou le PDF de la carte et demander l'Excel menu.
   Claude rend le fichier `.xlsx` à télécharger.

## Ce qu'il y a dedans

| Chemin | Rôle |
|---|---|
| `skills/menu-excel/SKILL.md` | les consignes que suit Claude : lecture, TVA, nommage, pièges |
| `skills/menu-excel/scripts/build.js` | `items.js` → `.xlsx` d'import (51 colonnes) |
| `skills/menu-excel/scripts/dump.js` | relit un `.xlsx` (vérification, ou carte livrée en Excel) |
| `skills/menu-excel/scripts/pdftext.js` | texte d'un PDF |
| `skills/menu-excel/scripts/docxtext.js` | texte d'une carte Word |
| `skills/menu-excel/scripts/toitems.js` | reprend un menu déjà livré pour le compléter |
| `skills/menu-excel/scripts/items.exemple.js` | modèle du fichier d'articles |
| `dist/menu-excel-skill.zip` | la skill emballée pour l'app Claude (`node tools/pack.js`) |
| `cartes/` | où déposer les cartes (non versionné) |

À la main, sans Claude :

```sh
node skills/menu-excel/scripts/build.js skills/menu-excel/scripts/items.exemple.js "MENU TEST"
```

## Le fichier produit

Seules ces colonnes sont remplies, le backoffice complète le reste :

| Col. | Champ | Valeur |
|---|---|---|
| B | `active` | 1 |
| C | `stock` | 0 |
| D / E / F | `name_fr` / `name_nl` / `name_en` | le même libellé |
| G | `description_fr` | facultatif |
| AB | `level1` | catégorie |
| AF / AG | `vat_rate` / `vat_rate_takeaway` | TVA sur place / à emporter |
| AH | `price_vat_included` | prix TTC |

Les taux de TVA suivent la pratique belge pour l'HoReCa ; en cas de doute sur un produit, Claude
le signale. À faire valider par le comptable du client pour les cas particuliers.

---
UnidU — caisses, terminaux et logiciels pour l'HoReCa et le retail, région de Liège.
