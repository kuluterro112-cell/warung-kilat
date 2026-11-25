// Warung Kilat — program pengumpul entry (Node 22, pustaka standar saja).
// Game-nya ada di folder game/ di sebelah file ini: file statis yang dibuka
// browser desktop tanpa jaringan (index.html + modul ES, tanpa library).
// Program ini menyalin game/ dan screenshots/ ke folder keluaran lalu
// menulis dossier.json di sana, ringkasan yang dibaca juri, memakai
// pustaka make.fun yang sudah di-vendor.
//
// Menjalankan game secara lokal: `node serve.ts`, lalu buka http://localhost:8080.
// Di luar wadah penilai, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Batas yang dipakai penilai (reference/gate.json). Hanya text_max_bytes
// yang membentuk isi dossier; sisanya menolak entry yang memang akan
// ditolak penilai: lebih dari 4 screenshot, satu screenshot di atas 256 KiB,
// lebih dari 993 file di game/, total di atas 48 MiB, atau ada path di game/
// yang lebih dari 1000 byte.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyIfPresent(source, dest) {
  if (!existsSync(source)) return;
  cpSync(source, dest, { recursive: true });
}

function main() {
  const rootDir = fileURLToPath(new URL('.', import.meta.url));
  const destDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  mkdirSync(destDir, { recursive: true });
  cpSync(join(rootDir, 'game'), join(destDir, 'game'), { recursive: true });
  mkdirSync(join(destDir, 'screenshots'), { recursive: true });
  copyIfPresent(join(rootDir, 'screenshots'), join(destDir, 'screenshots'));

  const dossier = buildDossier(destDir, DOSSIER_LIMITS);
  writeFileSync(join(destDir, 'dossier.json'), dossier);
}

main();
