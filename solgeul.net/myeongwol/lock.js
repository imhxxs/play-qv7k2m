// 비밀글 오방기 잠금 — 다은이 만든 위젯(기획서 §4.6, §6.1 P05).
//
// · 칸 4개, 깃발 5개(홍·황·백·청·녹, 한자 라벨 紅·黃·白·靑·綠 선택).
// · 깃발을 누르면 빈 칸을 앞에서부터 채운다. 채운 칸을 누르면 그 칸만 비운다.
// · '깃발을 꽂는다'를 눌러야만 판정한다. 틀리면 방울 소리 + 깃발 흔들림 + 칸 비움(어느 칸이 틀렸는지는 알리지 않는다).
// · 녹(상문)을 누르면 그 자리에서 방울과 함께 '그날은 상문이 안 나왔어'.
// · 세 번 틀리면 30초 '방울이 멎을 때까지' 쉬고, 잠금 힌트와 힌트 버튼을 강조한다.
// · 정답은 평문으로 두지 않는다. 순서 문자열의 SHA-256(지원하지 않는 환경은 FNV-1a)만 비교한다.
// · 열리면 플래그 'blog-myeongwol:lock-open'과 퍼즐 P05를 기록한다. 본문(E13~E18)은 제2장에서 넣는다.
//
// 상태: md1:site.blog-myeongwol → { lock: { fails, total, until }, hanja }

const FLAGS = [
  { key: 'hong', code: 'R', ko: '홍', hanja: '紅', name: '홍기', desc: '붉은 깃발', color: 'var(--ob-hong)' },
  { key: 'hwang', code: 'Y', ko: '황', hanja: '黃', name: '황기', desc: '노란 깃발', color: 'var(--ob-hwang)' },
  { key: 'baek', code: 'W', ko: '백', hanja: '白', name: '백기', desc: '흰 깃발', color: 'var(--ob-baek)' },
  { key: 'cheong', code: 'B', ko: '청', hanja: '靑', name: '청기', desc: '푸른 깃발', color: 'var(--ob-cheong)' },
  { key: 'nok', code: 'G', ko: '녹', hanja: '綠', name: '녹기', desc: '초록 깃발', color: 'var(--ob-nok)' },
];
const BY_KEY = Object.fromEntries(FLAGS.map((f) => [f.key, f]));

const SALT = 'solgeul:myeongwol:0919|';
const ANSWER_SHA256 = 'e03b6e0560cc82a0691e19bb08d21003314abbec2efef77f71ab59f1ce09ab1c';
const ANSWER_FNV = '17e0a60d';

const SLOTS = 4;
const MAX_FAILS = 3;
const REST_MS = 30_000;
const OPEN_FLAG = 'blog-myeongwol:lock-open';
const NUMS = ['一', '二', '三', '四'];

const BELL = '<svg class="ob__bell" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5v1.6M5.2 13.5V9.6a4.8 4.8 0 0 1 9.6 0v3.9l1.4 1.8H3.8z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="17" r="1.4" fill="currentColor"/></svg>';

function flagSvg(f) {
  return `<svg class="ob__flag" viewBox="0 0 40 64" aria-hidden="true"><path d="M6 2v60" stroke="#6d5b45" stroke-width="2.2" stroke-linecap="round"/><circle cx="6" cy="2.4" r="2" fill="#b89a5e"/><path class="cloth" d="M7 5c9-2 17 3 29 0v28c-12 3-20-2-29 0z" fill="${f.color}" stroke="rgba(40,30,20,.28)" stroke-width=".9"/><path d="M7 33c9-2 17 3 29 0" fill="none" stroke="rgba(40,30,20,.12)" stroke-width="3"/></svg>`;
}

