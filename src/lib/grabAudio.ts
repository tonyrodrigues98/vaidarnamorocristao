// Shared casino-roulette audio engine for the Grab feature.
//
// Why a module-level singleton?
//   iOS Safari requires `AudioContext` to be created and resumed inside a
//   real user-gesture handler. The grab flow does async work (DB call) before
//   the roulette modal mounts, so creating the context inside the modal's
//   effect lands OUTSIDE the gesture and stays in the `suspended` state on
//   iOS — no audio plays. Instead we unlock here synchronously from the
//   button's `onClick` and reuse the same context for ticks + ding.
//
// Web Audio quirks handled:
//   - `webkitAudioContext` fallback for older Safari.
//   - One-shot silent buffer played on first unlock — Safari needs the very
//     first scheduled sound to originate inside the gesture, otherwise later
//     `resume()` calls are ignored.
//   - `StereoPannerNode` is feature-detected; we fall back to plain destination
//     on browsers that don't support it.
//   - Context is never closed automatically; subsequent grabs reuse it.

type AudioCtorLike = typeof AudioContext;

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;
let rumbleBuffer: AudioBuffer | null = null;
let unlocked = false;

// State for the continuous "wheel + ball rolling" bed that plays under the
// ticks. Tracked at module scope so the modal can stop it from cleanup.
let rumbleSource: AudioBufferSourceNode | null = null;
let rumbleGain: GainNode | null = null;
let rumbleFilter: BiquadFilterNode | null = null;

function getCtor(): AudioCtorLike | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: AudioCtorLike })
      .webkitAudioContext ||
    null
  );
}

function getOrCreateCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = getCtor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

function getNoiseBuffer(ac: AudioContext): AudioBuffer {
  if (noiseBuffer) return noiseBuffer;
  const len = Math.floor(ac.sampleRate * 0.08);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

// Pink-ish noise loop (~2s) shaped to feel like a metal ball rolling on a
// wooden wheel. We pre-filter the random data with a simple low-pass IIR so
// the buffer itself sounds warm; runtime `BiquadFilterNode` then modulates
// brightness based on wheel speed. 2s is long enough to mask the loop seam.
function getRumbleBuffer(ac: AudioContext): AudioBuffer {
  if (rumbleBuffer) return rumbleBuffer;
  const len = Math.floor(ac.sampleRate * 2);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  // Voss-McCartney-ish pink noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
    data[i] = pink;
  }
  // Smooth window at both ends so the loop seam is inaudible
  const fade = Math.floor(ac.sampleRate * 0.05);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[i] *= k;
    data[len - 1 - i] *= k;
  }
  rumbleBuffer = buf;
  return buf;
}

/**
 * Start the continuous rolling-ball rumble bed. Safe to call multiple times —
 * subsequent calls are ignored until `stopGrabRumble` runs.
 */
export function startGrabRumble(): void {
  if (rumbleSource) return;
  const ac = getOrCreateCtx();
  if (!ac) return;
  ensureRunning(ac);
  try {
    const src = ac.createBufferSource();
    src.buffer = getRumbleBuffer(ac);
    src.loop = true;

    // Band-shape the noise: low-pass roll + slight resonance peak around
    // 600Hz to evoke the bearing/wood cavity.
    const lp = ac.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    lp.Q.value = 0.7;

    const peak = ac.createBiquadFilter();
    peak.type = "peaking";
    peak.frequency.value = 600;
    peak.gain.value = 6;
    peak.Q.value = 1.2;

    const g = ac.createGain();
    g.gain.value = 0.0001; // start silent; setGrabRumbleSpeed ramps it up

    src.connect(lp).connect(peak).connect(g).connect(ac.destination);
    src.start();

    rumbleSource = src;
    rumbleGain = g;
    rumbleFilter = lp;
  } catch {
    /* noop */
  }
}

/**
 * Drive the rumble's volume + brightness from the current wheel speed (0..1).
 * Called every animation frame by the modal — uses short ramps so the audio
 * tracks visual deceleration smoothly without zipper noise.
 */
export function setGrabRumbleSpeed(speed: number): void {
  const ac = ctx;
  if (!ac || !rumbleGain || !rumbleFilter) return;
  const s = Math.min(1, Math.max(0, speed));
  const now = ac.currentTime;
  // Quadratic curve so the bed fades out hard at the end (matches the
  // "ball dropping into a pocket" feel)
  const targetVol = 0.04 + s * s * 0.22;
  const targetFreq = 500 + s * 1800;
  try {
    rumbleGain.gain.cancelScheduledValues(now);
    rumbleGain.gain.setTargetAtTime(targetVol, now, 0.05);
    rumbleFilter.frequency.cancelScheduledValues(now);
    rumbleFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
  } catch {
    /* noop */
  }
}

