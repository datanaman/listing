document.addEventListener('DOMContentLoaded', ()=>{
  const track = document.getElementById('carousel-track');
  const thumbs = document.getElementById('thumbs');
  const images = [];
  // try to load images named image1.jpg..image8.jpg from ./images
  for(let i=1;i<=8;i++){
    const url = `images/image${i}.jpg`;
    images.push(url);
  }

  // Utility: check image exists
  function imageExists(src){
    return new Promise(resolve=>{
      const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;
    });
  }

  async function buildCarousel(){
    const available = [];
    for(const src of images){
      if(await imageExists(src)) available.push(src);
    }

    track.innerHTML='';thumbs.innerHTML='';
    if(available.length===0){
      const placeholder=document.createElement('div');placeholder.className='slide placeholder';placeholder.textContent='No images found. Add photos to /images as image1.jpg, image2.jpg, ...';track.appendChild(placeholder);return;
    }

    available.forEach((src,idx)=>{
      const slide=document.createElement('div');slide.className='slide';slide.style.backgroundImage=`url(${src})`;
      track.appendChild(slide);
      const timg=document.createElement('img');timg.src=src;timg.dataset.index=idx; if(idx===0) timg.classList.add('active');
      timg.addEventListener('click', ()=>{goTo(idx)});
      thumbs.appendChild(timg);
    });

    let current=0;
    const slides=track.children;

    function update(){
      track.style.transform = `translateX(-${current*100}%)`;
      Array.from(thumbs.children).forEach((t,i)=> t.classList.toggle('active', i===current));
    }

    window.goTo = function(i){ current = (i+slides.length)%slides.length; update(); }

    document.querySelector('.carousel-nav.prev').addEventListener('click', ()=>{ goTo(current-1); });
    document.querySelector('.carousel-nav.next').addEventListener('click', ()=>{ goTo(current+1); });

    // Auto-advance
    setInterval(()=>{ goTo(current+1); }, 4500);
  }

  buildCarousel();

  // Share
  const shareBtn = document.getElementById('shareBtn');
  shareBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    if(navigator.share){
      navigator.share({title:document.title,text:'Check out this home: 10867 Farmstead Mill Lane Gln — $529k',url:location.href});
    } else {
      navigator.clipboard.writeText(location.href).then(()=> alert('Link copied to clipboard'));
    }
  });

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
