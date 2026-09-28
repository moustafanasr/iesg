(()=>{
  'use strict';
  window.IESGMotion={enabled:true,smoothScroll:true,pageWipe:false,intensity:'cinematic',mobileHeavy:false};

  const btn=document.querySelector('[data-iesg-menu-toggle]');
  const nav=document.querySelector('[data-iesg-nav]');
  if(btn&&nav){
    btn.addEventListener('click',()=>{
      const open=nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded',open?'true':'false');
    });
    nav.addEventListener('click',e=>{if(e.target.closest('a')&&window.innerWidth<=820){nav.classList.remove('is-open');btn.setAttribute('aria-expanded','false')}});
  }

  const form=document.querySelector('[data-demo-form]');
  if(form){
    form.addEventListener('submit',(e)=>{
      e.preventDefault();
      const status=form.querySelector('.iesg-form-status');
      if(status){status.classList.add('is-visible');}
      form.querySelectorAll('input,textarea,select').forEach(el=>{if(el.type!=='submit') el.blur();});
    });
  }

  // Active menu fallback for static files.
  const file=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  document.querySelectorAll('[data-iesg-nav] a').forEach(a=>{
    const href=(a.getAttribute('href')||'').split('#')[0].split('/').pop().toLowerCase();
    if(href && href===file) a.setAttribute('aria-current','page');
  });
})();
