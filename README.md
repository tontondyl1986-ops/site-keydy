# Site vitrine de la famille Keydy

Quatre SaaS : Bâtiment, Études & Architecture, Promotion et Techniques spéciales. Le site distingue l’application existante, les fonctions des pilotes et la feuille de route. Aucun déploiement n’est effectué par ce travail.

## Pages et sources

- `index.html` : présentation de la famille et logo général existant.
- `logiciels.html` et quatre pages `logiciel-*.html` : publics, modules réalisés et futurs, parcours et accès.
- `modules.html` : comparaison des fonctions par logiciel.
- `tarifs.html` : trois nouvelles offres sur demande ; configurateur existant réservé à Techniques spéciales.
- `contact.html?saas=batiment|etudes|promotion|techniques-speciales` : orientation explicite du formulaire.
- `assets/js/saas-catalog.mjs` : catalogue éditorial commun, sans tarif numérique des nouveaux SaaS.
- `scripts/build-saas-pages.mjs` : générateur des sept pages de gamme et de la navigation. Il conserve le contenu et le moteur des pages existantes.
- `assets/brand/` : variantes SVG existantes de Keydy reprises du nouveau socle, sans retouche du logo général.

Les montants proposés à valider sont dans le dépôt privé `KeydySuite/docs/proposition-tarifaire-quatre-saas.md`. Ils ne sont injectés ni dans le configurateur ni dans ces pages publiques. Le regroupement de facturation entre produits est une cible et reste traité sur devis.

## Développement et vérification locale

Node 24, Python 3 et Playwright. Utiliser un serveur HTTP local pour les modules JavaScript ; une ouverture `file://` ne qualifie pas le configurateur.

```text
npm ci --ignore-scripts
npm run build:pages
npm test
npx playwright install chromium
python -m http.server 18745 --bind 127.0.0.1
```

Dans un second terminal : `npm run test:browser`. Fermer ensuite le serveur de prévisualisation. Les tests bloquent toutes les requêtes externes sauf les réponses explicitement fictives du configurateur. Ils ne soumettent aucun formulaire de contact et n’effectuent aucune souscription réelle. Captures et résultats : `site-smoke-output/`, ignoré par Git. Le workflow GitHub est uniquement un workflow de tests, sans publication.

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

## Vérification de la gamme du 3 novembre 2026

20 tests Node réussis. Dans le navigateur de test Chromium : 18 groupes du configurateur existant, les sept pages de gamme à 390/800/1280 px, l’orientation du contact pour chaque nouveau produit et une réponse tardive du catalogue Techniques spéciales après un changement de SaaS. Aucun débordement horizontal constaté dans ces formats ; logos chargés et absence d’erreur JavaScript vérifiés. Accueil ordinateur/mobile et page Études inspectés visuellement sur captures.

Les services externes sont bloqués dans les tests ; le catalogue et la souscription Techniques spéciales y sont simulés. Aucune demande par e-mail, souscription ou transaction réelle. Restent à qualifier : appareils iOS/Android réels, Safari et audit complet d’accessibilité. Les essais locaux ne constituent pas un déploiement ni une validation commerciale des nouveaux tarifs.
