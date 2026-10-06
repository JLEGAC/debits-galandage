# Préparation des débits

PWA installable de calcul bidirectionnel des cotes et de préparation des débits d’une porte à galandage. Le jeu de règles livré par défaut sert de configuration initiale ; l’utilisateur peut ensuite personnaliser le titre, les libellés, les formules, leurs conditions et les noms des profils dans l’éditeur intégré.

## Personnaliser l’outil

Ouvrir **Personnaliser** pour modifier les éléments disponibles. Les conditions utilisent des choix guidés (vantail, imposte, matériau et remplissage). Le testeur intégré vérifie une formule avec des cotes connues. Les relations acceptées sont linéaires et sont résolues dans les deux sens, sans `eval()`.

Les changements sont conservés sur l’appareil dans IndexedDB, avec un repli sur le stockage local du navigateur. Ils ne modifient pas le dépôt Git ni les règles des autres utilisateurs. Utiliser **Exporter JSON** et **Importer JSON** pour transférer une configuration. **Restaurer l’origine** rétablit le jeu de règles livré avec la PWA.

La source initiale des règles est `data/regles-calcul.json`. Les calculs sont répartis entre `src/formulas.js`, `src/calculation.js` et `src/cutlist.js`. La configuration importée est vérifiée avant son application. Le format est réservé aux cotes et profils déjà prévus ; il ne permet pas encore d’ajouter de nouveaux champs ou profils.

## Comportement de calcul

Chaque cote possède un champ unique. Les valeurs saisies restent visibles et modifiables ; les cotes calculées apparaissent dans le même champ avec le repère `fx`. Une cote calculée qui représente la configuration minimale porte le suffixe **(mini)**. Si une cote saisie contredit une relation, les valeurs entrées sont conservées et les champs concernés sont colorés.

La configuration de départ utilise les cotes minimales connues. Une cote de réservation saisie remplace les relations minimales qui en dépendent : MPR ajuste la lisse basse, la lisse haute côté partie fixe et le remplissage ; EM ajuste ces débits et la longueur du rail. La liste des débits se met à jour à la saisie. Une longueur ou une quantité non calculable est indiquée comme « À préciser ».

## Vérifier et lancer

```bash
npm test
python -m http.server 8080
```

Ouvrir `http://localhost:8080/`. L’installation PWA et le service worker nécessitent localhost ou HTTPS.

## GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` exécute `npm test`, puis publie le site sur GitHub Pages avec `ubuntu-24.04`. Dans **Settings → Pages**, choisir **GitHub Actions** comme source de publication.

Aucun fichier de licence open source n’est inclus.
