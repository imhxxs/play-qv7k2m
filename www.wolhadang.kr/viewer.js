// 월하당 확대 보기: 신당 갤러리 사진과 평면도를 크게 본다.
// - 확대(버튼·휠·두 손가락), 끌어서 옮기기, 두 번 눌러 확대/원래대로
// - 밝기·대비 슬라이더(터치로도 움직인다). 사진의 판독을 돕는다(§4.4)
// - Esc 닫기, ←/→ 이전·다음, +/− 확대
// 보는 사진에 단서 카드가 있으면 열람 기록에 조용히 넣고, '수첩에 담기' 버튼을 붙인다.

import { esc } from './wolhadang.js';

const MIN = 1;
const MAX = 5;

export function openViewer(game, { items, index = 0, filters = true, onChange, onClose } = {}) {
  let i = Math.max(0, Math.min(items.length - 1, index));
  const st = { s: 1, x: 0, y: 0, b: 100, c: 100 };
  let baseW = 0;
  let baseH = 0;
  let aspect = 4 / 3;
  const lastFocus = document.activeElement;

  const root = document.createElement('div');
  root.className = 'wh-viewer';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'whv-title');
  root.innerHTML = `
  <div class="wh-viewer__head">
    <button type="button" class="wh-vbtn" data-act="prev" aria-label="이전 사진">◀</button>
    <h2 class="wh-viewer__title" id="whv-title"></h2>
    <button type="button" class="wh-vbtn" data-act="next" aria-label="다음 사진">▶</button>
    <button type="button" class="wh-vbtn" data-act="close" aria-label="닫기">✕ 닫기</button>
  </div>
  <div class="wh-viewer__stage" tabindex="-1"><div class="wh-viewer__canvas"></div></div>
  <div class="wh-viewer__panel">
    <div class="wh-viewer__row">
      <button type="button" class="wh-vbtn" data-act="out" aria-label="작게">－</button>
      <button type="button" class="wh-vbtn" data-act="in" aria-label="크게">＋</button>
      <button type="button" class="wh-vbtn" data-act="reset">원래대로</button>
      <span class="wh-zoomv" aria-live="polite" style="font-size:12px;color:#d8c8aa">100%</span>
    </div>
    <div class="wh-viewer__row" data-filters>
      <label class="wh-slider"><span>밝기</span><input type="range" min="50" max="200" step="5" value="100" data-f="b" aria-label="밝기"><output>100%</output></label>
      <label class="wh-slider"><span>대비</span><input type="range" min="50" max="300" step="5" value="100" data-f="c" aria-label="대비"><output>100%</output></label>
    </div>
    <p class="wh-viewer__cap"></p>
    <div class="wh-collect" data-collect></div>
  </div>`;
  document.body.append(root);
  document.documentElement.classList.add('wh-modal-open');

  const $ = (sel) => root.querySelector(sel);
  const stage = $('.wh-viewer__stage');
  const canvas = $('.wh-viewer__canvas');
  const title = $('#whv-title');
  const cap = $('.wh-viewer__cap');
  const zoomv = $('.wh-zoomv');
  const fRow = $('[data-filters]');
  const collect = $('[data-collect]');
  const prevB = $('[data-act="prev"]');
  const nextB = $('[data-act="next"]');
  canvas.style.left = '0';
  canvas.style.top = '0';
  if (!filters) fRow.hidden = true;
  if (items.length < 2) { prevB.hidden = true; nextB.hidden = true; }

  function layout() {
    const r = stage.getBoundingClientRect();
    const W = Math.max(1, r.width);
    const H = Math.max(1, r.height);
    baseW = Math.min(W, H * aspect);
    baseH = baseW / aspect;
    canvas.style.width = baseW + 'px';
    clamp(W, H);
    const px = W / 2 - (baseW * st.s) / 2 + st.x;
    const py = H / 2 - (baseH * st.s) / 2 + st.y;
    canvas.style.transform = `translate(${px}px, ${py}px) scale(${st.s})`;
    zoomv.textContent = Math.round(st.s * 100) + '%';
  }

  function clamp(W, H) {
    const mx = Math.max(0, (baseW * st.s - W) / 2 + 24);
    const my = Math.max(0, (baseH * st.s - H) / 2 + 24);
    st.x = Math.max(-mx, Math.min(mx, st.x));
    st.y = Math.max(-my, Math.min(my, st.y));
    if (st.s <= 1.001) { st.x = 0; st.y = 0; }
  }

  function zoomTo(s, cx, cy) {
    const r = stage.getBoundingClientRect();
    const ns = Math.max(MIN, Math.min(MAX, s));
    // 가리킨 점이 제자리에 있도록
    if (cx != null) {
      const ox = cx - r.left - r.width / 2 - st.x;
      const oy = cy - r.top - r.height / 2 - st.y;
      const k = ns / st.s;
      st.x -= ox * (k - 1);
      st.y -= oy * (k - 1);
    }
    st.s = ns;
    layout();
  }

  function applyFilter() {
    const el = canvas.firstElementChild;
    if (el && filters) el.style.filter = `brightness(${st.b}%) contrast(${st.c}%)`;
    for (const inp of fRow.querySelectorAll('input')) {
      inp.value = String(st[inp.dataset.f]);
      inp.nextElementSibling.textContent = st[inp.dataset.f] + '%';
    }
  }

  function show(n) {
    i = (n + items.length) % items.length;
    const it = items[i];
    st.s = 1; st.x = 0; st.y = 0;
    title.innerHTML = `${esc(it.title)}<small>${[it.date, items.length > 1 ? `${i + 1} / ${items.length}` : ''].filter(Boolean).map(esc).join(' · ')}</small>`;
    cap.innerHTML = it.caption || '';
    canvas.replaceChildren();
    canvas.classList.toggle('is-plan', !!it.node);
    if (it.node) {
      const node = it.node.cloneNode(true);
      node.removeAttribute('id');
      for (const el of node.querySelectorAll('[id]')) el.removeAttribute('id');
      const vb = node.viewBox?.baseVal;
      aspect = vb && vb.width ? vb.width / vb.height : 4 / 3;
      canvas.append(node);
      layout();
    } else {
      const img = new Image();
      img.alt = it.alt || it.title;
      img.decoding = 'async';
      img.draggable = false;
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) aspect = img.naturalWidth / img.naturalHeight;
        layout();
      };
      img.src = it.src;
      canvas.append(img);
      aspect = it.aspect || 4 / 3;
      layout();
    }
    applyFilter();
    collect.replaceChildren();
    if (it.card) {
      game.view(it.card);
      game.collectButton(collect, it.card);
    }
    onChange?.(it, i);
  }

  // 버튼
  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    if (act === 'close') close();
    else if (act === 'prev') show(i - 1);
    else if (act === 'next') show(i + 1);
    else if (act === 'in') zoomTo(st.s * 1.5);
    else if (act === 'out') zoomTo(st.s / 1.5);
    else if (act === 'reset') { st.s = 1; st.x = 0; st.y = 0; st.b = 100; st.c = 100; layout(); applyFilter(); }
  });
  for (const inp of fRow.querySelectorAll('input')) {
    inp.addEventListener('input', () => { st[inp.dataset.f] = Number(inp.value); applyFilter(); });
  }

  // 끌기·두 손가락 확대
  const ptrs = new Map();
  let pinch = null;
  let drag = null;
  let lastTap = 0;
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: st.s, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      drag = null;
    } else if (ptrs.size === 1) {
      drag = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, moved: false };
      stage.classList.add('is-drag');
    }
  });
  stage.addEventListener('pointermove', (e) => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size >= 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const target = pinch.s * (d / pinch.d);
      zoomTo(target, pinch.cx, pinch.cy);
      pinch.s = st.s;
      pinch.d = d;
    } else if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      st.x = drag.sx + dx;
      st.y = drag.sy + dy;
      layout();
    }
  });
  const up = (e) => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (!ptrs.size) {
      stage.classList.remove('is-drag');
      if (drag && !drag.moved) {
        const now = Date.now();
        if (now - lastTap < 320) { zoomTo(st.s > 1.2 ? 1 : 2.5, e.clientX, e.clientY); lastTap = 0; }
        else lastTap = now;
      }
      drag = null;
    }
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomTo(st.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
  }, { passive: false });

  // 키보드
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft' && items.length > 1 && !e.target.matches('input')) show(i - 1);
    else if (e.key === 'ArrowRight' && items.length > 1 && !e.target.matches('input')) show(i + 1);
    else if ((e.key === '+' || e.key === '=') && !e.target.matches('input')) zoomTo(st.s * 1.5);
    else if (e.key === '-' && !e.target.matches('input')) zoomTo(st.s / 1.5);
    else if (e.key === 'Tab') {
      const f = [...root.querySelectorAll('button:not([hidden]), input, md-collect')].filter((x) => !x.closest('[hidden]'));
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener('keydown', onKey, true);
  const onResize = () => layout();
  window.addEventListener('resize', onResize);

  function close() {
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onResize);
    root.remove();
    document.documentElement.classList.remove('wh-modal-open');
    try { lastFocus?.focus?.(); } catch { /* ignore */ }
    onClose?.();
  }

  show(i);
  setTimeout(() => $('[data-act="close"]').focus(), 30);
  return { close, show: (n) => show(n), get index() { return i; } };
}
