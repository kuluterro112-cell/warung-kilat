// art.js - gambar bahan, hidangan, dan koki dengan Canvas 2D, tanpa aset luar.
const FULL = Math.PI * 2;

// Elips yang bisa diisi warna, diberi garis tepi, atau keduanya.
function oval(c, cx, cy, rx, ry, fill, edge) {
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, FULL);
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  if (edge) {
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.stroke();
  }
}

// Kotak bersudut membulat, dipakai juga oleh file lain.
export function roundRect(c, x, y, w, h, r) {
  const right = x + w;
  const bottom = y + h;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(right - r, y);
  c.arcTo(right, y, right, bottom, r);
  c.lineTo(right, bottom - r);
  c.arcTo(right, bottom, x, bottom, r);
  c.lineTo(x + r, bottom);
  c.arcTo(x, bottom, x, y, r);
  c.lineTo(x, y + r);
  c.arcTo(x, y, right, y, r);
  c.closePath();
}

// Piring putih di atas bayangan lembut.
function servingPlate(c) {
  oval(c, 1, 9, 31, 19, 'rgba(0,0,0,0.25)');
  oval(c, 0, 5, 30, 20, '#fdfcf8', '#c9c0ae');
  oval(c, 0, 5, 21, 13, '#f0ece2');
}

// Mangkuk biru muda di atas bayangan lembut.
function soupBowl(c) {
  oval(c, 1, 14, 28, 15, 'rgba(0,0,0,0.25)');
  oval(c, 0, 10, 27, 17, '#e9eef2', '#8fa9bd');
  oval(c, 0, 8, 22, 12, '#cfdbe4');
}

// Dua tusuk sate miring, masing-masing berisi empat potong.
function sataySticks(c, meat, rim, glaze) {
  c.save();
  c.rotate(-0.25);
  [-10, 8].forEach((rowY) => {
    c.strokeStyle = '#c9a56a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-28, rowY);
    c.lineTo(30, rowY);
    c.stroke();
    [-16, -4, 8, 20].forEach((colX) => {
      roundRect(c, colX - 6, rowY - 6, 12, 12, 3);
      c.fillStyle = meat;
      c.fill();
      c.strokeStyle = rim;
      c.lineWidth = 1.5;
      c.stroke();
      if (glaze) oval(c, colX, rowY - 2, 4, 2, glaze);
    });
  });
  c.restore();
}

// --- Bahan mentah ---

function paintEmptyPlate(c) {
  servingPlate(c);
}

function paintRice(c) {
  soupBowl(c);
  c.fillStyle = '#fffef6';
  c.beginPath();
  c.ellipse(0, 6, 21, 17, 0, Math.PI, FULL);
  c.closePath();
  c.fill();
  c.strokeStyle = '#d8d2bd';
  c.lineWidth = 1.5;
  c.stroke();
  const grains = [[-8, 0], [2, -6], [9, 1], [-2, 3], [-12, 4]];
  grains.forEach(([gx, gy]) => oval(c, gx, gy, 2.5, 1.4, '#e4dec8'));
}

function paintEgg(c) {
  oval(c, 0, 4, 15, 19, '#f3dfba', '#b9964f');
  oval(c, -5, -4, 3.5, 7, 'rgba(255,255,255,0.7)');
}

// Satu gelombang mie, dipakai tiga kali dengan tinggi berbeda.
function noodleWave(c, y) {
  c.beginPath();
  c.moveTo(-18, y + 6);
  c.quadraticCurveTo(-9, y - 6, 0, y + 6);
  c.quadraticCurveTo(9, y + 18, 18, y + 6);
  c.stroke();
}

function paintNoodles(c) {
  soupBowl(c);
  c.strokeStyle = '#f4cf4e';
  c.lineWidth = 4;
  c.lineCap = 'round';
  [-7, 0, 7].forEach((rowY) => noodleWave(c, rowY));
}

function paintDrumstick(c) {
  c.save();
  c.rotate(-0.6);
  oval(c, -4, -2, 17, 13, '#d4883a', '#8a4f1a');
  oval(c, -9, -6, 7, 3.5, 'rgba(255,230,170,0.65)');
  c.fillStyle = '#f7f1e3';
  c.fillRect(10, -3, 16, 6);
  oval(c, 27, -4, 5, 5, '#f7f1e3');
  oval(c, 27, 4, 5, 5, '#f7f1e3');
  c.restore();
}

function paintRawSatay(c) {
  sataySticks(c, '#f2a6a0', '#c76d68', null);
}

