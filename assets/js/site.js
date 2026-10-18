
(function(){
  try{if(window.__forceSmoothScrollPolyfill__&&window.smoothscroll)window.smoothscroll.polyfill();}catch(e){}
  const header=document.querySelector('[data-header]');
  const menu=document.querySelector('[data-menu]');
  const nav=document.querySelector('[data-nav]');
  const progress=document.querySelector('.scroll-progress span');
  const onScroll=()=>{
    const y=window.scrollY||0;
    if(header) header.classList.toggle('is-scrolled',y>12);
    if(progress){const d=document.documentElement.scrollHeight-innerHeight;progress.style.width=(d>0?Math.min(100,y/d*100):0)+'%';}
  };
  addEventListener('scroll',onScroll,{passive:true});onScroll();
  if(menu&&nav)menu.addEventListener('click',()=>nav.classList.toggle('open'));
  document.querySelectorAll('.main-nav a').forEach(a=>a.addEventListener('click',()=>nav&&nav.classList.remove('open')));

  document.querySelectorAll('[data-slider]').forEach(shell=>{
    const track=shell.querySelector('[data-track]');
    const prev=shell.querySelector('[data-prev]'),next=shell.querySelector('[data-next]');
    const step=()=>Math.min(track.clientWidth*.82,380);
    prev&&prev.addEventListener('click',()=>track.scrollBy({left:-step(),behavior:'smooth'}));
    next&&next.addEventListener('click',()=>track.scrollBy({left:step(),behavior:'smooth'}));
  });

  // Homepage SDG spotlight
  const sdgRoot=document.querySelector('[data-sdg-home]');
  if(sdgRoot&&window.IESG_HOME_SDG){
    const data=window.IESG_HOME_SDG, panel=sdgRoot.querySelector('[data-sdg-panel]');
    const buttons=[...sdgRoot.querySelectorAll('[data-goal]')];
    function render(n){
      const g=data.find(x=>x.n===n)||data[0];
      buttons.forEach(b=>b.classList.toggle('active',+b.dataset.goal===n));
      panel.style.setProperty('--goal',g.color);
      panel.querySelector('[data-num]').textContent=String(g.n).padStart(2,'0');
      panel.querySelector('[data-title]').textContent=g.title;
      panel.querySelector('[data-tagline]').textContent=g.tagline;
      panel.querySelector('[data-rank]').textContent=g.rank?('#'+g.rank+' / 169'):'Not available';
      panel.querySelector('[data-score]').textContent=g.score!=null?g.score.toFixed(1):'Not available';
      panel.querySelector('[data-kpi1]').innerHTML='<small>'+g.k1label+'</small><b>'+g.k1+'</b>';
      panel.querySelector('[data-kpi2]').innerHTML='<small>'+g.k2label+'</small><b>'+g.k2+'</b>';
      panel.querySelector('[data-observation]').textContent=g.obs||'';
      const link=panel.querySelector('[data-explorer-link]'); if(link) link.href=link.dataset.base+'#goal-'+n;
    }
    buttons.forEach(b=>b.addEventListener('click',()=>render(+b.dataset.goal)));render(1);
  }

  // GSAP reveal, safe fallback if CDN unavailable
  if(window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('[data-reveal]').forEach((el,i)=>{
      gsap.from(el,{y:28,opacity:0,duration:.78,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%',once:true}});
    });
    gsap.utils.toArray('.service-card,.partner-card,.knowledge-card,.card').forEach((el,i)=>{
      gsap.from(el,{y:20,opacity:0,duration:.55,delay:(i%3)*.05,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});
    });
    gsap.utils.toArray('[data-parallax]').forEach(img=>{
      gsap.to(img,{yPercent:8,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:true}});
    });
  } else {
    const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');obs.unobserve(e.target)}}),{threshold:.08});
    document.querySelectorAll('[data-reveal]').forEach(x=>obs.observe(x));
  }

  document.querySelectorAll('[data-demo-form]').forEach(form=>{
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const msg=form.querySelector('[data-form-message]');
      if(msg){msg.textContent=form.dataset.success||'Thanks — this preview form is ready to connect to WordPress/email after approval.';msg.hidden=false;}
    });
  });
})();

