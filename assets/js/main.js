document.addEventListener('DOMContentLoaded',()=>{
  const toggle=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.nav-links');
  if(toggle&&nav) toggle.addEventListener('click',()=>nav.classList.toggle('open'));
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
  if(form){form.addEventListener('submit',e=>{
    e.preventDefault();
    const d=new FormData(form);
    const lines=[
      'Société : '+(d.get('societe')||''),
      'Nom et prénom : '+(d.get('nom')||''),
      'E-mail : '+(d.get('email')||''),
      'Téléphone : '+(d.get('telephone')||''),
      'Nombre de techniciens : '+(d.get('techniciens')||''),
      'Activité principale : '+(d.get('activite')||''),
      '',
      'Ce que le prospect souhaite améliorer :',
      (d.get('besoin')||'—')
    ];
    const subject=encodeURIComponent('Demande de démonstration Keydy — '+(d.get('societe')||d.get('nom')||''));
    const body=encodeURIComponent(lines.join('\n'));
    window.location.href='mailto:info@keydy.be?subject='+subject+'&body='+body;
    document.querySelector('[data-form-result]').textContent='Votre messagerie va s\'ouvrir avec la demande pré-remplie, à destination de info@keydy.be.';
    form.reset();
  });}
});
