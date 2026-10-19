(function(){
  'use strict';

  try{
    if(window.__forceSmoothScrollPolyfill__ && window.smoothscroll){ window.smoothscroll.polyfill(); }
  }catch(e){}

  const qs=(s,c=document)=>c.querySelector(s);
  const qsa=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header / progress / responsive menu */
  const header=qs('[data-header]');
  const menu=qs('[data-menu]');
  const nav=qs('[data-nav]');
  const progress=qs('.scroll-progress span');
  let backdrop=null;

  if(nav && menu){
    backdrop=document.createElement('div');
    backdrop.className='nav-backdrop';
    document.body.appendChild(backdrop);
    menu.setAttribute('aria-expanded','false');

    const closeMenu=()=>{
      nav.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.classList.remove('menu-open');
      menu.setAttribute('aria-expanded','false');
    };
    const openMenu=()=>{
      nav.classList.add('open');
      backdrop.classList.add('open');
      document.body.classList.add('menu-open');
      menu.setAttribute('aria-expanded','true');
    };
    menu.addEventListener('click',()=>nav.classList.contains('open')?closeMenu():openMenu());
    backdrop.addEventListener('click',closeMenu);
    qsa('.main-nav a').forEach(a=>a.addEventListener('click',closeMenu));
    document.addEventListener('keydown',e=>{if(e.key==='Escape') closeMenu();});
    window.addEventListener('resize',()=>{if(innerWidth>1050) closeMenu();},{passive:true});
  }

  const onScroll=()=>{
    const y=window.scrollY||0;
    if(header) header.classList.toggle('is-scrolled',y>10);
    if(progress){
      const d=document.documentElement.scrollHeight-innerHeight;
      progress.style.width=(d>0?Math.min(100,y/d*100):0)+'%';
    }
  };
  addEventListener('scroll',onScroll,{passive:true});
  onScroll();

  /* Horizontal sliders */
  qsa('[data-slider]').forEach(shell=>{
    const track=qs('[data-track]',shell);
    if(!track) return;
    const prev=qs('[data-prev]',shell), next=qs('[data-next]',shell);
    const dir=document.documentElement.dir==='rtl'?-1:1;
    const step=()=>Math.min(track.clientWidth*.8,390);
    prev&&prev.addEventListener('click',()=>track.scrollBy({left:-step()*dir,behavior:'smooth'}));
    next&&next.addEventListener('click',()=>track.scrollBy({left:step()*dir,behavior:'smooth'}));
  });

  /* Preview forms */
  qsa('[data-demo-form]').forEach(form=>{
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const msg=qs('[data-form-message]',form);
      if(msg){
        msg.textContent=form.dataset.success||'Thanks — this preview form is ready to connect after approval.';
        msg.hidden=false;
      }
    });
  });

  /* Complete SDG explorer iframe autosizing */
  window.addEventListener('message',event=>{
    const d=event.data||{};
    if(d.type!=='iesg-sdg-height') return;
    qsa('[data-sdg-full-frame]').forEach(frame=>{
      if(frame.contentWindow===event.source){
        const h=Math.max(980,Math.min(Number(d.height)||1350,7000));
        frame.style.height=h+'px';
        if(window.ScrollTrigger) ScrollTrigger.refresh();
      }
    });
  });

  /* Motion system */
  function initMotion(){
    if(reduced || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ease:'power3.out'});

    /* Header entrance */
    if(header){
      gsap.from(header,{y:-22,opacity:0,duration:.65,ease:'power3.out',clearProps:'all'});
    }

    /* Home hero */
    const hero=qs('.hero-v31');
    if(hero){
      const copy=qs('[data-hero-copy]',hero);
      const stage=qs('[data-hero-stage]',hero);
      if(copy){
        const seq=[
          qs('.eyebrow',copy),qs('h1',copy),qs('p:not(.eyebrow)',copy),
          qs('.actions',copy),qs('.hero-chips',copy),qs('.hero-proof',copy)
        ].filter(Boolean);
        gsap.from(seq,{opacity:0,y:26,duration:.72,stagger:.085,delay:.12});
      }
      if(stage){
        const main=qs('.hero-main-image',stage);
        const mainImg=main&&qs('img',main);
        const mini=qs('.hero-mini-image',stage);
        const glass=qs('.hero-glass-card',stage);
        const rings=qsa('.hero-ring',stage);
        gsap.from(stage,{opacity:0,x:42,scale:.97,duration:1.05,delay:.2,ease:'power4.out'});
        if(main){gsap.from(main,{clipPath:'inset(0 0 100% 0 round 38px)',duration:1.08,delay:.28,ease:'power4.inOut'});}
        if(mainImg){
          gsap.fromTo(mainImg,{scale:1.08},{scale:1,duration:1.35,delay:.3,ease:'power3.out'});
          gsap.to(mainImg,{yPercent:4,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.7}});
        }
        if(mini){
          gsap.from(mini,{opacity:0,x:-24,y:18,scale:.88,duration:.8,delay:.62});
          gsap.to(mini,{y:-9,duration:2.7,ease:'sine.inOut',repeat:-1,yoyo:true});
        }
        if(glass){
          gsap.from(glass,{opacity:0,x:24,y:18,duration:.8,delay:.72});
          gsap.to(glass,{y:7,duration:3.1,ease:'sine.inOut',repeat:-1,yoyo:true});
        }
        if(rings.length) gsap.to(rings,{rotate:360,duration:34,ease:'none',repeat:-1,transformOrigin:'50% 50%',stagger:{each:1.8,from:'end'}});
        const orbs=qsa('.hero-orb',hero);
        if(orbs.length) gsap.to(orbs,{x:'random(-18,18)',y:'random(-14,14)',duration:5,ease:'sine.inOut',repeat:-1,yoyo:true,stagger:.8});
      }
      qsa('.hero-proof strong',hero).forEach(el=>{
        const m=el.textContent.trim().match(/^([0-9]+)$/);
        if(!m) return;
        const target=+m[1], obj={v:0};
        gsap.to(obj,{v:target,duration:1.1,delay:.8,ease:'power2.out',onUpdate:()=>el.textContent=Math.round(obj.v)});
      });
    }

    /* Page hero */
    qsa('.page-hero').forEach(ph=>{
      const copy=ph.querySelector('.page-hero-grid > div:first-child')||ph.querySelector('.container');
      const img=ph.querySelector('img');
      if(copy){
        const items=[copy.querySelector('.eyebrow'),copy.querySelector('h1'),copy.querySelector('p:not(.eyebrow)'),copy.querySelector('.actions')].filter(Boolean);
        gsap.from(items,{opacity:0,y:24,duration:.68,stagger:.085,delay:.08});
      }
      if(img){
        const wrap=img.parentElement;wrap&&wrap.classList.add('image-reveal');
        gsap.from(img,{clipPath:'inset(0 0 100% 0 round 30px)',scale:1.07,duration:1.05,delay:.18,ease:'power4.inOut'});
      }
    });

    /* Section heads */
    qsa('.section-head,.sdg-complete-intro').forEach(head=>{
      const items=[...head.children].filter(el=>!el.matches('.text-link'));
      gsap.from(items,{opacity:0,y:24,duration:.62,stagger:.075,scrollTrigger:{trigger:head,start:'top 86%',once:true}});
      const link=head.querySelector('.text-link');
      if(link) gsap.from(link,{opacity:0,x:18,duration:.58,scrollTrigger:{trigger:head,start:'top 86%',once:true}});
    });

    /* Grouped card staggers */
    const groups=[
      ['.h-scroll','.service-card'],['.partner-grid','.partner-card'],['.knowledge-grid','.knowledge-card'],
      ['.card-grid','.card'],['.feature-split','.feature-story'],['.insight-work-grid','.insight-work-card'],
      ['.sector-grid','.sector-card'],['.contact-info','.contact-item']
    ];
    groups.forEach(([parentSel,itemSel])=>{
      qsa(parentSel).forEach(parent=>{
        const items=qsa(itemSel,parent); if(!items.length) return;
        gsap.from(items,{opacity:0,y:30,scale:.985,duration:.58,stagger:.07,scrollTrigger:{trigger:parent,start:'top 88%',once:true}});
      });
    });

    /* Content-page editorial reveals */
    qsa('.entry').forEach(entry=>{
      const items=qsa(':scope > h2,:scope > h3,:scope > p,:scope > ul,:scope > ol,:scope > figure',entry);
      items.forEach((el,i)=>gsap.from(el,{opacity:0,y:20,duration:.55,scrollTrigger:{trigger:el,start:'top 91%',once:true}}));
    });
    qsa('.side-card,.form-card,.map-frame').forEach(el=>gsap.from(el,{opacity:0,y:24,duration:.66,scrollTrigger:{trigger:el,start:'top 90%',once:true}}));

    /* Image reveals and subtle parallax */
    qsa('.service-card img,.collab-main img,.collab-small img,.insight-work-media img,.feature-visual img,.partner-card .logo img').forEach(img=>{
      const parent=img.parentElement;
      if(parent) parent.classList.add('image-reveal');
      gsap.from(img,{opacity:0,scale:1.07,duration:.72,scrollTrigger:{trigger:img,start:'top 92%',once:true}});
    });
    qsa('[data-parallax]').forEach(img=>{
      gsap.to(img,{yPercent:7,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:.7}});
    });

    /* CTA and footer */
    qsa('.cta-card').forEach(card=>gsap.from(card,{opacity:0,y:30,scale:.985,duration:.72,scrollTrigger:{trigger:card,start:'top 90%',once:true}}));
    const footer=qs('.site-footer');
    if(footer){
      const cols=qsa('.footer-grid > *',footer);
      gsap.from(cols,{opacity:0,y:22,duration:.58,stagger:.08,scrollTrigger:{trigger:footer,start:'top 88%',once:true}});
    }

    /* Subtle hover tilt on capable pointers */
    if(window.matchMedia('(hover:hover) and (pointer:fine)').matches){
      qsa('.service-card,.feature-story,.insight-work-card,.sector-card').forEach(card=>{
        card.dataset.tilt='';
        card.addEventListener('mousemove',e=>{
          const r=card.getBoundingClientRect();
          const rx=((e.clientY-r.top)/r.height-.5)*-2.4;
          const ry=((e.clientX-r.left)/r.width-.5)*3.2;
          gsap.to(card,{rotateX:rx,rotateY:ry,transformPerspective:900,duration:.35,ease:'power2.out'});
        });
        card.addEventListener('mouseleave',()=>gsap.to(card,{rotateX:0,rotateY:0,duration:.5,ease:'power3.out'}));
      });
    }

    addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
    setTimeout(()=>ScrollTrigger.refresh(),500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initMotion,{once:true});
  else initMotion();
})();