/** 엔진이 부른다: renderObangLock(el, { game, blog, post, key }) */
export function renderObangLock(el, { game, post, key }) {
  const st = () => game.get(key, {}) || {};

  if (game.has(OPEN_FLAG)) { renderOpen(el, game, false); return; }

  const root = document.createElement('div');
  root.className = 'ob';
  root.innerHTML = `
    <div class="ob__hintbox">
      <span class="ob__hintlabel">잠금 힌트</span>
      <p class="ob__hint">${escapeHtml(post.lockHint || '')}</p>
      <p class="ob__nudge" hidden>'신을 받던 날'은 언제였을까요.</p>
    </div>
    <ol class="ob__slots" aria-label="깃발 칸 네 개"></ol>
    <div class="ob__flags" role="group" aria-label="깃발 다섯"></div>
    <div class="ob__actions">
      <button type="button" class="sg-btn sg-btn--ink ob__plant" disabled>깃발을 꽂는다</button>
      <button type="button" class="sg-btn ob__clear">비우기</button>
    </div>
    <p class="ob__msg" role="status" aria-live="polite"></p>
    <p class="ob__rest" hidden>방울이 멎을 때까지 <b class="ob__sec">30</b>초</p>
    <button type="button" class="sg-btn ob__hintbtn" hidden>수첩 › 힌트 보기</button>
    <div class="ob__opts">
      <label class="ob__toggle"><input type="checkbox" class="ob__hanja"> 한자 라벨(紅·黃·白·靑·綠)</label>
    </div>`;
  el.append(root);

  const slotsEl = root.querySelector('.ob__slots');
  const flagsEl = root.querySelector('.ob__flags');
  const plant = root.querySelector('.ob__plant');
  const clear = root.querySelector('.ob__clear');
  const msg = root.querySelector('.ob__msg');
  const rest = root.querySelector('.ob__rest');
  const sec = root.querySelector('.ob__sec');
  const hintBtn = root.querySelector('.ob__hintbtn');
  const nudge = root.querySelector('.ob__nudge');
  const hanjaBox = root.querySelector('.ob__hanja');

  let slots = Array(SLOTS).fill(null);
  let busy = false;
  let opened = false;
  let restTimer = null;
  let unsubFlag = null;

  const label = (f) => (st().hanja ? `<span class="ob__lbl is-hanja">${f.hanja}</span>` : `<span class="ob__lbl">${f.ko}</span>`);
  const resting = () => (st().lock?.until || 0) > Date.now();

  function paintFlags() {
    flagsEl.innerHTML = '';
    for (const f of FLAGS) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ob__btn';
      b.dataset.flag = f.key;
      b.setAttribute('aria-label', `${f.name}(${f.desc}) 칸에 넣기`);
      b.innerHTML = flagSvg(f) + label(f);
      b.addEventListener('click', () => pick(f, b));
      flagsEl.append(b);
    }
  }

  function paintSlots() {
    slotsEl.innerHTML = '';
    slots.forEach((k, i) => {
      const li = document.createElement('li');
      li.className = 'ob__slotwrap';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ob__slot' + (k ? ' is-filled' : '');
      b.dataset.slot = String(i);
      const f = k ? BY_KEY[k] : null;
      b.setAttribute('aria-label', f ? `${i + 1}번째 칸: ${f.name}. 누르면 비웁니다` : `${i + 1}번째 칸: 비어 있음`);
      if (!f) b.setAttribute('aria-disabled', 'true');
      b.innerHTML = `<span class="ob__slotnum" aria-hidden="true">${NUMS[i]}</span>${f ? flagSvg(f) + label(f) : ''}`;
      b.addEventListener('click', () => {
        if (busy || !slots[i]) return;
        slots[i] = null;
        msg.textContent = '';
        paintSlots();
        paintButtons();
      });
      li.append(b);
      slotsEl.append(li);
    });
  }

  function paintButtons() {
    const r = resting();
    const full = slots.every(Boolean);
    plant.disabled = busy || r || !full;
    clear.disabled = busy || r || !slots.some(Boolean);
    for (const b of flagsEl.querySelectorAll('.ob__btn')) b.disabled = busy || r;
    const tired = (st().lock?.total || 0) >= MAX_FAILS;
    root.classList.toggle('is-tired', tired);
    nudge.hidden = !tired;
    hintBtn.hidden = !tired;
  }

  function pick(f, btn) {
    if (busy || resting()) return;
    if (f.key === 'nok') {
      game.sfx('bell', { gain: 0.7 });
      btn.classList.remove('is-shake');
      void btn.offsetWidth;
      btn.classList.add('is-shake');
      setTimeout(() => btn.classList.remove('is-shake'), 700);
      msg.classList.add('is-warn');
      msg.innerHTML = `${BELL}그날은 상문이 안 나왔어`;
      return;
    }
    const i = slots.indexOf(null);
    if (i < 0) {
      msg.classList.remove('is-warn');
      msg.textContent = '칸이 다 찼어요. 칸을 눌러 비우거나 깃발을 꽂으세요.';
      return;
    }
    slots[i] = f.key;
    msg.classList.remove('is-warn');
    msg.textContent = '';
    paintSlots();
    paintButtons();
    if (slots.every(Boolean)) plant.focus();
  }

  clear.addEventListener('click', () => {
    if (busy) return;
    slots = Array(SLOTS).fill(null);
    msg.textContent = '';
    paintSlots();
    paintButtons();
  });

  plant.addEventListener('click', async () => {
    if (busy || resting() || !slots.every(Boolean)) return;
    busy = true;
    paintButtons();
    const seq = slots.map((k) => BY_KEY[k].code);
    let ok = false;
    try { ok = await check(seq); } catch { ok = false; }
    if (ok) {
      opened = true;
      unsubFlag?.();
      clearInterval(restTimer);
      const planted = slots.slice();
      root.remove();
      renderOpen(el, game, true, planted);
      game.sfx('paper');
      game.flag(OPEN_FLAG);
      game.solve('P05');
      return;
    }
    // 틀림: 방울 + 흔들림 + 칸 비움
    game.sfx('bell');
    root.classList.remove('is-shake');
    void root.offsetWidth;
    root.classList.add('is-shake');
    msg.classList.add('is-warn');
    msg.innerHTML = `${BELL}방울이 운다. 깃발이 제자리가 아니다.`;
    const now = Date.now();
    const until = now + REST_MS;
    game.update(key, (d) => {
      d.lock ||= {};
      d.lock.fails = (d.lock.fails || 0) + 1;
      d.lock.total = (d.lock.total || 0) + 1;
      if (d.lock.fails >= MAX_FAILS) { d.lock.fails = 0; d.lock.until = until; }
    });
    setTimeout(() => {
      root.classList.remove('is-shake');
      slots = Array(SLOTS).fill(null);
      busy = false;
      paintSlots();
      paintButtons();
      if (resting()) startRest();
    }, 680);
  });

  hintBtn.addEventListener('click', () => game.notebook.open('hints'));

  hanjaBox.checked = !!st().hanja;
  hanjaBox.addEventListener('change', () => {
    const on = hanjaBox.checked;
    game.update(key, (d) => { d.hanja = on; });
    paintFlags();
    paintSlots();
    paintButtons();
  });

  function startRest() {
    clearInterval(restTimer);
    rest.hidden = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil(((st().lock?.until || 0) - Date.now()) / 1000));
      sec.textContent = String(left);
      if (left <= 0) {
        clearInterval(restTimer);
        rest.hidden = true;
        msg.classList.remove('is-warn');
        msg.textContent = '방울이 멎었다. 다시 꽂을 수 있다.';
        paintButtons();
      }
    };
    tick();
    restTimer = setInterval(tick, 250);
    msg.classList.add('is-warn');
    msg.innerHTML = `${BELL}세 번 틀렸다. 깃발을 내려놓고 숨을 고른다.`;
  }

  // 다른 탭에서 열었으면 이 탭도 열린 모습으로
  unsubFlag = game.on('flag', (f) => {
    if (f !== OPEN_FLAG || opened || !root.isConnected) return;
    opened = true;
    unsubFlag?.();
    clearInterval(restTimer);
    root.remove();
    renderOpen(el, game, false);
  });

  paintFlags();
  paintSlots();
  paintButtons();
  if (resting()) startRest();
}

