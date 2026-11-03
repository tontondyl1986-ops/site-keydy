// Public presentation only. Billing and subscription entitlements remain server-owned.
export const products = [
  {
    key:'batiment',name:'Keydy Bâtiment',short:'Bâtiment',page:'logiciel-batiment.html',accent:'#9A5B1A',
    logo:'assets/brand/keydy-batiment.svg',stage:'Pilote sur demande',pricing:'Sur demande',
    audience:'Gros œuvre, plâtre, chape, châssis, menuiserie et autres entreprises de bâtiment.',
    headline:'Préparer les travaux. Partager les bonnes informations.',
    intro:'Un espace pour vos chantiers et vos postes de travaux, avec le métré et les prescriptions utiles à votre métier. Transmettez une version précise à vos partenaires en gardant votre chiffrage interne privé.',
    available:[
      ['Chantiers et postes','Organisez les postes de métré et les prescriptions par lot et chapitre.'],
      ['Métrés simples','Saisissez les unités, quantités et estimations commerciales dans votre espace privé.'],
      ['Cahiers et plans transmis','Choisissez les postes, les révisions de plans et les destinataires ; consultez l’aperçu avant transmission.'],
      ['Avancements partagés','Distinguez montants proposés, vérifiés et approuvés ; conservez les décisions et leurs motifs.']
    ],
    planned:[['Ouvrages métier','Bibliothèques et détails de quantités adaptés aux différents corps de métier.'],['Gestion d’entreprise','Devis, facturation, achats, personnel, planning et matériel à enrichir progressivement.'],['Calculs Bâtiment et stabilité','Charges, éléments de structure et fondations : des moteurs à développer et qualifier par domaine.']],
    example:'L’entreprise de gros œuvre reçoit le cahier, le métré sans prix et les plans du lot concerné. Elle commente la version reçue sans accéder au dossier privé de l’architecte.',
    priceNote:'Le périmètre et les conditions du pilote sont convenus avant activation. L’offre commerciale définitive reste à confirmer.'
  },
  {
    key:'etudes',name:'Keydy Études & Architecture',short:'Études & Architecture',page:'logiciel-etudes-architecture.html',accent:'#0B6F68',
    logo:'assets/brand/keydy-etudes.svg',stage:'Pilote sur demande',pricing:'Sur demande',
    audience:'Architectes, bureaux d’études, missions de conseil et de contrôle.',
    headline:'Du cahier des charges au dossier transmis à l’entreprise.',
    intro:'Préparez vos prescriptions, vos métrés et les révisions de plans de la mission. Chaque transmission garde son contenu et ses destinataires, avec un retour des commentaires dans le dossier.',
    available:[
      ['Missions et prescriptions','Classez les postes par lot et chapitre, conservez vos notes et estimations dans votre dossier privé.'],
      ['Cahier et métré sans prix','Produisez les PDF, le métré CSV et l’archive du dossier avec les pièces choisies.'],
      ['Plans et révisions','Déposez des plans PDF ou images et joignez une révision identifiée à la transmission.'],
      ['Partenaires et suivi','Invitez les entreprises gratuitement et échangez sur la version qui leur est adressée.'],
      ['Dossier de permis privé','Renseignez la liste des pièces, conservez des exports figés et enregistrez les preuves de dépôt et de décision. Le suivi est manuel ; aucun dépôt administratif n’est automatisé.']
    ],
    planned:[['Conception et études','Bibliothèques, études spécialisées, calculs de stabilité et outils de dessin à qualifier séparément.'],['Gestion des missions','Honoraires, charge de travail, consultations et comparaison d’offres.']],
    example:'L’architecte transmet uniquement le dossier gros œuvre à l’entreprise concernée : cahier PDF, métré sans prix et plans révisés. Les autres membres du projet n’accèdent pas automatiquement à cette transmission.',
    priceNote:'Le pilote concerne les fonctions présentées comme réalisées. Les modules en préparation ne constituent pas une offre déjà livrée.'
  },
  {
    key:'promotion',name:'Keydy Promotion',short:'Promotion',page:'logiciel-promotion.html',accent:'#7042A8',
    logo:'assets/brand/keydy-promotion.svg',stage:'Pilote sur demande',pricing:'Sur demande',
    audience:'Promoteurs et maîtres d’ouvrage qui organisent des opérations et des marchés de travaux.',
    headline:'L’opération, les engagements et les décisions au même endroit.',
    intro:'Préparez le budget de vos lots et vos engagements par entreprise. Suivez les éléments publiés par vos partenaires selon votre mandat, tout en gardant vos données financières internes privées.',
    available:[
      ['Opérations privées','Regroupez les postes d’une opération, les bâtiments et unités décrits dans le dossier pilote.'],
      ['Lots et engagements','Distinguez budget de lot et engagements, avec rattachement des entreprises concernées.'],
      ['Documents et avancements','Retrouvez les publications du projet et les pièces auxquelles votre compte est autorisé.'],
      ['Vérification et approbation','Prenez des décisions partielles selon votre mandat, avec historique et sans facture automatique.']
    ],
    planned:[['Biens et commercialisation','Fiches de maisons ou appartements, prix commerciaux et disponibilités structurés.'],['Publicité et prospects','Brochures, annonces, demandes, relances et visites.'],['Ventes et acquéreurs','Offres, options, suivi des documents de vente et relation acquéreur.']],
    example:'Le promoteur suit ses lots de travaux et consulte un avancement proposé par l’entreprise. Il approuve les montants autorisés et retrouve les décisions précédentes. La publicité et la vente des biens formeront une étape suivante.',
    priceNote:'Le pilote porte sur la gestion de l’opération et des échanges. La commercialisation immobilière n’est pas encore incluse dans une offre disponible.'
  },
  {
    key:'techniques-speciales',name:'Keydy Techniques spéciales',short:'Techniques spéciales',page:'logiciel-techniques-speciales.html',accent:'#1A73E8',
    logo:'assets/brand/keydy-techniques-speciales.svg',stage:'Application existante',pricing:'Selon configuration',
    audience:'Chauffage, HVAC, sanitaire, électricité, maintenance et entreprises techniques.',
    headline:'Du rendez-vous à l’intervention, jusqu’à la facture.',
    intro:'Le KeydyWeb existant réunit la gestion du bureau et le travail des techniciens avec KeydyApp. Composez votre offre à partir des modules et des licences adaptés à votre entreprise.',
    available:[
      ['Clients, sites et installations','Retrouvez les équipements, documents et historiques de vos interventions.'],
      ['Planning et terrain','Organisez les rendez-vous, les interventions et les tournées avec les modules correspondants.'],
      ['Gestion commerciale','Préparez devis et factures, puis complétez votre organisation avec achats, stock et personnel selon vos modules.'],
      ['Outils techniques','Calculs métier, rapports et attestations selon les outils activés et leur périmètre.']
    ],
    planned:[['Lien avec les trois nouveaux SaaS','Le raccord automatique reste en préparation. Le pilote utilise aujourd’hui un lien vers le portail de partage existant.'],['Extensions spécialisées','KeydyCAD et les modules indiqués en préparation ne peuvent pas être souscrits dans le configurateur.']],
    example:'Le technicien retrouve son intervention dans KeydyApp. Le bureau suit le client, le matériel, les documents et la facturation dans KeydyWeb.',
    priceNote:'Le catalogue serveur fournit les prix, quantités, remises et conditions applicables. L’ouverture de la souscription suit la disponibilité annoncée dans le configurateur.'
  }
];

