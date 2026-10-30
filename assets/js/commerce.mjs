const fields=['modules','users','annual','vehicles','scanners','assistedImport','revision'];
export function normalize(selected,catalog){
  const allowed=new Map(catalog.filter(m=>!m.inDevelopment).map(m=>[m.key,m])),result=new Set();
  const append=key=>{const m=allowed.get(key);if(!m||result.has(key))return;result.add(key);for(const need of m.required||[])append(need);};
  for(const key of selected)append(key);return result;
}
export function dependents(selected,key,catalog){return catalog.filter(m=>selected.has(m.key)&&(m.required||[]).includes(key)).map(m=>m.key);}
export function configurationUrl(base,selection){
  const target=new URL('/souscription-keydy',base);
  for(const key of fields)if(selection[key]!==undefined)target.searchParams.set(key,Array.isArray(selection[key])?selection[key].join(','):String(selection[key]));
  return target.href;
}
export function contactConfigurationUrl(base,selection){
  const target=new URL('contact.html',base);target.searchParams.set('configuration','true');
  for(const key of fields.filter(k=>k!=='revision'))if(selection[key]!==undefined)target.searchParams.set(key,Array.isArray(selection[key])?selection[key].join(','):String(selection[key]));
  return target.href;
}
export function validateCycleComparison(monthly,annual,revision){
  for(const p of [monthly,annual]){
    if(!p||!Number.isSafeInteger(p.revision)||p.revision!==revision)throw new Error('CATALOG_CHANGED');
    if(!['monthlyHt','recurringHt','recurringVat','recurringTtc','setupHt','setupVat','setupTtc'].every(k=>Number.isFinite(p[k])&&p[k]>=0)||!Array.isArray(p.lines)||p.lines.length<1||
      p.lines.some(c=>typeof c.code!=='string'||typeof c.label!=='string'||!Number.isFinite(c.quantity)||c.quantity<0||!Number.isFinite(c.unitPrice)||c.unitPrice<0))throw new Error('INVALID_PREVIEW');
  }
  if(monthly.monthlyHt!==annual.monthlyHt||['setupHt','setupVat','setupTtc'].some(k=>monthly[k]!==annual[k])||
    JSON.stringify(monthly.lines)!==JSON.stringify(annual.lines))throw new Error('INCONSISTENT_PREVIEWS');
  return {monthly,annual};
}
export function restoreSelection(params,catalog){
  const integer=(key,fallback,min,max)=>{const raw=params.get(key);if(raw===null||!/^\d+$/.test(raw))return fallback;const n=Number(raw);return n>=min&&n<=max?n:fallback;};
  return {modules:[...normalize((params.get('modules')||'').split(','),catalog)],users:integer('users',3,1,50),
    annual:params.get('annual')==='true',assistedImport:params.get('assistedImport')==='true',vehicles:integer('vehicles',0,0,1000),scanners:integer('scanners',0,0,1000)};
}
const descriptions={PLANNING:'Organisez les rendez-vous et les équipes.',CONGES:'Centralisez les demandes et les absences.',TACHES:'Suivez les tâches et leurs responsables.',
  CARTE_SITES:'Repérez vos sites et lieux d’intervention.',COMPTA:'Retrouvez les fonctions comptables dans Keydy.',REPORTS:'Consultez vos rapports et indicateurs.',
  MOBILE:'Complétez le suivi des interventions sur le terrain.',SAV:'Organisez les campagnes et tournées d’entretien.',CHANTIER:'Rassemblez les informations de vos chantiers.',
  FGAS:'Suivez les informations relatives aux fluides frigorigènes.',EMPLOYES:'Centralisez les dossiers de vos collaborateurs.',POINTAGE:'Suivez les heures de votre équipe.',
  STOCK:'Retrouvez les articles et mouvements de stock.',FOURNISSEURS:'Préparez vos achats et suivez les fournisseurs.',FLOTTE:'Rassemblez les informations de vos véhicules.',
  OUTILLAGE:'Suivez le matériel de votre entreprise.',MESSAGERIE:'Échangez dans Keydy.',BOITE_MAIL:'Retrouvez vos échanges e-mail dans votre outil.',
  PORTAIL:'Proposez un espace de consultation à vos clients.',CALCUL:'Retrouvez les outils de calcul métier.',ATTESTATIONS_PERSO:'Préparez vos modèles d’attestations.'};
