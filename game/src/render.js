// render.js - menggambar seluruh adegan Warung Kilat: latar dapur, stasiun,
// papan pesanan, HUD, partikel, teks melayang, dan layar-layar overlay.
import { W, H, COLORS as C, DISHES, COOKERS, DAYS, MAX_HEARTS, COOK_TIME, WARN_TIME, BURN_TIME } from './config.js';
import { stations, center } from './world.js';
import { hintFor, plateProgress } from './cooking.js';
import { drawItem, drawChef, drawHeart, roundRect as rr } from './art.js';

const FULL = Math.PI * 2;
const TYPEFACE = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';
let backdrop = null;

// Teks tebal dengan bayangan gelap opsional.
function label(c, s, x, y, size, color = C.text, align = 'center', shade = true) {
  c.font = `bold ${size}px ${TYPEFACE}`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  if (shade) {
    c.lineJoin = 'round';
    c.lineWidth = Math.max(3, size / 5);
    c.strokeStyle = 'rgba(30,12,4,0.8)';
    c.strokeText(s, x, y);
  }
  c.fillStyle = color;
  c.fillText(s, x, y);
}

// Persegi bersudut membulat yang diisi dan (opsional) diberi garis tepi.
function box(c, x, y, w, h, r, fill, stroke, lw = 3) {
  rr(c, x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = lw;
    c.stroke();
  }
}

function dot(c, x, y, r, fill) {
  c.beginPath();
  c.arc(x, y, r, 0, FULL);
  c.fillStyle = fill;
  c.fill();
}

// Panah kecil ke kanan untuk resep di tiket pesanan.
function pointer(c, x, y, col) {
  const pts = [[-7, -3], [2, -3], [2, -7], [9, 0], [2, 7], [2, 3], [-7, 3]];
  c.beginPath();
  pts.forEach(([px, py], i) => (i ? c.lineTo(x + px, y + py) : c.moveTo(x + px, y + py)));
  c.closePath();
  c.fillStyle = col;
  c.fill();
}

// ---------- latar (digambar sekali ke kanvas offscreen) ----------
function paintWall(c) {
  for (let i = 0; i < W / 64; i++) {
    c.fillStyle = i % 2 ? '#7a492b' : '#6b3e24';
    c.fillRect(i * 64, 0, 64, 184);
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(i * 64, 0, 3, 184);
  }
  c.fillStyle = '#8a5a30';
  c.fillRect(0, 180, W, H - 180);
}

function paintFloor(c) {
  const shades = ['#c88e53', '#bf8549', '#cf9759'];
  let row = 0;
  for (let y = 184; y < H; y += 34, row++) {
    let col = 0;
    for (let x = -(row % 2) * 90; x < W; x += 180, col++) {
      c.fillStyle = shades[(row + col) % 3];
      c.fillRect(x + 1, y, 178, 32);
      c.fillStyle = 'rgba(255,255,255,0.06)';
      c.fillRect(x + 1, y, 178, 3);
    }
  }
}

function paintAwning(c) {
  for (let i = 0; i < W / 40; i++) {
    const col = i % 2 ? '#fff3df' : '#d9402f';
    box(c, i * 40, 168, 40, 14, 0, col);
    c.beginPath();
    c.arc(i * 40 + 20, 182, 20, 0, Math.PI);
    c.fillStyle = col;
    c.fill();
  }
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.fillRect(0, 196, W, 4);
}

function paintFooter(c) {
  box(c, -10, 660, W + 20, 70, 0, '#6a3c1a');
  box(c, -10, 660, W + 20, 24, 0, '#b8723a');
  c.fillStyle = 'rgba(255,255,255,0.15)';
  c.fillRect(0, 660, W, 3);
  label(c, 'WARUNG KILAT  -  MASAKAN RUMAHAN', W / 2, 700, 22, '#ffe2a8');
  for (const px of [70, 1210]) {
    box(c, px - 16, 636, 32, 28, 6, '#a0522d', '#5a2a10', 2);
    for (const [dx, dy, r] of [[-8, -10, 11], [8, -12, 12], [0, -20, 12]]) dot(c, px + dx, 636 + dy, r, '#3f9a45');
  }
  for (const px of [330, 560, 790, 1010]) {
    dot(c, px, 672, 14, '#f4ecd8');
    dot(c, px, 672, 9, '#d96a2a');
  }
}

