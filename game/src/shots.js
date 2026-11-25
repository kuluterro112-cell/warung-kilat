// shots.js — adegan screenshot deterministik: ?shot=start|play|end (tampilan stabil tanpa interaksi).
import { createKitchen, updateKitchen } from './cooking.js';
import { stationById, createPlayer } from './world.js';
import { updateFx } from './render.js';

function ticket(dish, left, max = 40) {
  return { id: Math.round(left * 10), dish, max, left, age: 5 };
}

function dressKitchen(g) {
  g.kitchen = createKitchen();
  const slots = g.kitchen;
  Object.assign(slots.cook.wajan, { items: ['nasi', 'telur'], phase: 'cooking', dish: 'nasi_goreng', t: 1.8 });
  Object.assign(slots.cook.panci, { items: ['mie', 'ayam'], phase: 'done', dish: 'mie_ayam', t: 1.2 });
  slots.plate.piring1.items = ['teh'];
  slots.plate.piring2.items = ['nasi_goreng'];
  slots.plate.piring2.dish = 'nasi_goreng';
}

// Susun adegan tengah permainan (nilai tetap; hanya partikel memakai RNG seed).
function stageMidGame(g) {
  Object.assign(g, { day: 2, hearts: 3, score: 840, coins: 31, combo: 3, bestCombo: 4, served: 7, lost: 1, timeLeft: 74 });
  g.dayStart = { score: 300, coins: 10, served: 3, lost: 0 };
  g.orders = [ticket('mie_ayam', 33, 44), ticket('nasi_goreng', 24, 44), ticket('es_teh', 15, 44), ticket('nasi_goreng', 8, 44)];
  g.held = { kind: 'ing', id: 'es' };
  g.player = createPlayer();
  Object.assign(g.player, { x: 950, y: 424, dx: 1, dy: 0, face: 1 });
  g.hover = stationById('piring1');
  g.particles = [];
  g.floaters = [];
  dressKitchen(g);
  for (let i = 0; i < 34; i++) {
    updateKitchen(g, 0.05);
    updateFx(g, 0.05);
    g.kitchen.cook.wajan.t = Math.min(g.kitchen.cook.wajan.t, 1.8);
    g.kitchen.cook.panci.t = Math.min(g.kitchen.cook.panci.t, 1.2);
  }
  dressKitchen(g);
  updateFx(g, 0.3);
  g.flash = 0;
}

export function applyShot(g, name) {
  g.frozen = true;
  g.t = 12.4;
  g.muted = false;
  if (name === 'end') {
    Object.assign(g, { state: 'gameOver', day: 3, score: 2180, best: 3420, coins: 74, served: 18, lost: 3, bestCombo: 6, hearts: 0, won: false, newBest: false, orders: [], held: null });
    return;
  }
  stageMidGame(g);
  g.state = name === 'play' ? 'playing' : 'title';
  if (name !== 'play') {
    Object.assign(g, { day: 1, score: 0, coins: 0, combo: 0, timeLeft: 120, orders: [], held: null, hover: null, particles: [], floaters: [], kitchen: createKitchen(), player: createPlayer() });
  }
}
