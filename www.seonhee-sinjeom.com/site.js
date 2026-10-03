// 선희당 공용 모듈(이 사이트 페이지만 쓴다).
//   start({ page, title })  머리말·꼬리말을 그리고 boot() → game
//   parseBirth / normName   생년월일·이름 정규화(무료 신점·오늘의 사주·지난 상담 공용)
//   siteState / updateSite  'site.seonhee' 상태
//   checkO2                 모집 공고의 대본 예시 + 받은 풀이(답장·오늘의 사주·지난 상담) → E52, O2
//
// 머리말과 꼬리말은 boot() 전에 넣는다(그래야 data-site 링크·md-collect가 함께 처리된다).

import { boot } from '../src/game.js';
import { NAV, SITE_ID } from './data.js';

export const ASSET = '../assets/seonhee/';

// ── 아이콘 ────────────────────────────────────────────────────

export const ICON = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M10 19.5v-5h4v5" fill="none" stroke="currentColor" stroke-width="1.9"/></svg>',
  lotus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c2.4 2.6 2.4 7 0 10-2.4-3-2.4-7.4 0-10zM12 15c-2-3.6-5-5-8-4.6.4 3.6 3.4 5.6 8 4.6zm0 0c2-3.6 5-5 8-4.6-.4 3.6-3.4 5.6-8 4.6zM4 18.5h16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8.5" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 19.5c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="16.5" cy="9" r="2.6" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16.5 14c2.4 0 4.1 1.6 4.6 4.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  flag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V3.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M6.5 4.5c3-1.4 5 1 8 0s3.5-.6 4.5 0v8c-1-.6-1.6-1-4.5 0s-5-1.4-8 0z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.4A7 7 0 0 1 15.5 3.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 9.5l.6 1.4 1.4.6-1.4.6L8 13.5l-.6-1.4-1.4-.6 1.4-.6z" fill="currentColor"/></svg>',
  gift: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9" width="16" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 9h18M12 9v11M12 9c-3-.2-5-1.6-4.6-3.4.4-1.6 3-1.4 4.6 3.4zm0 0c3-.2 5-1.6 4.6-3.4-.4-1.6-3-1.4-4.6 3.4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
  bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H10l-4.5 3.5v-3.5H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8 10.5h.01M12 10.5h.01M16 10.5h.01" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h3l1.4 4.2-2 1.4a12 12 0 0 0 5.9 5.9l1.4-2 4.2 1.4v3c0 1-.8 1.8-1.8 1.8C10.7 19.2 4.8 13.3 4.8 5.3c0-1 .8-1.8 1.8-1.8z" fill="currentColor"/></svg>',
  warn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 22 20H2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M12 9.5v5M12 17.2v.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

export const LOGO_MARK = `<svg class="sh-logo__mark" viewBox="0 0 48 48" aria-hidden="true">
  <defs><linearGradient id="shg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2bf"/><stop offset=".55" stop-color="#f1cf6b"/><stop offset="1" stop-color="#b8862a"/></linearGradient></defs>
  <circle cx="24" cy="24" r="22" fill="#5b2a86" stroke="url(#shg)" stroke-width="2.4"/>
  <circle cx="24" cy="24" r="16.5" fill="none" stroke="#f1cf6b" stroke-opacity=".7" stroke-width="1"/>
  <path d="M33 11.5a10 10 0 1 0 4 9.8 8 8 0 0 1-4-9.8z" fill="#f6dc8a" opacity=".22"/>
  <text x="24" y="31.5" text-anchor="middle" font-size="21" fill="url(#shg)" font-family="'Song Myung','Nanum Myeongjo',serif">善</text>
</svg>`;

// 근조 리본
const RIBBON = '<svg viewBox="0 0 20 24" aria-hidden="true"><path d="M10 2c3 0 5 2.4 4 5.4L10 14 6 7.4C5 4.4 7 2 10 2z" fill="none" stroke="#e8e4ec" stroke-width="2"/><path d="M8.2 11.4 4 22l3.4-1.8L9 23l2-7.8M11.8 11.4 16 22l-3.4-1.8L11 23" fill="#e8e4ec"/></svg>';

// ── 머리말·꼬리말 ─────────────────────────────────────────────

