// 누리메일 화면 공용 도우미(DOM·날짜·아이콘). 엔진 밖의 사이트 코드다.

/** h('div', { class: 'x', onClick: fn }, '내용', 자식…) */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'hidden') el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  add(el, kids);
  return el;
}

function add(el, kids) {
  for (const k of kids) {
    if (k == null || k === false) continue;
    if (Array.isArray(k)) add(el, k);
    else el.append(k instanceof Node ? k : String(k));
  }
}

/** 아이콘(인라인 SVG, currentColor) */
const P = (d, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"${extra}>${d}</svg>`;
const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
export const ICON = {
  back: P(`<path d="M14.5 5.5 8 12l6.5 6.5" ${S}/>`),
  reply: P(`<path d="M9.5 6.5 4 12l5.5 5.5" ${S}/><path d="M4.5 12H14a6 6 0 0 1 6 6v1" ${S}/>`),
  forward: P(`<path d="M14.5 6.5 20 12l-5.5 5.5" ${S}/><path d="M19.5 12H10a6 6 0 0 0-6 6v1" ${S}/>`),
  clip: P(`<path d="M15.5 7.5 8.6 14.4a2.2 2.2 0 0 0 3.1 3.1l7.4-7.4a4 4 0 0 0-5.7-5.7l-7.6 7.6a5.8 5.8 0 0 0 8.2 8.2l5.8-5.8" ${S}/>`),
  close: P(`<path d="M6 6l12 12M18 6 6 18" ${S}/>`),
  send: P(`<path d="M4 12 20 4l-4 16-4.5-6.5z" ${S}/><path d="M11.5 13.5 20 4" ${S}/>`),
  trash: P(`<path d="M5 7h14M10 7V4.5h4V7M7 7l1 13h8l1-13" ${S}/>`),
  search: P(`<circle cx="11" cy="11" r="6" ${S}/><path d="m20 20-4.6-4.6" ${S}/>`),
  doc: P(`<path d="M7 3.5h7l4 4v13H7z" ${S}/><path d="M14 3.5v4h4M9.5 12h5M9.5 15.5h5" ${S}/>`),
  image: P(`<rect x="3.5" y="5" width="17" height="14" rx="2" ${S}/><circle cx="9" cy="10" r="1.6" ${S}/><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" ${S}/>`),
  book: P(`<path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v12.5H7.5A2.5 2.5 0 0 1 5 17z" ${S}/><path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H18" ${S}/>`),
  pencil: P(`<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z" ${S}/><path d="M13.5 8.5l3 3" ${S}/>`),
  check: P(`<path d="m5 12.5 4.5 4.5L19 7.5" ${S}/>`),
  drop: '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 3.5c5 6.6 8.4 10.8 8.4 15A8.4 8.4 0 0 1 7.6 18.5C7.6 14.3 11 10.1 16 3.5z" fill="currentColor"/><path d="M12 19.4a4.1 4.1 0 0 0 3.7 3.9" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
};

export function icon(name, cls = 'ico') {
  return h('span', { class: cls, html: ICON[name] || '' });
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function hhmm(ts) {
  const t = new Date(ts);
  return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
}

/** 게임 날짜('2026-09-27') + 실제 시각 → '9월 27일(일) 14:05' */
export function dateLabelOf(gd, at) {
  const [y, m, d] = String(gd || '2026-09-27').split('-').map(Number);
  const w = WEEK[new Date(y, (m || 1) - 1, d || 1).getDay()];
  return `${m}월 ${d}일(${w}) ${hhmm(at)}`;
}

/** 엔진 날짜 표기('9월 26일(토) 21:30')를 목록용 짧은 표기로: 오늘이면 시:분, 아니면 '9월 26일' */
export function shortDate(label, gameDate) {
  const m = /(\d+)월\s*(\d+)일(?:\((.)\))?\s*(\d{1,2}:\d{2})?/.exec(label || '');
  if (!m) return label || '';
  const [, mm, dd, , time] = m;
  const [, gm, gdd] = String(gameDate || '').split('-').map(Number);
  if (Number(mm) === gm && Number(dd) === gdd && time) return time;
  return `${mm}월 ${dd}일`;
}

/** 메일 본문 HTML → 미리보기 글(숨은 문단·버튼·장식은 뺀다) */
export function snippetOf(html, max = 90) {
  try {
    const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
    doc.querySelectorAll('style,script,svg,[hidden],[aria-hidden="true"],button,.m01-tools,.ad__foot,.mb-meta,blockquote').forEach((n) => n.remove());
    doc.body.querySelectorAll('p,div,li,ul,ol,h1,h2,h3,h4,blockquote,dl,dt,dd,small,br,span[class]').forEach((n) => n.append(' '));
    const t = (doc.body.textContent || '').replace(/\s+/g, ' ').replace(/\s+([.,!?)])/g, '$1').trim();
    return t.length > max ? t.slice(0, max) + '…' : t;
  } catch {
    return '';
  }
}

/** 메일 본문 HTML → 평문(답장 인용·전달용) */
export function plainOf(html) {
  try {
    const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
    doc.querySelectorAll('style,script,svg,[hidden],button,.m01-tools').forEach((n) => n.remove());
    doc.querySelectorAll('br').forEach((n) => n.replaceWith('\n'));
    doc.querySelectorAll('p,div,li,blockquote,dd').forEach((n) => n.append('\n'));
    return (doc.body.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  } catch {
    return '';
  }
}

/** 보낸 사람 첫 글자(아바타) */
export function initialOf(name, addr) {
  const s = String(name || addr || '?').trim();
  if (/^mailer-daemon/i.test(s)) return '!';
  return [...s][0]?.toUpperCase() || '?';
}

/** 주소마다 정해진 아바타 색(쪽빛 계열 안에서) */
const TONES = ['#24408e', '#2f6b8f', '#5b4b8a', '#7a4a2a', '#2f6d5a', '#8a3a3a', '#4a5568'];
export function toneOf(addr) {
  let n = 0;
  for (const ch of String(addr || '')) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[n % TONES.length];
}

export const isEmail = (s) => /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(String(s || '').trim());

/** 같은 프레임 안 여러 번 부름을 한 번으로 */
export function rafOnce(fn) {
  let queued = false;
  return () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; fn(); });
  };
}

export function prefersReducedMotion(game) {
  if (game?.settings?.reduceMotion) return true;
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}
