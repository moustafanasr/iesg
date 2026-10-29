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


  /* v4.3 — robust native-scroll 17-goal carousel */
  qsa('[data-goals-carousel]').forEach(carousel=>{
    const section = carousel.closest('.goals-carousel-section');
    const viewport = qs('.goals-viewport', carousel);
    const track = qs('.goals-track', carousel);
    const cards = qsa('[data-goal-card]', carousel);
    const timeline = qsa('[data-goal-jump]', section);
    const currentEl = qs('[data-goals-current]', section);
    const progressEl = qs('[data-goals-progress]', section);
    const prevBtns = qsa('[data-goals-prev]', section);
    const nextBtns = qsa('[data-goals-next]', section);
    const pauseBtn = qs('[data-goals-pause]', section);
    if(!viewport || !track || cards.length !== 17) return;

    let selected = 0;       // Selected GOAL, independent from scroll position.
    let timer = null;
    let firstTimer = null;
    let paused = false;
    let inView = false;
    let userResumeTimer = null;
    let programmatic = false;
    let programmaticTimer = null;
    let scrollEndTimer = null;
    let dragMoved = false;

    const clamp=(n,min,max)=>Math.max(min,Math.min(n,max));
    const maxScroll=()=>Math.max(0,viewport.scrollWidth-viewport.clientWidth);

    const updateUI=()=>{
      const goal=selected+1;
      carousel.dataset.currentGoal=String(goal);

      if(currentEl) currentEl.textContent=String(goal).padStart(2,'0');
      if(progressEl) progressEl.style.width=`${(goal/17)*100}%`;

      cards.forEach((card,i)=>{
        const active=i===selected;
        card.classList.toggle('is-selected',active);
        if(active) card.setAttribute('aria-current','true');
        else card.removeAttribute('aria-current');
      });

      timeline.forEach((btn,i)=>{
        const active=i===selected;
        btn.classList.toggle('is-active',active);
        btn.setAttribute('aria-selected',active?'true':'false');
      });

      prevBtns.forEach(btn=>btn.disabled=selected===0);
      nextBtns.forEach(btn=>btn.disabled=selected===cards.length-1);

      const timelineBtn=timeline[selected];
      if(timelineBtn && window.innerWidth<=720){
        timelineBtn.scrollIntoView({
          behavior:reduced?'auto':'smooth',
          block:'nearest',
          inline:'center'
        });
      }
    };

    const cardTargetLeft=(i)=>{
      const card=cards[i];
      if(!card) return 0;
      // Put selected card at the start where possible.
      // Browser clamps final goals naturally so 17 stays reachable/selected.
      return clamp(card.offsetLeft-track.offsetLeft,0,maxScroll());
    };

    const scrollToGoal=(i,{behavior='smooth',restart=true}={})=>{
      selected=clamp(i,0,cards.length-1);
      updateUI();

      programmatic=true;
      clearTimeout(programmaticTimer);
      viewport.scrollTo({
        left:cardTargetLeft(selected),
        behavior:reduced?'auto':behavior
      });
      programmaticTimer=setTimeout(()=>{programmatic=false;},750);

      if(restart) scheduleAutoplayAfterInteraction();
    };

    const stopAutoplay=()=>{
      if(timer){clearInterval(timer);timer=null;}
      if(firstTimer){clearTimeout(firstTimer);firstTimer=null;}
    };

    const runInterval=()=>{
      if(reduced || paused || !inView) return;
      if(timer) clearInterval(timer);
      timer=setInterval(()=>{
        const next=selected>=cards.length-1?0:selected+1;
        scrollToGoal(next,{behavior:'smooth',restart:false});
      },5200);
    };

    const startAutoplay=()=>{
      stopAutoplay();
      if(reduced || paused || !inView) return;
      // Keep Goal 01 visible long enough when the section first enters view.
      firstTimer=setTimeout(()=>{
        firstTimer=null;
        if(reduced || paused || !inView) return;
        scrollToGoal(selected>=cards.length-1?0:selected+1,{
          behavior:'smooth',
          restart:false
        });
        runInterval();
      },7000);
    };

    const scheduleAutoplayAfterInteraction=()=>{
      stopAutoplay();
      clearTimeout(userResumeTimer);
      userResumeTimer=setTimeout(()=>{
        if(inView && !paused) runInterval();
      },6500);
    };

    const deriveSelectionFromManualScroll=()=>{
      const left=viewport.scrollLeft;
      const max=maxScroll();

      if(left<=3) return 0;
      if(max-left<=3) return cards.length-1;

      // On manual scrolling, select the card nearest the viewport's left edge.
      let best=0;
      let bestDistance=Infinity;
      cards.forEach((card,i)=>{
        const cardLeft=card.offsetLeft-track.offsetLeft;
        const d=Math.abs(cardLeft-left);
        if(d<bestDistance){bestDistance=d;best=i;}
      });
      return best;
    };

    // Arrow controls.
    prevBtns.forEach(btn=>btn.addEventListener('click',()=>{
      scrollToGoal(selected-1);
    }));
    nextBtns.forEach(btn=>btn.addEventListener('click',()=>{
      scrollToGoal(selected+1);
    }));

    // Direct 01–17 navigation.
    timeline.forEach(btn=>btn.addEventListener('click',()=>{
      const i=Number(btn.dataset.goalJump||1)-1;
      scrollToGoal(i);
    }));

    // Pause / Play.
    if(pauseBtn){
      pauseBtn.addEventListener('click',()=>{
        paused=!paused;
        pauseBtn.setAttribute('aria-pressed',paused?'true':'false');
        pauseBtn.textContent=paused?'▶':'Ⅱ';
        if(paused) stopAutoplay();
        else startAutoplay();
      });
    }

    // Trackpad / wheel. Convert vertical wheel to horizontal only while
    // the carousel can continue in that direction.
    viewport.addEventListener('wheel',e=>{
      const delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;
      if(Math.abs(delta)<1) return;

      const left=viewport.scrollLeft;
      const max=maxScroll();
      const canMove=(delta>0 && left<max-2)||(delta<0 && left>2);
      if(!canMove) return; // Let the page continue scrolling at boundaries.

      e.preventDefault();
      programmatic=false;
      viewport.scrollLeft+=delta;
      scheduleAutoplayAfterInteraction();
    },{passive:false});

    // Pointer drag (mouse, pen, touch).
    let dragging=false;
    let pointerId=null;
    let startX=0;
    let startLeft=0;

    viewport.addEventListener('pointerdown',e=>{
      if(e.pointerType==='mouse' && e.button!==0) return;
      dragging=true;
      dragMoved=false;
      pointerId=e.pointerId;
      startX=e.clientX;
      startLeft=viewport.scrollLeft;
      viewport.classList.add('is-dragging');
      viewport.setPointerCapture?.(pointerId);
      stopAutoplay();
    });

    viewport.addEventListener('pointermove',e=>{
      if(!dragging || e.pointerId!==pointerId) return;
      const dx=e.clientX-startX;
      if(Math.abs(dx)>5) dragMoved=true;
      viewport.scrollLeft=startLeft-dx;
    });

    const finishDrag=e=>{
      if(!dragging || (e.pointerId!=null && e.pointerId!==pointerId)) return;
      dragging=false;
      viewport.classList.remove('is-dragging');
      try{viewport.releasePointerCapture?.(pointerId);}catch(_){}
      pointerId=null;

      selected=deriveSelectionFromManualScroll();
      updateUI();

      // Snap the selected card neatly after dragging.
      programmatic=true;
      viewport.scrollTo({
        left:cardTargetLeft(selected),
        behavior:reduced?'auto':'smooth'
      });
      clearTimeout(programmaticTimer);
      programmaticTimer=setTimeout(()=>{programmatic=false;dragMoved=false;},650);
      scheduleAutoplayAfterInteraction();
    };

    viewport.addEventListener('pointerup',finishDrag);
    viewport.addEventListener('pointercancel',finishDrag);

    // Prevent opening a goal when the user was dragging the carousel.
    cards.forEach(card=>card.addEventListener('click',e=>{
      if(dragMoved){
        e.preventDefault();
        e.stopPropagation();
      }
    },true));

    // Sync UI after native/manual scrollbar or trackpad scrolling.
    viewport.addEventListener('scroll',()=>{
      if(programmatic) return;
      clearTimeout(scrollEndTimer);
      scrollEndTimer=setTimeout(()=>{
        selected=deriveSelectionFromManualScroll();
        updateUI();
      },110);
    },{passive:true});

    // Only autoplay while the section is actually visible.
    if('IntersectionObserver' in window){
      const io=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          inView=entry.isIntersecting && entry.intersectionRatio>=.25;
          if(inView) startAutoplay();
          else stopAutoplay();
        });
      },{threshold:[0,.25,.5]});
      io.observe(carousel);
    }else{
      inView=true;
      startAutoplay();
    }

    // Recalculate target positions responsively.
    let resizeTimer=null;
    addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        programmatic=true;
        viewport.scrollTo({left:cardTargetLeft(selected),behavior:'auto'});
        setTimeout(()=>{programmatic=false;},80);
        updateUI();
      },120);
    });

    // Initial guaranteed state: Goal 01, no inherited scroll position.
    selected=0;
    viewport.scrollLeft=0;
    updateUI();
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
