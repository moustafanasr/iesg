(function(){
  function initGallery(g){
    const track=g.querySelector('[data-media-track]');
    if(!track)return;
    const slides=[...track.children], dots=[...g.querySelectorAll('[data-media-dot]')];
    let i=0;
    const go=n=>{i=(n+slides.length)%slides.length;track.style.transform=`translate3d(${-i*100}%,0,0)`;dots.forEach((d,x)=>d.classList.toggle('is-active',x===i));};
    g.querySelector('[data-media-prev]')?.addEventListener('click',()=>go(i-1));
    g.querySelector('[data-media-next]')?.addEventListener('click',()=>go(i+1));
    dots.forEach((d,x)=>d.addEventListener('click',()=>go(x)));
    let startX=0;
    track.addEventListener('pointerdown',e=>{startX=e.clientX});
    track.addEventListener('pointerup',e=>{const dx=e.clientX-startX;if(Math.abs(dx)>45)go(i+(dx<0?1:-1));});
  }
  document.querySelectorAll('[data-media-gallery]').forEach(initGallery);
  document.querySelectorAll('[data-linkedin-media] img').forEach(img=>{
    img.addEventListener('error',()=>{
      const wrap=img.closest('[data-linkedin-media]');
      if(wrap){wrap.classList.add('media-unavailable');wrap.setAttribute('aria-hidden','true');}
    },{once:true});
  });
})();