function paintVignette(c) {
  const v = c.createRadialGradient(W / 2, H / 2, 250, W / 2, H / 2, 820);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(20,6,0,0.4)');
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
}

function makeBackdrop() {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const c = cv.getContext('2d');
  paintWall(c);
  paintFloor(c);
  paintAwning(c);
  paintFooter(c);
  paintVignette(c);
  return cv;
}

// ---------- stasiun ----------
// Cincin progres di atas stasiun masak.
function dial(c, x, y, frac, color, mark) {
  dot(c, x, y, 21, 'rgba(25,10,4,0.85)');
  c.lineWidth = 7;
  c.strokeStyle = 'rgba(255,255,255,0.18)';
  c.beginPath();
  c.arc(x, y, 14, 0, FULL);
  c.stroke();
  c.strokeStyle = color;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + FULL * Math.max(0.02, frac));
  c.stroke();
  c.lineCap = 'butt';
  if (mark) label(c, mark, x, y + 1, 18, color, 'center', false);
}

function paintWok(c, x, y) {
  box(c, x + 30, y - 6, 48, 10, 5, '#6b3f22', '#3a2010', 2);
  dot(c, x, y, 42, '#101012');
  dot(c, x, y, 37, '#2b2b30');
  dot(c, x, y, 31, '#3a3a40');
}

function paintPot(c, x, y, t) {
  box(c, x - 52, y - 6, 12, 10, 4, '#7b838c', '#3a3f45', 2);
  box(c, x + 40, y - 6, 12, 10, 4, '#7b838c', '#3a3f45', 2);
  dot(c, x, y, 42, '#7f8890');
  dot(c, x, y, 37, '#b9c1c9');
  dot(c, x, y, 31, '#6fa9cf');
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 2;
  for (const r of [10, 19]) {
    c.beginPath();
    c.arc(x, y, r + Math.sin(t * 3) * 1.5, 0.3, 2.4);
    c.stroke();
  }
}

function paintGrill(c, s, st, t) {
  box(c, s.x + 14, s.y + 8, s.w - 28, s.h - 36, 8, '#1f1f23', '#0a0a0c', 2);
  const heat = 0.55 + Math.sin(t * 5) * 0.12 + (st.phase === 'cooking' ? 0.25 : 0);
  box(c, s.x + 20, s.y + 14, s.w - 40, s.h - 48, 6, `rgba(255,${100 + Math.floor(heat * 60)},20,${heat})`);
  c.strokeStyle = '#74747c';
  c.lineWidth = 3;
  for (let gx = s.x + 28; gx < s.x + s.w - 20; gx += 16) {
    c.beginPath();
    c.moveTo(gx, s.y + 12);
    c.lineTo(gx, s.y + s.h - 26);
    c.stroke();
  }
}

function paintCooker(c, s, g) {
  const st = g.kitchen.cook[s.id];
  const ctr = center(s);
  const x = ctr.x + (s.cook === 'wajan' ? -8 : 0);
  const y = ctr.y - 8;
  if (s.cook === 'wajan') paintWok(c, x, y);
  else if (s.cook === 'panci') paintPot(c, x, y, g.t);
  else paintGrill(c, s, st, g.t);
  const spread = (ids, scale) => ids.forEach((id, i) => drawItem(c, id, x + (i - (ids.length - 1) / 2) * 30, y, scale));
  if (st.phase === 'burnt') drawItem(c, 'burnt', x, y, 1.1, false);
  else if (st.phase === 'done') drawItem(c, st.dish, x, y, 1.15, false);
  else if (st.phase === 'cooking') {
    const p = Math.min(1, st.t / COOK_TIME);
    c.globalAlpha = 1 - p;
    spread(st.items, 0.8);
    c.globalAlpha = p;
    drawItem(c, st.dish, x, y, 1.15, false);
    c.globalAlpha = 1;
  } else spread(st.items, 0.8);
  const rx = ctr.x;
  const ry = s.y - 26;
  if (st.phase === 'cooking') {
    dial(c, rx, ry, Math.min(1, st.t / COOK_TIME), '#ffb02e', null);
  } else if (st.phase === 'done') {
    const safe = 1 - st.t / BURN_TIME;
    const blink = st.t > WARN_TIME && Math.floor(g.t * 6) % 2 === 0;
    dial(c, rx, ry, safe, blink ? C.bad : st.t > WARN_TIME ? C.warn : C.good, blink ? '!' : 'OK');
  } else if (st.phase === 'burnt') dial(c, rx, ry, 1, C.bad, '!');
}

