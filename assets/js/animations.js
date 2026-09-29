(() => {
  'use strict';
  const cfg = window.IESGMotion || {};
  const body = document.body;
  const root = document.documentElement;
  if (!body) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = matchMedia('(max-width: 1024px)').matches;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const enabled = cfg.enabled !== false && !reduceMotion && !!window.gsap && !!window.ScrollTrigger;
  const heavy = (cfg.intensity || 'cinematic') === 'cinematic' && (!isSmall || cfg.mobileHeavy === true);

  if (window.smoothscroll && typeof window.smoothscroll.polyfill === 'function') window.smoothscroll.polyfill();
  if (!enabled) { body.classList.add('iesg-motion-fallback'); return; }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  body.classList.add('iesg-motion-on', heavy ? 'iesg-motion-cinematic' : 'iesg-motion-balanced');

  const header = document.querySelector('[data-iesg-header]');
  const scroller = document.querySelector('[data-iesg-scroll-container]');
  let scrollbar = null;
  const headerHeight = () => header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  const setHeaderVar = () => root.style.setProperty('--iesg-header-h', `${headerHeight()}px`);
  setHeaderVar();

  const progress = document.createElement('div');
  progress.className = 'iesg-scroll-progress';
  progress.innerHTML = '<span></span>';
  body.appendChild(progress);
  const bar = progress.firstElementChild;
  const updateProgress = (y, max) => {
    const ratio = Math.max(0, Math.min(1, (y || 0) / Math.max(1, max || 1)));
    gsap.set(bar, { scaleX: ratio, transformOrigin: '0 50%' });
    if (header) header.classList.toggle('is-scrolled', (y || 0) > 22);
  };

  /* Keep Smooth Scrollbar, but content is never opacity-hidden if ScrollTrigger misses a frame. */
  if (cfg.smoothScroll !== false && window.Scrollbar && scroller && (!isSmall || cfg.mobileHeavy === true)) {
    body.classList.add('iesg-smooth-active');
    scrollbar = window.Scrollbar.init(scroller, {
      damping: heavy ? 0.07 : 0.10,
      renderByPixels: true,
      alwaysShowTracks: false,
      continuousScrolling: true,
      syncCallbacks: true,
      delegateTo: document
    });
    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value){ if (arguments.length) scrollbar.scrollTop = value; return scrollbar.scrollTop; },
      getBoundingClientRect(){ return {top:0,left:0,width:innerWidth,height:innerHeight-headerHeight()}; },
      pinType:'transform'
    });
    ScrollTrigger.defaults({ scroller });
    scrollbar.addListener(s => { updateProgress(s.offset.y, s.limit.y); ScrollTrigger.update(); });
    ScrollTrigger.addEventListener('refresh', () => scrollbar && scrollbar.update());
  } else {
    const nativeProgress = () => updateProgress(scrollY || document.documentElement.scrollTop || 0, document.documentElement.scrollHeight - innerHeight);
    nativeProgress();
    addEventListener('scroll', nativeProgress, {passive:true});
  }

  const scrollToTarget = target => {
    if (!target) return;
    const offset = headerHeight() + 14;
    if (scrollbar) {
      const y = target.getBoundingClientRect().top + scrollbar.offset.y - offset;
      scrollbar.scrollTo(0, Math.max(0,y), heavy ? 900 : 650);
    } else {
      const y = target.getBoundingClientRect().top + pageYOffset - offset;
      scrollTo({top:Math.max(0,y),behavior:'smooth'});
    }
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault(); scrollToTarget(target);
  });

  // Hero entrance: transform-only for reliability.
  const hero = document.querySelector('.iesg-hero,.iesg-page-hero,.iesg-service-hero');
  if (hero) {
    hero.classList.add('iesg-motion-hero');
    const title = hero.querySelector('h1');
    const eyebrow = hero.querySelector('.iesg-eyebrow,.iesg-breadcrumb');
    const lead = hero.querySelector('h1 + p,.iesg-service-subtitle');
    if (eyebrow) gsap.fromTo(eyebrow,{y:18},{y:0,duration:.7,ease:'power3.out'});
    if (title) gsap.fromTo(title,{y:36,rotationX:heavy?-9:0},{y:0,rotationX:0,duration:heavy?1.05:.8,ease:'power4.out'});
    if (lead) gsap.fromTo(lead,{y:24},{y:0,duration:.85,delay:.12,ease:'power3.out'});
    const buttons = hero.querySelectorAll('.wp-block-button,.iesg-button');
    if (buttons.length) gsap.fromTo(buttons,{y:18,scale:.97},{y:0,scale:1,duration:.65,stagger:.08,delay:.18,ease:'power3.out'});
  }

  // Headings and text: movement only; no hidden initial states.
  gsap.utils.toArray('.iesg-section-title,.iesg-entry h2,.iesg-entry h3').forEach(el => {
    gsap.fromTo(el,{y:heavy?34:20},{y:0,duration:heavy?.95:.72,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true,immediateRender:false}});
  });

  // Card grids: 3D movement without opacity, so cards always remain visible.
  document.querySelectorAll('.iesg-card-grid,.iesg-service-grid,.iesg-post-grid').forEach(grid => {
    const cards = Array.from(grid.children).filter(el => el.matches('.iesg-card,.iesg-service-card,.iesg-post-card'));
    if (!cards.length) return;
    gsap.set(grid,{perspective:1200});
    gsap.fromTo(cards,{y:heavy?46:28,scale:heavy?.975:.99,rotationX:heavy?4:0},{y:0,scale:1,rotationX:0,duration:heavy?.95:.72,stagger:heavy?.07:.045,ease:'power3.out',scrollTrigger:{trigger:grid,start:'top 90%',once:true,immediateRender:false}});
  });

  // Dedicated home section blocks.
  gsap.utils.toArray('.iesg-about-panel,.iesg-why-layout,.iesg-way-layout,.iesg-contact-layout').forEach(block => {
    gsap.fromTo(block,{y:heavy?38:22},{y:0,duration:heavy?1:.75,ease:'power3.out',scrollTrigger:{trigger:block,start:'top 90%',once:true,immediateRender:false}});
  });

  // Images: subtle scale/parallax only, never blur/opacity.
  gsap.utils.toArray('.iesg-service-card__media img,.iesg-post-card__image img,.iesg-service-hero__image img,.iesg-entry figure img,.iesg-about-media img,.iesg-why-card-media img').forEach(img => {
    gsap.fromTo(img,{scale:1.035},{scale:1,duration:1.05,ease:'power2.out',scrollTrigger:{trigger:img,start:'top 95%',once:true,immediateRender:false}});
    if (heavy && !coarse) gsap.fromTo(img,{yPercent:-1.5},{yPercent:1.5,ease:'none',scrollTrigger:{trigger:img,start:'top bottom',end:'bottom top',scrub:.8}});
  });

  // Counters.
  document.querySelectorAll('[data-iesg-counter]').forEach(el => {
    const end = Number(el.dataset.iesgCounter || 0); if (!Number.isFinite(end)) return;
    const state = {v:0};
    ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter(){gsap.to(state,{v:end,duration:1.2,ease:'power2.out',onUpdate(){el.textContent=Math.round(state.v).toLocaleString();}})}});
  });

  // SDG ribbon and orbit motion.
  const sdg = document.querySelector('.iesg-sdg-track');
  if (sdg && heavy) gsap.fromTo(sdg,{xPercent:0},{xPercent:-7,ease:'none',scrollTrigger:{trigger:sdg,start:'top bottom',end:'bottom top',scrub:.8}});
  const orbit = document.querySelector('.iesg-way-orbit');
  if (orbit && heavy) gsap.to(orbit,{rotation:80,scale:1.04,ease:'none',scrollTrigger:{trigger:orbit.closest('.iesg-way-section')||orbit,start:'top bottom',end:'bottom top',scrub:1}});

  // Magnetic buttons + gentle card tilt on fine pointers.
  if (!coarse) {
    document.querySelectorAll('.iesg-button,.wp-block-button__link').forEach(btn => {
      btn.addEventListener('pointermove', e => { const r=btn.getBoundingClientRect(); gsap.to(btn,{x:(e.clientX-r.left-r.width/2)*.12,y:(e.clientY-r.top-r.height/2)*.12,duration:.25,overwrite:true}); });
      btn.addEventListener('pointerleave', () => gsap.to(btn,{x:0,y:0,duration:.45,ease:'power3.out',overwrite:true}));
    });
    document.querySelectorAll('.iesg-card,.iesg-service-card,.iesg-post-card').forEach(card => {
      card.addEventListener('pointermove', e => { const r=card.getBoundingClientRect(), px=(e.clientX-r.left)/r.width-.5, py=(e.clientY-r.top)/r.height-.5; gsap.to(card,{rotationY:px*3.2,rotationX:-py*2.8,transformPerspective:900,duration:.28,overwrite:true}); });
      card.addEventListener('pointerleave', () => gsap.to(card,{rotationX:0,rotationY:0,duration:.45,ease:'power3.out',overwrite:true}));
    });
  }

  addEventListener('load',()=>{setHeaderVar(); if(scrollbar) scrollbar.update(); ScrollTrigger.refresh(true);},{once:true});
  addEventListener('resize',()=>{setHeaderVar(); if(scrollbar) scrollbar.update(); ScrollTrigger.refresh();},{passive:true});
})();


