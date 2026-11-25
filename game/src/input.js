// input.js — keyboard (WASD/panah, E/Spasi, M, P, Enter, Esc) dan mouse (klik).
import { W, H } from './config.js';

const STOP_SCROLL = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

export function createInput(canvas, h) {
  const pressed = Object.create(null);

  function held(code) {
    return !!pressed[code];
  }

  function direction() {
    const right = (held('KeyD') || held('ArrowRight') ? 1 : 0) - (held('KeyA') || held('ArrowLeft') ? 1 : 0);
    const down = (held('KeyS') || held('ArrowDown') ? 1 : 0) - (held('KeyW') || held('ArrowUp') ? 1 : 0);
    const len = Math.hypot(right, down);
    return len > 0 ? { x: right / len, y: down / len } : { x: 0, y: 0 };
  }

  window.addEventListener('keydown', (ev) => {
    if (STOP_SCROLL.indexOf(ev.code) >= 0) ev.preventDefault();
    if (ev.repeat) return;
    pressed[ev.code] = true;
    h.gesture();
    switch (ev.code) {
      case 'KeyE':
      case 'Space':
        h.interact();
        break;
      case 'Enter':
      case 'NumpadEnter':
        h.confirm();
        break;
      case 'KeyP':
        h.pause();
        break;
      case 'KeyM':
        h.mute();
        break;
      case 'Escape':
        h.back();
        break;
      default:
        break;
    }
  });

  window.addEventListener('keyup', (ev) => {
    delete pressed[ev.code];
  });

  window.addEventListener('blur', () => {
    for (const code of Object.keys(pressed)) delete pressed[code];
  });

  canvas.addEventListener('pointerdown', (ev) => {
    const box = canvas.getBoundingClientRect();
    h.gesture();
    h.click(((ev.clientX - box.left) * W) / box.width, ((ev.clientY - box.top) * H) / box.height);
  });

  return { axis: direction };
}
