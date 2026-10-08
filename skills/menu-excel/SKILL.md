---
name: menu-excel
description: Crée le fichier Excel de menu (import articles Restomax / Plug&POS, 51 colonnes) à partir de la carte d'un restaurant, fournie en photos, PDF, Excel, Word ou .zip. À utiliser quand on demande « fais-moi un Excel menu », « encode la carte de <client> », « fichier d'import articles », ou qu'on envoie la carte d'un client pour la caisse.
---

# Menu Excel — import articles caisse

Livrable : `<MENU CLIENT>.xlsx` au format d'import articles Restomax / Plug&POS (ex.
`MENU CAMPUS.xlsx`). Les scripts sont dans `scripts/` à côté de ce fichier, en Node et **sans
aucune dépendance** (ni npm, ni Python, ni zip/unzip).

**Où écrire le fichier :**
- Claude Code (poste de l'utilisateur) : sans 3e argument, `build.js` l'écrit **sur le Bureau**
  (Desktop, OneDrive\Desktop ou Bureau détectés automatiquement).
- Claude app / claude.ai (skill importée) : passer le dossier de sortie en 3e argument,
  `/mnt/user-data/outputs`, puis donner le fichier à l'utilisateur.

> **Sans Claude** : la même chose existe en webapp — **https://menu-xlsx-web-unid-u.vercel.app**.
> On y dépose la carte (PDF, photos, Excel, Word, .zip, ou texte collé), l'outil devine catégories,
> prix et TVA, on relit, on télécharge. Même fichier de sortie. La skill reste le bon choix pour une
> carte manuscrite, une photo difficile ou un gros travail de nommage : la lecture par Claude y est
> bien meilleure que l'OCR du navigateur.

## Déroulé

1. **Lire la carte**, quel que soit le format :
   | Source | Comment |
   |---|---|
   | Photos (`.jpg`, `.png`…) | les lire directement, **toutes**, avant d'encoder. Petits caractères : recadrer / zoomer. Carte manuscrite : couper chaque page en deux moitiés améliore beaucoup la lecture |
   | PDF | `node scripts/pdftext.js carte.pdf` (décode les polices sous-ensemble). Texte vide = PDF scanné : lire les pages comme des images, ou demander des photos |
   | Excel (carte au format libre) | `node scripts/dump.js carte.xlsx` — toutes les feuilles |
   | Word (`.docx`) | `node scripts/docxtext.js carte.docx` — tabulations et tableaux conservés, prix alignés |
   | `.zip` | décompresser, puis chaque fichier selon son type |
   | Un menu `.xlsx` déjà livré à compléter | `node scripts/toitems.js menu.xlsx items.js`, compléter `items.js`, régénérer, puis comparer ancien et nouveau avec `dump.js` pour prouver que l'existant est intact |
2. **Écrire le fichier d'articles** dans un dossier de travail (jamais dans le dossier de la skill),
   en partant de `scripts/items.exemple.js` :
   ```js
   const A = [0.21, 0.21], S = [0.21, 0.06], F = [0.12, 0.06];
   module.exports = [
     ['NOM CATEGORIE', F, [ ['NOM ARTICLE', 12.50, 'description facultative'], ... ]],
   ];
   ```
   Une catégorie de la carte = une entrée, dans l'ordre de la carte. La TVA est **par catégorie** :
   un article dont la TVA diffère de sa famille part dans une catégorie voisine (voir TVA).
3. **Générer** : `node scripts/build.js <items.js> "MENU <CLIENT>" [dossier_sortie]`.
4. **Vérifier** : `node scripts/dump.js "<chemin>.xlsx"` et relire le résultat (nombre d'articles,
   prix, TVA, catégorie en `AB` sur **toutes** les lignes, aucun doublon de libellé).
5. **Rendre compte** : chemin du fichier, nombre d'articles par catégorie, et la liste des points à
   faire valider (prix illisibles, articles sans prix, TVA douteuse, formats devinés, libellés
   corrigés ou raccourcis).

## Colonnes remplies (et rien d'autre)

| Col. | Champ | Valeur |
|------|-------|--------|
| B | `active` | 1 |
| C | `stock` | 0 |
| D/E/F | `name_fr` / `name_nl` / `name_en` | le même libellé répété 3 fois |
| G | `description_fr` | facultatif (composition, précisions) |
| AB | `level1` | catégorie |
| AF | `vat_rate` | TVA sur place |
| AG | `vat_rate_takeaway` | TVA à emporter |
| AH | `price_vat_included` | prix TTC |

Aucun style, aucune formule, tout le reste vide : le backoffice complète.

## TVA — convention (Belgique)

| Famille | Sur place | À emporter |
|---------|-----------|------------|
| Alcool : bières, vins, bulles, spiritueux, cocktails, cafés alcoolisés | 0.21 | 0.21 |
| Softs, jus, eaux, boissons chaudes, mocktails, bières 0,0 (≤ 0,5 %) | 0.21 | 0.06 |
| Nourriture : entrées, plats, pizzas, snacks, desserts | 0.12 | 0.06 |

Lire le nom de catégorie **mot par mot** : `PLATEAU DE FRUITS DE MER`, `GATEAUX` ne sont pas de
l'eau, `VINAIGRETTES` n'est pas du vin. Une catégorie qui s'appelle juste `ROUGES`, `BLANCS`,
`ROSES`, `BULLES` est du vin.

**Exceptions par article** — la TVA étant par catégorie, ces articles sortent dans une catégorie
voisine, placée juste après leur famille :

| Cas | Catégorie créée | TVA |
|---|---|---|
| Bières 0,0 / 0,4 %, « sans alcool », mocktails, virgin dans une catégorie alcool | `BIERES SANS ALCOOL` (ou `<FAMILLE> SANS ALCOOL`) | 0.21 / 0.06 |
| Irish, Italian, French coffee, café arrosé, vin chaud dans les boissons chaudes | `CAFES ALCOOLISES` | 0.21 / 0.21 |
| Bières, vins, alcools rangés dans une catégorie « BOISSONS » fourre-tout | `BOISSONS ALCOOLISEES` | 0.21 / 0.21 |

Un sous-titre de marque dans une carte des boissons (`PEAK`, `LUPULUS`, `TRIPICK`) garde la TVA de
la famille au-dessus, pas la nourriture.

En cas de doute (ex. teneur en alcool inconnue), appliquer la règle la plus proche **et le
signaler** dans le compte rendu. Les taux sont ceux appliqués en Belgique : à faire confirmer par
le comptable du client en cas de cas particulier.

## Nommage

- MAJUSCULES, **sans accents** ni guillemets (`CREME BRULEE`, `TARTARE A L ITALIENNE`).
- Le format dans le nom : `STELLA 33CL`, `CHAUDFONTAINE PLATE 50CL`.
- Préfixe de famille quand un nom existe dans plusieurs catégories :
  `PORTIE SALAMI` vs `PIZZA SALAMI`, `KIDS SPAGHETTI BOLOGNAISE` vs `SPAGHETTI BOLOGNAISE`.
- Pas de doublon exact de libellé dans tout le fichier.
- Parenthèses : un format reste dans le nom (`(33cl)` → `33CL`) ; le reste (région d'un vin,
  garniture) part en description. Un libellé de plus de ~40 caractères se coupe sur ` - `, la fin
  passe en description (`COTES DU RHONE - INTUITIONS` + « Cellier des Terres Blanches (Rhône) »).

### Prix multiples = un article par prix

| Sur la carte | Articles |
|---|---|
| `4 € (verre) / 22 € (bouteille)` | `VERRE <VIN>` 4,00 · `BTL <VIN>` 22,00 |
| `Spaghetti bolognaise (normal / XL)  13 € / 16 €` | `SPAGHETTI BOLOGNAISE` 13,00 · `SPAGHETTI BOLOGNAISE XL` 16,00 |
| Sous-titre « au verre, à la bouteille » puis `5,00 € - 25,00 €` | `VERRE …` · `BTL …` |
| `Lupulus Pils 25 cl 3,50` puis la ligne `33 cl 4,50` | `LUPULUS PILS 25 CL` · `LUPULUS PILS 33 CL` |
| `Le verre 5,00` sous un vin | `VERRE <VIN>` |
| Deux prix sans libellé nulle part | demander, ou nommer au mieux et **le signaler** |

## Pièges connus

- Prix illisible ou absent : ne pas l'inventer. Mettre `0` et le lister dans le compte rendu.
- **Pas des prix** : les numéros de section du graphisme (`01 PETIT-DÉJEUNER`, `05`), les
  quantités (`100 g de pur bœuf`, `2 pièces`, `6 huîtres`), l'adresse et le téléphone en en-tête.
- Une ligne en minuscules ou commençant par « accompagné de », « servi avec », ou qui suit une ligne
  terminée par une virgule, est la **description** du plat au-dessus, pas une catégorie.
- Carte en deux colonnes : lire chaque colonne de haut en bas, une famille ne déborde pas sur l'autre.
- Cartes « design » : l'étiquette de prix est parfois en haut à droite de la photo de l'article,
  pas à côté du nom. Vérifier l'appariement nom / prix avant de saisir.
- Suppléments (« + 1,50 € fromage ») : les créer comme articles dans une catégorie `SUPPLEMENTS`,
  sauf consigne contraire.
- Orthographe de la carte (`Kirr`, `Vitello tonato`, `Buratta`) : corriger (`KIR`, `TONNATO`,
  `BURRATA`) et le mentionner dans le compte rendu.
