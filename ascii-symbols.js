// Character-only illustrations on a transparent background.
(() => {
  'use strict';
  const cols = 72;
  const rows = 34;
  const shades = ' .,:;+=ox%#@';

  function frame(kind, time = 0) {
    const grid = Array.from({ length: rows }, () => Array(cols).fill(' '));
    function put(x, y, char) {
      x = Math.round(x); y = Math.round(y);
      if (x >= 0 && x < cols && y >= 0 && y < rows) grid[y][x] = char;
    }
    function line(x1, y1, x2, y2, char = '.') {
      const steps = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 2);
      for (let i = 0; i <= steps; i++) {
        const p = steps ? i / steps : 0;
        put(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p, char);
      }
    }
    function ellipse(cx, cy, rx, ry, char = '.') {
      for (let a = 0; a < Math.PI * 2; a += 0.035) put(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, char);
    }

    if (kind === 'orbit') {
      const tilt = -0.3;
      function ring(front) {
        for (let a = 0; a < Math.PI * 2; a += 0.015) {
          if ((Math.sin(a) > 0) !== front) continue;
          for (let band = 0; band < 3; band++) {
            const x = Math.cos(a) * (27 - band * 1.2);
            const y = Math.sin(a) * (6.8 - band * 0.35);
            put(36 + x * Math.cos(tilt) - y * Math.sin(tilt) * 2,
              17 + x * Math.sin(tilt) * 0.5 + y * Math.cos(tilt), band === 1 ? ':' : '.');
          }
        }
      }
      ring(false);
      for (let y = -9; y <= 9; y++) {
        for (let x = -17; x <= 17; x++) {
          const nx = x / 17, ny = y / 9;
          const radius = nx * nx + ny * ny;
          if (radius > 1) continue;
          const nz = Math.sqrt(1 - radius);
          const light = Math.max(0, -nx * 0.45 - ny * 0.55 + nz * 0.7);
          const bands = Math.sin(ny * 17 + Math.atan2(nx, nz) * 2 + time * 0.45) * 0.1;
          put(36 + x, 17 + y, shades[Math.max(1, Math.min(shades.length - 1, Math.floor((light * 0.8 + bands + 0.13) * 10)))]);
        }
      }
      ring(true);
      const a = time * 0.42 - 0.6;
      const x = Math.cos(a) * 29, y = Math.sin(a) * 7.8;
      const sx = 36 + x * Math.cos(tilt) - y * Math.sin(tilt) * 2;
      const sy = 17 + x * Math.sin(tilt) * 0.5 + y * Math.cos(tilt);
      put(sx, sy, '@'); put(sx - 1, sy, 'o'); put(sx + 1, sy, 'o');
    } else if (kind === 'cursor') {
      // A pointer and an expanding click ripple for computer actions.
      const pulse = (time * 0.28) % 1;
      if (pulse > 0.08) ellipse(27, 6, 3 + pulse * 17, 1.5 + pulse * 8, pulse < 0.65 ? ':' : '.');
      const points = [[27, 5], [27, 26], [35, 21], [43, 31], [49, 28], [41, 18], [54, 18]];
      function inside(x, y) {
        let hit = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const [xi, yi] = points[i], [xj, yj] = points[j];
          if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) hit = !hit;
        }
        return hit;
      }
      for (let y = 5; y <= 31; y++) for (let x = 27; x <= 54; x++) {
        if (inside(x, y)) put(x, y, x < 31 || y > 25 ? '#' : (x + y) % 3 ? ':' : '+');
      }
      points.forEach(([x, y], i) => line(x, y, ...points[(i + 1) % points.length], '+'));
    } else if (kind === 'leaf') {
      const sway = Math.sin(time * 0.6) * 0.035;
      const angle = -0.48 + sway;
      const ax = Math.sin(angle), ay = -Math.cos(angle);
      for (let y = 1; y < rows - 1; y++) for (let x = 8; x < cols - 8; x++) {
        const px = (x - 36) * 0.55, py = y - 17;
        const along = px * ax + py * ay;
        const side = px * -ay + py * ax;
        const u = (along + 12) / 26;
        if (u <= 0 || u >= 1) continue;
        const width = 7.6 * Math.pow(Math.sin(u * Math.PI), 0.82);
        if (Math.abs(side) >= width) continue;
        const vein = Math.abs(side) < 0.45;
        const rib = Math.abs(((along + Math.abs(side) * 0.9 + 30) % 4.2) - 2.1) < 0.4;
        const edge = width - Math.abs(side) < 0.65;
        put(x, y, vein ? '/' : rib ? (side < 0 ? '\\' : '/') : edge ? '.' : side < 0 ? ':' : '+');
      }
      line(36 - ax * 12 / 0.55, 17 - ay * 12, 36 - ax * 17 / 0.55, 17 - ay * 17, '/');
    } else if (kind === 'network') {
      const layers = [[14, [6, 16, 26]], [36, [3, 12, 21, 30]], [58, [9, 25]]];
      for (let l = 0; l < layers.length - 1; l++) {
        for (const y of layers[l][1]) for (const nextY of layers[l + 1][1]) {
          line(layers[l][0], y, layers[l + 1][0], nextY, '.');
        }
      }
      const progress = (time * 0.3) % 1;
      const activeX = 14 + progress * 44;
      for (const [x, ys] of layers) for (const y of ys) {
        ellipse(x, y, 2.8, 1.4, Math.abs(x - activeX) < 8 ? '@' : 'o');
        put(x, y, Math.abs(x - activeX) < 8 ? '+' : ' ');
      }
      const segment = progress < 0.5 ? 0 : 1;
      const local = (progress * 2) % 1;
      const startY = layers[segment][1][1], endY = layers[segment + 1][1][1];
      put(activeX, startY + (endY - startY) * local, '*');
    }
    return grid.map(row => row.join('').trimEnd()).join('\n');
  }

  window.PortfolioAscii = { frame };
})();
