# Comparer et préparer son projet — 29 octobre 2026

La page Tarifs présente côte à côte les montants mensuel et annuel renvoyés par
le serveur, pour la même sélection et la même révision du catalogue. Cliquer un
cycle actualise le récapitulatif et le passage vers la souscription. La mise en
service reste séparée. Un cycle indisponible ou une révision différente retire
les deux montants et ferme le passage ; un lien recharge le catalogue en gardant
les choix valides. Aucun tarif de secours n'est calculé dans le site.

« Discuter de cette configuration » reprend les modules, utilisateurs, cycle et
quantités dans le formulaire de contact, y compris lorsque les ventes sont
fermées. Les clés de modules sont relues dans le catalogue ; les inconnues et
modules en développement sont exclus. Le lien ne contient ni montant, identité
personnelle ni révision contractuelle. Le prospect peut modifier sa sélection
depuis le contact sans la ressaisir. Si le catalogue est indisponible, le formulaire
reste utilisable et demande de préciser les besoins, sans confirmer la sélection.

Le formulaire prépare un e-mail via la messagerie du visiteur ; il n'envoie aucun
message automatiquement et ne crée aucun contrat, facture ou paiement. Les
champs personnels restent dans le formulaire. `subscriptionsOpen=true` explicite
reste nécessaire au passage vers la souscription ; cette évolution n'ouvre pas
les ventes et reste compatible avec les API déjà préparées.

Validation locale : 12 tests Node et 13 scénarios Edge sur API fictives, dont
390/800/1280 pixels, contact aller/retour, fermeture commerciale, catalogue ancien,
erreurs, comparaisons partielles, révisions différentes et réponses désordonnées.
Les requêtes non locales sont toutes interceptées ou bloquées. Les prix sont
fictifs ; aucun appel à Keydy en production ou à un prestataire réel.

Cette branche part de `5fd0ebb`, sans modifier la PR précédente ni publier Pages.
Les résultats CI et captures finaux sont liés depuis le bilan local de livraison.
