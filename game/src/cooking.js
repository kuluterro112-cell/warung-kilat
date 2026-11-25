// cooking.js — dapur Warung Kilat: mengambil bahan, memasak, merakit di
// piring, lalu menyajikan ke pelanggan.
import { DISHES, COOK_TIME, WARN_TIME, BURN_TIME } from './config.js';
import { stations, center } from './world.js';
import { takeOrderFor } from './orders.js';

const DISH_IDS = Object.keys(DISHES);

function freshCooker() {
  return { items: [], phase: 'idle', t: 0, dish: null, fx: 0, snd: 0 };
}

export function createKitchen() {
  return {
    cook: {
      wajan: freshCooker(),
      panci: freshCooker(),
      panggangan: freshCooker(),
    },
    plate: {
      piring1: { items: [], dish: null },
      piring2: { items: [], dish: null },
    },
  };
}

// --- pencocokan resep: bahan dicocokkan sebagai multiset, jadi urutan
// memasukkan bahan tidak penting. ---

function tally(list) {
  const bag = {};
  for (const item of list) bag[item] = (bag[item] || 0) + 1;
  return bag;
}

// Benar bila setiap bahan di `need` ada di `have` dalam jumlah yang cukup.
function covers(need, have) {
  const needBag = tally(need);
  const haveBag = tally(have);
  return Object.keys(needBag).every((key) => (haveBag[key] || 0) >= needBag[key]);
}

function sameSet(a, b) {
  return a.length === b.length && covers(a, b);
}

function dishForCooker(cooker, items) {
  return DISH_IDS.find((id) => DISHES[id].cook === cooker && sameSet(items, DISHES[id].raw)) || null;
}

function fitsCooker(cooker, items) {
  return DISH_IDS.some((id) => DISHES[id].cook === cooker && covers(items, DISHES[id].raw));
}

function dishForPlate(items) {
  return DISH_IDS.find((id) => sameSet(items, DISHES[id].plate)) || null;
}

function fitsPlate(items) {
  return DISH_IDS.some((id) => covers(items, DISHES[id].plate));
}

// [terisi, dibutuhkan] untuk lencana "Rakit 1/2" di atas piring.
export function plateProgress(items) {
  const match = DISH_IDS.find((id) => covers(items, DISHES[id].plate));
  const total = match ? DISHES[match].plate.length : items.length;
  return [items.length, total];
}

// --- barang yang dipegang dan pesan penolakan ---

function carriedId(held) {
  if (!held) return null;
  if (held.kind === 'ing' || held.kind === 'dish') return held.id;
  return null;
}

function noteSpot(station) {
  const spot = center(station);
  if (station.y < 300) return { x: spot.x, y: station.y + station.h + 22 };
  return { x: spot.x, y: station.y - 46 };
}

function refuse(game, station, text) {
  const spot = noteSpot(station);
  game.fx.sfx('fail');
  game.fx.say(spot.x, spot.y, text, '#ffb4a8', 20);
  return false;
}

// --- interaksi utama ---

export function interact(game, station) {
  switch (station.type) {
    case 'bin': return takeIngredient(game, station);
    case 'trash': return throwAway(game, station);
    case 'cook': return useCooker(game, station);
    case 'plate': return usePlate(game, station);
    case 'serve': return serveDish(game, station);
    default: return false;
  }
}

function takeIngredient(game, station) {
  if (game.held) return refuse(game, station, 'Tangan penuh');
  game.held = { kind: 'ing', id: station.item };
  game.fx.sfx('take');
  return true;
}

function throwAway(game, station) {
  if (!game.held) return refuse(game, station, 'Tidak ada yang dibuang');
  game.held = null;
  game.fx.sfx('trash');
  const spot = center(station);
  game.fx.say(spot.x, station.y - 30, 'Dibuang', '#d8d8d8', 20);
  return true;
}

// --- alat masak ---

function useCooker(game, station) {
  const cooker = game.kitchen.cook[station.id];
  const held = game.held;
  if (held && held.kind === 'ing') return loadCooker(game, station, cooker);
  if (held) return refuse(game, station, 'Tidak bisa di sini');
  return unloadCooker(game, station, cooker);
}

