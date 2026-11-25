// audio.js - semua bunyi dibuat dengan WebAudio synth, tanpa file luar.
let ac = null;        // AudioContext, dibuat sekali saat init
let bus = null;       // gain utama yang mengatur mute
let silent = false;   // status mute
let staticBuf = null; // buffer derau putih sepanjang satu detik

export function init() {
  if (ac) {
    if (ac.state === 'suspended') ac.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    bus = ac.createGain();
    bus.gain.value = silent ? 0 : 0.5;
    bus.connect(ac.destination);
  } catch (e) {
    ac = null;
  }
}

export function toggleMute() {
  silent = !silent;
  if (bus) bus.gain.value = silent ? 0 : 0.5;
  return silent;
}

export const isMuted = () => silent;

// Satu nada osilator: frekuensi bisa naik atau turun, volume naik lalu menghilang.
function tone(freq, dur, opt = {}) {
  const start = ac.currentTime + (opt.at || 0);
  const out = ac.createGain();
  const src = ac.createOscillator();
  src.type = opt.w || 'sine';
  src.frequency.setValueAtTime(freq, start);
  if (opt.to) src.frequency.exponentialRampToValueAtTime(opt.to, start + dur);
  out.gain.setValueAtTime(0.0001, start);
  out.gain.exponentialRampToValueAtTime(opt.v || 0.25, start + 0.012);
  out.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(out);
  out.connect(bus);
  src.start(start);
  src.stop(start + dur + 0.03);
}

// Derau putih yang disaring bandpass, untuk desis dan bunyi kasar.
function hiss(dur, opt = {}) {
  if (!staticBuf) {
    staticBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const data = staticBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const start = ac.currentTime + (opt.at || 0);
  const src = ac.createBufferSource();
  src.buffer = staticBuf;
  src.loop = true;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = opt.f || 2000;
  band.Q.value = opt.q || 0.8;
  const out = ac.createGain();
  out.gain.setValueAtTime(opt.v || 0.2, start);
  out.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  src.connect(band);
  band.connect(out);
  out.connect(bus);
  src.start(start);
  src.stop(start + dur + 0.03);
}

// Daftar bunyi: tiap bunyi adalah urutan langkah tone atau noise.
// f = frekuensi, d = durasi, w = bentuk gelombang, to = frekuensi akhir,
// at = jeda sebelum langkah, v = volume, q = lebar filter.
const LIB = {
  take: [{ k: 'tone', f: 520, d: 0.09, w: 'triangle', to: 800 }],
  put: [{ k: 'tone', f: 340, d: 0.08, w: 'triangle', to: 230 }],
  click: [{ k: 'tone', f: 700, d: 0.04, w: 'square', v: 0.07 }],
  sizzle: [{ k: 'noise', d: 0.9, f: 3600, q: 0.7, v: 0.2 }],
  trash: [{ k: 'noise', d: 0.2, f: 700, q: 0.6, v: 0.22 }],
  warn: [{ k: 'tone', f: 1000, d: 0.07, w: 'square', v: 0.09 }],
  ready: [
    { k: 'tone', f: 880, d: 0.1, v: 0.16 },
    { k: 'tone', f: 1320, d: 0.14, at: 0.09, v: 0.14 },
  ],
  ding: [
    { k: 'tone', f: 1175, d: 0.5, v: 0.28 },
    { k: 'tone', f: 1568, d: 0.7, at: 0.12, v: 0.22 },
  ],
  combo: [660, 880, 1100].map((f, i) => ({ k: 'tone', f, d: 0.12, w: 'triangle', at: 0.18 + i * 0.07, v: 0.18 })),
  fail: [{ k: 'tone', f: 210, d: 0.3, w: 'sawtooth', to: 90, v: 0.18 }],
  burn: [
    { k: 'tone', f: 160, d: 0.5, w: 'sawtooth', to: 70, v: 0.2 },
    { k: 'noise', d: 0.5, f: 1200, v: 0.2 },
  ],
  start: [523, 659, 784].map((f, i) => ({ k: 'tone', f, d: 0.14, w: 'triangle', at: i * 0.09, v: 0.2 })),
  dayend: [523, 659, 784, 1047].map((f, i) => ({ k: 'tone', f, d: 0.25, w: 'triangle', at: i * 0.13, v: 0.2 })),
  over: [440, 392, 330, 262].map((f, i) => ({ k: 'tone', f, d: 0.3, w: 'sawtooth', at: i * 0.18, v: 0.12 })),
};

function playSteps(steps) {
  for (const step of steps) {
    if (step.k === 'noise') hiss(step.d, step);
    else tone(step.f, step.d, step);
  }
}

export function play(name) {
  if (!ac || silent) return;
  try {
    const steps = LIB[name];
    if (steps) playSteps(steps);
  } catch (e) {
    /* bunyi tidak boleh membuat game crash */
  }
}