function paintTeaMug(c) {
  roundRect(c, -14, -21, 28, 42, 7);
  c.fillStyle = '#c0651a';
  c.fill();
  c.strokeStyle = '#7a3a0c';
  c.lineWidth = 2;
  c.stroke();
  roundRect(c, -14, -21, 28, 11, 6);
  c.fillStyle = '#e29a44';
  c.fill();
  c.strokeStyle = '#7a3a0c';
  c.lineWidth = 4;
  c.beginPath();
  c.arc(17, 0, 10, -1.2, 1.2);
  c.stroke();
  oval(c, -7, 2, 2.5, 10, 'rgba(255,255,255,0.35)');
}

function paintIce(c) {
  const cubes = [[-10, 5, 0.2], [9, -4, -0.3], [3, 13, 0.5]];
  cubes.forEach(([cx, cy, ang]) => {
    c.save();
    c.translate(cx, cy);
    c.rotate(ang);
    roundRect(c, -10, -10, 20, 20, 5);
    c.fillStyle = 'rgba(205,240,255,0.95)';
    c.fill();
    c.strokeStyle = '#7fc0e4';
    c.lineWidth = 2;
    c.stroke();
    oval(c, -3, -4, 3, 2, 'rgba(255,255,255,0.9)');
    c.restore();
  });
}

// --- Hidangan jadi ---

function paintFriedRice(c, plated) {
  if (plated) servingPlate(c);
  oval(c, 0, 4, 19, 13, '#b87430');
  oval(c, 0, -1, 16, 10, '#d09144');
  const bits = [[-8, -3, '#6fb43f'], [4, -6, '#d94a2a'], [-3, 2, '#7a3e14'], [10, 1, '#6fb43f'], [-12, 3, '#d94a2a']];
  bits.forEach(([bx, by, col]) => oval(c, bx, by, 2.4, 1.8, col));
  oval(c, 8, -6, 10, 7, '#fffdf2', '#dcd3b8');
  oval(c, 9, -7, 3.6, 3.6, '#f2b01e');
  oval(c, -21, 12, 6, 4.5, '#a5d874', '#4f8f2d');
  oval(c, -13, 17, 6, 4.5, '#a5d874', '#4f8f2d');
}

function paintChickenNoodles(c, plated) {
  if (plated) soupBowl(c);
  oval(c, 0, 4, 20, 13, '#f2c94c');
  c.strokeStyle = '#d4a52a';
  c.lineWidth = 2;
  c.lineCap = 'round';
  [-4, 3, 9].forEach((rowY) => {
    c.beginPath();
    c.moveTo(-14, rowY + 3);
    c.quadraticCurveTo(-6, rowY - 4, 1, rowY + 3);
    c.quadraticCurveTo(8, rowY + 9, 15, rowY + 3);
    c.stroke();
  });
  [[-8, -1], [4, -4], [9, 5]].forEach(([cx, cy]) => {
    roundRect(c, cx - 4, cy - 3, 8, 6, 2);
    c.fillStyle = '#8a4f1a';
    c.fill();
  });
  [[-3, 5], [-12, 6], [12, 0], [1, -8]].forEach(([gx, gy]) => oval(c, gx, gy, 2, 1.4, '#4fae3c'));
}

function paintGrilledSatay(c, plated) {
  if (plated) servingPlate(c);
  sataySticks(c, '#a8541d', '#5a2a0a', '#3a1a06');
  oval(c, 15, 15, 9, 5, '#8a5a2b', '#5a3a14');
}

// Jalur tepi gelas, dipakai untuk isi kaca, isi teh, dan garis tepi.
function glassOutline(c) {
  c.beginPath();
  c.moveTo(-15, -26);
  c.lineTo(15, -26);
  c.lineTo(10, 24);
  c.lineTo(-10, 24);
  c.closePath();
}

function paintIcedTea(c) {
  oval(c, 0, 26, 14, 4, 'rgba(0,0,0,0.25)');
  glassOutline(c);
  c.fillStyle = 'rgba(225,243,255,0.4)';
  c.fill();
  c.beginPath();
  c.moveTo(-14, -14);
  c.lineTo(14, -14);
  c.lineTo(10, 23);
  c.lineTo(-10, 23);
  c.closePath();
  c.fillStyle = '#c4741f';
  c.fill();
  [[-5, -8], [5, -2], [-3, 6], [4, 14]].forEach(([ix, iy]) => {
    roundRect(c, ix - 5, iy - 5, 10, 10, 2);
    c.fillStyle = 'rgba(215,244,255,0.85)';
    c.fill();
  });
  c.strokeStyle = '#e8453a';
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(6, -36);
  c.lineTo(9, -2);
  c.stroke();
  glassOutline(c);
  c.strokeStyle = '#9ec3d8';
  c.lineWidth = 2;
  c.stroke();
  oval(c, -15, -24, 8, 8, '#ffe36a', '#d4a91a');
}

