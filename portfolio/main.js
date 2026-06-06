// ============================================================================
// P5.JS LOADER SKETCH — extended multi-phase loader
// ============================================================================
const loaderSketch = (p) => {
    let chars = ["0", "1"];
    let hexChars = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
    let mathSymbols = ["∇","∂","Σ","∫","λ","α","β","σ","μ","π","∞","⊗","⊕"];
    let frameCount = 0;
    const duration = 330; // total loader frames (≈11 s at 30 fps)

    // Phase boundaries (frame numbers)
    // 0–49   → phase 0: binary rain columns
    // 50–99  → phase 1: original pixel squares
    // 100–149→ phase 2: hex characters (original chars phase)
    // 150–199→ phase 3: math symbols, expanding radius
    // 200–249→ phase 4: original dot phase
    // 250–299→ phase 5: scanline sweep
    // 300–329→ phase 6: original line phase + fade-to-white pulse

    // Binary rain state
    let rainDrops = [];
    const GRID = 16;

    p.setup = () => {
        const cc = document.getElementById("canvas-container");
        p.createCanvas(cc.clientWidth, cc.clientHeight).parent("canvas-container");
        p.background(10, 10, 12);
        p.textFont("JetBrains Mono");
        p.textAlign(p.CENTER, p.CENTER);
        p.frameRate(30);

        // init rain columns
        const cols = Math.ceil(p.width / GRID);
        for (let i = 0; i < cols; i++) {
            rainDrops.push({
                x: i * GRID + GRID / 2,
                y: p.random(-p.height, 0),
                speed: p.random(2, 6),
                len: Math.floor(p.random(5, 20)),
                chars: []
            });
            for (let j = 0; j < 25; j++) rainDrops[i].chars.push(chars[Math.floor(p.random(2))]);
        }
    };

    p.windowResized = () => {
        const cc = document.getElementById("canvas-container");
        p.resizeCanvas(cc.clientWidth, cc.clientHeight);
        p.background(10, 10, 12);
    };

    p.draw = () => {
        frameCount++;
        const phase = getPhase(frameCount);

        // ─── PHASE 0: Binary rain (0-49) ─────────────────────────────────────
        if (phase === 0) {
            p.background(10, 10, 12, 200);
            p.textSize(GRID - 2);
            for (let drop of rainDrops) {
                drop.y += drop.speed;
                if (drop.y > p.height + drop.len * GRID) drop.y = -drop.len * GRID;
                for (let j = 0; j < drop.len; j++) {
                    const cy = drop.y - j * GRID;
                    if (cy < 0 || cy > p.height) continue;
                    const alpha = p.map(j, 0, drop.len, 255, 30);
                    if (j === 0) p.fill(200, 255, 200, alpha);
                    else p.fill(30, 180, 60, alpha);
                    p.text(drop.chars[(Math.floor(frameCount * 0.5) + j) % drop.chars.length], drop.x, cy);
                }
            }
            // Overlay label
            _drawLabel("INITIALIZING WEIGHTS", p.width / 2, p.height - 24, "#22c55e", 0.8);
        }

        // ─── PHASE 1: Pixel squares (50-99) ──────────────────────────────────
        else if (phase === 1) {
            p.background(10, 10, 12);
            _drawGridPhase(1);
            _drawLabel("LOADING ARCHITECTURE", p.width / 2, p.height - 24, "#f3f4f6", 0.8);
        }

        // ─── PHASE 2: Hex chars (100-149) ────────────────────────────────────
        else if (phase === 2) {
            p.background(10, 10, 12);
            _drawGridPhaseHex();
            _drawLabel("COMPILING GRADIENTS", p.width / 2, p.height - 24, "#60a5fa", 0.8);
        }

        // ─── PHASE 3: Math symbols, expanding radius (150-199) ───────────────
        else if (phase === 3) {
            p.background(10, 10, 12, 180);
            _drawMathPhase();
            _drawLabel("RUNNING BACKPROP", p.width / 2, p.height - 24, "#d4af37", 0.8);
        }

        // ─── PHASE 4: Dots (200-249) ──────────────────────────────────────────
        else if (phase === 4) {
            p.background(10, 10, 12);
            _drawGridPhase(2);
            _drawLabel("OPTIMIZING PARAMS", p.width / 2, p.height - 24, "#f3f4f6", 0.8);
        }

        // ─── PHASE 5: Scanline sweep (250-299) ───────────────────────────────
        else if (phase === 5) {
            p.background(10, 10, 12, 60);
            _drawScanlinePhase();
            _drawLabel("VERIFYING OUTPUTS", p.width / 2, p.height - 24, "#a78bfa", 0.8);
        }

        // ─── PHASE 6: Lines + bright pulse (300-329) ─────────────────────────
        else if (phase === 6) {
            p.background(10, 10, 12);
            _drawGridPhase(3);
            const t = p.map(frameCount, 300, duration, 0, 1);
            p.fill(255, 255, 255, t * 180);
            p.noStroke();
            p.ellipse(p.width / 2, p.height / 2, t * 600, t * 600);
            _drawLabel("READY", p.width / 2, p.height - 24, "#ffffff", 0.9 + t * 0.1);
        }

        if (frameCount >= duration) {
            p.noLoop();
            const overlay = document.getElementById("loader-overlay");
            const content = document.getElementById("portfolio-content");
            if (overlay && content) {
                overlay.classList.add("fade-out");
                content.style.opacity = "1";
                content.classList.add("visible");
            }
        }
    };

    function getPhase(f) {
        if (f < 50)  return 0;
        if (f < 100) return 1;
        if (f < 150) return 2;
        if (f < 200) return 3;
        if (f < 250) return 4;
        if (f < 300) return 5;
        return 6;
    }

    function _drawLabel(text, x, y, col, alpha) {
        p.push();
        p.fill(col);
        p.noStroke();
        p.textSize(11);
        p.textAlign(p.CENTER, p.CENTER);
        p.globalAlpha = alpha;
        p.text(text, x, y);
        p.pop();
    }

    // Original pixel squares / dots / lines
    function _drawGridPhase(cycle) {
        for (let x = 0; x < p.width; x += GRID) {
            for (let y = 0; y < p.height; y += GRID) {
                const dx = x - p.width / 2;
                const dy = y - p.height / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const noiseVal = p.noise(x * 0.05, y * 0.05, p.frameCount * 0.1);
                const radiusLimit = 120 + Math.sin(p.frameCount * 0.1) * 20;
                if (distance < radiusLimit && noiseVal > 0.3) {
                    p.push();
                    p.translate(x + GRID / 2, y + GRID / 2);
                    if (cycle === 1) {
                        p.fill(200, 190, 195);
                        p.noStroke();
                        p.rectMode(p.CENTER);
                        p.rect(0, 0, GRID - 2, GRID - 2);
                    } else if (cycle === 2) {
                        p.fill(255);
                        p.noStroke();
                        const dotSize = p.map(distance, 0, radiusLimit, 12, 2);
                        p.ellipse(0, 0, dotSize, dotSize);
                    } else if (cycle === 3) {
                        p.fill(147, 51, 234, 150);
                        p.stroke(243, 244, 246);
                        p.strokeWeight(1);
                        p.line(-GRID / 2, 0, GRID / 2, 0);
                    }
                    p.pop();
                }
            }
        }
    }

    function _drawGridPhaseHex() {
        for (let x = 0; x < p.width; x += GRID) {
            for (let y = 0; y < p.height; y += GRID) {
                const dx = x - p.width / 2;
                const dy = y - p.height / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const noiseVal = p.noise(x * 0.05, y * 0.05, p.frameCount * 0.1);
                const radiusLimit = 130 + Math.sin(p.frameCount * 0.08) * 25;
                if (distance < radiusLimit && noiseVal > 0.28) {
                    p.push();
                    p.translate(x + GRID / 2, y + GRID / 2);
                    const charIndex = Math.floor(noiseVal * hexChars.length) % hexChars.length;
                    const brightness = p.map(distance, 0, radiusLimit, 255, 80);
                    p.fill(60, 165, 250, brightness);
                    p.textSize(12);
                    p.noStroke();
                    p.text(hexChars[charIndex], 0, 0);
                    p.pop();
                }
            }
        }
    }

    function _drawMathPhase() {
        const t = frameCount - 150;
        const radiusLimit = 80 + t * 1.4 + Math.sin(frameCount * 0.12) * 15;
        for (let x = 0; x < p.width; x += GRID) {
            for (let y = 0; y < p.height; y += GRID) {
                const dx = x - p.width / 2;
                const dy = y - p.height / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const noiseVal = p.noise(x * 0.06, y * 0.06, frameCount * 0.08);
                if (distance < radiusLimit && noiseVal > 0.32) {
                    p.push();
                    p.translate(x + GRID / 2, y + GRID / 2);
                    const charIndex = Math.floor((noiseVal + frameCount * 0.01) * mathSymbols.length) % mathSymbols.length;
                    const alpha = p.map(distance, 0, radiusLimit, 240, 60);
                    p.fill(212, 175, 55, alpha);
                    p.textSize(13);
                    p.noStroke();
                    p.text(mathSymbols[charIndex], 0, 0);
                    p.pop();
                }
            }
        }
    }

    function _drawScanlinePhase() {
        const t = frameCount - 250;
        const scanY = p.map(t, 0, 50, 0, p.height);
        // Grid fill below scanline
        for (let x = 0; x < p.width; x += GRID) {
            for (let y = 0; y < Math.min(scanY, p.height); y += GRID) {
                const noiseVal = p.noise(x * 0.07, y * 0.07, frameCount * 0.05);
                if (noiseVal > 0.35) {
                    p.push();
                    p.translate(x + GRID / 2, y + GRID / 2);
                    const fade = p.map(y, 0, scanY, 40, 160);
                    p.fill(160, 139, 250, fade);
                    p.textSize(11);
                    p.noStroke();
                    p.text(hexChars[Math.floor(noiseVal * 16)], 0, 0);
                    p.pop();
                }
            }
        }
        // Scanline itself
        p.stroke(160, 139, 250, 200);
        p.strokeWeight(1.5);
        p.line(0, scanY, p.width, scanY);
        p.noStroke();
        // Glow above
        for (let gx = 0; gx < p.width; gx += 4) {
            const a = p.random(80, 180);
            p.fill(160, 139, 250, a);
            p.ellipse(gx, scanY, 2, 2);
        }
    }
};

