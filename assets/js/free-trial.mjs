import {normalize,unavailableModules} from './commerce.mjs';

export function trialAvailable(catalog){
  return catalog?.freeTrialDays===30&&catalog.freeTrialAvailable===true&&catalog.subscriptionsOpen===true&&catalog.freeTrialUrl==='/essai-gratuit'&&Array.isArray(catalog.modules);
}
export function trialConfigurationUrl(base,selected,catalog){
  const target=new URL('/essai-gratuit',base);
  if(!['https:','http:'].includes(target.protocol))throw new Error('Adresse Keydy invalide');
  const blocked=new Set(unavailableModules(catalog).map(m=>m.key));
  const modules=[...normalize(selected,catalog.modules.filter(m=>!blocked.has(m.key)))];
  if(modules.length)target.searchParams.set('modules',modules.join(','));
  return target.href;
}
export async function initFreeTrial(document,fetcher=globalThis.fetch){
  const links=[...document.querySelectorAll('[data-start-trial]')];if(!links.length)return;
  const base=new URL(document.documentElement.dataset.keydyApi||'https://keydy.be');
  const status=document.querySelector('[data-trial-status]');let catalog=null;
  const update=()=>{
    for(const link of links){
      if(!catalog||!trialAvailable(catalog)){link.removeAttribute('href');link.setAttribute('aria-disabled','true');continue;}
      const inputs=[...document.querySelectorAll('#modules input[name="module"]')];
      const modules=inputs.length?inputs.filter(i=>i.checked&&!i.disabled).map(i=>i.value):(new URL(document.defaultView.location.href).searchParams.get('modules')||'').split(',');
      link.href=trialConfigurationUrl(base,modules,catalog);link.removeAttribute('aria-disabled');
    }
  };
  for(const link of links)link.addEventListener('click',event=>{if(link.getAttribute('aria-disabled')==='true')event.preventDefault();});
  document.querySelector('#subscription-builder')?.addEventListener('change',update);
  async function load(){
    catalog=null;update();if(status)status.textContent='Vérification de la disponibilité de l’essai…';
    try{
      const r=await fetcher(new URL('/api/keydy/catalog',base),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});
      if(!r.ok)throw new Error();catalog=await r.json();
      if(status)status.textContent=trialAvailable(catalog)?'Essai disponible · 30 jours après activation · jusqu’à 3 utilisateurs · aucune carte bancaire.':'Les inscriptions aux essais ne sont pas encore disponibles sur cette version de Keydy. Vous pouvez nous contacter pour une démonstration.';
    }catch(ignored){if(status)status.textContent='Impossible de vérifier l’ouverture des essais. Réessayez ou contactez info@keydy.be.';}
    update();
  }
  document.querySelector('[data-trial-retry]')?.addEventListener('click',load);
  await load();
}
if(typeof document!=='undefined')initFreeTrial(document);
