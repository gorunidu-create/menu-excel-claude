// Exemple — une catégorie = [NOM CATEGORIE (level1), [TVA sur place, TVA à emporter], articles]
// Article = [NOM, prix TTC, description facultative]
const A = [0.21, 0.21], S = [0.21, 0.06], F = [0.12, 0.06]; // Alcool / Soft & chaud / Food
module.exports = [
 ['BIERES FUT', A, [
   ['JUPILER 25CL', 2.90],
   ['JUPILER 33CL', 3.40],
 ]],
 ['SOFTS', S, [
   ['COCA COLA 20CL', 3.00],
   ['JUPILER 0.0 25CL', 3.00],
 ]],
 ['BOISSONS CHAUDES', S, [
   ['CAFE', 2.60],
 ]],
 ['PIZZAS', F, [
   ['PIZZA MARGHERITA', 11.00, 'Tomate, mozzarella, basilic.'],
   ['PIZZA SALAMI', 13.00],
 ]],
];