function renderOpen(el, game, fresh, planted) {
  const order = planted || null;
  const box = document.createElement('div');
  box.className = 'ob-open';
  box.setAttribute('role', 'status');
  box.innerHTML = `
    ${order ? `<div class="ob-open__flags" aria-hidden="true">${order.map((k) => flagSvg(BY_KEY[k])).join('')}</div>` : ''}
    <p class="ob-open__t">${fresh ? '깃발 넷이 꽂혔다. 잠금이 풀렸다.' : '잠금이 풀린 글입니다.'}</p>
    <p class="ob-open__d">이 글은 제2장 「신병일기」에서 열립니다 — 제작 중</p>
    <span class="ob-open__soon">제2장 · 9월 28일(월)</span>`;
  el.append(box);
  if (fresh) { box.tabIndex = -1; box.focus({ preventScroll: true }); }
}

async function check(seq) {
  const s = SALT + seq.join('-');
  const subtle = globalThis.crypto?.subtle;
  if (subtle && typeof subtle.digest === 'function') {
    const buf = await subtle.digest('SHA-256', new TextEncoder().encode(s));
    const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return hex === ANSWER_SHA256;
  }
  return fnv1a(s) === ANSWER_FNV;
}

function fnv1a(s) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(s)) {
    h ^= b;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
