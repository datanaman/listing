document.addEventListener('DOMContentLoaded', ()=>{
  // Replace custom carousel with Swiper
  const exts = ['jpg','jpeg','png','webp'];
  const maxImages = 12;

  function imageExists(src){
    return new Promise(resolve=>{
      const img = new Image(); img.onload = ()=> resolve(true); img.onerror = ()=> resolve(false); img.src = src;
    });
  }

  async function initSwiper(){
    const available = [];
    for(let i=1;i<=maxImages;i++){
      for(const ext of exts){
        const candidate = `images/image${i}.${ext}`;
        // eslint-disable-next-line no-await-in-loop
        if(await imageExists(candidate)){
          available.push(candidate);
          break;
        }
      }
    }

    const mainWrapper = document.getElementById('swiper-wrapper');
    const thumbsWrapper = document.getElementById('thumbs-wrapper');
    mainWrapper.innerHTML = '';
    thumbsWrapper.innerHTML = '';

    if(available.length === 0){
      mainWrapper.innerHTML = '<div class="swiper-slide placeholder">Add photos to /images as image1.jpg, image2.jpg, ...</div>';
      return;
    }

    available.forEach(src => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
  slide.innerHTML = `<div class="slide" style="background-image:url('${src}')" data-src="${src}"></div>`;
      mainWrapper.appendChild(slide);

      const thumb = document.createElement('div');
      thumb.className = 'swiper-slide';
      thumb.innerHTML = `<img src="${src}" alt="thumb" style="width:60px;height:40px;object-fit:cover;border-radius:6px"/>`;
      thumbsWrapper.appendChild(thumb);
    });

    // init Swiper (script included via CDN in index.html)
    const thumbsSwiper = new Swiper('.thumbs-swiper',{ spaceBetween:8, slidesPerView: Math.min(available.length, 8), watchSlidesProgress:true, freeMode:true });
    const mainSwiper = new Swiper('.main-swiper',{ spaceBetween:10, navigation:{ nextEl:'.swiper-button-next', prevEl:'.swiper-button-prev' }, thumbs: { swiper: thumbsSwiper }, loop:true, autoplay: { delay:4500, disableOnInteraction:false } });

    // expose available images for other UI actions (lightbox/download)
    window.__galleryImages = available;

    // add click handlers to open lightbox when a slide or thumbnail is clicked
    const openLightbox = (index)=>{
      const images = window.__galleryImages || [];
      if(!images.length) return;
      currentLightboxIndex = ((index % images.length) + images.length) % images.length;
      showLightboxAt(currentLightboxIndex);
    };

    // attach to main slides
    const mainSlides = mainWrapper.querySelectorAll('.slide');
    mainSlides.forEach((el, idx)=> el.addEventListener('click', ()=> openLightbox(idx)));

    // attach to thumbs
    const thumbs = thumbsWrapper.querySelectorAll('img');
    thumbs.forEach((el, idx)=> el.addEventListener('click', ()=> openLightbox(idx)));
  }

  initSwiper();

  // LIGHTBOX functionality
  let currentLightboxIndex = 0;
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const lightboxDownload = document.getElementById('lightboxDownload');

  function showLightboxAt(index){
    const images = window.__galleryImages || [];
    if(!images.length) return;
    currentLightboxIndex = ((index % images.length) + images.length) % images.length;
    const src = images[currentLightboxIndex];
    lightboxImage.src = src;
    lightboxDownload.href = src;
    lightboxDownload.setAttribute('download', src.split('/').pop());
    lightbox.setAttribute('aria-hidden','false');
  }

  function closeLightbox(){
    lightbox.setAttribute('aria-hidden','true');
    lightboxImage.src = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) closeLightbox(); });
  lightboxPrev.addEventListener('click', ()=> showLightboxAt(currentLightboxIndex-1));
  lightboxNext.addEventListener('click', ()=> showLightboxAt(currentLightboxIndex+1));

  // keyboard navigation when lightbox open
  document.addEventListener('keydown', (e)=>{
    if(lightbox.getAttribute('aria-hidden') === 'false'){
      if(e.key === 'ArrowLeft') showLightboxAt(currentLightboxIndex-1);
      if(e.key === 'ArrowRight') showLightboxAt(currentLightboxIndex+1);
      if(e.key === 'Escape') closeLightbox();
    }
  });

  // (Download-all removed — per user request)

  // Share
  const shareBtn = document.getElementById('shareBtn');
  shareBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    if(navigator.share){
      navigator.share({title:document.title,text:'Check out this home: 10867 Farmstead Mill Lane Gln — $529k',url:location.href});
    } else {
      // Build WhatsApp share as a fallback so mobile users can open WhatsApp with a rich message
      const title = document.title;
      const descEl = document.querySelector('.lead');
      const desc = descEl ? descEl.textContent.trim() : '';
      const priceEl = document.getElementById('ownerPrice');
      const price = priceEl ? priceEl.textContent.trim() : '';
      const message = `${title}\n${price}\n${desc}\n${location.href}`;
      const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
      // Try opening WhatsApp in a new tab/window; if blocked, copy link to clipboard
      const opened = window.open(waLink, '_blank');
      if(!opened) navigator.clipboard.writeText(waLink).then(()=> alert('WhatsApp share link copied to clipboard'));
    }
  });

  // Ensure Open Graph tags have absolute URLs (useful when the page is hosted)
  try{
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    if(ogUrl) ogUrl.content = location.href;
    if(ogImage){
      // if an images/image1.jpg exists, convert to absolute URL
      const imgCandidate = 'images/image1.jpg';
      const abs = new URL(imgCandidate, location.href).href;
      ogImage.content = abs;
    }
  }catch(e){console.warn('OG tags setup failed',e)}

  // Print flyer
  const printBtn = document.getElementById('printBtn');
  printBtn.addEventListener('click', ()=> window.print());

  // Price with buyer agent commission (2%)
  try{
    const ownerPriceEl = document.getElementById('ownerPrice');
    const priceWithCommissionEl = document.getElementById('priceWithCommission');
    const priceWithCommissionBreakdownEl = document.getElementById('priceWithCommissionBreakdown');
    if(ownerPriceEl && priceWithCommissionEl){
      // read data-base-price or parse text
      let base = parseFloat(ownerPriceEl.dataset.basePrice || ownerPriceEl.textContent.replace(/[^0-9.-]+/g,""));
      if(Number.isFinite(base)){
        const commissionRate = 0.02;
        const commissionAmount = Math.round(base * commissionRate);
        const totalWithCommission = Math.round(base + commissionAmount);

        const fmt = (n)=> n.toLocaleString(undefined,{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:0});

        priceWithCommissionEl.textContent = fmt(totalWithCommission) + " ";
        priceWithCommissionBreakdownEl.textContent = `${fmt(base)} + 2%`;
      }
    }
  }catch(err){ console.error('price calc error',err) }
});
