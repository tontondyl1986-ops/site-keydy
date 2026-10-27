export function normalize(selected,catalog){
  const allowed=new Map(catalog.map(m=>[m.key,m])),result=new Set();
  const append=key=>{const m=allowed.get(key);if(!m||result.has(key))return;result.add(key);for(const need of m.required||[])append(need);};
  for(const key of selected)append(key);return result;
}
export function dependents(selected,key,catalog){return catalog.filter(m=>selected.has(m.key)&&(m.required||[]).includes(key)).map(m=>m.key);}
export function configurationUrl(base,selection){
  const target=new URL('/souscription-keydy',base);
  for(const [k,v] of Object.entries(selection))target.searchParams.set(k,Array.isArray(v)?v.join(','):String(v));return target.href;
}
export async function initCommerce(document,fetcher=globalThis.fetch){
  const form=document.querySelector('#subscription-builder');if(!form)return;
  const status=document.querySelector('#catalog-status'),summary=document.querySelector('#price-summary'),button=document.querySelector('#continue');
  const base=new URL(document.documentElement.dataset.keydyApi||'https://keydy.be');
  if(!['https:','http:'].includes(base.protocol))throw new Error('Adresse de catalogue invalide');
  const money=v=>new Intl.NumberFormat('fr-BE',{style:'currency',currency:'EUR'}).format(v);
  const selected=new Set(),boxes=new Map();let generation=0,preview=null;
  const values=()=>({modules:[...selected],users:Number(document.querySelector('#users').value),annual:document.querySelector('#annual').checked,
    vehicles:Number(document.querySelector('#vehicles').value),scanners:Number(document.querySelector('#scanners').value)});
  const error=message=>{status.textContent=message;status.classList.add('error');button.disabled=true;preview=null;};
  try{
    const response=await fetcher(new URL('/api/keydy/catalog',base),{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw new Error('Catalogue indisponible');const catalog=await response.json();
    if(!Array.isArray(catalog.modules)||!catalog.configuration?.prices)throw new Error('Catalogue incomplet');
    const prices=catalog.configuration.prices,discount=catalog.configuration.annualDiscount;
    document.querySelector('#annual-discount').textContent=discount?'−'+discount+' % sur l’abonnement':'';
    const modules=document.querySelector('#modules');
    for(const module of catalog.modules){
      const label=document.createElement('label');label.className='module-choice';
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.value=module.key;checkbox.name='module';boxes.set(module.key,checkbox);
      const text=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');title.textContent=module.label;
      const rule=catalog.configuration.moduleRules?.[module.key];
      detail.textContent=rule?money(rule.unitPrice)+' HTVA par unité/mois · '+({ORG:'par entreprise',USERS:'par utilisateur',PAID_USERS:'par licence facturable',VEHICLES:'par véhicule',SCANNERS:'par terminal',MANUAL:'quantité convenue'}[rule.basis]||'quantité convenue')+' · '+rule.includedQuantity+' incluse(s)':money(prices[module.key])+' HTVA / mois';
      text.append(title,detail);label.append(checkbox,text);modules.append(label);
      checkbox.addEventListener('change',()=>{
        if(checkbox.checked){selected.add(module.key);for(const dependency of normalize(selected,catalog.modules))selected.add(dependency);}
        else{if(dependents(selected,module.key,catalog.modules).length){checkbox.checked=true;status.classList.remove('error');status.textContent='Retirez d’abord les modules dépendants de ce module.';return;}selected.delete(module.key);}
        for(const [key,box] of boxes)box.checked=selected.has(key);recalculate();
      });
    }
    const line=(label,value)=>{const row=document.createElement('div');row.className='summary-line';const a=document.createElement('span'),b=document.createElement('span');a.textContent=label;b.textContent=value;row.append(a,b);return row;};
    async function recalculate(){
      const own=++generation;preview=null;button.disabled=true;
      if(!form.checkValidity())return error('Vérifiez le nombre d’utilisateurs et les quantités.');
      const selection=values(),url=new URL('/api/keydy/preview',base);
      for(const [k,v] of Object.entries(selection))url.searchParams.set(k,Array.isArray(v)?v.join(','):String(v));
      try{
        const r=await fetcher(url,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('Configuration indisponible');const p=await r.json();if(own!==generation)return;
        if(!Number.isFinite(p.recurringTtc)||!Number.isFinite(p.setupTtc))throw new Error('Récapitulatif incomplet');
        summary.replaceChildren();const total=document.createElement('div');total.className='summary-total';total.textContent=money(p.recurringTtc);
        const period=document.createElement('p');period.className='summary-period';period.textContent='TTC / '+(selection.annual?'an':'mois')+' · à la mise à disposition';
        const divider=document.createElement('hr');divider.className='summary-divider';
        summary.append(total,period,line('Abonnement HTVA',money(p.recurringHt)),line('TVA',money(p.recurringVat)),divider,
          line('Mise en service unique HTVA',money(p.setupHt)),line('TVA des frais uniques',money(p.setupVat)),line('Frais initiaux TTC',money(p.setupTtc)));
        preview={...selection,revision:p.revision};button.disabled=false;status.classList.remove('error');status.textContent='Tarifs recalculés par Keydy. TVA présentée pour une entreprise belge ; autres régimes sur devis.';
      }catch(e){if(own===generation)error('Le calcul est temporairement indisponible. Réessayez ou contactez Keydy pour votre devis.');}
    }
    for(const id of ['users','annual','vehicles','scanners'])document.querySelector('#'+id).addEventListener('input',()=>recalculate());
    form.addEventListener('submit',e=>{e.preventDefault();if(preview&&!button.disabled)document.defaultView.location.assign(configurationUrl(base,preview));});
    form.hidden=false;await recalculate();
  }catch(e){error('Le catalogue sera disponible après ouverture du service de souscription. Contactez Keydy pour préparer votre offre.');}
}
if(typeof document!=='undefined')initCommerce(document);
