// orders.js — papan pesanan: pesanan datang, menua, lalu hangus atau tersaji.
import { DAYS } from './config.js';

export function resetOrders(game) {
  game.orders = [];
  game.orderSeq = 0;
  game.nextOrderIn = 0.8;
}

function countDish(orders, dish) {
  let n = 0;
  for (const o of orders) if (o.dish === dish) n += 1;
  return n;
}

// Pilih hidangan untuk pesanan baru, jangan sampai tiga pesanan yang
// sama menumpuk di papan (paling banyak dua yang sama).
function pickDish(game, dayCfg) {
  let dish = game.rng.pick(dayCfg.menu);
  let tries = 0;
  while (tries < 4 && countDish(game.orders, dish) >= 2) {
    dish = game.rng.pick(dayCfg.menu);
    tries += 1;
  }
  return dish;
}

export function spawnOrder(game) {
  const dayCfg = DAYS[game.day - 1];
  if (game.orders.length >= dayCfg.maxOrders) return null;
  const dish = pickDish(game, dayCfg);
  const order = {
    id: ++game.orderSeq,
    dish,
    max: dayCfg.patience,
    left: dayCfg.patience,
    age: 0,
  };
  game.orders.push(order);
  return order;
}

// onExpire(order, index) dipanggil sebelum pesanan dihapus dari papan.
export function updateOrders(game, dt, onExpire) {
  const dayCfg = DAYS[game.day - 1];
  game.nextOrderIn -= dt;
  if (game.nextOrderIn <= 0) {
    if (spawnOrder(game)) game.fx.sfx('click');
    game.nextOrderIn = game.rng.range(dayCfg.gap[0], dayCfg.gap[1]);
  }
  for (let i = game.orders.length - 1; i >= 0; i -= 1) {
    const order = game.orders[i];
    order.age += dt;
    order.left -= dt;
    if (order.left > 0) continue;
    if (onExpire) onExpire(order, i);
    game.orders.splice(i, 1);
    game.hearts -= 1;
    game.combo = 0;
    game.lost += 1;
  }
}

// Ambil pesanan yang cocok dengan hidangan (yang paling mendesak dulu).
export function takeOrderFor(game, dish) {
  let pick = -1;
  for (let i = 0; i < game.orders.length; i += 1) {
    const o = game.orders[i];
    if (o.dish !== dish) continue;
    if (pick < 0 || o.left < game.orders[pick].left) pick = i;
  }
  if (pick < 0) return null;
  const order = game.orders.splice(pick, 1)[0];
  return { order, frac: Math.max(0, order.left / order.max) };
}