export const comparison = [
  ['Dossiers privés et projets partagés','Pilote','Pilote','Pilote','Existant · raccord progressif'],
  ['Métrés, prescriptions et cahier simple','Pilote','Pilote','Consultation selon partage','Selon modules'],
  ['Transmission nominative sans prix et plans révisés','Pilote','Pilote','Réception selon mandat','Raccord en préparation'],
  ['Avancements, commentaires et décisions','Pilote','Pilote','Pilote','Existant · portail propre'],
  ['Planning, personnel, achats et stocks','En préparation','En préparation / options','En préparation / options','Selon modules'],
  ['Calculs de stabilité','À développer et qualifier','À développer et qualifier','Consultation de notes partagées','Interfaces selon besoins'],
  ['Dossier de permis d’urbanisme','Pièces demandées','Pilote privé · suivi manuel','Pièces publiées séparément','Pièces demandées'],
  ['Biens, publicité, prospects et ventes','Hors offre principale','Pièces autorisées','En préparation','Hors offre principale']
];

export function productFor(value){return products.find(p=>p.key===value)||null;}
export function contactUrl(key){if(!productFor(key))throw new Error('SaaS inconnu');return 'contact.html?saas='+encodeURIComponent(key);}
export function initSaasContact(document){
  const form=document.querySelector('[data-demo-form]'),select=form?.querySelector('[name="saas"]');if(!select)return;
  const params=new URL(document.defaultView.location.href).searchParams;
  const initial=productFor(params.get('saas'))||(params.get('configuration')==='true'&&!params.has('saas')?productFor('techniques-speciales'):null);
  if(initial)select.value=initial.key;
  const update=()=>{
    const p=productFor(select.value),note=document.querySelector('[data-saas-contact-note]');
    note.textContent=p?(p.key==='techniques-speciales'?'Keydy Techniques spéciales : précisez vos modules et votre équipe.':'Demande de pilote '+p.name+' : le périmètre et les conditions seront confirmés avec vous.'):'Choisissez un logiciel ou décrivez votre activité pour être orienté.';
    document.querySelector('[data-contact-title]').textContent=p?'Parlons de '+p.name:'Parlons de votre projet Keydy';
    if(p&&p.key!=='techniques-speciales'){
      form.querySelector('[name="configuration"]').value='';document.querySelector('#contact-configuration-summary').hidden=true;
    }
  };
  select.addEventListener('change',update);update();
}
if(typeof document!=='undefined')initSaasContact(document);
