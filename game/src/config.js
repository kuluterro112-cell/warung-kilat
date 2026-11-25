// config.js — angka, warna, menu, dan tata letak Warung Kilat.
// Modul lain membaca nilai di sini secara langsung, jadi angka dan
// nama kuncinya harus tetap seperti ini.

export const W = 1280;
export const H = 720;
export const MAX_HEARTS = 3;

export const COOK_TIME = 3;
export const WARN_TIME = 2.8;
export const BURN_TIME = 4.5;

export const BEST_KEY = 'warungkilat.best';

export const COLORS = {
  text: '#fff6e3',
  dim: '#e9c89a',
  gold: '#ffd54a',
  good: '#5ed26b',
  warn: '#ffc44a',
  bad: '#ff5b4a',
  hud: 'rgba(38,19,9,0.93)',
  ink: '#4a2812',
};

export const ITEMS = {
  nasi: { name: 'Nasi' },
  telur: { name: 'Telur' },
  mie: { name: 'Mie' },
  ayam: { name: 'Ayam' },
  sate_mentah: { name: 'Sate' },
  teh: { name: 'Teh' },
  es: { name: 'Es Batu' },
};

// raw = bahan yang harus dikumpulkan, cook = alat masak yang dipakai
// (null berarti bahannya langsung dirakit di piring), plate = isi
// piring yang membuat hidangan siap disajikan.
export const DISHES = {
  nasi_goreng: {
    name: 'Nasi Goreng',
    price: 100,
    raw: ['nasi', 'telur'],
    cook: 'wajan',
    plate: ['nasi_goreng'],
  },
  mie_ayam: {
    name: 'Mie Ayam',
    price: 120,
    raw: ['mie', 'ayam'],
    cook: 'panci',
    plate: ['mie_ayam'],
  },
  sate_ayam: {
    name: 'Sate Ayam',
    price: 130,
    raw: ['sate_mentah'],
    cook: 'panggangan',
    plate: ['sate_ayam'],
  },
  es_teh: {
    name: 'Es Teh Manis',
    price: 60,
    raw: ['teh', 'es'],
    cook: null,
    plate: ['teh', 'es'],
  },
};

export const COOKERS = {
  wajan: 'Wajan',
  panci: 'Panci',
  panggangan: 'Panggangan',
};

// Menu bertambah tiap hari: hari 2 menambah Mie Ayam, hari 3 Sate Ayam.
const MENU_DAY1 = ['nasi_goreng', 'es_teh'];
const MENU_DAY2 = [...MENU_DAY1, 'mie_ayam'];
const MENU_DAY3 = [...MENU_DAY2, 'sate_ayam'];

export const DAYS = [
  {
    duration: 120,
    gap: [7, 9.5],
    patience: 50,
    maxOrders: 4,
    menu: MENU_DAY1,
    news: 'Nasi Goreng dan Es Teh Manis',
  },
  {
    duration: 120,
    gap: [5.5, 8],
    patience: 44,
    maxOrders: 5,
    menu: MENU_DAY2,
    news: 'Mie Ayam',
  },
  {
    duration: 120,
    gap: [4.5, 7],
    patience: 40,
    maxOrders: 5,
    menu: MENU_DAY3,
    news: 'Sate Ayam',
  },
];

// Tips singkat yang berputar di layar jeda dan layar akhir hari.
export const TIPS = [
  'Sajikan berurutan tanpa salah untuk menaikkan KOMBO.',
  'Angkat masakan tepat waktu — kalau gosong, buang ke Sampah.',
  'Es Teh tidak perlu dimasak, langsung rakit di piring.',
  'Pesanan yang hampir habis waktunya berkedip — dahulukan!',
  'Klik stasiun untuk berjalan ke sana dan langsung beraksi.',
  'Wajan, Panci, dan Panggangan bisa dipakai bersamaan.',
  'Piring yang sudah berisi hidangan siap disajikan ke Meja Saji.',
  'Sabar pelanggan menipis — sajikan sebelum barnya habis.',
];

// Rak bahan di baris atas dapur: tujuh wadah berjajar.
const BIN_DEFS = [
  ['nasi', 'Nasi'],
  ['telur', 'Telur'],
  ['mie', 'Mie'],
  ['ayam', 'Ayam'],
  ['sate_mentah', 'Sate'],
  ['teh', 'Teh'],
  ['es', 'Es Batu'],
];

function makeBin(i, def) {
  const [item, label] = def;
  return {
    id: 'bin_' + item,
    type: 'bin',
    item,
    label,
    x: 24 + i * 127,
    y: 190,
    w: 117,
    h: 92,
  };
}

export const STATIONS = [
  ...BIN_DEFS.map((def, i) => makeBin(i, def)),
  { id: 'serve', type: 'serve', label: 'MEJA SAJI', x: 940, y: 190, w: 316, h: 92 },
  { id: 'wajan', type: 'cook', cook: 'wajan', label: 'Wajan', x: 130, y: 372, w: 160, h: 104 },
  { id: 'panci', type: 'cook', cook: 'panci', label: 'Panci Rebus', x: 420, y: 372, w: 160, h: 104 },
  { id: 'panggangan', type: 'cook', cook: 'panggangan', label: 'Panggangan', x: 700, y: 372, w: 200, h: 104 },
  { id: 'piring1', type: 'plate', label: 'Piring 1', x: 980, y: 372, w: 120, h: 104 },
  { id: 'piring2', type: 'plate', label: 'Piring 2', x: 1120, y: 372, w: 120, h: 104 },
  { id: 'trash', type: 'trash', label: 'Sampah', x: 40, y: 540, w: 110, h: 84 },
];
