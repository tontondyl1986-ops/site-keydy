import {restoreSelection} from './commerce.mjs';

export function configurationRequest(selection,catalog){
  const labels=new Map(catalog.map(m=>[m.key,m.label]));
  return ['Configuration envisagée, à confirmer avec Keydy (aucun contrat ni paiement créé) :',
    'Utilisateurs : '+selection.users,'Cycle souhaité : '+(selection.annual?'annuel':'mensuel'),
    'Modules : '+(selection.modules.map(key=>labels.get(key)).filter(Boolean).join(', ')||'socle Keydy'),
    'Véhicules : '+selection.vehicles+' · Terminaux : '+selection.scanners,
    'Tarifs et conditions à confirmer dans un devis.'].join('\n');
}
export async function initContactConfiguration(document,fetcher=globalThis.fetch){
  const view=document.defaultView,params=new URL(view.location.href).searchParams;
  const section=document.querySelector('#contact-configuration-summary');
  if(!section||params.get('configuration')!=='true')return;
  const form=document.querySelector('[data-demo-form]'),field=form.querySelector('[name="configuration"]'),submit=form.querySelector('[type="submit"]');
  const detail=section.querySelector('[data-configuration-detail]'),edit=section.querySelector('[data-configuration-edit]');
  section.hidden=false;detail.textContent='Vérification de votre sélection…';submit.disabled=true;
  document.querySelector('[data-contact-title]').textContent='Parlons de votre projet Keydy';
  document.querySelector('[data-contact-intro]').textContent='Retrouvez votre sélection ci-dessous et précisez vos besoins. Les tarifs et conditions seront confirmés avant tout engagement.';
  document.title='Votre projet d’abonnement | Keydy';
  try{
    const base=new URL(document.documentElement.dataset.keydyApi||'https://keydy.be');
    const response=await fetcher(new URL('/api/keydy/catalog',base),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('catalog');const data=await response.json();
    if(!Array.isArray(data.modules))throw new Error('catalog');
    const modules=data.modules.filter(m=>!m.inDevelopment),selection=restoreSelection(params,modules);
    const text=configurationRequest(selection,modules);detail.textContent=text;field.value=text;
    const target=new URL('tarifs.html',view.location.href);
    for(const [key,value] of Object.entries(selection))target.searchParams.set(key,Array.isArray(value)?value.join(','):String(value));
    edit.href=target.href;
  }catch{
    field.value='';detail.textContent='Le catalogue est indisponible. Décrivez vos besoins dans le formulaire ; les modules et tarifs seront confirmés ensemble.';
  }finally{submit.disabled=false;}
}
if(typeof document!=='undefined')initContactConfiguration(document);
