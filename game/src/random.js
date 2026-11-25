// random.js — generator angka acak ber-seed (deterministik) untuk mode screenshot.
export function makeRng(seed) {
  let state = (seed >>> 0) || 1;

  function unit() {
    state = (state + 0x6d2b79f5) >>> 0;
    let mix = state;
    mix = Math.imul(mix ^ (mix >>> 15), mix | 1);
    mix ^= mix + Math.imul(mix ^ (mix >>> 7), mix | 61);
    return ((mix ^ (mix >>> 14)) >>> 0) / 4294967296;
  }

  function span(lo, hi) {
    return lo + (hi - lo) * unit();
  }

  function whole(lo, hi) {
    return Math.floor(span(lo, hi + 1));
  }

  function choice(items) {
    return items[Math.floor(unit() * items.length)];
  }

  return { next: unit, range: span, int: whole, pick: choice };
}
