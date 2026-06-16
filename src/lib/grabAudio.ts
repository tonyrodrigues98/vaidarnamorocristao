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
let unlocked = false;

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

/**
 * Unlock the shared AudioContext from inside a user gesture (e.g. button
 * onClick). Safe to call repeatedly — the first call performs the actual
 * iOS/Safari unlock dance; subsequent calls just resume if suspended.
 */
export function unlockGrabAudio(): void {
  const ac = getOrCreateCtx();
  if (!ac) return;
  if (ac.state === "suspended") {
    void ac.resume().catch(() => {});
  }
  if (unlocked) return;
  unlocked = true;
  // iOS Safari: schedule a silent buffer inside this gesture so the audio
  // graph is considered "started" by the OS. Without this, scheduling a
  // sound later (after async work) is silently dropped.
  try {
    const silent = ac.createBuffer(1, 1, 22050);
    const src = ac.createBufferSource();
    src.buffer = silent;
    src.connect(ac.destination);
    src.start(0);
  } catch {
    /* noop */
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