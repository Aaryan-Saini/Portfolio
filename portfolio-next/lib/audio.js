/* ============================================================
   Cinematic audio — fully synthesized with the Web Audio API.
   No asset files: a deep evolving drone, UI ticks, a confirm
   chirp and a reveal whoosh, all generated on the fly.

   Lazy + gesture-safe: nothing is created until enable() is
   called from a user gesture (the loader's SOUND toggle), so it
   never trips browser autoplay policies. Every call is wrapped
   so a missing/!broken AudioContext can never throw into the UI.
   ============================================================ */

let ctx = null;
let master = null;     // final dry bus → destination
let reverb = null;     // convolver (algorithmic space)
let ambient = null;    // ambient drone bus gain
let enabled = false;
let ambientStarted = false;
let bed = false;       // true once the drone has been ducked to its site "bed" level
const listeners = new Set();

/* subscribe to enabled-state changes (keeps the loader + site toggles in sync) */
export function subscribe(fn) {
  listeners.add(fn);
  try { fn(enabled); } catch (e) {}
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((fn) => { try { fn(enabled); } catch (e) {} });
}

function ensure() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(2.8, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    reverb.connect(wet);
    wet.connect(master);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

function impulse(dur, decay) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * dur);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function noiseSource() {
  const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.loop = true;
  return s;
}

// route a source to the dry bus + (optionally) a reverb send
function route(node, wet) {
  node.connect(master);
  if (wet && reverb) {
    const g = ctx.createGain();
    g.gain.value = wet;
    node.connect(g);
    g.connect(reverb);
  }
}

function tone(freq, dur, gain, type, wet) {
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type || "sine";
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    route(g, wet == null ? 0.3 : wet);
    o.start(t);
    o.stop(t + dur + 0.05);
  } catch (e) {}
}

function startAmbient() {
  if (ambientStarted || !ctx) return;
  ambientStarted = true;
  try {
    const t = ctx.currentTime;
    ambient = ctx.createGain();
    ambient.gain.value = 0;
    ambient.gain.linearRampToValueAtTime(bed ? 0.1 : 0.22, t + 4);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    lp.Q.value = 0.7;
    lp.connect(ambient);

    // detuned drone stack (warm, wine-dark chord: A / E / A / C#)
    [55, 82.41, 110, 138.59].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? "sawtooth" : "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 7;
      const g = ctx.createGain();
      g.gain.value = i < 2 ? 0.16 : 0.1;
      o.connect(g);
      g.connect(lp);
      o.start();
    });
    // sub
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = 36.71;
    const sg = ctx.createGain();
    sg.gain.value = 0.28;
    sub.connect(sg);
    sg.connect(lp);
    sub.start();
    // slow filter LFO for movement
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 200;
    lfo.connect(lfoG);
    lfoG.connect(lp.frequency);
    lfo.start();
    // airy noise bed
    const noise = noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 640;
    bp.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.04;
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(lp);
    noise.start();

    route(ambient, 0.6);
  } catch (e) {}
}

/* ---------- public API ---------- */

export function isEnabled() {
  return enabled;
}

export async function enable(on) {
  const c = ensure();
  if (!c) return false;
  try {
    if (c.state === "suspended") await c.resume();
  } catch (e) {}
  enabled = on;
  try {
    const t = c.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.exponentialRampToValueAtTime(on ? 0.62 : 0.0001, t + (on ? 0.9 : 0.5));
  } catch (e) {}
  if (on) {
    startAmbient();
    confirm();
  }
  notify();
  return true;
}

export function toggle() {
  return enable(!enabled);
}

// soft typewriter / counter tick
export function tick(freq, gain) {
  if (!enabled) return;
  tone(freq || 680, 0.05, gain || 0.03, "triangle", 0.2);
}

// completion chime (gentle ascending arpeggio)
export function chime() {
  if (!enabled) return;
  [659.25, 987.77, 1318.5].forEach((f, i) =>
    window.setTimeout(() => tone(f, 0.6, 0.05, "sine", 0.6), i * 110)
  );
}

// hover blip
export function hover() {
  if (!enabled) return;
  tone(1245, 0.04, 0.02, "triangle", 0.25);
}

// enable-confirmation chirp (plays even as sound is switching on)
export function confirm() {
  tone(523.25, 0.12, 0.05, "sine", 0.4);
  window.setTimeout(() => tone(783.99, 0.2, 0.05, "sine", 0.5), 95);
}

// cinematic reveal: filtered-noise whoosh + descending sub boom
export function whoosh() {
  if (!enabled || !ctx) return;
  try {
    const t = ctx.currentTime;
    const noise = noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(280, t);
    bp.frequency.exponentialRampToValueAtTime(3600, t + 0.5);
    bp.frequency.exponentialRampToValueAtTime(200, t + 1.4);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    noise.connect(bp);
    bp.connect(g);
    route(g, 0.85);
    noise.start(t);
    noise.stop(t + 1.6);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(82, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 1.2);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.6, t + 0.1);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    o.connect(og);
    route(og, 0.3);
    o.start(t);
    o.stop(t + 1.5);
  } catch (e) {}
}

// duck the drone to a subtle "bed" at the reveal handoff so the cinematic
// ambience continues quietly into the site (the persistent SOUND toggle in
// the header can still fully mute via enable(false) → master gain).
export function duck() {
  bed = true;
  if (!ambient || !ctx) return;
  try {
    const t = ctx.currentTime;
    ambient.gain.cancelScheduledValues(t);
    ambient.gain.setValueAtTime(Math.max(ambient.gain.value, 0.0001), t);
    ambient.gain.exponentialRampToValueAtTime(0.1, t + 1.6);
  } catch (e) {}
}