function paintPlate(c, s, g) {
  const p = g.kitchen.plate[s.id];
  const ctr = center(s);
  const cx = ctr.x;
  const cy = ctr.y - 8;
  if (p.dish) {
    const pulse = 0.35 + Math.sin(g.t * 5) * 0.12;
    const glow = c.createRadialGradient(cx, cy, 10, cx, cy, 58);
    glow.addColorStop(0, `rgba(255,226,110,${pulse + 0.2})`);
    glow.addColorStop(1, 'rgba(255,226,110,0)');
    c.fillStyle = glow;
    c.fillRect(cx - 60, cy - 60, 120, 120);
    drawItem(c, p.dish, cx, cy, 1.25, true);
    box(c, cx - 34, s.y - 34, 68, 24, 12, '#2f9d4a', '#0f4a1d', 2);
    label(c, 'SIAP!', cx, s.y - 22, 17, '#fff', 'center', false);
    return;
  }
  drawItem(c, 'plate_empty', cx, cy, 1.25, true);
  p.items.forEach((id, i) => drawItem(c, id, cx + (i - (p.items.length - 1) / 2) * 34, cy, 0.8));
  if (p.items.length) {
    const [have, need] = plateProgress(p.items);
    box(c, cx - 40, s.y - 34, 80, 24, 12, '#e8a020', '#6a4208', 2);
    label(c, `Rakit ${have}/${need}`, cx, s.y - 22, 16, '#fff', 'center', false);
  }
}

function paintBin(c, s) {
  const ctr = center(s);
  box(c, s.x + 10, s.y + 7, s.w - 20, s.h - 33, 8, '#8f592c', '#5a3416', 2);
  c.strokeStyle = 'rgba(0,0,0,0.18)';
  c.lineWidth = 2;
  for (const dy of [22, 40]) {
    c.beginPath();
    c.moveTo(s.x + 12, s.y + dy);
    c.lineTo(s.x + s.w - 12, s.y + dy);
    c.stroke();
  }
  drawItem(c, s.item, ctr.x, ctr.y - 12, 0.95);
}

function paintServe(c, s, g) {
  const ctr = center(s);
  dot(c, s.x + 36, ctr.y - 8, 17, '#f0c040');
  dot(c, s.x + 36, ctr.y - 8, 7, '#fff0a0');
  c.fillStyle = '#7a5a10';
  c.fillRect(s.x + 24, ctr.y + 6, 24, 5);
  for (let i = 0; i < 3; i++) {
    const px = s.x + 110 + i * 80;
    dot(c, px, ctr.y - 8, 27, '#f6e2b4');
    dot(c, px, ctr.y - 8, 20, '#ecd098');
  }
  if (g.flash > 0) box(c, s.x, s.y, s.w, s.h, 12, `rgba(255,240,150,${g.flash})`);
}

function paintTrash(c, s) {
  const ctr = center(s);
  box(c, ctr.x - 26, ctr.y - 30, 52, 52, 8, '#8d9298', '#4a4d52', 3);
  box(c, ctr.x - 33, ctr.y - 38, 66, 13, 5, '#a9aeb4', '#4a4d52', 3);
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = 3;
  for (const dx of [-12, 0, 12]) {
    c.beginPath();
    c.moveTo(ctr.x + dx, ctr.y - 18);
    c.lineTo(ctr.x + dx, ctr.y + 14);
    c.stroke();
  }
}

