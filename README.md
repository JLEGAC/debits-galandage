# Préparation des débits

PWA installable pour calculer dans les deux sens les cotes d’un galandage et préparer une liste de débits. L’interface est générique et fonctionne localement dans le navigateur ; elle peut être publiée sur GitHub Pages.

## Données et maintenance

`data/regles-calcul.json` est la source unique des cotes, relations, limites et règles de débit. Pour corriger une formule, modifier l’équation correspondante dans `relations`. Les profils et débits sont décrits dans `debits`. Les quantités dépendant du nombre de vantaux ou des parties fixes utilisent un identifiant de règle (`quantiteRule`) traité dans `src/cutlist.js`.

Le moteur résout les relations linéaires dans les deux sens sans `eval()`. Chaque cote dispose d’un seul champ : les valeurs saisies restent modifiables et les valeurs déduites apparaissent dans les mêmes champs avec le repère `fx`. La liste des débits se trouve dans le même panneau et se recalcule à chaque événement de saisie. Une valeur calculée n’est pas réutilisée comme donnée d’entrée ; si les données ne déterminent pas une cote de façon unique, le champ reste vide. Quand une quantité ou une longueur n’est pas fournie, la liste affiche « À préciser » plutôt que de supposer une valeur. Les états sont aussi repérés visuellement : `fx` pour une cote calculée, rouge pâle pour une saisie en conflit et jaune pâle pour un calcul affecté. La configuration s’adapte à la largeur de l’écran. La saisie mobile utilise le clavier décimal et accepte la virgule ou le point. L’impression/PDF présente la configuration et la liste des profils, sans les champs de saisie ni les notes de détail.

## Formules actuellement intégrées

- Passage libre, entre montants, entraxe minimum, arrêt de lisse, lisse basse minimum et largeur de remplissage.
- Distances EM1 (simple vantail) et EM (double vantail), longueurs des lisses 1 et 2, lisse basse de la partie fixe, longueur de poutre. Dans la notice récente, EM1 remplace Dsv et EM remplace Ddv.
- Relations de hauteur de porte (`HP = H`), hauteur sous poutre et axe de la poutre (`Sol / entraxe poutre = Hauteur sous poutre + 18`), vitrage, remplissage, parclose et profils/couvre-joints de départ mur avec imposte. Les profils de départ mur utilisent HSP et l’axe de la poutre.
- Conditions connues : largeur LP de 680 à 1 300 mm pour une porte aluminium, jusqu’à 1 230 mm pour une porte bois ; entre montants jusqu’à 3 000 mm ; hauteur de porte jusqu’à 3 000 mm.
- Quantités connues : 1 poutre ; Lisse 1 (1 ou 2) et Lisse 2 (1) ; couvre-joint haut (2) ; profil de réception (1 en simple vantail, absent en double) ; montants renforcés et de passage (2 ou 4) ; 2 montants préparés ; 1 couvre-joint par montant renforcé et 2 par montant préparé ; aucun couvre-joint sur montant de passage ; 1 ou 2 parties fixes selon le vantail ; départ mur avec imposte (2 profils de chaque type) ; parcloses (1 ou 2 si les parties fixes sont vitrées).

Les profils de la partie fixe sont listés individuellement. Le nombre de parties fixes et de départs mur avec imposte est déduit de la configuration. Une longueur s’affiche dès que les cotes nécessaires sont saisies.

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
