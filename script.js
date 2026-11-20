(() => {
  'use strict';
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sequence = document.querySelector('.intro-sequence');
  const about = document.querySelector('.about-panel');
  const canvas = document.querySelector('.wipe-pixels');
  const ctx = canvas.getContext('2d');
  const columns = 20;
  const cutoutsSupported = CSS.supports('clip-path', 'path(evenodd, "M0 0H1V1H0Z")');
  let width = 0;
  let height = 0;
  let lastProgress = 0;

  function hash(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  // The reference uses a coarse grid, a narrow moving edge, and a few
  // detached cells on both sides. Keep the underlying content stationary.
  function drawWipe(progress) {
    lastProgress = progress;
    if (!width || !height) return;
    const cell = width / columns;
    // Leave a short pause on each complete panel.
    const p = gsap.utils.clamp(0, 1, (progress - 0.1) / 0.74);
    const front = p * (height + cell * 6) - cell * 3;
    const row = Math.floor(front / cell);
    const edge = [];
    const holes = [];
    ctx.clearRect(0, 0, width, height);
    for (let col = 0; col < columns; col++) {
      const offset = Math.floor(hash(col, row) * 3) - 1;
      const y = Math.max(0, Math.min(height, (row + offset) * cell));
      edge.push(y);
      if (p <= 0 || p >= 1 || y <= 0 || y >= height) continue;
      const x = col * cell;
      // Small gaps behind the front reveal the outgoing panel through the mask.
      if (cutoutsSupported && hash(col + 13, row) > 0.85 && y > cell * 2) {
        holes.push(`M${x},${y - cell * 2}h${cell}v${cell}h${-cell}Z`);
      }
      const lead = hash(col + 53, row);
      if (lead > 0.64) {
        const tileY = y + (lead > 0.89 ? cell : 0);
        ctx.fillStyle = lead > 0.82 ? '#3863d8' : '#111620';
        ctx.globalAlpha = lead > 0.82 ? 0.42 : 1;
        ctx.fillRect(x, tileY, Math.ceil(cell), Math.ceil(cell));
      }
      if (hash(col + 97, row) > 0.88) {
        ctx.fillStyle = '#a7bce4';
        ctx.globalAlpha = 0.36;
        ctx.fillRect(x, y - cell, Math.ceil(cell), Math.ceil(cell));
      }
    }
    ctx.globalAlpha = 1;
    if (cutoutsSupported) {
      let path = `M0,0H${width}V${edge[columns - 1]}`;
      for (let col = columns - 1; col >= 0; col--) {
        path += `H${col * cell}`;
        if (col > 0) path += `V${edge[col - 1]}`;
      }
      about.style.clipPath = `path(evenodd, "${path}Z${holes.join('')}")`;
    } else {
      const points = edge.flatMap((y, col) => [[col * 100 / columns, y * 100 / height], [(col + 1) * 100 / columns, y * 100 / height]]);
      about.style.clipPath = `polygon(0 0,100% 0,${points.reverse().map(([x,y]) => `${x}% ${y}%`).join(',')})`;
    }
    about.style.pointerEvents = p === 1 ? 'auto' : 'none';
  }

  const media = gsap.matchMedia();
  media.add('(min-width: 701px) and (min-height: 660px) and (prefers-reduced-motion: no-preference)', () => {
    document.body.classList.add('motion-ready');
    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawWipe(lastProgress);
    }
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const state = { progress: 0 };
    gsap.to(state, {
      progress: 1, ease: 'none',
      onUpdate: () => drawWipe(state.progress),
      scrollTrigger: { trigger: sequence, start: 'top top', end: 'bottom bottom', scrub: 0.15, invalidateOnRefresh: true }
    });
    // The about anchor sits inside a sticky stage, so map it to its fully revealed position.
    document.querySelectorAll('a[href="#about"]').forEach(link => link.addEventListener('click', navigateAbout));
    function navigateAbout(event) {
      event.preventDefault();
      const destination = sequence.offsetTop + sequence.offsetHeight - document.querySelector('.intro-stage').offsetHeight;
      window.scrollTo({ top: destination, behavior: 'smooth' });
      history.replaceState(null, '', '#about');
    }
    if (location.hash === '#about') requestAnimationFrame(() => window.scrollTo(0, sequence.offsetHeight - height));
    return () => {
      observer.disconnect();
      document.body.classList.remove('motion-ready');
      about.style.clipPath = '';
      about.style.pointerEvents = '';
      ctx.clearRect(0, 0, width, height);
      document.querySelectorAll('a[href="#about"]').forEach(link => link.removeEventListener('click', navigateAbout));
    };
  });

  media.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from('.hero-line, .hero-tagline', { y: 28, opacity: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out', clearProps: 'transform,opacity' });
    gsap.utils.toArray('.reveal').forEach(element => {
      gsap.from(element, { y: 32, opacity: 0, duration: 0.85, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 94%', once: true }, clearProps: 'transform,opacity' });
    });
  });

  // Animate only the ASCII symbols currently on screen, at a restrained 12 fps.
  const symbols = [...document.querySelectorAll('[data-ascii]')];
  const visibleSymbols = new Set();
  let lastFrame = 0;
  function renderSymbols(time) {
    if (document.hidden || time - lastFrame < 1 / 12) return;
    lastFrame = time;
    for (const symbol of visibleSymbols) {
      symbol.textContent = window.PortfolioAscii.frame(symbol.dataset.ascii, time);
    }
  }
  function syncSymbols() {
    gsap.ticker.remove(renderSymbols);
    if (!reduced.matches && !document.hidden && visibleSymbols.size) gsap.ticker.add(renderSymbols);
    if (reduced.matches) symbols.forEach(symbol => {
      symbol.textContent = window.PortfolioAscii.frame(symbol.dataset.ascii, 0);
    });
  }
  const symbolObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visibleSymbols.add(entry.target) : visibleSymbols.delete(entry.target));
    syncSymbols();
  });
  symbols.forEach(symbol => symbolObserver.observe(symbol));
  document.addEventListener('visibilitychange', syncSymbols);
  reduced.addEventListener('change', syncSymbols);

  // Start and stop the supplied GPU effect with visibility, viewport and motion preferences.
  const art = document.querySelector('[data-anm-ascii-overlay]');
  function syncShader() {
    const state = art._anmAsciiState;
    if (!state) return;
    const rect = art.getBoundingClientRect();
    const visible = !document.hidden && !reduced.matches && rect.bottom > 0 && rect.top < window.innerHeight;
    if (visible) gsap.ticker.add(state.render);
    else gsap.ticker.remove(state.render);
  }
  const artObserver = new IntersectionObserver(syncShader);
  artObserver.observe(art);
  document.addEventListener('visibilitychange', syncShader);
  reduced.addEventListener('change', () => {
    if (!reduced.matches && !art._anmAsciiState) window.Anm?.AsciiOverlay?.refresh();
    syncShader();
  });
  // Keep internal section links smooth without changing the native wheel/trackpad behavior.
  document.querySelectorAll('a[href^="#"]:not([href="#about"])').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', link.getAttribute('href'));
      if (link.classList.contains('skip-link')) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
    });
  });
  document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