const TOP_COLORS = { bin: '#dca46a', serve: '#e3ad6e', cook: '#4a4a50', plate: '#ead2a0', trash: '#6f7075' };

function paintCounter(c, s, g) {
  const ctr = center(s);
  box(c, s.x + 5, s.y + 9, s.w, s.h, 12, 'rgba(0,0,0,0.3)');
  box(c, s.x, s.y, s.w, s.h, 12, '#6b3a18');
  box(c, s.x, s.y, s.w, s.h - 17, 12, TOP_COLORS[s.type], 'rgba(255,255,255,0.28)', 2);
  if (s.type === 'bin') paintBin(c, s);
  else if (s.type === 'cook') paintCooker(c, s, g);
  else if (s.type === 'plate') paintPlate(c, s, g);
  else if (s.type === 'serve') paintServe(c, s, g);
  else paintTrash(c, s);
  label(c, s.label, ctr.x, s.y + s.h - 8, s.type === 'serve' ? 22 : 17, '#fff6e3');
}

function paintHint(c, s, txt) {
  const ctr = center(s);
  const y = s.y < 300 ? s.y + s.h + 24 : s.y - 52;
  c.font = `bold 20px ${TYPEFACE}`;
  const w = c.measureText(txt).width + 54;
  const left = ctr.x - w / 2;
  box(c, left, y - 16, w, 32, 16, 'rgba(255,248,232,0.96)', '#c99a5a', 3);
  box(c, left + 7, y - 10, 26, 20, 6, '#e8a020');
  label(c, 'E', left + 20, y, 15, '#fff', 'center', false);
  label(c, txt, left + 40, y + 1, 20, C.ink, 'left', false);
}

// ---------- papan pesanan ----------
export function ticketRect(i) {
  return { x: 22 + i * 249, y: 74, w: 240, h: 88 };
}

function paintTicket(c, g, i) {
  const r = ticketRect(i);
  const o = g.orders[i];
  if (!o) {
    c.setLineDash([8, 8]);
    rr(c, r.x, r.y, r.w, r.h, 10);
    c.strokeStyle = 'rgba(243,239,224,0.25)';
    c.lineWidth = 3;
    c.stroke();
    c.setLineDash([]);
    return;
  }
  const frac = o.left / o.max;
  const urgent = frac < 0.25;
  const grow = o.age < 0.25 ? 0.7 + o.age * 1.2 : 1;
  const wobble = urgent ? Math.sin(g.t * 40) * 1.5 : 0;
  c.save();
  c.translate(r.x + r.w / 2 + wobble, r.y + r.h / 2);
  c.scale(grow, grow);
  c.translate(-r.w / 2, -r.h / 2);
  const border = urgent && Math.floor(g.t * 5) % 2 ? C.bad : '#d1b27a';
  box(c, 0, 0, r.w, r.h, 10, '#fff1d0', border, 3);
  dot(c, 14, 10, 5, '#d9402f');
  const dish = DISHES[o.dish];
  drawItem(c, o.dish, 42, 38, 0.95, true);
  label(c, dish.name, 84, 22, 22, C.ink, 'left', false);
  dish.raw.forEach((id, k) => drawItem(c, id, 98 + k * 26, 50, 0.4));
  const after = 98 + dish.raw.length * 26;
  pointer(c, after + 2, 50, '#8a5a2b');
  label(c, dish.cook ? COOKERS[dish.cook] : 'Piring', after + 16, 50, 15, '#7a5230', 'left', false);
  const barColor = frac > 0.6 ? C.good : frac > 0.3 ? C.warn : C.bad;
  box(c, 10, r.h - 17, r.w - 20, 11, 5, '#d9c397', '#8a6a3a', 2);
  if (frac > 0.01) {
    const fill = urgent && Math.floor(g.t * 8) % 2 ? '#ff9a8a' : barColor;
    box(c, 10, r.h - 17, (r.w - 20) * frac, 11, 5, fill);
  }
  c.restore();
}

function paintOrders(c, g) {
  box(c, 14, 60, W - 28, 116, 14, '#8a5a2b', '#4a2c10', 4);
  box(c, 22, 68, W - 44, 100, 10, '#1d3a2f');
  for (let i = 0; i < 5; i++) paintTicket(c, g, i);
}

