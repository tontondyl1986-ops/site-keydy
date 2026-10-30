# Site vitrine Keydy

Ce dossier contient une première version hors ligne du site vitrine Keydy.

## Ouvrir le site

Ouvrir ce fichier dans un navigateur:

```text
site-keydy/index.html
```

Le site fonctionne sans serveur et sans nom de domaine.

## Fichiers

- `index.html`: contenu de la page.
- `styles.css`: design, couleurs et responsive.
- `script.js`: menu mobile et sélection des modules.
- `assets/keydy-hero.png`: visuel principal du site.
- `assets/keydy-logo.svg`: logo Keydy utilisé dans l'en-tête et le pied de page.
- `assets/keydy-icon.png`: icône du site.
- `assets/screenshots/`: captures d'écran du programme.

## Ajouter les captures du programme

Déposer les images dans `assets/screenshots/` avec ces noms:

- `bureau.png`
- `tablette-technicien.png`
- `devis-factures.png`
- `planning.png`
- `chantiers.png`

Les mêmes noms en `.jpg` fonctionnent aussi.

Si une image n'existe pas encore, le site affiche une maquette propre à la place.

## Avant publication sur keydy.be

1. Vérifier ou acheter le domaine `keydy.be`.
2. Activer une adresse email comme `contact@keydy.be`.
3. Remplacer ou confirmer les textes de la section `Société Keydy`.
4. Définir les vrais tarifs ou garder une approche "sur demande".
5. Publier le contenu du dossier `site-keydy` chez un hébergeur.

## Parcours d’abonnement autonome préparé le 30 octobre 2026

Le configurateur exige la capacité serveur `SELF_SERVICE_V1` : import Excel
autonome inclus, option de reprise par Keydy à 1 500 € HTVA une fois, premier
paiement puis activation après signature et paiement vérifiés. Prix principaux
HTVA, TVA et premier total TTC distincts. Remise annuelle issue du catalogue.
Le choix de reprise est conservé dans les liens et revient au serveur pour
recalcul ; aucun prix envoyé dans l’URL ne fait foi.

Cette branche accompagne `feat/automated-subscription-20261030` du serveur.
Le catalogue ancien est refusé ; un commerce fermé reste fermé même si les
simulations fonctionnent. Les tests navigateur interceptent toutes les requêtes
vers Keydy/Stripe et n’effectuent aucune souscription réelle.

Résiliation des nouveaux abonnements autonomes : fin de période payée, accès
conservé jusqu’à la date affichée, sans remboursement automatique. Ce travail
ne publie pas le site et n’ouvre ni commerce ni paiements réels.

Le catalogue doit aussi annoncer `recurringPaymentRequired=true`. Les nouvelles souscriptions payantes nécessitent une autorisation explicite de prélèvement récurrent, confirmée par le prestataire avant activation. Aucun renouvellement ne demande au client de souscrire de nouveau. La résiliation volontaire reste en fin de période payée.
