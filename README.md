# Préparation des débits

PWA installable pour calculer dans les deux sens les cotes d’un galandage et préparer une liste de débits. L’interface est générique et fonctionne localement dans le navigateur ; elle peut être publiée sur GitHub Pages.

## Données et maintenance

`data/regles-calcul.json` est la source unique des cotes, relations, limites et règles de débit. Pour corriger une formule, modifier l’équation correspondante dans `relations`. Les profils et débits sont décrits dans `debits`. Les quantités dépendant du nombre de vantaux ou des départs mur utilisent un identifiant de règle (`quantiteRule`) traité dans `src/cutlist.js`.

Le moteur résout les relations linéaires dans les deux sens sans `eval()`. Quand une quantité ou une longueur n’est pas fournie, la liste affiche « À préciser » plutôt que de supposer une valeur.

## Formules actuellement intégrées

- Passage libre, entre montants, entraxe minimum, arrêt de lisse, lisse basse minimum et largeur de remplissage.
- Distances Dsv / Ddv, longueurs des lisses 1 et 2 avec imposte, longueur de poutre.
- Relations de hauteur de porte, sous poutre, vitrage, remplissage, parclose et profils/couvre-joints de départ mur avec imposte.
- Conditions connues : LP de 680 à 1 300 mm, LPB jusqu’à 1 230 mm, entre montants jusqu’à 3 000 mm, hauteur de porte jusqu’à 3 000 mm.
- Quantités connues des montants renforcés, de passage et préparés, couvre-joints associés, poutre et profils de départ mur.

Les règles qui restent à confirmer (notamment quantités de certaines lisses et parcloses, couvercles en toute hauteur et profils de la partie fixe) restent visibles comme incomplètes dans la liste.

## Tester

```bash
npm test
```

## Lancer en local

Le service worker et l’installation nécessitent localhost ou HTTPS :

```bash
python -m http.server 8080
```

Ouvrir `http://localhost:8080/`.

## Publier sur GitHub Pages

Placer le contenu de ce dossier à la racine du dépôt, puis choisir **Settings → Pages → Deploy from a branch → main → /(root)**.

Aucun fichier de licence open source n’est inclus.
