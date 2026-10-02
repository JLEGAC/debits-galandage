# Calculateur de cotes et de débits

Application web installable pour calculer des valeurs liées par des formules et, après ajout des règles correspondantes, préparer une liste de débits.

## État du projet

- Interface mobile-first, installation PWA, cache hors connexion après le premier chargement.
- Moteur de résolution bidirectionnelle pour les systèmes d’équations linéaires.
- `data/formules-exemple.json` contient des relations fictives (`A = B + 100`, `C = 2 * B`) uniquement pour démontrer le fonctionnement. Elles ne décrivent aucun produit réel.
- La liste de débits n’est pas encore implémentée : ajoutez les règles de quantité et de longueur propres à votre projet avant toute utilisation en fabrication.

## Modifier les formules

Éditez `data/formules-exemple.json` :

- `cotes` associe un identifiant court à son libellé visible ;
- `relations` contient les égalités utilisées dans les deux sens par le moteur.

La syntaxe acceptée est `+`, `-`, `*`, `/` et les parenthèses. Les relations doivent rester linéaires ; les produits entre deux variables ne sont pas pris en charge. Si des équations sont incompatibles, l’application l’indique.

## Lancer localement

Un serveur local ou HTTPS est nécessaire pour le service worker et l’installation PWA :

```bash
python -m http.server 8080
```

Ouvrez ensuite `http://localhost:8080/calculateur-cotes-debits/`.

## GitHub Pages

Si le contenu du projet est à la racine du dépôt, choisissez dans **Settings → Pages** un déploiement depuis la branche `main` et le dossier `/ (root)`. Pour publier depuis un sous-dossier, utilisez une GitHub Action adaptée.

## Licence

Aucun fichier de licence open source n’est inclus. Le dépôt public permet la consultation et l’hébergement par GitHub Pages ; les droits d’utilisation du code restent à définir par l’auteur du dépôt.