/* v2.0: Section 2 interactions + richer HOME motion. No layout restructuring below Section 2. */
(()=>{
  'use strict';
  if(!window.gsap || !window.ScrollTrigger) return;
  const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;

  // Section 2: drag + scroll-linked horizontal movement on desktop.
  const section=document.querySelector('[data-sdg-showcase]');
  const viewport=document.querySelector('[data-sdg-viewport]');
  const track=document.querySelector('[data-sdg-track]');
  const progress=document.querySelector('[data-sdg-progress]');
  const cards=track ? [...track.querySelectorAll('[data-sdg-card]')] : [];

  if(section && viewport && track && cards.length){
    const desktop=()=>innerWidth>820;
    const maxX=()=>Math.max(0,track.scrollWidth-innerWidth);
    let tween=null;

    const build=()=>{
      if(tween){tween.scrollTrigger&&tween.scrollTrigger.kill();tween.kill();tween=null;}
      gsap.set(track,{x:0});
      if(!desktop()) return;
      const dist=Math.max(0,track.scrollWidth-innerWidth+80);
      if(dist<30) return;
      tween=gsap.to(track,{x:-dist,ease:'none',scrollTrigger:{
        trigger:section,start:'top 78%',end:()=>`+=${Math.max(700,dist*.82)}`,scrub:1.05,invalidateOnRefresh:true,
        onUpdate:self=>{
          progress&&gsap.set(progress,{scaleX:.08+self.progress*.92});
          const idx=Math.min(cards.length-1,Math.round(self.progress*(cards.length-1)));
          cards.forEach((c,i)=>c.classList.toggle('is-active',i===idx));
        }
      }});
    };
    build();
    addEventListener('resize',()=>{clearTimeout(window.__iesgSdgResize);window.__iesgSdgResize=setTimeout(()=>{build();ScrollTrigger.refresh();},180)},{passive:true});

    // Mouse/touch drag on desktop without replacing scroll behavior.
    let down=false,startX=0,startPos=0,currentX=0;
    const setX=x=>{currentX=Math.max(-maxX(),Math.min(0,x));gsap.to(track,{x:currentX,duration:.35,ease:'power3.out',overwrite:true});};
    viewport.addEventListener('pointerdown',e=>{if(!desktop())return;down=true;startX=e.clientX;startPos=gsap.getProperty(track,'x')||0;viewport.setPointerCapture?.(e.pointerId);});
    viewport.addEventListener('pointermove',e=>{if(!down||!desktop())return;setX(startPos+(e.clientX-startX));});
    const stop=()=>{down=false}; viewport.addEventListener('pointerup',stop); viewport.addEventListener('pointercancel',stop); viewport.addEventListener('pointerleave',stop);

    // Card entrance and image movement.
    gsap.fromTo(cards,{y:34,scale:.96,rotationY:3},{y:0,scale:1,rotationY:0,duration:.85,stagger:.06,ease:'power3.out',scrollTrigger:{trigger:section,start:'top 88%',once:true,immediateRender:false}});
    cards.forEach((card,i)=>{
      const img=card.querySelector('img');
      if(img) gsap.fromTo(img,{scale:1.08},{scale:1,duration:1.1,delay:i*.025,ease:'power2.out',scrollTrigger:{trigger:section,start:'top 90%',once:true,immediateRender:false}});
    });
  }

  // Stronger motion across existing HOME elements only; structures are untouched.
  if(document.body.classList.contains('iesg-home-v2')){
    gsap.utils.toArray('.iesg-section-title').forEach(title=>{
      const eyebrow=title.querySelector('.iesg-eyebrow');
      const h2=title.querySelector('h2');
      const p=title.querySelector('p:not(.iesg-eyebrow)');
      const tl=gsap.timeline({scrollTrigger:{trigger:title,start:'top 88%',once:true}});
      if(eyebrow) tl.fromTo(eyebrow,{x:-20},{x:0,duration:.45,ease:'power2.out'});
      if(h2) tl.fromTo(h2,{y:28,scale:.985},{y:0,scale:1,duration:.72,ease:'power3.out'},'-=.2');
      if(p) tl.fromTo(p,{y:16},{y:0,duration:.55,ease:'power2.out'},'-=.35');
    });

    gsap.utils.toArray('.iesg-about-media,.iesg-why-intro,.iesg-way-orbit,.iesg-contact-map').forEach((el,i)=>{
      gsap.fromTo(el,{y:32,rotationY:i%2?2.5:-2.5,scale:.985},{y:0,rotationY:0,scale:1,duration:.9,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true,immediateRender:false}});
    });

    gsap.utils.toArray('.iesg-core-grid .iesg-card,.iesg-why-cards .iesg-card,.iesg-service-grid .iesg-service-card,.iesg-post-grid .iesg-post-card').forEach((el,i)=>{
      gsap.fromTo(el,{y:28+(i%3)*5,rotationX:2.2,scale:.985},{y:0,rotationX:0,scale:1,duration:.75,delay:(i%3)*.045,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true,immediateRender:false}});
    });

    // Subtle image parallax for existing home imagery.
    gsap.utils.toArray('.iesg-about-media img,.iesg-why-card-media img,.iesg-service-card__media img,.iesg-post-card__image img').forEach(img=>{
      gsap.fromTo(img,{yPercent:-2},{yPercent:2,ease:'none',scrollTrigger:{trigger:img,start:'top bottom',end:'bottom top',scrub:.9}});
    });
  }
})();
