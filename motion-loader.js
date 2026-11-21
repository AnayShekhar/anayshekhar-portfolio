// The HTML is complete without animation. Phones never fetch these dependencies.
(() => {
  'use strict';
  if (document.documentElement.classList.contains('lite-mode')) return;

  const sources = [
    'assets/vendor/gsap.min.js',
    'assets/vendor/ScrollTrigger.min.js',
    'assets/vendor/ScrambleTextPlugin.min.js',
    'assets/vendor/three.min.js',
    'assets/vendor/ascii-overlay.js?v=2',
    'assets/vendor/dual-scramble.js',
    'ascii-symbols.js',
    'script.js'
  ];
  // Fetch in parallel, but execute in dependency order.
  for (const src of sources) {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    document.head.append(script);
  }
})();
