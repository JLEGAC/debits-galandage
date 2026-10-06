# Préparation des débits

PWA installable pour calculer dans les deux sens les cotes d’un galandage et préparer une liste de débits. L’interface est générique et fonctionne localement dans le navigateur ; elle peut être publiée sur GitHub Pages.

## Données et maintenance

`data/regles-calcul.json` est la source unique des cotes, relations, limites et règles de débit. Pour corriger une formule, modifier l’équation correspondante dans `relations`. Les profils et débits sont décrits dans `debits`. Les quantités dépendant du nombre de vantaux ou des parties fixes utilisent un identifiant de règle (`quantiteRule`) traité dans `src/cutlist.js`.

Le moteur résout les relations linéaires dans les deux sens sans `eval()`. Chaque cote dispose d’un seul champ : les valeurs saisies restent modifiables et les valeurs déduites apparaissent dans les mêmes champs avec le repère `fx`. La liste des débits se trouve dans le même panneau et se recalcule à chaque événement de saisie. Une valeur calculée n’est pas réutilisée comme donnée d’entrée ; si les données ne déterminent pas une cote de façon unique, le champ reste vide. Quand une quantité ou une longueur n’est pas fournie, la liste affiche « À préciser » plutôt que de supposer une valeur. Les états sont aussi repérés visuellement : `fx` pour une cote calculée, rouge pâle pour une saisie en conflit et jaune pâle pour un calcul affecté. La configuration s’adapte à la largeur de l’écran. La saisie mobile utilise le clavier décimal et accepte la virgule ou le point. L’impression/PDF présente la configuration et la liste des profils, sans les champs de saisie ni les notes de détail.

## Formules actuellement intégrées

- Largeurs : passage libre, entre montants, entraxe minimum entre axes des montants, arrêt de lisse, largeur minimale et réelle de lisse basse, largeur de remplissage, MPR, profils hauts côté partie fixe et côté passage, et longueur de coupe du rail.
- Hauteurs : HSP (hauteur sous plafond), SEP (sol / entraxe du rail), HSR (hauteur sous rail), hauteur de porte, remplissage de la partie fixe et de l’imposte, parclose de finition, couvre-joint d’imposte et départ mur d’imposte.
- Hauteur de porte : bois = SEP − 55 mm ; aluminium = SEP − 60 mm. En toute hauteur, SEP = HSP − 24,5 mm, donc HP bois = HSP − 79,5 mm et HP aluminium = HSP − 84,5 mm. HSR = SEP − 36 mm et longueur de parclose = HSR + 24 mm.
- Largeur minimale de lisse basse : LBmini = LP − 105 mm. Longueur réelle LB : simple vantail = MPR − LP − 9 mm ; double vantail = EM / 2 − LP − 16,2 mm. En simple vantail, MPR est une cote à saisir ; aucune relation permettant de la déduire n’a été fournie. Largeur de remplissage de partie fixe = LB + 19 mm.
- LHF (profil haut côté partie fixe) : simple vantail = MPR − LP − 9 mm ; double vantail = EM / 2 − LP − 16,2 mm. LHP (profil haut côté passage) : simple vantail = LP − 59 mm ; double vantail = 2 × LP − 103 mm. Avec imposte, ces profils sont des lisses ; en toute hauteur, ce sont des couvercles de finition.
- Avec imposte : remplissage vitré = HSP − SEP − 32 mm ; remplissage plein = HSP − SEP − 24 mm ; CJI = HSP − SEP − 58 mm ; DMI = HSP − SEP − 29,5 mm.
- Conditions connues : LP de 680 à 1 300 mm pour une porte aluminium, jusqu’à 1 230 mm pour une porte bois ; EM jusqu’à 3 000 mm ; HSP jusqu’à 3 000 mm.
- Quantités : 1 rail ; montants renforcés et de passage (2 ou 4 selon le nombre de vantaux) ; 2 montants préparés ; un couvre-joint par montant renforcé, deux par montant préparé ; profils hauts côté partie fixe (1 ou 2) et côté passage (1) ; deux couvre-joints hauts ; 1 ou 2 parties fixes ; une lisse basse par partie fixe ; parcloses (1 ou 2 si les parties fixes sont vitrées) ; avec imposte, 2 couvre-joints et 2 départs mur.

Les cotes du projet, les résultats calculés et la liste des débits restent réunis dans le même panneau. Les expressions et profils sont modifiables dans `data/regles-calcul.json`.

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