// ---------- HUD ----------
function meter(c, caption, value, x, tint = C.text, size = 28) {
  label(c, caption, x, 15, 13, C.dim, 'left', false);
  label(c, value, x, 40, size, tint, 'left');
}

function paintHud(c, g) {
  box(c, -10, -10, W + 20, 68, 14, C.hud);
  meter(c, 'HARI', `${g.day}/${DAYS.length}`, 24);
  meter(c, 'SKOR', String(g.score), 170);
  dot(c, 372, 40, 13, '#f0b820');
  dot(c, 372, 40, 8, '#ffd95a');
  meter(c, 'KOIN', String(g.coins), 394);
  const hot = g.combo >= 2;
  const zoom = 1 + Math.max(0, g.comboPulse || 0) * 0.5;
  meter(c, 'KOMBO', 'x' + g.combo, 530, hot ? '#ff9d2e' : C.text, hot ? 28 * zoom : 28);
  if (hot) {
    const mult = Math.min(1 + 0.25 * (g.combo - 1), 2.5);
    label(c, 'poin x' + mult.toFixed(2).replace(/\.?0+$/, ''), 600, 40, 15, C.gold, 'left', false);
  }
  const frac = Math.max(0, g.timeLeft / DAYS[g.day - 1].duration);
  label(c, 'WAKTU HARI', 706, 15, 13, C.dim, 'left', false);
  box(c, 706, 27, 300, 25, 12, '#2a1608', '#d89a4b', 2);
  const low = g.timeLeft < 20;
  const fill = frac > 0.3 ? C.good : frac > 0.15 ? C.warn : C.bad;
  box(c, 709, 30, Math.max(0, 294 * frac), 19, 9, low && Math.floor(g.t * 4) % 2 ? '#ff9a8a' : fill);
  label(c, `${Math.ceil(Math.max(0, g.timeLeft))} dtk`, 856, 40, 20, '#fff');
  for (let i = 0; i < MAX_HEARTS; i++) drawHeart(c, 1062 + i * 40, 36, 1.35, i < g.hearts ? '#ff4d5e' : '#4a3a3a');
  label(c, g.muted ? 'SUARA MATI (M)' : 'SUARA (M)', 1250, 40, 15, g.muted ? C.bad : C.dim, 'right', false);
}

// ---------- partikel dan teks melayang ----------
export function addBurst(g, x, y, kind, n = 1) {
  const rng = g.rng;
  for (let i = 0; i < n; i++) {
    if (kind === 'spark') {
      g.particles.push({ kind, x, y, vx: rng.range(-130, 130), vy: rng.range(-170, -30), grav: 320, life: 0, max: rng.range(0.6, 0.95), size: rng.range(3, 6), color: rng.pick(['#ffe27a', '#fff6c0', '#ffb02e']) });
    } else if (kind === 'smoke') {
      g.particles.push({ kind, x, y, vx: rng.range(-8, 8), vy: rng.range(-40, -20), grav: 0, life: 0, max: rng.range(1.1, 1.7), size: rng.range(7, 12), color: '60,60,64' });
    } else {
      g.particles.push({ kind: 'steam', x, y, vx: rng.range(-10, 10), vy: rng.range(-62, -34), grav: 0, life: 0, max: rng.range(0.9, 1.5), size: rng.range(6, 11), color: '255,255,255' });
    }
  }
}

export function addFloater(g, x, y, str, color, size = 24) {
  g.floaters.push({ x, y, str, color, size, life: 0, max: 1.5 });
}

export function updateFx(g, dt) {
  for (let i = g.particles.length - 1; i >= 0; i--) {
    const p = g.particles[i];
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += p.grav * dt;
    if (p.life >= p.max) g.particles.splice(i, 1);
  }
  for (let i = g.floaters.length - 1; i >= 0; i--) {
    const f = g.floaters[i];
    f.life += dt;
    f.y -= 34 * dt;
    if (f.life >= f.max) g.floaters.splice(i, 1);
  }
  g.flash = Math.max(0, g.flash - dt);
  g.shake = Math.max(0, g.shake - dt);
  g.comboPulse = Math.max(0, (g.comboPulse || 0) - dt);
}

