PROJECT: Retro ML Portfolio (Anay)

Build a fully custom portfolio website for a machine learning and systems engineering student named Anay.

The site must feel:

retro-futuristic but minimal
computational but human
cinematic in the loader, extremely clean in the UI
lowercase everywhere
NOT a generic developer portfolio, AI startup site, or dashboard UI
1. TECH SETUP
Stack
React or Next.js (preferred: Next.js)
Tailwind CSS
Framer Motion
Rules
Keep performance lightweight
Avoid unnecessary libraries
Use reusable components
Keep animations subtle and intentional
2. DESIGN SYSTEM
Colors
background: #001219
primary text: #E9D8A6
accent: #0A9396
highlight: #EE9B00
optional warning: #AE2012
Typography
loader/system text: monospace (terminal-like)
UI + content: clean sans-serif (Inter / Geist / Satoshi)
ALL TEXT MUST BE LOWERCASE
3. LOADER SYSTEM (0.0s – 7.5s)
Goal

Cinematic identity transformation → latent system state → handoff into hero.

Phase 1 — Identity Input (0.0s – 1.8s)
full screen background (#001219)
cursor appears slightly left of center
types:

hi, i'm anay

Typing rules:

"hi," is fast
small pause after comma
"i'm anay" slower and intentional
natural human timing, slightly imperfect

Styles:

text: #E9D8A6
cursor: solid block #EE9B00
Phase 2 — Silent Awareness (1.8s – 2.8s)
text remains static
cursor blinks steadily
no new UI or motion

Meaning:
system has registered input

Phase 3 — Decomposition (2.8s – 4.2s)
cursor disappears
letters detach from baseline
characters become floating glyph particles
drift outward slowly (no explosion)

Rules:

smooth motion only
slight fade (~100% → ~80%)
no UI formation yet

Meaning:
identity becomes raw computational data

Phase 4 — Latent Field Formation (4.2s – 7.5s)
faint grid appears in background (#0A9396 at very low opacity)
particles drift and slowly settle toward edges
subtle clustering behavior appears

Final state:

everything slows down
cursor returns

Text appears:

system stabilized.

then quickly replaced with:

awaiting interaction.

fade out into stillness

4. HERO STATE (RESIDUAL SYSTEM)
Core idea:

The loader does NOT transition into a new page.

It simply stops evolving.

Hero Content

Centered text:

hi, i'm anay

Style:

lowercase
clean sans-serif
warm cream (#E9D8A6)
Subtitle (optional)

Very low opacity:

systems · ml · optimization

Background
minimal dark field (#001219)
optional faint grid or noise texture
no particles
no complex animation
Navigation Entry

Top-right:

menu

Style:

minimal text or pill button
subtle hover effect
5. MENU / DRAWER SYSTEM
Interaction

Clicking "menu":

opens a right-side drawer
smooth Framer Motion slide-in
subtle dark overlay on background
Drawer Style
background: #E9D8A6 (cream)
text: dark (#001219 / black variant)
clean contrast inversion
minimal design
Close Button

Top-right inside drawer:

(x)

simple, minimal, clickable

6. MENU CONTENT STRUCTURE

Four sections:

about
projects
future
contact

Clicking each one:

swaps content inside drawer
smooth fade/slide transition
ABOUT

i really enjoy working on the underlying infrastructure of software and figuring out how to make systems run faster and cleaner. my curiosity about how computers handle massive workloads eventually led me straight into machine learning. instead of just using existing models, i like to look under the hood to focus on building things that are efficient, predictable, and stable from the ground up.

right now, i am focusing on architectural efficiency and trying to understand exactly how data flows through deep neural networks.

currently exploring: subquadratic attention scaling, optimizing tensor math, and finding hardware bottlenecks.

PROJECTS

fern.ai
built a mobile app that acts as an ai powered hospital bill auditor. extracts medical codes from bills, validates them with cms data using rag, flags incorrect charges, and generates dispute letters.

pokepy
built a language model from scratch using numpy to understand weight initialization, activation stability, and gradient flow without frameworks.

FUTURE

focused on building reliable and efficient ML systems instead of chasing trends.

algorithmic efficiency: sparse attention from scratch in pytorch (up to 2048 tokens)

hardware profiling: analyzing masking layers for real compute vs memory savings

mechanistic interpretability: extracting and visualizing internal activation states

CONTACT

if you are working on something similar or want to talk about systems and optimization, feel free to reach out.

email: anay.shekhar10@gmail.com
github: github.com/AnayShekhar
linkedin: linkedin.com/in/AnayShekhar

DRAWER FOOTER

simple footer with:

email link
github link
linkedin link

minimal styling, always visible at bottom of drawer

7. GLOBAL DESIGN RULES
keep everything minimal and intentional
avoid over-animation
no neon cyberpunk aesthetic
no dashboard UI
no cluttered layouts
prioritize spacing and typography
everything should feel like a “quiet computational system”
8. CORE EXPERIENCE GOAL

The website should feel like:

a machine that briefly processed identity, then became quiet again.

loader = transformation
hero = residue
menu = access layer