new p5(loaderSketch);

// ============================================================================
// MAIN APPLICATION LOGIC
// ============================================================================
document.addEventListener("DOMContentLoaded", () => {

    // ── Cursor ──────────────────────────────────────────────────────────────
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetMouseX = window.innerWidth / 2;
    let targetMouseY = window.innerHeight / 2;
    const cursorDot = document.querySelector('.cursor-dot');
    const glowRing  = document.querySelector('.glow-ring');

    document.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX;
        targetMouseY = e.clientY;
        cursorDot.style.left = e.clientX - 4 + 'px';
        cursorDot.style.top  = e.clientY - 4 + 'px';
        cursorDot.classList.add('active');
        glowRing.style.left  = e.clientX - 20 + 'px';
        glowRing.style.top   = e.clientY - 20 + 'px';
        glowRing.classList.add('active');
    });
    document.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('active');
        glowRing.classList.remove('active');
    });

    // ── 3D Particle Engine ──────────────────────────────────────────────────
    const canvas = document.getElementById('mainCanvas');
    const ctx    = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
    function initParticles() {
        particles = [];
        for (let i = 0; i < 1000; i++) {
            const a = Math.random()*Math.PI*2, phi = Math.random()*Math.PI;
            const r = Math.random()*150 + 50;
            particles.push(new Particle(
                r*Math.sin(phi)*Math.cos(a),
                r*Math.sin(phi)*Math.sin(a),
                r*Math.cos(phi)
            ));
        }
    }
    initParticles();

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

    function animate() {
        mouseX += (targetMouseX - mouseX) * 0.1;
        mouseY += (targetMouseY - mouseY) * 0.1;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        time += 0.01;
        rotationX += 0.003 + (mouseX - canvas.width/2)*0.00001;
        rotationY += 0.005 + (mouseY - canvas.height/2)*0.00001;
        morphFactor = 0.5 + 0.5*Math.sin(time*0.5);
        zoomLevel  += (targetZoom - zoomLevel)*0.05;
        const cx = canvas.width/2, cy = canvas.height/2;
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

    // ── Asset Panel Content ─────────────────────────────────────────────────
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
                            <span class="research-status status-completed">HACKTHJ WINNER</span>
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

    // ── Asset panel state ───────────────────────────────────────────────────
    const assetPanel  = document.getElementById('asset-panel');
    const panelLabel  = document.getElementById('panel-label');
    const panelBody   = document.getElementById('panel-body');
    const panelClose  = document.getElementById('panelClose');
    const statusRight = document.getElementById('statusRight');
    const assets      = ['POKEPY', 'RESEARCH', 'SYSTEMS', 'ENGINEERING'];
    let currentAsset  = 'POKEPY';
    let panelOpen     = false;

    function openPanel(asset) {
        currentAsset = asset;
        statusRight.textContent = asset;
        panelLabel.textContent  = ASSET_CONTENT[asset].label;
        panelBody.innerHTML     = ASSET_CONTENT[asset].html;
        assetPanel.classList.add('open');
        panelOpen = true;
        // nav link highlighting
        document.querySelectorAll('.nav-items a').forEach(a => {
            a.classList.toggle('active', a.dataset.asset === asset);
        });
    }

    function closePanel() {
        assetPanel.classList.remove('open');
        panelOpen = false;
    }

    panelClose.addEventListener('click', closePanel);

    // Click on orb → cycle asset + open panel
    canvas.addEventListener('click', (e) => {
        const cx   = canvas.width / 2, cy = canvas.height / 2;
        const dist = Math.sqrt((e.clientX - cx)**2 + (e.clientY - cy)**2);
        if (dist < 300) {
            const idx = (assets.indexOf(currentAsset) + 1) % assets.length;
            openPanel(assets[idx]);
            targetZoom = 1.5;
            setTimeout(() => { targetZoom = 1; }, 300);
        }
    });

    // Status-right label click → open current panel
    statusRight.addEventListener('click', () => {
        openPanel(currentAsset);
    });

    // ── Nav Drawer ──────────────────────────────────────────────────────────
    const menuIcon      = document.getElementById('menuIcon');
    const navDrawer     = document.getElementById('nav-drawer');
    const drawerBackdrop= document.getElementById('drawer-backdrop');
    let drawerOpen      = false;

    function openDrawer() {
        navDrawer.classList.add('open');
        drawerBackdrop.classList.add('open');
        menuIcon.classList.add('open');
        drawerOpen = true;
    }
    function closeDrawer() {
        navDrawer.classList.remove('open');
        drawerBackdrop.classList.remove('open');
        menuIcon.classList.remove('open');
        drawerOpen = false;
    }

    menuIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        drawerOpen ? closeDrawer() : openDrawer();
    });

    drawerBackdrop.addEventListener('click', closeDrawer);

    // Nav drawer links → open panel + close drawer
    document.querySelectorAll('.nav-items a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel(a.dataset.asset);
            closeDrawer();
        });
    });

    // Escape key closes both
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePanel();
            closeDrawer();
        }
    });
});