function paintEffects(c, g) {
  for (const p of g.particles) {
    const k = p.life / p.max;
    if (p.kind === 'spark') {
      c.globalAlpha = 1 - k;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.life * 6);
      c.fillStyle = p.color;
      c.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      c.restore();
    } else {
      const strength = (p.kind === 'smoke' ? 0.55 : 0.5) * (1 - k);
      c.fillStyle = `rgba(${p.color},${strength})`;
      c.beginPath();
      c.arc(p.x, p.y, p.size * (1 + k * 1.4), 0, FULL);
      c.fill();
    }
  }
  c.globalAlpha = 1;
  for (const f of g.floaters) {
    c.globalAlpha = Math.min(1, (f.max - f.life) / 0.45);
    const grow = f.life < 0.15 ? 0.7 + f.life * 2 : 1;
    label(c, f.str, f.x, f.y, f.size * grow, f.color);
  }
  c.globalAlpha = 1;
}

// ---------- layar overlay ----------
function veil(c, a = 0.62) {
  c.fillStyle = `rgba(15,6,2,${a})`;
  c.fillRect(0, 0, W, H);
}

function card(c, x, y, w, h) {
  box(c, x, y, w, h, 24, 'rgba(38,19,9,0.95)', '#d89a4b', 6);
}

function blinkPrompt(c, g, str, y) {
  c.globalAlpha = 0.65 + Math.sin(g.t * 5) * 0.35;
  label(c, str, W / 2, y, 30, C.gold);
  c.globalAlpha = 1;
}

function paintTitle(c, g) {
  veil(c, 0.6);
  label(c, 'WARUNG KILAT', W / 2, 110, 104, C.gold);
  label(c, 'Masak cepat ala warung Indonesia', W / 2, 184, 30, '#ffe7b8');
  card(c, 250, 226, 780, 296);
  label(c, 'CARA MAIN', W / 2, 256, 26, '#ffb02e');
  const lines = [
    'WASD / Panah = jalan     E / Spasi = ambil, taruh, sajikan',
    'Klik stasiun = jalan ke sana dan langsung beraksi',
    'Bahan > masak > piring > Meja Saji sebelum sabar habis',
    'Angkat makanan tepat waktu. Kalau gosong, buang ke Sampah!',
    'Sajikan berturut-turut tanpa salah untuk KOMBO.   P = jeda   M = suara',
  ];
  lines.forEach((line, i) => label(c, line, W / 2, 298 + i * 40, 21, C.text, 'center', false));
  label(c, 'Skor terbaik: ' + g.best, W / 2, 500, 24, C.gold);
  Object.keys(DISHES).forEach((key, i) => {
    const x = 400 + i * 160;
    drawItem(c, key, x, 584, 0.95);
    label(c, DISHES[key].name, x, 626, 17, C.text);
  });
  blinkPrompt(c, g, 'Tekan ENTER atau klik untuk mulai', 668);
}

function paintPaused(c, g) {
  veil(c, 0.65);
  label(c, 'JEDA', W / 2, 290, 110, C.gold);
  label(c, 'Tekan P untuk lanjut', W / 2, 400, 34, C.text);
  label(c, 'Esc = kembali ke layar judul', W / 2, 450, 22, C.dim);
}

function paintDayDone(c, g) {
  veil(c, 0.62);
  card(c, 330, 120, 620, 480);
  label(c, `HARI ${g.day} SELESAI!`, W / 2, 178, 54, C.gold);
  const start = g.dayStart;
  const stats = [
    ['Disajikan', String(g.served - start.served)],
    ['Pesanan hangus', String(g.lost - start.lost)],
    ['Skor hari ini', '+' + (g.score - start.score)],
    ['Koin didapat', '+' + (g.coins - start.coins)],
    ['Kombo terbaik', 'x' + g.bestCombo],
  ];
  stats.forEach(([a, b], i) => {
    label(c, a, 390, 258 + i * 46, 26, C.text, 'left', false);
    label(c, b, 890, 258 + i * 46, 28, C.gold, 'right', false);
  });
  for (let i = 0; i < MAX_HEARTS; i++) drawHeart(c, 590 + i * 50, 500, 1.6, i < g.hearts ? '#ff4d5e' : '#4a3a3a');
  label(c, 'Menu baru besok: ' + DAYS[g.day].news, W / 2, 548, 22, '#ffb02e');
  blinkPrompt(c, g, `ENTER untuk Hari ${g.day + 1}`, 636);
}