/** Fade out + stop the rumble bed. Idempotent. */
export function stopGrabRumble(): void {
  const ac = ctx;
  const src = rumbleSource;
  const g = rumbleGain;
  rumbleSource = null;
  rumbleGain = null;
  rumbleFilter = null;
  if (!ac || !src) return;
  try {
    const now = ac.currentTime;
    if (g) {
      g.gain.cancelScheduledValues(now);
      g.gain.setTargetAtTime(0.0001, now, 0.06);
    }
    src.stop(now + 0.35);
  } catch {
    /* noop */
  }
}

/**
 * Cinematic reveal for a LEGENDARY drop. Layered sustained pad (choir-like
 * stack of detuned saws) + deeper gong-style sub thump + crystalline bell
 * stack. Slightly longer and more dramatic than `playGrabFinalDing`.
 */
export function playGrabLegendaryReveal(): void {
  const ac = getOrCreateCtx();
  if (!ac) return;
  ensureRunning(ac);
  try {
    const now = ac.currentTime;

    // 1) Deep gong sub
    const sub = ac.createOscillator();
    const subGain = ac.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(90, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.9);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.7, now + 0.02);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    sub.connect(subGain).connect(ac.destination);
    sub.start(now);
    sub.stop(now + 1.3);

    // 2) Choir pad — detuned sawtooth stack with lowpass + slow swell
    const padGain = ac.createGain();
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.exponentialRampToValueAtTime(0.18, now + 0.4);
    padGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    const padLp = ac.createBiquadFilter();
    padLp.type = "lowpass";
    padLp.frequency.setValueAtTime(800, now);
    padLp.frequency.linearRampToValueAtTime(2400, now + 1.4);
    padLp.Q.value = 0.8;
    padGain.connect(padLp).connect(ac.destination);
    [261.6, 329.6, 392.0, 523.2].forEach((f, i) => {
      const o1 = ac.createOscillator();
      const o2 = ac.createOscillator();
      o1.type = "sawtooth";
      o2.type = "sawtooth";
      o1.frequency.value = f;
      o2.frequency.value = f * 1.005;
      const g = ac.createGain();
      g.gain.value = 0.18 / (i + 1);
      o1.connect(g);
      o2.connect(g);
      g.connect(padGain);
      o1.start(now);
      o2.start(now);
      o1.stop(now + 2.5);
      o2.stop(now + 2.5);
    });

    // 3) Bell crystal cascade — staggered partials with stereo spread
    const supportsPanner = typeof ac.createStereoPanner === "function";
    const bells = [
      { f: 1046, v: 0.32, pan: -0.4, t: 0.05, dur: 2.0 },
      { f: 1318, v: 0.26, pan: 0.35, t: 0.12, dur: 1.8 },
      { f: 1568, v: 0.22, pan: -0.2, t: 0.2, dur: 1.6 },
      { f: 2093, v: 0.18, pan: 0.5, t: 0.3, dur: 1.4 },
      { f: 2637, v: 0.13, pan: -0.5, t: 0.42, dur: 1.2 },
    ];
    bells.forEach(({ f, v, pan, t, dur }) => {
      const t0 = now + t;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let tail: AudioNode = g;
      if (supportsPanner) {
        const p = ac.createStereoPanner();
        p.pan.value = pan;
        g.connect(p);
        tail = p;
      }
      osc.connect(g);
      tail.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  } catch {
    /* noop */
  }
}

/**
 * Unlock the shared AudioContext from inside a user gesture (e.g. button
 * onClick). Safe to call repeatedly — the first call performs the actual
 * iOS/Safari unlock dance; subsequent calls just resume if suspended.
 */
export function unlockGrabAudio(): void {
  const ac = getOrCreateCtx();
  if (!ac) {
    console.warn("[grabAudio] no AudioContext available");
    return;
  }
  // Always re-resume — iOS Safari can put the context back to "interrupted"
  // after backgrounding or after a phone call without firing any event.
  if (ac.state !== "running") {
    void ac.resume().catch((e) => console.warn("[grabAudio] resume failed", e));
  }
  try {
    // Slightly longer silent buffer (1024 samples ≈ 23ms @ 44.1kHz). Some
    // iOS versions require the unlock buffer to be > 1 sample, otherwise
    // the audio graph is never marked as "started" and later schedules are
    // silently dropped.
    const silent = ac.createBuffer(1, 1024, ac.sampleRate);
    const src = ac.createBufferSource();
    src.buffer = silent;
    src.connect(ac.destination);
    src.start(0);
  } catch (e) {
    console.warn("[grabAudio] silent buffer failed", e);
  }
  if (!unlocked) {
    unlocked = true;
    console.info("[grabAudio] unlocked", { state: ac.state, sampleRate: ac.sampleRate });
  }
}

function ensureRunning(ac: AudioContext) {
  if (ac.state === "suspended") void ac.resume().catch(() => {});
}

/**
 * One roulette tick: short noise transient ("ball on metal fret") plus a
 * triangle body resonance. `pan` (-1..1) biases the L→R sweep so consecutive
 * ticks feel spatially distinct.
 */
export function playGrabTick(speed: number, pan: number = 0): void {
  const ac = getOrCreateCtx();
  if (!ac) return;
  ensureRunning(ac);
  try {
    const now = ac.currentTime;
    const s = Math.min(1, Math.max(0, speed));
    const jitter = 0.85 + Math.random() * 0.3;

    const supportsPanner = typeof ac.createStereoPanner === "function";
    const panner = supportsPanner ? ac.createStereoPanner() : null;
    if (panner) {
      const start = Math.max(-1, Math.min(1, 0.85 + pan * 0.4));
      const end = Math.max(-1, Math.min(1, -0.85 + pan * 0.4));
      panner.pan.setValueAtTime(start, now);
      panner.pan.linearRampToValueAtTime(end, now + 0.07);
      panner.connect(ac.destination);
    }
    const out: AudioNode = panner ?? ac.destination;

    // 1) Noise transient — the bright "tac"
    const noise = ac.createBufferSource();
    noise.buffer = getNoiseBuffer(ac);
    const bp = ac.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = (2200 + s * 2800) * jitter;
    bp.Q.value = 6 + s * 4;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1200;
    const nGain = ac.createGain();
    const nVol = (0.18 + s * 0.32) * jitter;
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.exponentialRampToValueAtTime(nVol, now + 0.0015);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    noise.connect(bp).connect(hp).connect(nGain).connect(out);
    noise.start(now);
    noise.stop(now + 0.05);

    // 2) Body resonance — wooden "tock"
    const body = ac.createOscillator();
    const bodyGain = ac.createGain();
    body.type = "triangle";
    const bodyFreq = (520 + s * 380) * jitter;
    body.frequency.setValueAtTime(bodyFreq * 1.6, now);
    body.frequency.exponentialRampToValueAtTime(bodyFreq, now + 0.012);
    const bVol = 0.06 + s * 0.1;
    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(bVol, now + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    body.connect(bodyGain).connect(out);
    body.start(now);
    body.stop(now + 0.08);
  } catch {
    /* noop */
  }
}

/**
 * Win seal: sub-bass thump + noise splash + stacked bell partials with
 * stereo spread for the shimmer tail.
 */
export function playGrabFinalDing(): void {
  const ac = getOrCreateCtx();
  if (!ac) return;
  ensureRunning(ac);
  try {
    const now = ac.currentTime;

    // 1) Sub-bass BUM
    const sub = ac.createOscillator();
    const subGain = ac.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(120, now);
    sub.frequency.exponentialRampToValueAtTime(38, now + 0.35);
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.exponentialRampToValueAtTime(0.55, now + 0.012);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    sub.connect(subGain).connect(ac.destination);
    sub.start(now);
    sub.stop(now + 0.6);

    // 2) Splash noise
    const noise = ac.createBufferSource();
    noise.buffer = getNoiseBuffer(ac);
    const nbp = ac.createBiquadFilter();
    nbp.type = "bandpass";
    nbp.frequency.value = 3200;
    nbp.Q.value = 1.2;
    const nGain = ac.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.exponentialRampToValueAtTime(0.35, now + 0.005);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    noise.connect(nbp).connect(nGain).connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.2);

    // 3) Bell partials with stereo spread
    const supportsPanner = typeof ac.createStereoPanner === "function";
    const partials = [
      { f: 880, v: 0.32, pan: -0.3, dur: 1.4 },
      { f: 1320, v: 0.24, pan: 0.25, dur: 1.2 },
      { f: 1760, v: 0.2, pan: -0.15, dur: 1.0 },
      { f: 2640, v: 0.12, pan: 0.4, dur: 0.8 },
    ];
    partials.forEach(({ f, v, pan, dur }, i) => {
      const t0 = now + 0.04 + i * 0.025;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      let tail: AudioNode = g;
      if (supportsPanner) {
        const p = ac.createStereoPanner();
        p.pan.value = pan;
        g.connect(p);
        tail = p;
      }
      osc.connect(g);
      tail.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    });
  } catch {
    /* noop */
  }
}