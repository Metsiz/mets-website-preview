// The Cadillac Ring page: click-to-zoom on the views (replaces Liam's hover loupe)
// and the material-detail hotspots on the top view.
(() => {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const icon = zoomed => `<svg viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.2">
    <circle cx="5" cy="5" r="3.8"/><path d="M8 8l3.2 3.2M3.2 5h3.6${zoomed ? '' : 'M5 3.2v3.6'}"/></svg>`;

  const views = [...document.querySelectorAll('.view[data-zoom]')];

  function setOrigin(fig, clientX, clientY) {
    const r = fig.querySelector('.view-inner').getBoundingClientRect();
    fig.style.setProperty('--zx', `${clamp((clientX - r.left) / r.width, 0, 1) * 100}%`);
    fig.style.setProperty('--zy', `${clamp((clientY - r.top) / r.height, 0, 1) * 100}%`);
  }

  function zoom(fig, on, x, y) {
    views.forEach(v => { if (v !== fig && v.classList.contains('is-zoomed')) zoom(v, false); });
    if (on && x != null) setOrigin(fig, x, y);
    if (!on) { fig.style.removeProperty('--zx'); fig.style.removeProperty('--zy'); }
    fig.classList.toggle('is-zoomed', on);
    const hint = fig.querySelector('.zoom-hint');
    hint.innerHTML = `${icon(on)}${on ? 'Zoom out' : 'Zoom'}`;
    hint.setAttribute('aria-pressed', String(on));
  }

  views.forEach(fig => {
    const inner = fig.querySelector('.view-inner');
    const img = inner.querySelector('img');
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'zoom-hint';
    hint.setAttribute('aria-label', `Zoom: ${img.alt}`);
    fig.appendChild(hint);
    zoom(fig, false);

    hint.addEventListener('click', () => zoom(fig, !fig.classList.contains('is-zoomed')));

    // Click the image: zoom in on that point; click again to zoom out
    img.addEventListener('click', e => zoom(fig, !fig.classList.contains('is-zoomed'), e.clientX, e.clientY));

    // While zoomed, the mouse (or a finger) moves around the ring
    inner.addEventListener('mousemove', e => {
      if (fig.classList.contains('is-zoomed')) setOrigin(fig, e.clientX, e.clientY);
    });
    inner.addEventListener('touchmove', e => {
      if (!fig.classList.contains('is-zoomed')) return;
      e.preventDefault();
      setOrigin(fig, e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
  });

  // Zoom out when the view scrolls away, or on Escape
  const stage = document.querySelector('.viewer-stage');
  if (stage) stage.addEventListener('scroll', () => views.forEach(v => v.classList.contains('is-zoomed') && zoom(v, false)), { passive: true });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') views.forEach(v => zoom(v, false)); });

  // Material detail: one label open at a time, and a show/hide toggle
  document.querySelectorAll('.view').forEach(fig => {
    const spots = [...fig.querySelectorAll('.hotspot')];
    spots.forEach(s => s.addEventListener('click', e => {
      e.stopPropagation();
      const open = s.getAttribute('aria-expanded') !== 'true';
      spots.forEach(o => o.setAttribute('aria-expanded', 'false'));
      s.setAttribute('aria-expanded', String(open));
    }));
    const t = fig.querySelector('.hs-toggle');
    if (t) t.addEventListener('click', () => {
      const shown = t.getAttribute('aria-pressed') !== 'true';
      t.setAttribute('aria-pressed', String(shown));
      fig.classList.toggle('hs-hidden', !shown);
      t.querySelector('span').textContent = shown ? t.dataset.hide : t.dataset.show;
    });
  });
})();