function paintGameOver(c, g) {
  veil(c, 0.68);
  card(c, 310, 100, 660, 520);
  label(c, g.won ? 'SELAMAT! 3 HARI TAMAT' : 'GAME OVER', W / 2, 160, g.won ? 46 : 62, g.won ? C.gold : C.bad);
  label(c, 'SKOR AKHIR', W / 2, 232, 24, C.dim);
  label(c, String(g.score), W / 2, 296, 84, '#fff');
  label(c, 'Skor terbaik: ' + g.best, W / 2, 364, 30, C.gold);
  if (g.newBest) label(c, 'REKOR BARU!', W / 2, 408, 28, '#ff9d2e');
  label(c, `Disajikan ${g.served}   Hangus ${g.lost}   Kombo terbaik x${g.bestCombo}   Koin ${g.coins}`, W / 2, 462, 21, C.text, 'center', false);
  for (let i = 0; i < MAX_HEARTS; i++) drawHeart(c, 590 + i * 50, 520, 1.6, i < g.hearts ? '#ff4d5e' : '#4a3a3a');
  blinkPrompt(c, g, 'Tekan ENTER atau klik untuk main lagi', 584);
}

// ---------- adegan utama ----------
// Spanduk pengumuman di awal hari: nomor hari + menu hari itu, memudar
// selama beberapa detik pertama. Hanya muncul saat bermain langsung.
function paintDayBanner(c, g) {
  if (g.dayBanner <= 0 || g.state !== 'playing') return;
  const fade = Math.min(1, g.dayBanner);
  const cx = W / 2;
  const top = 296;
  c.save();
  c.globalAlpha = fade;
  c.fillStyle = 'rgba(30,16,8,0.88)';
  rr(c, cx - 260, top, 520, 92, 18);
  c.fill();
  c.strokeStyle = '#ffd54a';
  c.lineWidth = 3;
  c.stroke();
  c.fillStyle = '#ffd54a';
  c.font = `bold 34px ${TYPEFACE}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(`HARI ${g.day}`, cx, top + 26);
  c.fillStyle = '#fff6e3';
  c.font = `bold 20px ${TYPEFACE}`;
  c.fillText(`Menu hari ini: ${g.dayNews}`, cx, top + 64);
  c.restore();
}

export function draw(c, g) {
  if (!backdrop) backdrop = makeBackdrop();
  c.save();
  if (g.shake > 0) c.translate(Math.sin(g.t * 90) * g.shake * 14, Math.cos(g.t * 70) * g.shake * 10);
  c.drawImage(backdrop, 0, 0);
  for (const s of stations) paintCounter(c, s, g);
  drawChef(c, g.player, g.t, g.held);
  paintOrders(c, g);
  if (g.state === 'playing' && g.hover) {
    const s = g.hover;
    const glow = 0.65 + Math.sin(g.t * 8) * 0.3;
    rr(c, s.x - 4, s.y - 4, s.w + 8, s.h + 8, 15);
    c.strokeStyle = `rgba(255,255,255,${glow})`;
    c.lineWidth = 4;
    c.stroke();
    const tip = hintFor(g, s);
    if (tip) paintHint(c, s, tip);
  }
  paintEffects(c, g);
  paintHud(c, g);
  c.restore();
  paintDayBanner(c, g);
  if (g.state === 'title') paintTitle(c, g);
  else if (g.state === 'paused') paintPaused(c, g);
  else if (g.state === 'dayComplete') paintDayDone(c, g);
  else if (g.state === 'gameOver') paintGameOver(c, g);
}
