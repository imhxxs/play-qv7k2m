// M01(언니의 예약 메일): 깨진 문단 '원문 보기'(P01)와, 처음 열었을 때 한 번 화면이 살짝 어두워지는 분위기 연출.
// 깜짝 연출(game.scare)은 쓰지 않는다 — 첫 경험은 차분하게.

import { h, prefersReducedMotion } from './util.js';

const VEIL_FLAG = 'nurimail:m01-veil';

/** 답장 인용·전달용 본문. M01을 이미 되살렸으면 깨진 문단 대신 원문을 넣는다. */
export function quotableBody(game, mail) {
  let html = mail?.body || '';
  if (mail?.templateId === 'M01' && game.viewed('E01')) {
    html = html.replace(/<p class="m01-garbled"[\s\S]*?<\/p>/, '').replace('<p class="m01-original" hidden>', '<p class="m01-original">');
  }
  return html;
}

/** 메일 본문(이미 그려진 .mailbody)에서 M01의 깨진 문단을 살린다. */
export function enhanceM01(root, app) {
  const { game } = app;
  const box = root.querySelector('.m01-broken');
  if (!box) return;
  const garbled = box.querySelector('.m01-garbled');
  const original = box.querySelector('.m01-original');
  const tools = box.querySelector('.m01-tools');
  const btn = box.querySelector('[data-action="reveal-original"]');
  const text = original?.textContent || '';

  const showRestored = (fresh) => {
    if (garbled) garbled.hidden = true;
    if (original) {
      original.hidden = false;
      if (fresh) original.classList.add('m01-original--fresh');
    }
    tools?.remove();
    if (!box.querySelector('.m01-collect')) {
      const row = h('p', { class: 'm01-collect' });
      game.collectButton(row, 'E01', { label: '원문을 수첩에 담기' });
      box.append(row);
    }
    const ps = root.querySelector('.m01-ps');
    if (ps && !root.querySelector('.m01-collect--ps')) {
      const row2 = h('p', { class: 'm01-collect m01-collect--ps' });
      game.collectButton(row2, 'E02', { label: '추신을 수첩에 담기' });
      ps.after(row2);
    }
  };

  if (game.viewed('E01')) { showRestored(false); return; }

  btn?.addEventListener('click', () => {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = '원문을 불러오는 중…';
    game.view('E01');
    game.view('E02');
    game.solve('P01');
    game.sfx('paper');
    box.setAttribute('aria-live', 'polite');
    restore(garbled, text, prefersReducedMotion(game)).then(() => {
      showRestored(true);
      notebookTip(game);
    });
  });
}

/** 처음 원문을 되살렸을 때(게임 전체에서 한 번) 수첩이 있다는 것을 알려 준다. */
function notebookTip(game) {
  const FLAG = 'nurimail:notebook-tip';
  if (game.has(FLAG)) return;
  game.flag(FLAG);
  game.toast('언니의 메일을 되살렸습니다. 본 것은 모두 오른쪽 아래 ‘수첩’의 열람 기록에 쌓여요.', {
    id: 'nurimail-notebook-tip',
    durationMs: 9000,
    action: { label: '수첩 열기', onClick: () => game.notebook.open('viewed') },
  });
}

/** 깨진 글자가 한 자씩 원래 글자로 돌아온다. calm이면 조용히 바꿔치기. */
function restore(el, text, calm) {
  return new Promise((resolve) => {
    if (!el) { resolve(); return; }
    const pool = [...(el.textContent || '')].filter((c) => c.trim());
    if (!pool.length) pool.push('�');
    if (calm) {
      el.classList.add('m01-fadeout');
      setTimeout(resolve, 500);
      return;
    }
    const chars = [...text];
    const spans = chars.map((ch, i) => h('span', { class: 'm01-ch' }, ch === ' ' ? ' ' : pool[(i * 7) % pool.length]));
    el.replaceChildren(...spans);
    el.classList.add('m01-live');
    const step = Math.max(24, Math.min(52, 2600 / Math.max(1, chars.length)));
    const at = chars.map((_, i) => i * step + Math.random() * 280);
    const done = chars.map((c) => c === ' ');
    let left = done.filter((d) => !d).length;
    let t0 = null;
    const tick = (now) => {
      if (t0 == null) t0 = now;
      const t = now - t0;
      for (let i = 0; i < chars.length; i++) {
        if (done[i] || t < at[i]) continue;
        if (t >= at[i] + 140) {
          spans[i].textContent = chars[i];
          spans[i].className = 'm01-ch is-set';
          done[i] = true;
          left--;
        } else {
          spans[i].textContent = pool[Math.floor(Math.random() * pool.length)];
          spans[i].className = 'm01-ch is-flick';
        }
      }
      if (left > 0) requestAnimationFrame(tick);
      else setTimeout(resolve, 650);
    };
    requestAnimationFrame(tick);
  });
}

/** M01을 처음 연 순간(게임 전체에서 한 번) 화면이 잠깐 미세하게 어두워지고 저음이 깔린다. */
export function firstOpenAtmosphere(app) {
  const { game } = app;
  if (game.has(VEIL_FLAG)) return false;
  game.flag(VEIL_FLAG);
  const veil = document.getElementById('veil');
  if (veil) {
    veil.classList.remove('is-on');
    void veil.offsetWidth;
    veil.classList.add('is-on');
    veil.addEventListener('animationend', () => veil.classList.remove('is-on'), { once: true });
  }
  const drone = game.sfx('drone', { gain: 0.85 });
  setTimeout(() => { try { drone?.stop?.(3.5); } catch { /* ignore */ } }, 4600);
  return true;
}