function headerHtml(current) {
  const items = NAV.map((n) => `<li><a href="${n.page}.html"${n.page === current ? ' aria-current="page"' : ''}>${ICON[n.icon] || ''}<span class="sh-nav__short">${n.short}</span><span class="sh-nav__full">${n.label}</span></a></li>`).join('');
  return `
<div class="sh-top">
  <div class="sh-wrap sh-top__in">
    <p class="sh-top__tel">${ICON.phone}상담 <b>060-XXXX-XXXX</b><span class="sh-top__24"> · 24시간 상담</span></p>
    <div class="sh-top__r">
      <button type="button" class="sh-top__btn" data-member>로그인</button><button type="button" class="sh-top__btn" data-member>회원가입</button><button type="button" class="sh-top__btn sh-top__btn--cart" data-member>장바구니</button>
    </div>
  </div>
  <p class="sh-top__msg" role="status" hidden></p>
</div>
<header class="sh-head">
  <div class="sh-wrap">
    <div class="sh-head__row">
      <a class="sh-logo" href="index.html" aria-label="선희당 홈">${LOGO_MARK}<span class="sh-logo__text"><b>선희당</b><small>선희보살 신점·사주·궁합 봐드립니다</small></span></a>
      <a class="sh-head__cta" href="fortune.html">첫 신점 <b>무료</b> ›</a>
    </div>
    <nav class="sh-nav" aria-label="선희당 메뉴"><ul>${items}</ul></nav>
  </div>
</header>
<div class="sh-mourn"><div class="sh-wrap"><a href="notice.html?id=jinogwi">${RIBBON}<strong>故 송만신 어머니의 명복을 빕니다</strong><span>진오귀굿 안내 ›</span></a></div></div>
<a class="sh-promo" href="fortune.html"><b>첫 신점 무료</b><span class="sh-twinkle" aria-hidden="true">✦</span>지금 신청하면 선생님이 바로 배정됩니다<span class="sh-twinkle" aria-hidden="true">✦</span></a>`;
}

function footerHtml() {
  return `
<footer class="sh-foot">
  <div class="sh-wrap">
    <div class="sh-foot__cs"><span>고객센터</span><b>060-XXXX-XXXX</b><span>24시간 · 연중무휴</span></div>
    <ul class="sh-foot__links">
      <li><a href="notice.html?id=privacy">개인정보처리방침</a></li>
      <li><a href="notice.html?id=fee">이용 요금 안내</a></li>
      <li><a href="qna.html">1:1 문의</a></li>
      <li><a href="notice.html">공지사항</a></li>
    </ul>
    <p>선희당 | 운영 대행 (주)달무리컴퍼니 | 사업자등록번호 XXX-XX-XXXXX | 통신판매업 신고 제2019-서월-XXXX호</p>
    <p>유료 전화 상담 060-XXXX-XXXX (30초당 이용료 부과) | 상담 내용은 참고용이며 결과를 보장하지 않습니다.</p>
    <p>만 19세 미만 청소년은 유료 전화 상담을 이용할 수 없습니다. | 고객 문의 ${'help@seonhee-sinjeom.com'}</p>
    <div class="sh-foot__copy"><p>© 선희당. All rights reserved.</p><a class="sh-foot__tiny" href="recruit.html">함께할 선생님 모집</a></div>
  </div>
</footer>
<aside class="sh-side" aria-label="빠른 메뉴">
  <p class="sh-side__h">QUICK</p>
  <a href="fortune.html">${ICON.gift}무료 신점</a>
  <a href="saju.html">${ICON.moon}오늘의 사주</a>
  <a href="flags.html">${ICON.flag}오방기 점</a>
  <a href="qna.html">${ICON.chat}1:1 문의</a>
  <button type="button" data-top>${ICON.up}TOP</button>
</aside>`;
}

