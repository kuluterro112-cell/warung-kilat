// world.js — layout dapur, posisi pemain, gerakan, dan tabrakan.
import { W, STATIONS } from './config.js';

export const PLAYER_R = 17;
export const SPEED = 255;
export const REACH = 40;

const LEFT_EDGE = 24;
const RIGHT_EDGE = W - 24;
const TOP_EDGE = 300;
const BOTTOM_EDGE = 640;

export const stations = STATIONS.map((entry) => ({ ...entry }));

const lookup = new Map();
for (const entry of stations) lookup.set(entry.id, entry);

export function stationById(id) {
  return lookup.get(id);
}

export function center(st) {
  return { x: st.x + st.w / 2, y: st.y + st.h / 2 };
}

export function rectDist(px, py, st) {
  const ox = px < st.x ? st.x - px : px > st.x + st.w ? px - (st.x + st.w) : 0;
  const oy = py < st.y ? st.y - py : py > st.y + st.h ? py - (st.y + st.h) : 0;
  return Math.hypot(ox, oy);
}

export function createPlayer() {
  return { x: 600, y: 520, dx: 0, dy: 1, face: 1, moving: false, target: null, stuck: 0 };
}

function hitsWall(x, y) {
  if (x < LEFT_EDGE || x > RIGHT_EDGE || y < TOP_EDGE || y > BOTTOM_EDGE) return true;
  for (const st of stations) {
    if (rectDist(x, y, st) < PLAYER_R) return true;
  }
  return false;
}

// Gerak per sumbu agar pemain meluncur di sepanjang meja. Mengembalikan jarak tempuh.
export function movePlayer(p, mx, my) {
  const fromX = p.x;
  const fromY = p.y;
  if (!hitsWall(p.x + mx, p.y)) p.x += mx;
  if (!hitsWall(p.x, p.y + my)) p.y += my;
  return Math.hypot(p.x - fromX, p.y - fromY);
}

export function nearestStation(p) {
  let pick = null;
  let pickScore = Infinity;
  for (const st of stations) {
    const d = rectDist(p.x, p.y, st);
    if (d > REACH) continue;
    const c = center(st);
    const span = Math.hypot(c.x - p.x, c.y - p.y) || 1;
    const facing = ((c.x - p.x) / span) * p.dx + ((c.y - p.y) / span) * p.dy;
    const score = d - 6 * facing;
    if (score < pickScore) {
      pickScore = score;
      pick = st;
    }
  }
  return pick;
}

// Titik berdiri terdekat di sekitar stasiun (untuk klik-untuk-berjalan).
export function standPoint(st, p) {
  const c = center(st);
  const gap = PLAYER_R + 6;
  const sides = [
    { x: c.x, y: st.y + st.h + gap },
    { x: c.x, y: st.y - gap },
    { x: st.x - gap, y: c.y },
    { x: st.x + st.w + gap, y: c.y },
  ];
  const open = sides.filter((q) => !hitsWall(q.x, q.y));
  const options = open.length > 0 ? open : [sides[0]];
  let best = options[0];
  let bestDist = Math.hypot(best.x - p.x, best.y - p.y);
  for (let i = 1; i < options.length; i++) {
    const d = Math.hypot(options[i].x - p.x, options[i].y - p.y);
    if (d < bestDist) {
      bestDist = d;
      best = options[i];
    }
  }
  return best;
}

export function floorPoint(x, y) {
  const cx = Math.max(LEFT_EDGE, Math.min(RIGHT_EDGE, x));
  const cy = Math.max(TOP_EDGE, Math.min(BOTTOM_EDGE, y));
  return { x: cx, y: cy };
}