function paintBurnt(c) {
  oval(c, 0, 8, 23, 15, '#161616', '#000');
  oval(c, -7, 3, 9, 5, '#303030');
  oval(c, 8, 9, 6, 3, '#262626');
}

// Menggambar satu item berdasarkan id. Hidangan digambar di atas piring
// atau mangkuk bila plated=true, tanpa wadah bila plated=false.
export function drawItem(c, id, x, y, s = 1, plated = true) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  switch (id) {
    case 'plate_empty': paintEmptyPlate(c); break;
    case 'nasi': paintRice(c); break;
    case 'telur': paintEgg(c); break;
    case 'mie': paintNoodles(c); break;
    case 'ayam': paintDrumstick(c); break;
    case 'sate_mentah': paintRawSatay(c); break;
    case 'teh': paintTeaMug(c); break;
    case 'es': paintIce(c); break;
    case 'nasi_goreng': paintFriedRice(c, plated); break;
    case 'mie_ayam': paintChickenNoodles(c, plated); break;
    case 'sate_ayam': paintGrilledSatay(c, plated); break;
    case 'es_teh': paintIcedTea(c); break;
    default: paintBurnt(c);
  }
  c.restore();
}

export function drawHeart(c, x, y, s, fill) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.beginPath();
  c.moveTo(0, 10);
  c.bezierCurveTo(-18, -2, -12, -16, 0, -6);
  c.bezierCurveTo(12, -16, 18, -2, 0, 10);
  c.fillStyle = fill;
  c.fill();
  c.strokeStyle = 'rgba(40,10,5,0.8)';
  c.lineWidth = 2;
  c.stroke();
  c.restore();
}

// --- Koki ---

function chefShadow(c) {
  oval(c, 0, 17, 19, 7, 'rgba(0,0,0,0.3)');
}

function chefTorso(c) {
  oval(c, -18, 6, 5, 8, '#fffaf0', '#cfc4aa');
  oval(c, 18, 6, 5, 8, '#fffaf0', '#cfc4aa');
  roundRect(c, -15, -4, 30, 26, 10);
  c.fillStyle = '#fffaf0';
  c.fill();
  c.strokeStyle = '#cfc4aa';
  c.lineWidth = 2;
  c.stroke();
  roundRect(c, -9, -5, 18, 7, 3);
  c.fillStyle = '#d93f2e';
  c.fill();
}

function chefFace(c, look) {
  oval(c, 0, -13, 12, 12, '#f2c192', '#b98757');
  const shift = look * 2;
  oval(c, -4 + shift, -13, 1.8, 2.4, '#2a1608');
  oval(c, 4 + shift, -13, 1.8, 2.4, '#2a1608');
  c.strokeStyle = '#8a4a2a';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(shift, -8, 3.5, 0.2, Math.PI - 0.2);
  c.stroke();
}

function chefHat(c) {
  oval(c, 0, -26, 13, 7, '#fff', '#d6d0c0');
  oval(c, -8, -30, 7, 7, '#fff', '#d6d0c0');
  oval(c, 8, -30, 7, 7, '#fff', '#d6d0c0');
  oval(c, 0, -34, 8, 7, '#fff', '#d6d0c0');
  roundRect(c, -13, -26, 26, 7, 3);
  c.fillStyle = '#fff';
  c.fill();
  c.strokeStyle = '#d6d0c0';
  c.stroke();
}

// Gelembung di atas kepala koki berisi item yang sedang dipegang.
function heldBubble(c, held) {
  roundRect(c, -34, -108, 68, 58, 14);
  c.fillStyle = 'rgba(255,248,232,0.93)';
  c.fill();
  c.strokeStyle = '#c99a5a';
  c.lineWidth = 3;
  c.stroke();
  let shown = held.id;
  if (held.kind === 'plate') shown = held.dish;
  if (held.kind === 'burnt') shown = 'burnt';
  drawItem(c, shown, 0, -78, 0.78, true);
}

export function drawChef(c, p, t, held) {
  const bob = p.moving ? Math.sin(t * 16) * 1.8 : 0;
  c.save();
  c.translate(p.x, p.y + bob);
  chefShadow(c);
  chefTorso(c);
  chefFace(c, p.face);
  chefHat(c);
  if (held) heldBubble(c, held);
  c.restore();
}
