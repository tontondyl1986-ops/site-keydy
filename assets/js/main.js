document.addEventListener('DOMContentLoaded',()=>{
  const search=document.querySelector('[data-help-search]');
  if(search){
    const items=[...document.querySelectorAll('[data-help-item]')];
    search.addEventListener('input',()=>{
      const q=search.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      items.forEach(el=>{
        const txt=el.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
        el.classList.toggle('hidden',q&&!txt.includes(q));
      });
    });
  }

  const form=document.querySelector('[data-demo-form]');
  if(form){
    const params=new URLSearchParams(window.location.search);
    const fromConfigurator=params.get('configuration')==='true';
    const product=form.elements.produit;
    const purpose=form.elements.demande;
    const selectValue=(field,value)=>{
      if([...field.options].some(option=>option.value===value&&!option.disabled))field.value=value;
    };
    selectValue(purpose,fromConfigurator?'devis':params.get('demande'));
    const offerPages=new Map([['wallet','keydy-wallet.html#offres'],['time','keydy-time.html#offres']]);
    const offerPage=offerPages.get(params.get('produit'));
    if(!fromConfigurator&&purpose.value!=='question'&&offerPage){
      window.location.replace(offerPage);
      return;
    }

    const prepared=form.querySelector('[data-mail-copy]');
    const message=prepared.querySelector('textarea');
    const status=form.querySelector('[data-form-result]');
    const configurationSummary=form.querySelector('#contact-configuration-summary');
    const questionOptions=[...form.querySelector('[data-question-products]').content.children];
    const futureOptions=product.querySelectorAll('[data-in-development]');
    const otherOption=product.querySelector('option[value=autre]');
    const title=document.querySelector('[data-contact-title]');
    const intro=document.querySelector('[data-contact-intro]');
    const requestHeadings={
      demo:[title.textContent,intro.textContent],
      devis:['Demander un devis','Décrivez les besoins de votre équipe pour préparer une offre adaptée.'],
      question:['Demander un renseignement','Choisissez le produit Keydy sur lequel vous avez une question.']
    };
    const updatePurpose=()=>{
      const isQuestion=purpose.value==='question';
      const previousProduct=product.value;
      if(isQuestion)otherOption.before(...questionOptions);
      else questionOptions.forEach(option=>option.remove());
      futureOptions.forEach(option=>{option.disabled=!isQuestion;});
      product.value='suite';
      selectValue(product,previousProduct);
      if(!fromConfigurator){[title.textContent,intro.textContent]=requestHeadings[purpose.value];document.title=title.textContent+' | Keydy';}
    };
    const refreshRequest=()=>{
      if(fromConfigurator)configurationSummary.hidden=purpose.value!=='devis'||product.value!=='suite';
      message.value='';
      prepared.hidden=true;
    };
    updatePurpose();
    if(!fromConfigurator)selectValue(product,params.get('produit'));
    refreshRequest();
    purpose.addEventListener('change',()=>{updatePurpose();refreshRequest();});
    product.addEventListener('change',refreshRequest);
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const data=new FormData(form);
      const label=purpose.selectedOptions[0].textContent.trim();
      const subject=label[0].toUpperCase()+label.slice(1)+' · '+product.selectedOptions[0].textContent.trim();
      const lines=[
        'Demande : '+label,
        'Produit : '+product.selectedOptions[0].textContent.trim(),
        'Nom et prénom : '+data.get('nom'),
        'E-mail : '+data.get('email')
      ];
      if(data.get('societe'))lines.push('Société : '+data.get('societe'));
      if(data.get('telephone'))lines.push('Téléphone : '+data.get('telephone'));
      lines.push('',String(data.get('besoin')).trim());
      if(purpose.value==='devis'&&product.value==='suite'&&data.get('configuration'))lines.push('',data.get('configuration'));
      const body=lines.join('\n');
      message.value='Objet : '+subject+'\n\n'+body;
      prepared.hidden=false;
      status.textContent='Si la messagerie ne s’ouvre pas, copiez ce texte et envoyez-le à info@keydy.be.';
      window.location.href='mailto:info@keydy.be?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
    });
    form.querySelector('[data-copy-request]').addEventListener('click',async()=>{
      try{
        await navigator.clipboard.writeText(message.value);
        status.textContent='Demande copiée. Vous pouvez la coller dans un e-mail à info@keydy.be.';
      }catch{
        message.select();
        status.textContent='Le texte est sélectionné. Copiez-le dans votre messagerie et envoyez-le à info@keydy.be.';
      }
    });
  }
});
