# Parcours commercial et site — 28 octobre 2026

Ce lot améliore la composition de l’offre et la présentation du site existant.
Il part de `6a6fdc0` et ne publie pas GitHub Pages.

Le configurateur présente les lignes renvoyées par le serveur (socle, licences,
modules), le total de la période mensuelle ou annuelle, la TVA et les frais uniques.
Il ne recalcule pas le prix contractuel dans le navigateur. Les produits en
développement ne sont pas proposés. Une recherche aide à retrouver un module,
ses prérequis sont indiqués et les dépendances sont conservées.

Les choix sont repris depuis l’URL puis recalculés par le serveur. L’URL et le
passage à `/souscription-keydy` contiennent uniquement modules, quantités, cycle
et révision ; aucun montant, identité ou paramètre de redirection arbitraire.
Le rafraîchissement de la page conserve ainsi la configuration sans stocker de
données personnelles dans le navigateur. Un résultat ancien ne remplace pas
un résultat plus récent. Une erreur ou une saisie invalide efface l’ancien prix
et bloque la suite ; le calcul peut être relancé.

L’API catalogue du serveur compagnon expose `subscriptionsOpen`, issu du verrou
serveur existant `keydey.saas.new-subscriptions-enabled`. Seule la valeur explicite
`true` permet de poursuivre vers un nouveau devis depuis le site. Avec `false`
ou un ancien serveur qui n’expose pas ce champ, les tarifs restent explorables
et le site indique que les nouvelles souscriptions sont fermées. Cette indication
ne remplace pas les contrôles des services de devis/signature/activation.

L’accueil présente le parcours Composer → Démarrer → Faire évoluer et un accès
à Mon abonnement pour les clients existants. Le configurateur reprend le bleu
du site. Le menu se replie avant débordement sur tablette, expose son état aux
lecteurs d’écran et se ferme avec Échap. Un raccourci de récapitulatif reste
accessible sur mobile.

Validation : `npm test` et `npm run test:browser`. Les huit scénarios navigateur
utilisent un serveur statique loopback et des API intégralement interceptées :
trois tailles 390/800/1280, commerce fermé, catalogue ancien, catalogue indisponible,
calcul invalide/indisponible avec reprise, réponses dans le désordre. Ils couvrent
aussi l’accueil et le menu. Les prix sont fictifs ; aucun appel à la production
ou à un prestataire n’est autorisé par ce banc. Les captures CI sont conservées
dans l’artefact `commercial-site-browser-fixtures`.

Ces améliorations attendent une revue et une publication distinctes. Les textes
juridiques, l’identité du vendeur, les recettes prestataires et matérielles ne
sont pas certifiés par ces essais. Aucun paiement réel, merge ou déploiement.
