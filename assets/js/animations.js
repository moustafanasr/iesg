(() => {
  'use strict';

  const cfg = window.IESGMotion || {};
  const root = document.documentElement;
  const body = document.body;
  if (!body) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isSmall = window.matchMedia('(max-width: 1024px)').matches;
  const enabled = cfg.enabled !== false && !reduceMotion;
  const intensity = ['cinematic', 'balanced', 'subtle'].includes(cfg.intensity) ? cfg.intensity : 'cinematic';
  const heavyMobile = cfg.mobileHeavy === true;
  const heavy = intensity === 'cinematic' && (!isSmall || heavyMobile);

  body.classList.add(`iesg-motion-${intensity}`);

  // Smooth-scroll polyfill is a safety net for browsers that do not support native smooth scrolling.
  if (window.smoothscroll && typeof window.smoothscroll.polyfill === 'function') {
    window.smoothscroll.polyfill();
  }

  if (!enabled || !window.gsap || !window.ScrollTrigger) {
    body.classList.add('iesg-motion-fallback');
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);
  body.classList.add('iesg-motion-on');

  const values = {
    cinematic: { distance: 92, duration: 1.15, stagger: 0.075, damping: 0.065, scrub: 1.15 },
    balanced:  { distance: 62, duration: 0.9,  stagger: 0.055, damping: 0.085, scrub: 0.9 },
    subtle:    { distance: 34, duration: 0.7,  stagger: 0.035, damping: 0.11,  scrub: 0.65 }
  }[intensity];

  const header = document.querySelector('[data-iesg-header]');
  const scrollContainer = document.querySelector('[data-iesg-scroll-container]');
  let scrollbar = null;
  let scrollY = 0;
  let scrollLimit = 1;

  const updateHeaderHeight = () => {
    const h = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    root.style.setProperty('--iesg-header-h', `${h}px`);
    return h;
  };
  updateHeaderHeight();

  const progress = document.createElement('div');
  progress.className = 'iesg-scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  body.appendChild(progress);
  const progressBar = progress.firstElementChild;

  const setProgress = (y, limit) => {
    scrollY = Math.max(0, y || 0);
    scrollLimit = Math.max(1, limit || 1);
    const ratio = Math.min(1, Math.max(0, scrollY / scrollLimit));
    gsap.set(progressBar, { scaleX: ratio, transformOrigin: '0 50%' });
    if (header) header.classList.toggle('is-scrolled', scrollY > 22);
  };

  // Smooth Scrollbar + ScrollTrigger scrollerProxy on desktop. Mobile keeps native scrolling by default.
  if (cfg.smoothScroll !== false && window.Scrollbar && scrollContainer && (!isSmall || heavyMobile)) {
    body.classList.add('iesg-smooth-active');
    updateHeaderHeight();
    scrollbar = window.Scrollbar.init(scrollContainer, {
      damping: values.damping,
      renderByPixels: true,
      alwaysShowTracks: false,
      continuousScrolling: true,
      syncCallbacks: true,
      delegateTo: document
    });

    ScrollTrigger.scrollerProxy(scrollContainer, {
      scrollTop(value) {
        if (arguments.length) scrollbar.scrollTop = value;
        return scrollbar.scrollTop;
      },
      scrollLeft(value) {
        if (arguments.length) scrollbar.scrollLeft = value;
        return scrollbar.scrollLeft;
      },
      getBoundingClientRect() {
        return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight - updateHeaderHeight() };
      },
      pinType: 'transform'
    });

    ScrollTrigger.defaults({ scroller: scrollContainer });
    scrollbar.addListener((status) => {
      setProgress(status.offset.y, status.limit.y);
      ScrollTrigger.update();
    });
    ScrollTrigger.addEventListener('refresh', () => scrollbar && scrollbar.update());
  } else {
    const updateNative = () => {
      const doc = document.documentElement;
      const limit = Math.max(1, doc.scrollHeight - window.innerHeight);
      setProgress(window.scrollY || doc.scrollTop || 0, limit);
    };
    updateNative();
    window.addEventListener('scroll', updateNative, { passive: true });
  }

  const getHeaderOffset = () => (header ? header.getBoundingClientRect().height : 0) + 18;
  const scrollToElement = (target) => {
    if (!target) return;
    const offset = getHeaderOffset();
    if (scrollbar) {
      const targetY = target.getBoundingClientRect().top + scrollbar.offset.y - offset;
      scrollbar.scrollTo(0, Math.max(0, targetY), heavy ? 1100 : 780, {
        easing: (t) => 1 - Math.pow(1 - t, 4)
      });
    } else {
      const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }
  };

  document.addEventListener('click', (event) => {
    const a = event.target.closest('a[href*="#"]');
    if (!a || a.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    let url;
    try { url = new URL(a.href, window.location.href); } catch (e) { return; }
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname) return;
    const id = decodeURIComponent(url.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    scrollToElement(target);
    if (history.pushState) history.pushState(null, '', url.hash);
  });

  // Preserve deep-link behaviour when Smooth Scrollbar owns the scroller.
  if (location.hash) {
    requestAnimationFrame(() => {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) setTimeout(() => scrollToElement(target), 120);
    });
  }

  // Cinematic page wipe. Created by JS so content can never be blocked when JS is unavailable.
  let wipe = null;
  if (cfg.pageWipe !== false) {
    wipe = document.createElement('div');
    wipe.className = 'iesg-page-wipe';
    wipe.setAttribute('aria-hidden', 'true');
    wipe.innerHTML = '<div class="iesg-page-wipe__brand"><span></span><span></span><span></span></div>';
    body.appendChild(wipe);
    gsap.set(wipe, { clipPath: 'inset(0 0 0 0)' });
    gsap.to(wipe, { clipPath: 'inset(0 0 100% 0)', duration: heavy ? 0.82 : 0.58, ease: 'power4.inOut', delay: 0.08 });

    document.addEventListener('click', (event) => {
      const a = event.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download') || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      let url;
      try { url = new URL(a.href, location.href); } catch (e) { return; }
      if (url.origin !== location.origin || url.pathname.includes('/wp-admin')) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      event.preventDefault();
      gsap.set(wipe, { clipPath: 'inset(100% 0 0 0)' });
      gsap.to(wipe, {
        clipPath: 'inset(0 0 0 0)',
        duration: heavy ? 0.62 : 0.45,
        ease: 'power4.inOut',
        onComplete: () => { window.location.href = url.href; }
      });
    });
  }

  // Split only direct text nodes so semantic/nested brand spans remain intact.
  const splitWords = (el) => {
    if (!el || el.dataset.iesgSplit === '1') return Array.from(el.querySelectorAll(':scope > .iesg-word, :scope > .iesg-gradient-word'));
    const nodes = Array.from(el.childNodes);
    nodes.forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) return;
      const parts = node.textContent.split(/(\s+)/);
      const frag = document.createDocumentFragment();
      parts.forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
        else {
          const span = document.createElement('span');
          span.className = 'iesg-word';
          span.textContent = part;
          frag.appendChild(span);
        }
      });
      node.replaceWith(frag);
    });
    el.dataset.iesgSplit = '1';
    return Array.from(el.querySelectorAll(':scope > .iesg-word, :scope > .iesg-gradient-word'));
  };

  const hero = document.querySelector('.iesg-hero, .iesg-page-hero, .iesg-service-hero');
  if (hero) {
    hero.classList.add('iesg-motion-hero');
    const title = hero.querySelector('h1, h2');
    const eyebrow = hero.querySelector('.iesg-eyebrow, .iesg-breadcrumb');
    const lead = hero.querySelector('h1 + p, h2 + p, .iesg-service-subtitle');
    const buttons = hero.querySelectorAll('.wp-block-button, .iesg-button');
    const words = splitWords(title);

    const orbA = document.createElement('span');
    const orbB = document.createElement('span');
    orbA.className = 'iesg-motion-orb iesg-motion-orb--a';
    orbB.className = 'iesg-motion-orb iesg-motion-orb--b';
    hero.append(orbA, orbB);

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.15 });
    if (eyebrow) tl.from(eyebrow, { opacity: 0, x: document.dir === 'rtl' ? 40 : -40, duration: 0.75 }, 0);
    if (words.length) {
      gsap.set(words, { display: 'inline-block', transformOrigin: '50% 100%' });
      tl.from(words, {
        yPercent: 120,
        opacity: 0,
        rotationX: heavy ? -84 : -40,
        rotationZ: heavy ? () => gsap.utils.random(-2.5, 2.5) : 0,
        duration: values.duration,
        stagger: values.stagger,
        ease: 'power4.out'
      }, 0.08);
    }
    if (lead) tl.from(lead, { opacity: 0, y: 34, duration: 0.85 }, 0.42);
    if (buttons.length) tl.from(buttons, { opacity: 0, y: 25, scale: 0.94, duration: 0.65, stagger: 0.1 }, 0.56);
    tl.from([orbA, orbB], { opacity: 0, scale: 0.45, duration: 1.35, stagger: 0.12 }, 0.05);

    if (heavy) {
      if (title) {
        gsap.to(title, { y: -48, scale: 0.965, opacity: 0.74, transformOrigin: '50% 50%', ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: values.scrub } });
      }
      gsap.to(orbA, { xPercent: 35, yPercent: 22, rotate: 24, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: values.scrub } });
      gsap.to(orbB, { xPercent: -30, yPercent: -34, rotate: -18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: values.scrub } });
      if (!coarsePointer) {
        hero.addEventListener('pointermove', (e) => {
          const r = hero.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - 0.5;
          const ny = (e.clientY - r.top) / r.height - 0.5;
          gsap.to(orbA, { x: nx * 70, y: ny * 50, duration: 1.1, overwrite: 'auto' });
          gsap.to(orbB, { x: nx * -45, y: ny * -36, duration: 1.1, overwrite: 'auto' });
          hero.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
          hero.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
        }, { passive: true });
      }
    }
  }

  // Section-heading word reveals.
  document.querySelectorAll('.iesg-section-title h2, .iesg-entry h2, .iesg-entry h3').forEach((heading) => {
    const words = splitWords(heading);
    if (!words.length) return;
    gsap.set(words, { display: 'inline-block', transformOrigin: '50% 100%' });
    gsap.from(words, {
      opacity: 0,
      yPercent: intensity === 'subtle' ? 45 : 95,
      rotationX: heavy ? -68 : -28,
      duration: values.duration * 0.84,
      stagger: values.stagger * 0.72,
      ease: 'power4.out',
      scrollTrigger: { trigger: heading, start: 'top 86%', once: true }
    });
  });

  // Eyebrows and supporting copy.
  gsap.utils.toArray('.iesg-section .iesg-eyebrow, .iesg-entry > p, .iesg-section-title > p').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: values.distance * 0.28,
      duration: values.duration * 0.72,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // Cards enter in 3D, then remain interactive.
  document.querySelectorAll('.iesg-card-grid, .iesg-service-grid, .iesg-post-grid').forEach((grid) => {
    const cards = Array.from(grid.children).filter((el) => el.matches('.iesg-card, .iesg-service-card, .iesg-post-card'));
    if (!cards.length) return;
    gsap.set(grid, { perspective: 1200 });
    gsap.from(cards, {
      opacity: 0,
      y: values.distance,
      rotationX: heavy ? 11 : 5,
      rotationY: heavy ? () => gsap.utils.random(-4, 4) : 0,
      scale: heavy ? 0.91 : 0.97,
      duration: values.duration,
      stagger: heavy ? 0.11 : 0.07,
      ease: 'power4.out',
      scrollTrigger: { trigger: grid, start: 'top 84%', once: true }
    });
  });

  // Image reveal / parallax.
  gsap.utils.toArray('.iesg-service-card__media img, .iesg-post-card__image img, .iesg-service-hero__image img, .iesg-entry figure img').forEach((img) => {
    gsap.from(img, {
      scale: heavy ? 1.16 : 1.07,
      filter: heavy ? 'blur(8px)' : 'blur(2px)',
      duration: values.duration * 1.15,
      ease: 'power3.out',
      scrollTrigger: { trigger: img, start: 'top 92%', once: true }
    });
    if (heavy) {
      gsap.fromTo(img, { yPercent: -5 }, {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: values.scrub }
      });
    }
  });

  // CTA: masked reveal + moving light field.
  document.querySelectorAll('.iesg-cta').forEach((cta) => {
    gsap.from(cta, {
      clipPath: document.dir === 'rtl' ? 'inset(0 0 0 100% round 32px)' : 'inset(0 100% 0 0 round 32px)',
      scale: 0.975,
      duration: values.duration * 1.05,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: cta, start: 'top 86%', once: true }
    });
    gsap.from(cta.children, {
      opacity: 0,
      y: 34,
      duration: 0.85,
      stagger: 0.09,
      ease: 'power3.out',
      scrollTrigger: { trigger: cta, start: 'top 78%', once: true }
    });
    if (heavy) {
      gsap.to(cta, {
        '--iesg-cta-shift': '100%',
        ease: 'none',
        scrollTrigger: { trigger: cta, start: 'top bottom', end: 'bottom top', scrub: values.scrub }
      });
    }
  });

  // Dark section gets a slow, cinematic field motion.
  document.querySelectorAll('.iesg-section--dark').forEach((section) => {
    if (!heavy) return;
    const grid = section.querySelector('.iesg-card-grid');
    if (grid) {
      gsap.fromTo(grid, { y: 55 }, {
        y: -35,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.35 }
      });
    }
  });

  // Footer rises into place.
  const footer = document.querySelector('.iesg-site-footer');
  if (footer) {
    gsap.from(footer.querySelectorAll('.iesg-footer-grid > *, .iesg-footer-bottom'), {
      opacity: 0,
      y: 42,
      duration: 0.9,
      stagger: 0.1,
      ease: 'power3.out',
      scrollTrigger: { trigger: footer, start: 'top 90%', once: true }
    });
  }

  // Magnetic CTA buttons and 3D tilt cards on fine pointers only.
  if (!coarsePointer && intensity !== 'subtle') {
    document.querySelectorAll('.iesg-button, .wp-block-button__link').forEach((button) => {
      button.classList.add('iesg-magnetic');
      button.addEventListener('pointermove', (e) => {
        const r = button.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(button, { x: x * 0.18, y: y * 0.22, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      });
      button.addEventListener('pointerleave', () => gsap.to(button, { x: 0, y: 0, duration: 0.65, ease: 'elastic.out(1, .35)', overwrite: 'auto' }));
    });

    document.querySelectorAll('.iesg-card, .iesg-service-card, .iesg-post-card').forEach((card) => {
      card.classList.add('iesg-tilt-card');
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const ry = (px - 0.5) * (heavy ? 8 : 4);
        const rx = (0.5 - py) * (heavy ? 7 : 3.5);
        card.style.setProperty('--glare-x', `${px * 100}%`);
        card.style.setProperty('--glare-y', `${py * 100}%`);
        gsap.to(card, { rotationX: rx, rotationY: ry, transformPerspective: 900, z: heavy ? 14 : 6, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotationX: 0, rotationY: 0, z: 0, duration: 0.7, ease: 'power3.out', overwrite: 'auto' }));
    });
  }

  // Refresh once fonts/images have settled, without blocking first paint.
  window.addEventListener('load', () => {
    updateHeaderHeight();
    if (scrollbar) scrollbar.update();
    ScrollTrigger.refresh();
  }, { once: true });

  if ('ResizeObserver' in window && scrollContainer) {
    const ro = new ResizeObserver(() => {
      updateHeaderHeight();
      if (scrollbar) scrollbar.update();
      ScrollTrigger.refresh();
    });
    ro.observe(scrollContainer);
  }
})();