function mountChromeHtml(page) {
  const body = document.body;
  const head = document.createElement('div');
  head.className = 'sh-header';
  head.innerHTML = headerHtml(page);
  body.prepend(head);
  const foot = document.createElement('div');
  foot.className = 'sh-footer';
  foot.innerHTML = footerHtml();
  body.append(foot);

  foot.querySelector('[data-top]')?.addEventListener('click', () => {
    const smooth = !document.documentElement.classList.contains('md-reduce-motion');
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  });

  const msg = head.querySelector('.sh-top__msg');
  for (const b of head.querySelectorAll('[data-member]')) {
    b.addEventListener('click', () => {
      msg.textContent = '회원 서비스 점검 중입니다. 비회원으로도 모든 메뉴를 이용하실 수 있어요^^';
      msg.hidden = false;
      clearTimeout(msg._t);
      msg._t = setTimeout(() => { msg.hidden = true; }, 5000);
    });
  }
}

/** 페이지 시작: 머리말·꼬리말 → boot → 공용 처리. */
export function start({ page, title, nav = page }) {
  mountChromeHtml(nav);
  const game = boot({ siteId: SITE_ID, page, title });
  document.documentElement.classList.add('sh-ready');
  checkO2(game);
  game.on('view', () => checkO2(game));
  return game;
}

// ── 상태 ──────────────────────────────────────────────────────

export const STATE_KEY = 'site.' + SITE_ID;
export const siteState = (game) => game.get(STATE_KEY, {}) || {};
export const updateSite = (game, fn) => game.update(STATE_KEY, fn, {});

// ── 정규화 ────────────────────────────────────────────────────

/** 이름 비교용: NFC, 공백 제거 */
export function normName(s) {
  return String(s ?? '').normalize('NFC').replace(/\s+/g, '').trim();
}

/**
 * 생년월일 해석. '1999.03.14' '1999-3-14' '1999/03/14' '1999년 3월 14일' '19990314' '990314'
 * 반환: { y, m, d, key: 'YYYYMMDD', label: 'YYYY.MM.DD' } 또는 null
 */
export function parseBirth(input, { minYear = 1920, maxYear = 2026 } = {}) {
  const s = String(input ?? '').normalize('NFC').trim();
  if (!s) return null;
  let y; let m; let d;
  const parts = s.match(/\d+/g) || [];
  if (parts.length >= 3) {
    [y, m, d] = parts.slice(0, 3).map(Number);
    if (parts[0].length === 2) y += y > maxYear % 100 ? 1900 : 2000;
  } else if (parts.length === 1 && parts[0].length === 8) {
    y = +parts[0].slice(0, 4); m = +parts[0].slice(4, 6); d = +parts[0].slice(6, 8);
  } else if (parts.length === 1 && parts[0].length === 6) {
    y = +parts[0].slice(0, 2); m = +parts[0].slice(2, 4); d = +parts[0].slice(4, 6);
    y += y > maxYear % 100 ? 1900 : 2000;
  } else return null;
  if (!(y >= minYear && y <= maxYear && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  const p2 = (n) => String(n).padStart(2, '0');
  return { y, m, d, key: `${y}${p2(m)}${p2(d)}`, label: `${y}.${p2(m)}.${p2(d)}` };
}

/** '서윤' → '서*', '김서윤' → '김*윤' (실시간 현황 표시용) */
export function maskName(name) {
  const c = [...String(name || '').trim()];
  if (c.length <= 1) return (c[0] || '손') + '*';
  if (c.length === 2) return c[0] + '*';
  return c[0] + '*'.repeat(c.length - 2) + c[c.length - 1];
}

/** 받은 시각(ms) → '9월 27일 14:05' (게임 날짜 + 실제 시:분) */
export function dateLabel(game, at, gd) {
  const iso = gd || game.gameDate;
  const [, m, d] = String(iso).split('-').map(Number);
  const t = new Date(at);
  return `${m}월 ${d}일 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

// ── O2: 모집 공고 대본 = 내가 받은 풀이 ───────────────────────

export function checkO2(game) {
  if (game.viewed('E52')) return;
  const sample = game.viewed('X-seonhee-script-sample');
  const reading = game.viewed('X-nurimail-fortune') || game.viewed('X-seonhee-saju') || game.viewed('E57');
  if (sample && reading) {
    game.view('E52');
    game.solve('O2');
  }
}

/** 원고 문장들 → 한 문단(무료 신점 답장과 같은 이음새) */
export const scriptText = (lines) => lines.join(' ');
