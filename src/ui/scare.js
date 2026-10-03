// 깜짝 연출 오버레이. 종류: flash · glitch · mirror · shadow · whisper
// 모션 줄이기가 켜져 있으면 흔들림·번쩍임 없이 조용히 나타났다 사라진다.
// 클릭·탭·Esc로 바로 닫을 수 있다. 화면 읽기 프로그램에는 숨긴다(장식).

import { h } from './dom.js';
import { mirrorSvg } from './icons.js';

export const SCARE_KINDS = ['flash', 'glitch', 'mirror', 'shadow', 'whisper'];
export const SCARE_DEFAULT_MS = { flash: 900, glitch: 1300, mirror: 1500, shadow: 1100, whisper: 2600 };

let seq = 0;

export function playScare(layer, { kind = 'flash', text = '', durationMs, reduceMotion = false }) {
  const k = SCARE_KINDS.includes(kind) ? kind : 'flash';
  const dur = Math.max(300, durationMs ?? SCARE_DEFAULT_MS[k]);
  return new Promise((resolve) => {
    const el = h('div', { class: `md-scare md-scare--${k}${reduceMotion ? ' md-scare--calm' : ''}`, 'aria-hidden': 'true' });
    el.style.setProperty('--md-scare-dur', `${dur}ms`);
    const t = text ? h('p', { class: 'md-scare__text', dataset: { text } }, text) : null;
    if (k === 'flash') {
      el.append(h('div', { class: 'md-scare__flash' }), t);
    } else if (k === 'glitch') {
      el.append(h('div', { class: 'md-scare__scan' }), t);
    } else if (k === 'mirror') {
      el.append(h('div', { class: 'md-scare__mirror', html: mirrorSvg(`mds${++seq}`, { label: '' }) }), t);
    } else if (k === 'shadow') {
      el.append(h('div', { class: 'md-scare__vignette' }), h('div', { class: 'md-scare__figure' }), t);
    } else {
      const w = text ? h('p', { class: 'md-scare__whisper' }, text) : null;
      if (w) {
        w.style.left = `${10 + Math.random() * 50}%`;
        w.style.top = `${18 + Math.random() * 55}%`;
      }
      el.append(h('div', { class: 'md-scare__dim' }), w);
    }
    layer.append(el);

    let done = false;
    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    el.addEventListener('pointerdown', finish);
    document.addEventListener('keydown', onKey, true);
    const timer = setTimeout(finish, dur);
    function finish() {
      if (done) return;
      done = true;
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey, true);
      el.classList.add('md-scare--out');
      setTimeout(() => { el.remove(); resolve(true); }, 260);
    }
  });
}
