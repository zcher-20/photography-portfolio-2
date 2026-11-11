const SERIES_ORDER = ['london','nyc','switzerland','portraits','travel','dubai','italy','portugal','morocco'];
const SERIES_LABELS = {
  london:'London', nyc:'New York', switzerland:'Switzerland',
  portraits:'Portraits', travel:'Travel', dubai:'Dubai',
  italy:'Italy', portugal:'Portugal', morocco:'Morocco'
};
const SERIES_FILES = {
  london:'london.html', nyc:'nyc.html', switzerland:'switzerland.html',
  portraits:'portraits.html', travel:'travel.html', dubai:'dubai.html',
  italy:'italy.html', portugal:'portugal.html', morocco:'morocco.html'
};

const grid  = document.getElementById('series-grid');
const front = document.getElementById('center-front');
const back  = document.getElementById('center-back');

// Hero background from cover image
document.getElementById('series-hero').style.backgroundImage = `url('${SERIES_COVER}')`;

// Title entrance
gsap.fromTo('.series-title',
  { y: 18, opacity: 0 },
  { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
);

// Fade each image in once it's loaded + in viewport
document.querySelectorAll('.grid-thumb img').forEach(img => gsap.set(img, { opacity: 0 }));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    const img = entry.target.querySelector('img');
    const delay = i * 0.05;
    const reveal = () => gsap.to(img, { opacity: 1, duration: 0.45, delay, ease: 'power2.out' });
    if (img.complete && img.naturalWidth > 0) reveal();
    else img.addEventListener('load', reveal, { once: true });
  });
}, { rootMargin: '0px 0px 10% 0px', threshold: 0.01 });

document.querySelectorAll('.grid-thumb').forEach(t => observer.observe(t));


// Overlay
gsap.set(front, { opacity: 0 });
gsap.set(back,  { opacity: 0 });
let visible = false;

function closeOverlay() {
  gsap.killTweensOf(front);
  gsap.to(front, { opacity: 0, duration: 0.3, ease: 'power2.inOut' });
  grid.classList.remove('dimmed');
  visible = false;
}

grid.querySelectorAll('.grid-thumb').forEach(thumb => {
  thumb.addEventListener('click', (e) => {
    e.stopPropagation();
    const src = thumb.dataset.src;
    front.setAttribute('data-loading', src);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (front.getAttribute('data-loading') !== src) return;
      back.src = src;
      gsap.killTweensOf(front);
      if (!visible) {
        front.src = src;
        gsap.to(front, { opacity: 1, duration: 0.35, ease: 'power2.out' });
        grid.classList.add('dimmed');
        visible = true;
      } else {
        gsap.to(front, { opacity: 0, duration: 0.15, ease: 'power2.in', onComplete: () => {
          front.src = src;
          gsap.to(front, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        }});
      }
    };
  });
});

document.getElementById('center-overlay').addEventListener('click', closeOverlay);
grid.addEventListener('click', (e) => {
  if (!e.target.closest('.grid-thumb')) closeOverlay();
});
