// ============================================================================
// MAIN PORTFOLIO APPLICATION LOGIC
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {

  // ── Canvas Setup ────────────────────────────────────────────────────────
  const coreCanvas = document.getElementById('mainCanvas');
  const ctx = coreCanvas ? coreCanvas.getContext('2d') : null;

  if (ctx) {
    function resizeCanvas() {
      coreCanvas.width  = window.innerWidth;
      coreCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // ── 3D Particle Engine ────────────────────────────────────────────────
    class Particle {
      constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
        this.vx = (Math.random() - 0.5) * 0.02;
        this.vy = (Math.random() - 0.5) * 0.02;
        this.vz = (Math.random() - 0.5) * 0.02;
        this.size    = Math.random() * 1.5 + 0.5;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color   = '#60a5fa';
      }
      update(cx, cy, cz, mf) {
        const dx = cx - this.x, dy = cy - this.y, dz = cz - this.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist > 0.1) {
          this.vx += (dx/dist)*0.0005*mf;
          this.vy += (dy/dist)*0.0005*mf;
          this.vz += (dz/dist)*0.0005*mf;
        }
        this.vx *= 0.98; this.vy *= 0.98; this.vz *= 0.98;
        this.x += this.vx; this.y += this.vy; this.z += this.vz;
      }
      draw(ctx, cx, cy, scale, rx, ry) {
        let x = this.x, y = this.y, z = this.z;
        const y1 = y*Math.cos(rx) - z*Math.sin(rx);
        const z1 = y*Math.sin(rx) + z*Math.cos(rx);
        const x2 = x*Math.cos(ry) + z1*Math.sin(ry);
        const z2 = -x*Math.sin(ry) + z1*Math.cos(ry);
        const s3  = 500 / (500 + z2);
        const sx  = cx + x2*s3*scale;
        const sy  = cy + y1*s3*scale;
        ctx.fillStyle   = this.color;
        ctx.globalAlpha = this.opacity * s3;
        ctx.beginPath();
        ctx.arc(sx, sy, this.size*s3, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    let particles = [];
    for (let i = 0; i < 1000; i++) {
      const a = Math.random()*Math.PI*2, phi = Math.random()*Math.PI;
      const r = Math.random()*150 + 50;
      particles.push(new Particle(
        r*Math.sin(phi)*Math.cos(a),
        r*Math.sin(phi)*Math.sin(a),
        r*Math.cos(phi)
      ));
    }

    let rotationX = 0, rotationY = 0, morphFactor = 1, time = 0;
    let zoomLevel = 1, targetZoom = 1;

    function drawLines(ctx, cx, cy, scale, rx, ry) {
      ctx.strokeStyle = 'rgba(96,165,250,0.1)';
      ctx.lineWidth   = 0.5;
      for (let i = 0; i < particles.length; i += 20) {
        for (let j = i+1; j < Math.min(i+5, particles.length); j++) {
          const p1 = particles[i], p2 = particles[j];
          const dist = Math.sqrt((p1.x-p2.x)**2+(p1.y-p2.y)**2+(p1.z-p2.z)**2);
          if (dist < 150) {
            const proj = (p, rx, ry) => {
              const y1 = p.y*Math.cos(rx) - p.z*Math.sin(rx);
              const z1 = p.y*Math.sin(rx) + p.z*Math.cos(rx);
              // FIXED: Changed raw x to p.x and raw -x to -p.x to match particle property definitions
              const x2 = p.x*Math.cos(ry) + z1*Math.sin(ry);
              const z2 = -p.x*Math.sin(ry) + z1*Math.cos(ry);
              const s3 = 500/(500+z2);
              return [cx+x2*s3*scale, cy+y1*s3*scale];
            };
            const [sx1,sy1] = proj(p1,rx,ry);
            const [sx2,sy2] = proj(p2,rx,ry);
            ctx.beginPath();
            ctx.moveTo(sx1,sy1);
            ctx.lineTo(sx2,sy2);
            ctx.stroke();
          }
        }
      }
    }

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let targetMouseX = window.innerWidth / 2, targetMouseY = window.innerHeight / 2;

    document.addEventListener('mousemove', (e) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      const cursorDot = document.querySelector('.cursor-dot');
      const glowRing  = document.querySelector('.glow-ring');
      if (cursorDot && glowRing) {
        cursorDot.style.left = e.clientX - 4 + 'px';
        cursorDot.style.top  = e.clientY - 4 + 'px';
        cursorDot.classList.add('active');
        glowRing.style.left  = e.clientX - 20 + 'px';
        glowRing.style.top   = e.clientY - 20 + 'px';
        glowRing.classList.add('active');
      }
    });

    function animate() {
      mouseX += (targetMouseX - mouseX) * 0.1;
      mouseY += (targetMouseY - mouseY) * 0.1;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, coreCanvas.width, coreCanvas.height);
      time += 0.01;
      rotationX += 0.003 + (mouseX - coreCanvas.width/2)*0.00001;
      rotationY += 0.005 + (mouseY - coreCanvas.height/2)*0.00001;
      morphFactor = 0.5 + 0.5*Math.sin(time*0.5);
      zoomLevel  += (targetZoom - zoomLevel)*0.05;
      const cx = coreCanvas.width/2, cy = coreCanvas.height/2;
      for (let p of particles) p.update(cx,cy,0,morphFactor);
      particles.sort((a,b) => a.z - b.z);
      drawLines(ctx,cx,cy,1.5*zoomLevel,rotationX,rotationY);
      for (let p of particles) p.draw(ctx,cx,cy,1.5*zoomLevel,rotationX,rotationY);
      ctx.fillStyle = 'rgba(96,165,250,0.05)';
      ctx.beginPath();
      ctx.arc(cx,cy,200*zoomLevel,0,Math.PI*2);
      ctx.fill();
      requestAnimationFrame(animate);
    }
    animate();

    coreCanvas.addEventListener('click', (e) => {
      const cx   = coreCanvas.width / 2, cy = coreCanvas.height / 2;
      const dist = Math.sqrt((e.clientX - cx)**2 + (e.clientY - cy)**2);
      if (dist < 300) {
        const idx = (assets.indexOf(currentAsset) + 1) % assets.length;
        openPanel(assets[idx]);
        targetZoom = 1.5;
        setTimeout(() => { targetZoom = 1; }, 300);
      }
    });
  }

  // ── Asset Contents ──────────────────────────────────────────────────────
  const ASSET_CONTENT = {
    POKEPY: {
      label: '// POKEPY',
      html: `
      <div class="panel-pokepy">
        <div class="project-title">pokepy</div>
        <div class="project-sub">CHARACTER-LEVEL LANGUAGE MODEL</div>
        <p class="project-desc">
          A from-scratch character-level language model trained on Pokémon names,
          built in pure NumPy. Implements all gradients manually across an embedding
          layer, linear layers, BatchNorm, tanh activations, and softmax + cross-entropy.
          Every gradient passes a cmp() check against PyTorch's autograd engine at
          precision down to 1e-15.
        </p>
        <div class="tags">
          <span class="tag">NumPy</span>
          <span class="tag">Backprop</span>
          <span class="tag">BatchNorm</span>
          <span class="tag">MLP</span>
          <span class="tag">Karpathy / Zero to Hero</span>
        </div>
        <div class="stat-row">
          <div class="stat-box">
            <div class="stat-val">1e-15</div>
            <div class="stat-label">Grad Precision</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">2-layer</div>
            <div class="stat-label">Architecture</div>
          </div>
          <div class="stat-box">
            <div class="stat-val">100%</div>
            <div class="stat-label">Manual Grads</div>
          </div>
        </div>
      </div>`
    },
    RESEARCH: {
      label: '// RESEARCH',
      html: `
      <div class="panel-research">
        <ul class="research-list">
          <li class="research-item">
            <span class="research-num">01</span>
            <div class="research-content">
              <h4>Fern AI — Hospital Bill Auditor</h4>
              <p>AI-powered mobile app that audits medical bills. CPT code validation via RAG
              (ChromaDB + sentence-transformers), price auditing against CMS fee schedules,
              fraud flagging with Isolation Forest, and dispute letter generation.</p>
              <span class="research-status status-completed">HACKTJ WINNER</span>
            </div>
          </li>
          <li class="research-item">
            <span class="research-num">02</span>
            <div class="research-content">
              <h4>Forge — ML Portfolio & Credentialing Engine</h4>
              <p>Users train a real PyTorch model, pass a Groq-powered verification interview,
              then receive a hard-locked GitHub export. Interview transcript ships in the README
              as proof of genuine understanding. Stack: React, FastAPI, Supabase, Groq llama-3.3-70b.</p>
              <span class="research-status status-active">IN DEVELOPMENT</span>
            </div>
          </li>
          <li class="research-item">
            <span class="research-num">03</span>
            <div class="research-content">
              <h4>ISEF Project — ML Research</h4>
              <p>Targeting Regeneron ISEF sophomore year. Leaning toward replicating and extending
              an arXiv paper or domain-applied ML (biology, climate, medicine).</p>
              <span class="research-status status-planned">PLANNED · 2026</span>
            </div>
          </li>
        </ul>
      </div>`
    },
    SYSTEMS: {
      label: '// SYSTEMS',
      html: `
      <div class="panel-systems">
        <div class="sys-grid">
          <div class="sys-card">
            <h4>Core ML</h4>
            <ul>
              <li>Manual backpropagation</li>
              <li>Embedding + Linear layers</li>
              <li>BatchNorm from scratch</li>
              <li>Tanh / softmax / cross-entropy</li>
              <li>Gradient verification (cmp)</li>
            </ul>
          </div>
          <div class="sys-card">
            <h4>Frameworks & Stack</h4>
            <ul>
              <li>PyTorch</li>
              <li>NumPy (primary)</li>
              <li>FastAPI</li>
              <li>React + Tailwind</li>
              <li>Expo / React Native</li>
            </ul>
          </div>
          <div class="sys-card">
            <h4>Infrastructure</h4>
            <ul>
              <li>Supabase / SQLite</li>
              <li>ChromaDB (RAG)</li>
              <li>Groq API (llama-3.3-70b)</li>
              <li>Gemini 2.0 Flash</li>
              <li>LM Studio + Roo Code</li>
            </ul>
          </div>
          <div class="sys-card">
            <h4>Roadmap Progress</h4>
            <ul>
              <li>Phase 1 — Foundations ✓</li>
              <li>Phase 2 — Deep Backprop ✓</li>
              <li>Phase 3 — ML Breadth →</li>
            </ul>
            <div class="progress-bar" style="margin-top:16px">
              <div class="progress-fill" style="width:66%"></div>
            </div>
          </div>
        </div>
      </div>`
    },
    ENGINEERING: {
      label: '// ENGINEERING',
      html: `
      <div class="panel-engineering">
        <ul class="eng-timeline">
          <li class="eng-item">
            <div class="eng-dot gold"></div>
            <div class="eng-content">
              <h4>HackTJ — 1st Place</h4>
              <span>World's largest high school hackathon</span>
              <p>Built Fern AI: hospital bill auditor with RAG, anomaly detection, and dispute generation. Won first place.</p>
            </div>
          </li>
          <li class="eng-item">
            <div class="eng-dot"></div>
            <div class="eng-content">
              <h4>pokepy — MLP Language Model</h4>
              <span>Pure NumPy · Zero to Hero track</span>
              <p>2-layer MLP trained on Pokémon names. All gradients manual; verified to 1e-15 against PyTorch autograd.</p>
            </div>
          </li>
          <li class="eng-item">
            <div class="eng-dot green"></div>
            <div class="eng-content">
              <h4>Milo — Senior Tech Literacy App</h4>
              <span>React Native + FastAPI + Groq</span>
              <p>Gamified AI tutor with XP, levels, badges, and leaderboard. Built at hackathon.</p>
            </div>
          </li>
          <li class="eng-item">
            <div class="eng-dot"></div>
            <div class="eng-content">
              <h4>Forge — ML Credentialing Engine</h4>
              <span>In development · Target: mid-2025</span>
              <p>Real model training + Groq interview + hard-locked GitHub export. Proof-of-learning in the README.</p>
            </div>
          </li>
          <li class="eng-item">
            <div class="eng-dot gold"></div>
            <div class="eng-content">
              <h4>ISEF Research</h4>
              <span>Target: Sophomore year</span>
              <p>ArXiv replication or domain-applied ML. Targeting Regeneron ISEF.</p>
            </div>
          </li>
        </ul>
      </div>`
    }
  };

  const assetPanel  = document.getElementById('asset-panel');
  const panelLabel  = document.getElementById('panel-label');
  const panelBody   = document.getElementById('panel-body');
  const panelClose  = document.getElementById('panelClose');
  const statusRight = document.getElementById('statusRight');
  const assets      = ['POKEPY', 'RESEARCH', 'SYSTEMS', 'ENGINEERING'];
  let currentAsset  = 'POKEPY';

  function openPanel(asset) {
    currentAsset = asset;
    if (statusRight) statusRight.textContent = asset;
    if (panelLabel) panelLabel.textContent  = ASSET_CONTENT[asset].label;
    if (panelBody) panelBody.innerHTML     = ASSET_CONTENT[asset].html;
    if (assetPanel) assetPanel.classList.add('open');
    document.querySelectorAll('.nav-items a').forEach(a => {
      a.classList.toggle('active', a.dataset.asset === asset);
    });
  }

  if (panelClose) panelClose.addEventListener('click', () => assetPanel.classList.remove('open'));
  if (statusRight) statusRight.addEventListener('click', () => openPanel(currentAsset));

  // ── Nav Menu Control ────────────────────────────────────────────────────
  const menuIcon      = document.getElementById('menuIcon');
  const navDrawer     = document.getElementById('nav-drawer');
  const drawerBackdrop= document.getElementById('drawer-backdrop');

  if (menuIcon && navDrawer && drawerBackdrop) {
    menuIcon.addEventListener('click', () => {
      const open = navDrawer.classList.toggle('open');
      drawerBackdrop.classList.toggle('open', open);
      menuIcon.classList.toggle('open', open);
    });
    drawerBackdrop.addEventListener('click', () => {
      navDrawer.classList.remove('open');
      drawerBackdrop.classList.remove('open');
      menuIcon.classList.remove('open');
    });
  }

  document.querySelectorAll('.nav-items a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openPanel(a.dataset.asset);
      if (navDrawer) {
        navDrawer.classList.remove('open');
        if (drawerBackdrop) drawerBackdrop.classList.remove('open');
        if (menuIcon) menuIcon.classList.remove('open');
      }
    });
  });

  // ============================================================================
  // HIGH-ISOLATION P5 LOADER ENGINE
  // ============================================================================
  const loaderSketch = (p) => {
    let chars = "01XW_K@#$§&%BMAHIQ5E7924";
    let internalFrames = 0;
    const maxDuration = 180;
    const sizeGrid = 16;

    p.setup = () => {
      const cc = document.getElementById('canvas-container');
      const w = cc ? cc.clientWidth : 400;
      const h = cc ? cc.clientHeight : 400;
      
      let instanceCanvas = p.createCanvas(w, h);
      instanceCanvas.parent('canvas-container');
      p.frameRate(60);
      p.textAlign(p.CENTER, p.CENTER);
    };

    p.windowResized = () => {
      const cc = document.getElementById('canvas-container');
      if (cc) p.resizeCanvas(cc.clientWidth, cc.clientHeight);
    };

    p.draw = () => {
      p.background(10, 10, 12);
      internalFrames++;

      let cycle = Math.floor(internalFrames / 30) % 4; 

      for (let x = 0; x < p.width; x += sizeGrid) {
        for (let y = 0; y < p.height; y += sizeGrid) {
          let dx = x - p.width / 2;
          let dy = y - p.height / 2;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let noiseVal = p.noise(x * 0.05, y * 0.05, internalFrames * 0.1);
          let radiusLimit = 120 + Math.sin(internalFrames * 0.1) * 20;

          if (distance < radiusLimit && noiseVal > 0.3) {
            p.push();
            p.translate(x + sizeGrid/2, y + sizeGrid/2);

            if (cycle === 0) {
              p.fill(200, 190, 195); p.noStroke(); p.rectMode(p.CENTER);
              p.rect(0, 0, sizeGrid - 2, sizeGrid - 2);
            } else if (cycle === 1) {
              let charIndex = Math.floor(noiseVal * chars.length) % chars.length;
              p.fill(243, 244, 246); p.textSize(14); p.textFont('JetBrains Mono');
              p.text(chars[charIndex], 0, 0);
            } else if (cycle === 2) {
              p.fill(255); p.noStroke();
              let dotSize = p.map(distance, 0, radiusLimit, 12, 2);
              p.ellipse(0, 0, dotSize, dotSize);
            } else if (cycle === 3) {
              p.fill(147, 51, 234, 150); p.stroke(243, 244, 246); p.strokeWeight(1);
              p.line(-sizeGrid/2, 0, sizeGrid/2, 0);
            }
            p.pop();
          }
        }
      }

      if (internalFrames >= maxDuration) {
        p.noLoop();
        const overlay = document.getElementById('loader-overlay');
        const content = document.getElementById('portfolio-content');
        if (overlay && content) {
          overlay.classList.add('fade-out');
          content.style.opacity = '1';
          content.classList.add('visible');
        }
      }
    };
  };

  const targetP5Engine = window.p5 || p5;
  if (targetP5Engine) {
    new targetP5Engine(loaderSketch);
  }
});