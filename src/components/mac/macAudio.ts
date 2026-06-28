// Web Audio only — no audio files. Every oscillator / noise node is created
// fresh per event and disconnected on `ended` so nothing leaks. Master gain 0.7.
// The context is created lazily and resumed on the first user gesture.

type Ctx = AudioContext;

export interface MacAudio {
  unlock: () => void;
  startHum: () => void;
  fadeOutHum: (ms: number) => void;
  click: () => void; // terminal keypress
  glitch: () => void; // corruption burst
  chime: () => void; // black → cream flash
  modernKey: () => void; // modern (HTML) typing
  dispose: () => void;
}

export function createMacAudio(): MacAudio {
  let ctx: Ctx | null = null;
  let master: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let hum: { osc: OscillatorNode; gain: GainNode } | null = null;

  function ensure(): Ctx | null {
    if (typeof window === "undefined") return null;
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.7;
      master.connect(ctx.destination);

      // 1s of white noise, reused by every burst
      const len = ctx.sampleRate;
      noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  // one-shot tone (sine) with a quick attack / exp decay
  function tone(freq: number, gain: number, attackMs: number, decayMs: number) {
    const c = ensure();
    if (!c || !master) return;
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attackMs / 1000);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (attackMs + decayMs) / 1000);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    const end = t + (attackMs + decayMs) / 1000 + 0.02;
    osc.stop(end);
    osc.onended = () => {
      osc.disconnect();
      g.disconnect();
    };
  }

  // one-shot filtered noise burst
  function burst(
    gain: number,
    decayMs: number,
    opts: { highpass?: number; rate?: number } = {},
  ) {
    const c = ensure();
    if (!c || !master || !noiseBuffer) return;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    if (opts.rate) src.playbackRate.value = opts.rate;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.001); // 1ms attack
    g.gain.exponentialRampToValueAtTime(0.0001, t + decayMs / 1000);

    let hp: BiquadFilterNode | null = null;
    if (opts.highpass) {
      hp = c.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = opts.highpass;
      src.connect(hp);
      hp.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(master);
    src.start(t);
    const end = t + decayMs / 1000 + 0.02;
    src.stop(end);
    src.onended = () => {
      src.disconnect();
      hp?.disconnect();
      g.disconnect();
    };
  }

  return {
    unlock: () => {
      ensure();
    },

    // continuous 60hz CRT hum, faded in
    startHum: () => {
      const c = ensure();
      if (!c || !master || hum) return;
      const osc = c.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 60;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.linearRampToValueAtTime(0.03, c.currentTime + 0.4);
      osc.connect(g);
      g.connect(master);
      osc.start();
      hum = { osc, gain: g };
    },

    fadeOutHum: (ms: number) => {
      const c = ctx;
      if (!c || !hum) return;
      const { osc, gain } = hum;
      hum = null;
      const t = c.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
      gain.gain.linearRampToValueAtTime(0.0001, t + ms / 1000);
      osc.stop(t + ms / 1000 + 0.05);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    },

    // sharp high-passed click, ±10% pitch
    click: () =>
      burst(0.04, 30, { highpass: 3000, rate: 1 + (Math.random() * 0.2 - 0.1) }),

    // electrical interference
    glitch: () => burst(0.08, 80),

    // clean system chime
    chime: () => tone(880, 0.06, 5, 200),

    // soft modern keystroke, ±15% pitch
    modernKey: () => tone(600 * (1 + (Math.random() * 0.3 - 0.15)), 0.025, 2, 60),

    dispose: () => {
      try {
        hum?.osc.stop();
      } catch {
        // already stopped
      }
      hum = null;
      void ctx?.close();
      ctx = null;
      master = null;
      noiseBuffer = null;
    },
  };
}