function loadCooker(game, station, cooker) {
  if (cooker.phase !== 'idle') return refuse(game, station, 'Sedang dipakai');
  if (!fitsCooker(station.cook, cooker.items.concat(game.held.id))) {
    return refuse(game, station, 'Bukan untuk ' + station.label);
  }
  cooker.items.push(game.held.id);
  game.held = null;
  game.fx.sfx('put');
  const dish = dishForCooker(station.cook, cooker.items);
  if (!dish) return true;
  cooker.phase = 'cooking';
  cooker.t = 0;
  cooker.dish = dish;
  const spot = center(station);
  game.fx.sfx('sizzle');
  game.fx.burst(spot.x, spot.y - 12, 'steam', 4);
  return true;
}

function unloadCooker(game, station, cooker) {
  if (cooker.phase === 'done' || cooker.phase === 'burnt') {
    game.held = cooker.phase === 'done'
      ? { kind: 'dish', id: cooker.dish }
      : { kind: 'burnt' };
    Object.assign(cooker, freshCooker());
    game.fx.sfx('take');
    return true;
  }
  if (cooker.phase === 'cooking') return refuse(game, station, 'Tunggu matang...');
  if (cooker.items.length > 0) {
    game.held = { kind: 'ing', id: cooker.items.pop() };
    game.fx.sfx('take');
    return true;
  }
  return refuse(game, station, 'Kosong');
}

// --- piring ---

function usePlate(game, station) {
  const plate = game.kitchen.plate[station.id];
  const held = game.held;
  const id = carriedId(held);
  if (id) return addToPlate(game, station, plate, id);
  if (held && held.kind === 'plate') return setPlateDown(game, station, plate, held);
  if (held) return refuse(game, station, 'Tidak bisa ditaruh');
  return takeFromPlate(game, station, plate);
}

function addToPlate(game, station, plate, id) {
  if (plate.dish) return refuse(game, station, 'Piring sudah penuh');
  const next = plate.items.concat(id);
  if (!fitsPlate(next)) return refuse(game, station, 'Tidak cocok');
  plate.items = next;
  game.held = null;
  game.fx.sfx('put');
  const dish = dishForPlate(next);
  if (!dish) return true;
  plate.dish = dish;
  const spot = center(station);
  game.fx.sfx('ready');
  game.fx.burst(spot.x, spot.y - 10, 'spark', 10);
  return true;
}

function setPlateDown(game, station, plate, held) {
  if (plate.dish || plate.items.length > 0) return refuse(game, station, 'Piring terisi');
  plate.dish = held.dish;
  plate.items = DISHES[held.dish].plate.slice();
  game.held = null;
  game.fx.sfx('put');
  return true;
}

function takeFromPlate(game, station, plate) {
  if (plate.dish) {
    game.held = { kind: 'plate', dish: plate.dish };
    plate.dish = null;
    plate.items = [];
    game.fx.sfx('take');
    return true;
  }
  if (plate.items.length > 0) {
    const last = plate.items.pop();
    game.held = { kind: DISHES[last] ? 'dish' : 'ing', id: last };
    game.fx.sfx('take');
    return true;
  }
  return refuse(game, station, 'Piring kosong');
}

// --- menyajikan ---

function serveDish(game, station) {
  const held = game.held;
  const spot = center(station);
  if (!held || held.kind !== 'plate') return refuse(game, station, 'Bawa piring siap saji');
  game.held = null;
  const found = takeOrderFor(game, held.dish);
  if (!found) {
    game.combo = 0;
    game.shake = 0.3;
    game.fx.sfx('fail');
    game.fx.say(spot.x, station.y + station.h + 22, 'Tidak ada yang pesan!', '#ffb4a8', 24);
    return true;
  }
  return payOut(game, station, held.dish, found.frac);
}

function payOut(game, station, dishId, frac) {
  const dish = DISHES[dishId];
  const spot = center(station);
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.comboPulse = 0.5;
  const mult = Math.min(1 + 0.25 * (game.combo - 1), 2.5);
  const points = Math.round((dish.price * mult) / 5) * 5;
  const tip = Math.round((dish.price * 0.5 * frac) / 5) * 5;
  game.score += points + tip;
  game.coins += Math.max(1, Math.round(dish.price / 25) + Math.round(tip / 20));
  game.served += 1;
  game.flash = 0.5;
  game.fx.sfx('ding');
  if (game.combo >= 2) game.fx.sfx('combo');
  game.fx.say(spot.x - 40, station.y + station.h + 28, '+' + points, '#ffe27a', 38);
  if (tip > 0) game.fx.say(spot.x + 70, station.y + station.h + 20, 'Tip +' + tip, '#9df0a8', 22);
  if (game.combo >= 2) game.fx.say(spot.x, station.y + station.h + 66, 'KOMBO x' + game.combo + '!', '#ff9d2e', 32);
  game.fx.burst(spot.x, station.y + station.h - 10, 'spark', 16);
  return true;
}

