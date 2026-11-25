// main.js — bootstrap, game loop, dan state machine (title, playing, paused, dayComplete, gameOver).
import { W, H, DAYS, MAX_HEARTS, BEST_KEY } from './config.js';
import { makeRng } from './random.js';
import { createInput } from './input.js';
import { createPlayer, movePlayer, nearestStation, standPoint, floorPoint, rectDist, SPEED, REACH, stations } from './world.js';
import { resetOrders, updateOrders } from './orders.js';
import { createKitchen, updateKitchen, interact } from './cooking.js';
import { draw, addFloater, addBurst, updateFx, ticketRect } from './render.js';
import * as audio from './audio.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || (Date.now() & 0x7fffffff);

function readBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch (e) {
    return 0;
  }
}

function writeBest(value) {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch (e) {
    /* penyimpanan tidak tersedia, abaikan */
  }
}

function newGame() {
  const g = {
    state: 'title', frozen: false, t: 0, rng: makeRng(seed), best: readBest(), muted: false,
    day: 1, timeLeft: 0, score: 0, coins: 0, hearts: MAX_HEARTS, combo: 0, bestCombo: 0, served: 0, lost: 0,
    won: false, newBest: false, held: null, hover: null, orders: [], particles: [], floaters: [],
    flash: 0, shake: 0, comboPulse: 0, dayStart: { score: 0, coins: 0, served: 0, lost: 0 },
    player: createPlayer(), kitchen: createKitchen(), nextOrderIn: 1, orderSeq: 0,
  };
  g.fx = {
    sfx: (n) => audio.play(n),
    say: (x, y, s, col, size) => addFloater(g, x, y, s, col, size),
    burst: (x, y, k, n) => addBurst(g, x, y, k, n),
  };
  return g;
}

const game = newGame();

function beginDay(n) {
  game.day = n;
  game.timeLeft = DAYS[n - 1].duration;
  game.combo = 0;
  game.held = null;
  game.kitchen = createKitchen();
  game.player = createPlayer();
  game.particles = [];
  game.floaters = [];
  game.dayStart = { score: game.score, coins: game.coins, served: game.served, lost: game.lost };
  resetOrders(game);
  game.state = 'playing';
  audio.play('start');
}

function beginRun() {
  Object.assign(game, { score: 0, coins: 0, hearts: MAX_HEARTS, bestCombo: 0, served: 0, lost: 0, won: false, newBest: false });
  beginDay(1);
}

function finishRun(won) {
  game.won = won;
  game.orders = [];
  game.newBest = game.score > game.best;
  if (game.newBest) {
    game.best = game.score;
    writeBest(game.score);
  }
  game.state = 'gameOver';
  audio.play(won ? 'dayend' : 'over');
}

function closeDay() {
  game.orders = [];
  game.held = null;
  if (game.day >= DAYS.length) finishRun(true);
  else {
    game.state = 'dayComplete';
    audio.play('dayend');
  }
}

function touchStation(s) {
  if (s) interact(game, s);
}

function reachTarget() {
  const p = game.player;
  const t = p.target;
  p.target = null;
  p.stuck = 0;
  p.moving = false;
  if (t && t.station && rectDist(p.x, p.y, t.station) <= REACH + 6) {
    game.hover = t.station;
    touchStation(t.station);
  }
}

function stepPlayer(dt) {
  const p = game.player;
  const dir = input.axis();
  let mx = dir.x;
  let my = dir.y;
  let budget = SPEED * dt;
  if (mx || my) {
    p.target = null;
  } else if (p.target) {
    const dest = p.target;
    const ex = dest.x - p.x;
    const ey = dest.y - p.y;
    const dist = Math.hypot(ex, ey);
    const close = dest.station ? rectDist(p.x, p.y, dest.station) <= 25 : dist < 4;
    if (close) {
      reachTarget();
      return;
    }
    mx = ex / dist;
    my = ey / dist;
    budget = Math.min(budget, dist);
  }
  if (!mx && !my) {
    p.moving = false;
    return;
  }
  p.dx = mx;
  p.dy = my;
  if (Math.abs(mx) > 0.2) p.face = mx > 0 ? 1 : -1;
  const moved = movePlayer(p, mx * budget, my * budget);
  p.moving = moved > 0.05;
  if (p.target) {
    p.stuck = moved < budget * 0.3 ? p.stuck + dt : 0;
    if (p.stuck > 0.5) reachTarget();
  }
}

function step(dt) {
  game.timeLeft -= dt;
  stepPlayer(dt);
  updateOrders(game, dt, (o, i) => {
    const r = ticketRect(i);
    game.fx.say(r.x + r.w / 2, r.y + r.h + 16, 'Pesanan hangus! -1 hati', '#ff8a7a', 22);
    game.fx.sfx('fail');
    game.shake = 0.3;
  });
  updateKitchen(game, dt);
  game.hover = nearestStation(game.player);
  if (game.hearts <= 0) finishRun(false);
  else if (game.timeLeft <= 0) closeDay();
}

function advance() {
  if (game.frozen) return;
  if (game.state === 'title' || game.state === 'gameOver') beginRun();
  else if (game.state === 'dayComplete') beginDay(game.day + 1);
  else if (game.state === 'paused') game.state = 'playing';
}

const input = createInput(canvas, {
  gesture: () => audio.init(),
  interact: () => {
    if (game.frozen) return;
    if (game.state === 'playing') touchStation(nearestStation(game.player));
    else advance();
  },
  confirm: advance,
  pause: () => {
    if (game.frozen) return;
    if (game.state === 'playing') game.state = 'paused';
    else if (game.state === 'paused') game.state = 'playing';
  },
  mute: () => {
    game.muted = audio.toggleMute();
  },
  back: () => {
    if (!game.frozen && game.state === 'paused') game.state = 'title';
  },
  click: (x, y) => {
    if (game.frozen) return;
    if (game.state !== 'playing') {
      advance();
      return;
    }
    const hit = stations.find((s) => x >= s.x - 6 && x <= s.x + s.w + 6 && y >= s.y - 6 && y <= s.y + s.h + 6);
    game.player.stuck = 0;
    if (hit) {
      const sp = standPoint(hit, game.player);
      game.player.target = { x: sp.x, y: sp.y, station: hit };
    } else {
      const fp = floorPoint(x, y);
      game.player.target = { x: fp.x, y: fp.y, station: null };
    }
  },
});

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = Math.floor(W * scale) + 'px';
  canvas.style.height = Math.floor(H * scale) + 'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'playing' && !game.frozen) game.state = 'paused';
});

const shot = params.get('shot');
if (shot) applyShot(game, shot);

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) {
    game.t += dt;
    if (game.state === 'playing') step(dt);
    updateFx(game, game.state === 'paused' ? 0 : dt);
  }
  draw(ctx, game);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
