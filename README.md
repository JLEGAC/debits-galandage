# Préparation des débits

PWA paramétrique pour calculer des cotes de galandage à partir des valeurs connues. Les formules sont conservées dans `data/regles-calcul.json` et peuvent être corrigées séparément du moteur.

## Fonctionnement actuel

- Calcul bidirectionnel des relations horizontales transcrites dans le fichier de formules.
- Choix du simple ou double vantail, du remplissage et de l’imposte.
- Contrôle des cotes saisies incompatibles.
- L’entraxe minimum en double vantail reste volontairement non calculé tant que la contradiction entre les deux valeurs disponibles n’est pas résolue.
- La liste des profils, leurs quantités et toutes leurs longueurs de débit restent à compléter avec les règles correspondantes.
- Impression ou enregistrement en PDF depuis le navigateur.
- Installation PWA et utilisation hors connexion après le premier chargement.

## Modifier les formules

Éditer `data/regles-calcul.json`. Chaque relation est une égalité utilisée dans les deux sens. Le moteur accepte `+`, `-`, `*`, `/` et les parenthèses pour les relations linéaires. Les libellés se trouvent dans `cotes`; les règles dans `relations`.

## Lancer localement

Un serveur local ou HTTPS est nécessaire pour le service worker et l’installation :

```bash
python -m http.server 8080
```

Ouvrir `http://localhost:8080/preparation-debits/`.

## GitHub Pages

Si le contenu du projet est à la racine du dépôt, choisir dans **Settings → Pages** un déploiement depuis la branche `main` et le dossier `/ (root)`.

Aucun fichier de licence open source n’est fourni.