export async function initCommerce(document,fetcher=globalThis.fetch){
  const form=document.querySelector('#subscription-builder');if(!form)return;
  const status=document.querySelector('#catalog-status'),summary=document.querySelector('#price-summary'),button=document.querySelector('#continue');
  const jump=document.querySelector('#summary-jump'),view=document.defaultView;
  const comparison=document.querySelector('#cycle-comparison'),contact=document.querySelector('#contact-configuration'),reload=document.querySelector('#reload-catalog');
  const base=new URL(document.documentElement.dataset.keydyApi||'https://keydy.be');
  if(!['https:','http:'].includes(base.protocol))throw new Error('Adresse de catalogue invalide');
  const money=v=>new Intl.NumberFormat('fr-BE',{style:'currency',currency:'EUR'}).format(v);
  const selected=new Set(),boxes=new Map();let generation=0,preview=null;
  const values=()=>({modules:[...selected],users:Number(document.querySelector('#users').value),annual:document.querySelector('#annual').checked,
    vehicles:Number(document.querySelector('#vehicles').value),scanners:Number(document.querySelector('#scanners').value),assistedImport:document.querySelector('#assisted-import').checked});
  const clearPrice=message=>{summary.textContent=message;summary.setAttribute('aria-busy','false');comparison.replaceChildren();preview=null;button.disabled=true;jump.textContent='Voir mon récapitulatif';};
  const error=message=>{status.textContent=message;status.classList.add('error');clearPrice('Aucun tarif confirmé. Relancez le calcul après vérification.');};
  const line=(label,value)=>{const row=document.createElement('div');row.className='summary-line';const a=document.createElement('span'),b=document.createElement('span');a.textContent=label;b.textContent=value;row.append(a,b);return row;};
  try{
    const response=await fetcher(new URL('/api/keydy/catalog',base),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('Catalogue indisponible');const catalog=await response.json();
    if(!Array.isArray(catalog.modules)||!catalog.configuration?.prices)throw new Error('Catalogue incomplet');
    if(catalog.subscriptionFlow!=='SELF_SERVICE_V1'||catalog.selfImportIncluded!==true||!Number.isFinite(catalog.assistedImportHt)||catalog.assistedImportHt!==1500)throw new Error('Parcours de souscription à mettre à jour');
    catalog.modules=catalog.modules.filter(m=>!m.inDevelopment);
    const open=catalog.subscriptionsOpen===true;
    const availability=document.querySelector('#sales-availability');availability.hidden=false;
    availability.textContent=open?'Composez votre offre, puis consultez le devis et le contrat avant de signer.':'Ouverture commerciale à venir. Vous pouvez explorer les tarifs ; la création de nouveaux devis en ligne reste fermée.';
    button.textContent=open?'Préparer mon devis':'Souscriptions bientôt disponibles';
    const prices=catalog.configuration.prices,discount=catalog.configuration.annualDiscount;
    document.querySelector('#annual-discount').textContent=discount?'−'+discount+' % sur l’abonnement':'Sans remise annuelle configurée';
    document.querySelector('#included-users').textContent=catalog.configuration.includedUsers+' utilisateur(s) inclus dans le socle. Les licences supplémentaires sont détaillées dans le récapitulatif.';
    const initial=restoreSelection(new URL(view.location.href).searchParams,catalog.modules);
    initial.modules.forEach(key=>selected.add(key));
    for(const key of ['users','vehicles','scanners'])document.querySelector('#'+key).value=initial[key];
    document.querySelector('#annual').checked=initial.annual;
    document.querySelector('#assisted-import').checked=initial.assistedImport;
    const modules=document.querySelector('#modules');
    for(const module of catalog.modules){
      const label=document.createElement('label');label.className='module-choice';label.dataset.search=(module.label+' '+(descriptions[module.key]||'')).toLocaleLowerCase('fr');
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=module.key;checkbox.name='module';checkbox.checked=selected.has(module.key);boxes.set(module.key,checkbox);
      const text=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('span'),detail=document.createElement('small');title.textContent=module.label;
      description.className='module-description';description.textContent=descriptions[module.key]||'Ajoutez cet outil à votre configuration.';
      const rule=catalog.configuration.moduleRules?.[module.key];
      detail.textContent=rule?money(rule.unitPrice)+' HTVA / mois · '+({ORG:'par entreprise',USERS:'par utilisateur',PAID_USERS:'par licence facturable',VEHICLES:'par véhicule',SCANNERS:'par terminal',MANUAL:'quantité convenue'}[rule.basis]||'quantité convenue')+' · '+rule.includedQuantity+' incluse(s)':money(prices[module.key])+' HTVA / mois';
      text.append(title,description,detail);
      if(module.required?.length){const needs=document.createElement('small');needs.className='module-needs';needs.textContent='Avec '+module.required.map(key=>catalog.modules.find(m=>m.key===key)?.label||key).join(', ');text.append(needs);}
      label.append(checkbox,text);modules.append(label);
      checkbox.addEventListener('change',()=>{
        if(checkbox.checked){selected.add(module.key);for(const dependency of normalize(selected,catalog.modules))selected.add(dependency);}
        else{if(dependents(selected,module.key,catalog.modules).length){checkbox.checked=true;status.classList.remove('error');status.textContent='Retirez d’abord les modules dépendants de ce module.';return;}selected.delete(module.key);}
        for(const [key,box] of boxes)box.checked=selected.has(key);recalculate();
      });
    }
    const search=document.querySelector('#module-search');
    search.addEventListener('input',()=>{const query=search.value.trim().toLocaleLowerCase('fr');let visible=0;for(const card of modules.children){card.hidden=!card.dataset.search.includes(query);if(!card.hidden)visible++;}document.querySelector('#search-result').textContent=visible?visible+' module(s) affiché(s)':'Aucun module trouvé. Essayez un autre terme.';});
    async function recalculate(){
      const own=++generation;clearPrice('Calcul de votre configuration…');summary.setAttribute('aria-busy','true');
      contact.href='contact.html';reload.hidden=true;
      document.querySelector('#selection-count').textContent=selected.size+' module(s) sélectionné(s)';
      if(!form.checkValidity())return error('Vérifiez le nombre d’utilisateurs et les quantités.');
      const selection=values();contact.href=contactConfigurationUrl(view.location.href,selection);
      const refreshed=new URL(view.location.href);refreshed.search='';
      for(const [key,value] of Object.entries(selection))refreshed.searchParams.set(key,Array.isArray(value)?value.join(','):String(value));reload.href=refreshed.href;
      try{
        const quotes=await Promise.all([false,true].map(async annual=>{
          const url=new URL('/api/keydy/preview',base);
          for(const [k,v] of Object.entries({...selection,annual}))url.searchParams.set(k,Array.isArray(v)?v.join(','):String(v));
          const r=await fetcher(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Configuration indisponible');return r.json();
        }));
        if(own!==generation)return;
        const pair=validateCycleComparison(quotes[0],quotes[1],catalog.revision),p=selection.annual?pair.annual:pair.monthly;
        const rows=p.lines.map(c=>{if(!Number.isFinite(c.quantity)||c.quantity<0||!Number.isFinite(c.unitPrice)||c.unitPrice<0)throw new Error('Ligne incomplète');return line(c.label+' · '+c.quantity+' × '+money(c.unitPrice),money(Math.round(c.quantity*c.unitPrice*100)/100));});
        summary.replaceChildren();summary.setAttribute('aria-busy','false');
        if(p.setupHt!==(selection.assistedImport?catalog.assistedImportHt:0))throw new Error('Option de reprise incohérente');
        const total=document.createElement('div');total.className='summary-total';total.textContent=money(p.recurringHt);
        const period=document.createElement('p');period.className='summary-period';period.textContent='HTVA / '+(selection.annual?'an':'mois')+' · après activation';
        const detail=document.createElement('details');detail.className='price-detail';detail.open=true;const heading=document.createElement('summary');heading.textContent='Détail mensuel HTVA';detail.append(heading,...rows,line('Total mensuel avant remise annuelle',money(p.monthlyHt)));
        const divider=document.createElement('hr');divider.className='summary-divider';
        summary.append(total,period,detail,line('Abonnement HTVA / '+(selection.annual?'an':'mois'),money(p.recurringHt)),line('TVA',money(p.recurringVat)),divider,
          line('Import Excel autonome', 'Inclus'),line('Reprise par Keydy (option unique HTVA)',money(p.setupHt)),line('TVA de l’option',money(p.setupVat)),line('Premier paiement TTC',money(Math.round((p.recurringTtc+p.setupTtc)*100)/100)));
        for(const [cycle,label,quote] of [[false,'Mensuel',pair.monthly],[true,'Annuel',pair.annual]]){
          const choice=document.createElement('button');choice.type='button';choice.className='cycle-choice';choice.setAttribute('aria-pressed',String(selection.annual===cycle));choice.dataset.cycle=cycle?'annual':'monthly';
          const name=document.createElement('strong'),cost=document.createElement('span');name.textContent=label;cost.textContent=money(quote.recurringHt)+' HTVA / '+(cycle?'an':'mois');choice.append(name,cost);
          choice.addEventListener('click',()=>{if(selection.annual===cycle)return;document.querySelector('#annual').checked=cycle;recalculate();});comparison.append(choice);
        }
        preview={...selection,revision:p.revision};button.disabled=!open;
        const saved=new URL(view.location.href);saved.search='';for(const key of fields)saved.searchParams.set(key,Array.isArray(preview[key])?preview[key].join(','):String(preview[key]));view.history.replaceState(null,'',saved.href);
        jump.textContent='Voir mon récapitulatif · '+money(p.recurringHt)+' HTVA / '+(selection.annual?'an':'mois');
        status.classList.remove('error');status.textContent='Configuration actualisée. Tarifs calculés par Keydy ; TVA indicative pour une entreprise belge, autres régimes sur devis.';
      }catch(e){if(own===generation){error(e.message==='CATALOG_CHANGED'?'Les tarifs ont changé. Rechargez le catalogue avant de poursuivre.':'Le calcul est temporairement indisponible. Réessayez ou contactez Keydy pour votre devis.');reload.hidden=e.message!=='CATALOG_CHANGED';}}
    }
    for(const id of ['users','annual','vehicles','scanners','assisted-import'])document.querySelector('#'+id).addEventListener('input',()=>recalculate());
    document.querySelector('#retry-price').addEventListener('click',()=>recalculate());
    form.addEventListener('submit',e=>{e.preventDefault();if(preview&&open&&!button.disabled)view.location.assign(configurationUrl(base,preview));});
    form.hidden=false;await recalculate();
  }catch(e){error('Le catalogue est temporairement indisponible. Contactez Keydy pour préparer votre offre.');}
}
if(typeof document!=='undefined')initCommerce(document);