// --- timer memasak ---

export function updateKitchen(game, dt) {
  for (const station of stations) {
    if (station.type !== 'cook') continue;
    const cooker = game.kitchen.cook[station.id];
    if (cooker.phase === 'cooking') tickCooking(game, station, cooker, dt);
    else if (cooker.phase === 'done') tickDone(game, station, cooker, dt);
    else if (cooker.phase === 'burnt') tickBurnt(game, station, cooker, dt);
  }
}

function tickCooking(game, station, cooker, dt) {
  const spot = center(station);
  cooker.t += dt;
  cooker.fx -= dt;
  cooker.snd -= dt;
  if (cooker.fx <= 0) {
    cooker.fx = 0.18;
    game.fx.burst(spot.x + game.rng.range(-18, 18), spot.y - 16, 'steam', 1);
  }
  if (cooker.snd <= 0) {
    cooker.snd = 1;
    game.fx.sfx('sizzle');
  }
  if (cooker.t < COOK_TIME) return;
  cooker.phase = 'done';
  cooker.t = 0;
  cooker.snd = 0;
  game.fx.sfx('ready');
  game.fx.burst(spot.x, spot.y - 14, 'spark', 10);
}

function tickDone(game, station, cooker, dt) {
  const spot = center(station);
  cooker.t += dt;
  cooker.fx -= dt;
  cooker.snd -= dt;
  if (cooker.fx <= 0) {
    cooker.fx = 0.24;
    game.fx.burst(spot.x + game.rng.range(-14, 14), spot.y - 18, 'steam', 1);
  }
  if (cooker.t > WARN_TIME && cooker.snd <= 0) {
    cooker.snd = 0.45;
    game.fx.sfx('warn');
  }
  if (cooker.t < BURN_TIME) return;
  cooker.phase = 'burnt';
  cooker.t = 0;
  game.combo = 0;
  game.fx.sfx('burn');
  game.fx.say(spot.x, station.y - 46, 'GOSONG!', '#ff6a5a', 28);
}

function tickBurnt(game, station, cooker, dt) {
  const spot = center(station);
  cooker.fx -= dt;
  if (cooker.fx <= 0) {
    cooker.fx = 0.3;
    game.fx.burst(spot.x + game.rng.range(-14, 14), spot.y - 18, 'smoke', 1);
  }
}

// --- petunjuk aksi untuk stasiun yang sedang disorot ---

export function hintFor(game, station) {
  const held = game.held;
  switch (station.type) {
    case 'bin':
      return held ? null : 'Ambil ' + station.label;
    case 'trash':
      return held ? 'Buang' : null;
    case 'serve':
      return held && held.kind === 'plate' ? 'Sajikan!' : null;
    case 'cook':
      return cookerHint(game, station);
    default:
      return plateHint(game, station);
  }
}

function cookerHint(game, station) {
  const cooker = game.kitchen.cook[station.id];
  const held = game.held;
  if (held && held.kind === 'ing') {
    const fits = cooker.phase === 'idle' && fitsCooker(station.cook, cooker.items.concat(held.id));
    return fits ? 'Masukkan' : null;
  }
  if (held) return null;
  if (cooker.phase === 'done') return 'Angkat!';
  if (cooker.phase === 'burnt') return 'Angkat (gosong)';
  if (cooker.phase === 'cooking') return 'Memasak...';
  return cooker.items.length > 0 ? 'Ambil kembali' : null;
}

function plateHint(game, station) {
  const plate = game.kitchen.plate[station.id];
  const held = game.held;
  const id = carriedId(held);
  if (id) {
    const ok = !plate.dish && fitsPlate(plate.items.concat(id));
    return ok ? 'Taruh di piring' : null;
  }
  if (held && held.kind === 'plate') {
    return !plate.dish && plate.items.length === 0 ? 'Taruh piring' : null;
  }
  if (held) return null;
  if (plate.dish) return 'Ambil piring';
  return plate.items.length > 0 ? 'Ambil kembali' : null;
}
