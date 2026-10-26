(function(){
  'use strict';

  try{
    if(window.__forceSmoothScrollPolyfill__ && window.smoothscroll){ window.smoothscroll.polyfill(); }
  }catch(e){}

  const qs=(s,c=document)=>c.querySelector(s);
  const qsa=(s,c=document)=>[...c.querySelectorAll(s)];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header / progress / requested desktop + mobile navigation */
  const header=qs('[data-header]');
  const mobileToggle=qs('[data-mobile-toggle]');
  const mobileNav=qs('#mobile-navbar');
  const backdrop=qs('#nav-backdrop');
  const progress=qs('.scroll-progress span');

  const closeMenu=()=>{
    if(!mobileNav||!mobileToggle) return;
    mobileNav.classList.remove('open');
    backdrop&&backdrop.classList.remove('open');
    document.body.classList.remove('menu-open');
    mobileToggle.setAttribute('aria-expanded','false');
    qsa('.mobile-dropdown',mobileNav).forEach(li=>li.classList.remove('open'));
  };
  const openMenu=()=>{
    if(!mobileNav||!mobileToggle) return;
    mobileNav.classList.add('open');
    backdrop&&backdrop.classList.add('open');
    document.body.classList.add('menu-open');
    mobileToggle.setAttribute('aria-expanded','true');
  };
  if(mobileToggle&&mobileNav){
    mobileToggle.addEventListener('click',()=>mobileNav.classList.contains('open')?closeMenu():openMenu());
    backdrop&&backdrop.addEventListener('click',closeMenu);
    document.addEventListener('keydown',e=>{if(e.key==='Escape') closeMenu();});
    window.addEventListener('resize',()=>{if(innerWidth>980) closeMenu();},{passive:true});
    qsa('.mobile-dropdown > .nav-link',mobileNav).forEach(a=>{
      a.addEventListener('click',e=>{
        const li=a.parentElement;
        if(!li) return;
        e.preventDefault();
        const willOpen=!li.classList.contains('open');
        qsa('.mobile-dropdown',mobileNav).forEach(x=>x.classList.remove('open'));
        if(willOpen) li.classList.add('open');
      });
    });
    qsa('.mobile-navbar a:not(.mobile-dropdown > .nav-link)').forEach(a=>a.addEventListener('click',closeMenu));
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

  /* Home goal slider -> Knowledge Hub deep-link support */
  const knowledgeGoalMatch=location.hash.match(/^#goal-(\d{1,2})$/);
  if(knowledgeGoalMatch){
    const n=Math.max(1,Math.min(17,Number(knowledgeGoalMatch[1])));
    const section=qs('#global-goals');
    const frame=qs('[data-sdg-full-frame]');
    if(frame){
      const base=frame.getAttribute('src').split('#')[0];
      frame.setAttribute('src',base+'#goal-'+n);
    }
    if(section){
      setTimeout(()=>section.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}),140);
    }
  }



  /* Partners marquee: start only once the section enters view */
  qsa('[data-partners-marquee]').forEach(wrap=>{
    if(reduced) return;
    const start=()=>wrap.classList.add('is-running');
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting && entry.intersectionRatio>=0.2){
            start();
            io.disconnect();
          }
        });
      },{threshold:[0,.2,.5]});
      io.observe(wrap);
    }else{
      start();
    }
  });

  /* Home 17-goal marquee: stay on Goal 1 until the user reaches the section */
  qsa('[data-goal-marquee]').forEach(marquee=>{
    const track=qs('.goal-marquee-track',marquee);
    if(!track) return;
    let started=false;
    const start=()=>{
      if(started) return;
      started=true;
      // Force the animation timeline to start from the very first card.
      marquee.classList.remove('is-running');
      track.style.animation='none';
      track.style.transform='translateX(0)';
      void track.offsetWidth;
      track.style.animation='';
      requestAnimationFrame(()=>requestAnimationFrame(()=>marquee.classList.add('is-running')));
    };
    if(reduced) return;
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(entry.isIntersecting && entry.intersectionRatio>=0.35){
            start();
            io.disconnect();
          }
        });
      },{threshold:[0,.35,.6]});
      io.observe(marquee);
    }else{
      const check=()=>{
        const r=marquee.getBoundingClientRect();
        if(r.top<innerHeight*.78 && r.bottom>0){
          start();
          removeEventListener('scroll',check);
        }
      };
      addEventListener('scroll',check,{passive:true});
      check();
    }
  });


  /* v4.1 — 17-goal image carousel */
  qsa('[data-goals-carousel]').forEach(carousel=>{
    const track = qs('.goals-track', carousel);
    const cards = qsa('[data-goal-card]', carousel);
    const timeline = qsa('[data-goal-jump]', carousel.closest('.goals-carousel-section'));
    const currentEl = qs('[data-goals-current]', carousel.closest('.goals-carousel-section'));
    const progressEl = qs('[data-goals-progress]', carousel.closest('.goals-carousel-section'));
    const prevBtns = qsa('[data-goals-prev]', carousel.closest('.goals-carousel-section'));
    const nextBtns = qsa('[data-goals-next]', carousel.closest('.goals-carousel-section'));
    const pauseBtn = qs('[data-goals-pause]', carousel.closest('.goals-carousel-section'));
    if(!track || !cards.length) return;

    let index = 0;
    let timer = null;
    let paused = false;
    let visible = false;

    const visibleCount = ()=>{
      const vw = window.innerWidth;
      if(vw <= 380) return 1;
      if(vw <= 520) return 2;
      if(vw <= 720) return 3;
      if(vw <= 950) return 4;
      if(vw <= 1200) return 5;
      return 6;
    };

    const maxIndex = ()=>Math.max(0, cards.length - visibleCount());

    const render = (animate=true)=>{
      index = Math.max(0, Math.min(index, maxIndex()));
      const card = cards[index];
      const gap = parseFloat(getComputedStyle(track).gap || '16');
      const step = card.getBoundingClientRect().width + gap;
      if(!animate) track.style.transition='none';
      track.style.transform = `translate3d(${-index * step}px,0,0)`;
      if(!animate){
        void track.offsetWidth;
        track.style.transition='';
      }
      const goal = index + 1;
      carousel.dataset.currentGoal = String(goal);
      if(currentEl) currentEl.textContent = String(goal).padStart(2,'0');
      if(progressEl) progressEl.style.width = `${(goal/17)*100}%`;
      timeline.forEach((btn,i)=>{
        const active = i===index;
        btn.classList.toggle('is-active',active);
        btn.setAttribute('aria-selected',active?'true':'false');
      });
      prevBtns.forEach(b=>b.disabled = index<=0);
      nextBtns.forEach(b=>b.disabled = index>=maxIndex());
      const activeTimeline = timeline[index];
      if(activeTimeline && activeTimeline.scrollIntoView && window.innerWidth<=720){
        activeTimeline.scrollIntoView({behavior: reduced?'auto':'smooth',block:'nearest',inline:'center'});
      }
    };

    const stop=()=>{
      if(timer){ clearInterval(timer); timer=null; }
    };
    const start=()=>{
      stop();
      if(reduced || paused || !visible) return;
      timer=setInterval(()=>{
        if(index >= maxIndex()) index=0;
        else index+=1;
        render();
      },3800);
    };

    prevBtns.forEach(btn=>btn.addEventListener('click',()=>{
      index=Math.max(0,index-1); render(); start();
    }));
    nextBtns.forEach(btn=>btn.addEventListener('click',()=>{
      index = index>=maxIndex()?0:index+1; render(); start();
    }));
    timeline.forEach(btn=>btn.addEventListener('click',()=>{
      index=Math.max(0,Math.min(Number(btn.dataset.goalJump||1)-1,maxIndex()));
      render(); start();
    }));

    if(pauseBtn){
      pauseBtn.addEventListener('click',()=>{
        paused=!paused;
        pauseBtn.setAttribute('aria-pressed',paused?'true':'false');
        pauseBtn.textContent = paused ? '▶' : 'Ⅱ';
        if(paused) stop(); else start();
      });
    }

    carousel.addEventListener('mouseenter',stop);
    carousel.addEventListener('mouseleave',start);
    carousel.addEventListener('focusin',stop);
    carousel.addEventListener('focusout',start);

    let touchX=null;
    carousel.addEventListener('touchstart',e=>{
      touchX=e.touches?.[0]?.clientX ?? null;
      stop();
    },{passive:true});
    carousel.addEventListener('touchend',e=>{
      if(touchX==null) return start();
      const endX=e.changedTouches?.[0]?.clientX ?? touchX;
      const dx=endX-touchX;
      if(Math.abs(dx)>42){
        if(dx<0) index=Math.min(maxIndex(),index+1);
        else index=Math.max(0,index-1);
        render();
      }
      touchX=null;
      start();
    },{passive:true});

    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          visible=entry.isIntersecting && entry.intersectionRatio>=.22;
          if(visible) start(); else stop();
        });
      },{threshold:[0,.22,.5]});
      io.observe(carousel);
    } else {
      visible=true;
    }

    let resizeTimer;
    window.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{ render(false); start(); },120);
    });

    render(false);
  });

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