/* v3.1 — hero motion + supplied-style SDG explorer component */
(function(){
  const format = (v) => v == null ? '—' : (typeof v === 'number' && !Number.isInteger(v) ? String(Math.round(v*100)/100) : String(v));
  document.querySelectorAll('[data-sdgx-home]').forEach(root=>{
    const dataEl=root.querySelector('[data-sdgx-data]');
    if(!dataEl) return;
    let goals=[];try{goals=JSON.parse(dataEl.textContent||'[]')}catch(e){return}
    const btns=[...root.querySelectorAll('.sdgx-goal-btn')];
    const panel=root.querySelector('.sdgx-panel');
    const q=s=>root.querySelector(s);
    function render(n){
      const g=goals.find(x=>x.n===n)||goals[0]; if(!g) return;
      btns.forEach(b=>b.classList.toggle('active',+b.dataset.goal===g.n));
      panel.style.setProperty('--gc',g.color);
      q('[data-sdgx-count]').textContent=String(g.n).padStart(2,'0');
      q('[data-sdgx-num]').textContent=String(g.n).padStart(2,'0');
      q('[data-sdgx-title]').textContent=g.title;
      q('[data-sdgx-tagline]').textContent=g.tagline;
      q('[data-sdgx-asof]').textContent=g.asof;
      q('[data-sdgx-rank]').textContent=format(g.global_rank);
      q('[data-sdgx-index-score]').textContent=format(g.global_score);
      q('[data-sdgx-regional]').textContent=format(g.regional_score);
      q('[data-sdgx-regavg]').textContent=format(g.regional_avg);
      q('[data-sdgx-peerpos]').textContent=format(g.peer_pos);
      q('[data-sdgx-peersize]').textContent=format(g.peer_size);
      q('[data-sdgx-rating]').textContent=g.rating + (g.trend ? ' · '+g.trend : '');
      q('[data-sdgx-leaders]').textContent=(g.leaders||[]).map(x=>x.name+' '+format(x.score)).join(' · ');
      const kpiWrap=q('[data-sdgx-kpis]');
      kpiWrap.innerHTML=(g.kpis||[]).map(k=>`<div class="sdgx-kpi"><div class="lbl">${k.label}</div><div class="val">${k.value==='Not available'?'—':k.value}<small>${k.value==='Not available'?'':k.unit}</small></div><div class="base">${k.value==='Not available'?'Not available':k.year+' · '+k.assessment}</div></div>`).join('');
      q('[data-sdgx-obs]').textContent=g.obs||'';
      const link=q('[data-sdgx-link]'); if(link) link.href='sdg-explorer.html#goal-'+g.n;
      if(window.gsap){
        gsap.fromTo(panel,{opacity:.72,y:10},{opacity:1,y:0,duration:.28,ease:'power2.out'});
        gsap.fromTo(kpiWrap.children,{opacity:0,y:8},{opacity:1,y:0,stagger:.035,duration:.3,ease:'power2.out'});
      }
    }
    btns.forEach(b=>b.addEventListener('click',()=>render(+b.dataset.goal)));
    render(1);
  });

  if(window.gsap){
    const copy=document.querySelector('[data-hero-copy]');
    const stage=document.querySelector('[data-hero-stage]');
    if(copy){
      const els=[copy.querySelector('.eyebrow'),copy.querySelector('h1'),copy.querySelector('p:not(.eyebrow)'),copy.querySelector('.actions'),copy.querySelector('.hero-chips'),copy.querySelector('.hero-proof')].filter(Boolean);
      gsap.from(els,{opacity:0,y:28,duration:.75,stagger:.09,ease:'power3.out',delay:.08});
    }
    if(stage){
      gsap.from(stage,{opacity:0,x:38,rotateY:-5,duration:1.05,ease:'power3.out',delay:.18});
      const mini=stage.querySelector('.hero-mini-image'); if(mini) gsap.to(mini,{y:-8,duration:2.4,ease:'sine.inOut',repeat:-1,yoyo:true});
      const glass=stage.querySelector('.hero-glass-card'); if(glass) gsap.to(glass,{y:7,duration:2.8,ease:'sine.inOut',repeat:-1,yoyo:true});
      const rings=stage.querySelectorAll('.hero-ring'); if(rings.length) gsap.to(rings,{rotate:360,duration:28,ease:'none',repeat:-1,transformOrigin:'50% 50%'});
    }
    gsap.utils.toArray('.sector-card').forEach((el,i)=>gsap.from(el,{opacity:0,y:28,duration:.55,delay:(i%3)*.06,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}}));
  }
})();
