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

const grid = document.getElementById('series-grid');

// Hero background
document.getElementById('series-hero').style.backgroundImage = `url('${SERIES_COVER}')`;

// ── Page load sequence ───────────────────────────────────────────────────────

// Hide everything before animating
gsap.set('header', { y: -20, opacity: 0 });
gsap.set('.series-title', { y: 24, opacity: 0 });
document.querySelectorAll('.grid-thumb img').forEach(img => gsap.set(img, { opacity: 0 }));

const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

// Header slides down
tl.to('header', { y: 0, opacity: 1, duration: 0.55 });

// First 8 grid thumbs stagger in with y + scale
const firstThumbs = Array.from(document.querySelectorAll('.grid-thumb')).slice(0, 8);
tl.add(() => {
  firstThumbs.forEach((thumb, i) => {
    const img = thumb.querySelector('img');
    const col = i % 4;
    const row = Math.floor(i / 4);
    const delay = col * 0.07 + row * 0.1;
    const animate = () => gsap.to(img, { opacity: 1, duration: 0.55, delay, ease: 'power2.out' });
    if (img.complete && img.naturalWidth > 0) animate();
    else img.addEventListener('load', animate, { once: true });
  });
}, '-=0.2');

// Remaining thumbs handled by scroll observer
const remainingThumbs = Array.from(document.querySelectorAll('.grid-thumb')).slice(8);
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    const img = entry.target.querySelector('img');
    const animate = () => gsap.to(img, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    if (img.complete && img.naturalWidth > 0) animate();
    else img.addEventListener('load', animate, { once: true });
  });
}, { rootMargin: '0px 0px 8% 0px', threshold: 0.01 });

remainingThumbs.forEach(t => observer.observe(t));

// ── Filmstrip lightbox ───────────────────────────────────────────────────────

const thumbs = Array.from(grid.querySelectorAll('.grid-thumb'));
const sources = thumbs.map(t => t.dataset.src);
let currentIndex = 0;
let lightboxOpen = false;
let onMainImage = false;

// Inject HTML
document.body.insertAdjacentHTML('beforeend', `
  <div id="fs-overlay" tabindex="-1">
    <div id="fs-dark"></div>
    <div id="fs-content">
      <div id="fs-main-wrap">
        <img id="fs-img" src="" alt="">
      </div>
      <div id="fs-strip-wrap">
        <div id="fs-strip"></div>
      </div>
    </div>
  </div>
  <div id="fs-cursor"></div>
`);

// Inject styles
document.head.insertAdjacentHTML('beforeend', `<style>
#fs-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  cursor: none;
  opacity: 0;
  outline: none;
}
#fs-overlay.open { pointer-events: all; cursor: none; }

#fs-dark {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.82);
  z-index: 0;
}

#fs-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 80vw;
}

#fs-main-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: none;
}

#fs-img {
  max-width: 82vw;
  max-height: 74vh;
  object-fit: contain;
  display: block;
  opacity: 0;
  will-change: transform, opacity;
}

#fs-strip-wrap {
  width: 100%;
  overflow: hidden;
}
#fs-strip {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
  will-change: transform;
}
.fs-thumb {
  flex-shrink: 0;
  width: 96px;
  height: 66px;
  object-fit: cover;
  cursor: none;
  opacity: 0;
  border: 1.5px solid transparent;
  transition: border-color 0.2s, transform 0.2s;
}
.fs-thumb.active {
  border-color: rgba(255,255,255,0.8);
  transform: scale(1.1);
}

#fs-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 300;
  font-size: 0.65rem;
  font-family: inherit;
  letter-spacing: 0.1em;
  padding: 2px 0;
  opacity: 0;
  white-space: nowrap;
  transition: opacity 0.15s;
  background: transparent !important;
}
</style>`);

// Build strip
const fsStrip = document.getElementById('fs-strip');
sources.forEach((src, i) => {
  const img = document.createElement('img');
  img.src = src;
  img.className = 'fs-thumb';
  img.addEventListener('click', (e) => { e.stopPropagation(); goTo(i); });
  fsStrip.appendChild(img);
});

const fsOverlay     = document.getElementById('fs-overlay');
const fsImg         = document.getElementById('fs-img');
const fsCursor      = document.getElementById('fs-cursor');
const fsContent     = document.getElementById('fs-content');
const fsStripWrap   = document.getElementById('fs-strip-wrap');
const fsStripThumbs = Array.from(fsStrip.querySelectorAll('.fs-thumb'));

