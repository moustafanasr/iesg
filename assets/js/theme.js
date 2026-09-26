(()=>{
  const btn=document.querySelector('[data-iesg-menu-toggle]');
  const nav=document.querySelector('[data-iesg-nav]');
  if(btn&&nav){
    btn.addEventListener('click',()=>{
      const open=nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded',open?'true':'false');
    });
    nav.addEventListener('click',e=>{if(e.target.closest('a')&&window.innerWidth<=820){nav.classList.remove('is-open');btn.setAttribute('aria-expanded','false')}});
  }
})();
