# Configurateur de souscription commerciale

Branche `feat/subscription-commerce-20261027`, depuis `main` f7e32e8. Cette branche
ne publie rien : GitHub Pages a été vérifié en lecture seule, source `main` à la racine.
La fusion/publication attend une décision distincte.

`tarifs.html` propose les modules, prérequis, licences, quantités véhicules/scanners
et choix mensuel/annuel. Les prix proviennent de `GET https://keydy.be/api/keydy/catalog`
et les récapitulatifs de `GET /api/keydy/preview`. Le site ne contient pas une seconde
grille tarifaire. Le choix d’un prérequis est automatique ; son retrait exige d’abord
de retirer les modules dépendants.

La continuation ouvre `/souscription-keydy` sur Keydy avec les choix et la révision du
catalogue. Aucun montant du navigateur ne fait autorité. Keydy calcule le devis et les
conditions, recueille l’identité, la signature et le paiement hébergé, puis prépare
les accès pour mise en service manuelle. Les textes légaux du site restent inchangés.
Le serveur correspondant de la branche Web `feat/saas-commerce-20261027` doit être
disponible avant toute publication de cette page. Si le catalogue est absent, le site
désactive le formulaire chiffré et propose de contacter Keydy.

Vérification locale : quatre tests Node, puis quatre scénarios Playwright sur une API
entièrement simulée : 390, 800 et 1280 pixels, dépendances, mensuel/annuel, transfert
sans montant et blocage lorsque le catalogue est indisponible. Les captures utilisent
des **prix fictifs volontairement différents** du catalogue V3 ; elles ne sont pas des
offres commerciales. Les résultats/captures locaux sont sous `output/saas-site-browser`
dans le workspace, hors dépôt. La CI reproduit ces tests avec Chromium et ne publie rien.

```bash
npm ci --ignore-scripts
npm test
npx playwright install chromium
python3 -m http.server 18745 --bind 127.0.0.1
# Dans un second terminal :
npm run test:browser
```

Les tests navigateur interceptent les appels API et bloquent les sorties réseau non
locales. Une recette reliée au vrai serveur de test et aux comptes prestataires test
reste à faire. Aucun paiement, appel Stripe/Mollie, déploiement ou compte réel n’est
utilisé par ces vérifications. Les paiements live doivent rester désactivés côté Keydy
tant que le statut, l’identité fiscale, le compte prestataire et le compte bancaire
de l’exploitant ne sont pas prêts.