function updateStrip(index) {
  fsStripThumbs.forEach((t, i) => t.classList.toggle('active', i === index));

  // Sync strip wrap width to the rendered image width
  const imgW = fsImg.offsetWidth || window.innerWidth * 0.5;
  fsStripWrap.style.width = imgW + 'px';

  const thumbW = 96 + 6;
  const offset = index * thumbW - imgW / 2 + 48;
  gsap.to(fsStrip, { x: -Math.max(0, offset), duration: 0.4, ease: 'power2.out' });
}

function goTo(index) {
  currentIndex = (index + sources.length) % sources.length;
  gsap.to(fsImg, { opacity: 0, duration: 0.15, ease: 'power2.in', onComplete: () => {
    fsImg.src = sources[currentIndex];
    fsImg.onload = () => {
      updateStrip(currentIndex);
      gsap.to(fsImg, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    };
    // fallback if already cached
    if (fsImg.complete) { updateStrip(currentIndex); gsap.to(fsImg, { opacity: 1, duration: 0.25, ease: 'power2.out' }); }
  }});
  fsStripThumbs.forEach((t, i) => { if (i !== currentIndex) gsap.to(t, { opacity: 0.4, duration: 0.2 }); });
  gsap.to(fsStripThumbs[currentIndex], { opacity: 1, duration: 0.2 });
}

const fsDark = document.getElementById('fs-dark');

function openLightbox(index) {
  if (lightboxOpen) return;
  lightboxOpen = true;
  currentIndex = index;
  document.body.style.overflow = 'hidden';

  gsap.killTweensOf(fsOverlay);
  gsap.killTweensOf(fsImg);

  fsOverlay.classList.add('open');
  fsOverlay.focus();
  gsap.fromTo(fsOverlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });

  fsImg.src = sources[index];
  gsap.fromTo(fsImg, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out', onComplete: () => updateStrip(index) });

  grid.classList.add('dimmed');

  fsStripThumbs.forEach((t, i) => {
    const dist = Math.abs(i - index);
    gsap.fromTo(t,
      { opacity: 0 },
      { opacity: i === index ? 1 : 0.4, duration: 0.3, delay: dist * 0.04, ease: 'power2.out' }
    );
  });
  updateStrip(index);
}

function closeLightbox() {
  if (!lightboxOpen) return;
  lightboxOpen = false;
  document.body.style.overflow = '';
  grid.classList.remove('dimmed');
  fsCursor.style.opacity = '0';

  gsap.killTweensOf(fsOverlay);
  gsap.to(fsOverlay, { opacity: 0, duration: 0.25, ease: 'power2.in', onComplete: () => {
    fsOverlay.classList.remove('open');
  }});
}

// Grid clicks
thumbs.forEach((thumb, i) => {
  thumb.addEventListener('click', () => openLightbox(i));
});

// Click main image = next; click dark = close
document.getElementById('fs-main-wrap').addEventListener('click', (e) => {
  e.stopPropagation();
  goTo(currentIndex + 1);
});
document.getElementById('fs-dark').addEventListener('click', (e) => {
  e.stopPropagation();
  closeLightbox();
});

// Keyboard — listen on both window and overlay for maximum compatibility
function handleKey(e) {
  if (!lightboxOpen) return;
  if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(currentIndex - 1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(currentIndex + 1); }
  if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
}
window.addEventListener('keydown', handleKey);
fsOverlay.addEventListener('keydown', handleKey);

// Cursor label
const mainWrap = document.getElementById('fs-main-wrap');
mainWrap.addEventListener('mouseenter', () => { onMainImage = true; });
mainWrap.addEventListener('mouseleave', () => { onMainImage = false; });

document.addEventListener('mousemove', (e) => {
  fsCursor.style.left = (e.clientX + 14) + 'px';
  fsCursor.style.top  = (e.clientY + 14) + 'px';
  if (!lightboxOpen) { fsCursor.style.opacity = '0'; return; }
  fsCursor.style.color = '#fff';
  fsCursor.textContent = onMainImage ? '[NEXT]' : '[ESC]';
  fsCursor.style.opacity = '1';
});
