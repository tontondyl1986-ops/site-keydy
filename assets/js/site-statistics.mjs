// Closed categories only. Never exports query strings, form values, text, IP or identifiers.
export const PAGES=Object.freeze({'/':'HOME','/index.html':'HOME','/logiciels.html':'SOFTWARE','/modules.html':'MODULES','/tarifs.html':'PRICING','/contact.html':'CONTACT','/demonstration.html':'DEMO','/aide.html':'HELP','/fonctionnalites.html':'FEATURES','/logiciel-chauffagiste.html':'HEATING','/facturation-electronique-peppol.html':'PEPPOL','/logiciel-batiment.html':'BUILDING','/logiciel-etudes-architecture.html':'STUDIES','/logiciel-promotion.html':'PROMOTION','/logiciel-techniques-speciales.html':'TECHNICAL','/confidentialite.html':'PRIVACY','/conditions-generales.html':'TERMS'});
export function pageKey(path){return PAGES[path]||null;}
export function clickTarget(href,current){
  try{
    const url=new URL(href,current),source=new URL(current);
    if(url.protocol==='mailto:')return 'EMAIL';
    if(!['https:','http:'].includes(url.protocol))return null;
    const known=url.origin===source.origin||['https://keydy.be','https://www.keydy.be','https://site.keydy.be','https://www.site.keydy.be'].includes(url.origin);
    if(!known)return null;
    if(url.pathname==='/souscription-keydy')return 'SUBSCRIBE';
    if(url.pathname==='/login')return 'LOGIN';
    if(url.pathname===source.pathname&&url.hash==='#logiciels')return 'CHOOSE_SOFTWARE';
    return pageKey(url.pathname);
  }catch{return null;}
}
export async function initSiteStatistics(document,fetcher=globalThis.fetch){
  const view=document.defaultView,page=pageKey(view.location.pathname);if(!page)return;
  const privacySignal=view.navigator.globalPrivacyControl===true||view.navigator.doNotTrack==='1';
  if(privacySignal)return;
  let base;
  try{base=new URL(document.documentElement.dataset.keydyApi||'https://keydy.be');if(!['https://keydy.be','https://www.keydy.be'].includes(base.origin)&&!/^http:\/\/127\.0\.0\.1:\d+$/.test(base.origin))return;}catch{return;}
  let config;
  try{const response=await fetcher(new URL('/public/site-statistics/config',base),{credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(4000)});if(!response.ok)return;config=await response.json();}catch{return;}
  if(config.schema!==1||config.enabled!==true)return;
  const storageKey='keydy-site-measurement-choice-v1';let choice='',sentView=false,sent=0,lastClick='';
  try{choice=view.sessionStorage.getItem(storageKey)||'';}catch{}
  const send=(event,target)=>{
    if(choice!=='accepted'||sent>=50)return;
    sent++;
    const body=JSON.stringify({schema:1,page,event,target});
    // No retries: analytics must never hold navigation or duplicate a failed send.
    try{Promise.resolve(fetcher(new URL('/public/site-statistics/event',base),{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',keepalive:true,signal:AbortSignal.timeout(3000)})).catch(()=>{});}catch{}
  };
  const viewOnce=()=>{if(choice==='accepted'&&!sentView){sentView=true;send('PAGE_VIEW','NONE');}};
  const panel=document.createElement('section');panel.setAttribute('aria-label','Choix de mesure d’audience');panel.className='keydy-measurement';
  const title=document.createElement('strong');title.textContent='Mesure d’audience facultative';
  const text=document.createElement('p');text.textContent='Acceptez-vous de compter les pages vues et les clics sur nos offres pour améliorer le site ? Aucun nom, identifiant de visiteur ou contenu de formulaire n’est enregistré. Vous pouvez refuser et continuer à utiliser le site.';
  const info=document.createElement('a');info.href='confidentialite.html#mesure-audience';info.textContent='En savoir plus';
  const accept=document.createElement('button'),refuse=document.createElement('button');
  for(const button of [accept,refuse]){button.type='button';button.className='btn btn-secondary btn-sm';}
  accept.textContent='Accepter la mesure';refuse.textContent='Refuser la mesure';
  const actions=document.createElement('div');actions.className='keydy-measurement-actions';actions.append(accept,refuse,info);panel.append(title,text,actions);
  const manage=document.createElement('button');manage.type='button';manage.className='keydy-measurement-manage';manage.textContent='Mes choix d’audience';manage.addEventListener('click',()=>{panel.hidden=false;refuse.focus();});
  const choose=value=>{choice=value;try{view.sessionStorage.setItem(storageKey,value);}catch{}panel.hidden=true;viewOnce();};
  accept.addEventListener('click',()=>choose('accepted'));refuse.addEventListener('click',()=>choose('refused'));
  panel.hidden=['accepted','refused'].includes(choice);document.body.append(panel,manage);viewOnce();
  let lastAt=0;
  document.addEventListener('click',event=>{
    if(choice!=='accepted'||!event.isTrusted)return;
    const element=event.target.closest?.('a,button');if(!element||panel.contains(element)||element===manage||element.disabled)return;
    const target=element.id==='continue'?'SUBSCRIBE':element.tagName==='A'?clickTarget(element.getAttribute('href'),view.location.href):null;
    if(!target)return;const now=Date.now();if(target===lastClick&&now-lastAt<1000)return;lastClick=target;lastAt=now;send('CLICK',target);
  },{capture:true});
}
