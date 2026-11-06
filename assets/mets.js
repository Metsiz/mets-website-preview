// Stands in for Liam's Next.js scripts in the mock-up: reveals, the header,
// and the aperture, which now opens through the Mets elongated rhombus.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => 1 - Math.pow(1 - t, 3);

  // Reveals and image wipes
  const reveal = document.querySelectorAll('[data-reveal]');
  reveal.forEach(el => el.setAttribute('data-revealed', 'false'));
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      if (e.target.hasAttribute('data-reveal')) e.target.setAttribute('data-revealed', 'true');
      if (e.target.classList.contains('wipe')) e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  reveal.forEach(el => io.observe(el));
  document.querySelectorAll('.wipe').forEach(el => io.observe(el));

  // Header: solid after the hero, tone from the section underneath it
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const toned = [...document.querySelectorAll('main [data-tone], footer[data-tone]')];

  // Aperture
  const ap = document.querySelector('.aperture');
  const stage = ap && ap.querySelector('.ap-stage');
  const svg = ap && ap.querySelector('.ap-setting');
  const poly = svg && svg.querySelector('polygon');

  function aperture() {
    if (!ap) return;
    const r = ap.getBoundingClientRect();
    const W = stage.clientWidth, H = stage.clientHeight;
    const run = ap.offsetHeight - H;
    const p = clamp(-r.top / run);
    const cs = getComputedStyle(stage);
    const hw = parseFloat(cs.getPropertyValue('--ap-half')) || 104;
    const hh = parseFloat(cs.getPropertyValue('--ap-halfh')) || 188;
    // Scale at which the rhombus covers the whole stage
    const kMax = (W / 2) / hw + (H / 2) / hh + 0.05;
    const g = ease(clamp(p / 0.62));
    const k = 1 + (kMax - 1) * g;
    const cx = W / 2, cy = H / 2;
    const pts = [[cx, cy - hh * k], [cx + hw * k, cy], [cx, cy + hh * k], [cx - hw * k, cy]];
    stage.style.setProperty('--ap-clip', `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(',')})`);
    stage.style.setProperty('--ap-g', g.toFixed(4));
    stage.style.setProperty('--ap-k', k.toFixed(4));
    // The mark, the name and the kicker are fully gone by the time the opening is as wide as "The Cadillac Ring"
    const name = stage.querySelector('.ap-name');
    let nameW = 2 * hw;
    if (name) { const rg = document.createRange(); rg.selectNodeContents(name); nameW = rg.getBoundingClientRect().width || nameW; }
    const kEnd = Math.max(1.2, nameW / (2 * hw));
    stage.style.setProperty('--ap-fade', clamp(1 - (k - 1) / (kEnd - 1)).toFixed(4));
    // The mark (outline and M) lasts one scroll (~100px) longer than the name, fading as it grows
    const gEnd = clamp((kEnd - 1) / (kMax - 1));
    const dEnd = 0.62 * (1 - Math.cbrt(1 - gEnd)) * run;
    const d = Math.max(0, -r.top);
    stage.style.setProperty('--ap-mark', clamp(1 - d / (dEnd + 100)).toFixed(4));
    stage.style.setProperty('--ap-cap', clamp((p - 0.6) / 0.25).toFixed(4));
    stage.style.setProperty('--ap-zoom', (1.3 - 0.3 * g).toFixed(4));
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const o = 14; // the gold outline sits just outside the opening
      poly.setAttribute('points', [[cx, cy - hh * k - o], [cx + hw * k + o * 0.55, cy], [cx, cy + hh * k + o], [cx - hw * k - o * 0.55, cy]]
        .map(pt => pt.join(',')).join(' '));
    }
  }

  function headerState() {
    if (!header) return;
    const y = window.scrollY;
    header.setAttribute('data-solid', String(y > (hero ? hero.offsetHeight - header.offsetHeight : 40)));
    const probe = header.offsetHeight / 2;
    const under = toned.find(el => {
      const b = el.getBoundingClientRect();
      return b.top <= probe && b.bottom > probe;
    });
    if (under) header.setAttribute('data-tone', under.getAttribute('data-tone'));
  }

  // Story: the last image's right edge lines up with the end of "Jewellery that complements your life."
  const line = document.querySelector('.dusk-line');
  const last = document.querySelector('.dusk .d4');
  function alignLast() {
    if (!line || !last) return;
    if (innerWidth <= 720) { last.style.width = ''; return; }
    const rg = document.createRange();
    rg.selectNodeContents(line);
    const textRight = rg.getBoundingClientRect().right;
    last.style.width = '';
    const left = last.getBoundingClientRect().left;
    if (textRight > left) last.style.width = (textRight - left) + 'px';
  }
  addEventListener('resize', alignLast);
  if (document.fonts) document.fonts.ready.then(alignLast);
  alignLast();

  // Menu and search: one open at a time, closed by Escape or by the desktop nav taking over
  const menu = document.getElementById('menu');
  const menuBtn = document.querySelector('.menu-btn');
  const searchBtn = document.querySelector('.search-btn');
  const searchBox = document.getElementById('site-search-box');

  function setMenu(open) {
    menu.setAttribute('data-open', String(open));
    document.body.setAttribute('data-menu', open ? 'open' : 'closed');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? menuBtn.dataset.close : menuBtn.dataset.open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }

  function setSearch(open) {
    header.setAttribute('data-search', open ? 'open' : 'closed');
    searchBtn.setAttribute('aria-expanded', String(open));
    if (open) searchBox.focus();
  }

  menuBtn.addEventListener('click', () => {
    const open = menu.getAttribute('data-open') !== 'true';
    setSearch(false);
    setMenu(open);
  });
  searchBtn.addEventListener('click', () => {
    const open = header.getAttribute('data-search') !== 'open';
    setMenu(false);
    setSearch(open);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => {
    if (e.key === 'Escape') { setMenu(false); setSearch(false); }
  });
  addEventListener('resize', () => {
    if (getComputedStyle(menuBtn).display === 'none') setMenu(false);
  });

  let ticking = false;
  function frame() {
    ticking = false;
    aperture();
    headerState();
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();
})();
