// 월하당 공통 틀: 근조 띠 · 머리(BGM·로고·반짝이 촛불·흐르는 글) · 왼쪽 메뉴 · 방문자 카운터 · 꼬리말.
// 페이지마다:
//   import { start } from './wolhadang.js';
//   const game = start({ page: 'gallery', title: '신당 갤러리 — 월하당' });
// 틀을 먼저 그리고 boot()를 부르므로 틀 안의 data-site 링크·data-view도 엔진이 채운다.
// 탭을 떠나도 제목은 바꾸지 않는다(산울림 블로그와 대비, §4.4).

import { boot, game } from '../src/game.js';
import { createBgm } from './bgm.js';

export const SITE = 'wolhadang';
const KEY = 'site.wolhadang';

const MENU = [
  { page: 'index', label: '처음으로' },
  { page: 'about', label: '만신 소개' },
  { page: 'daughters', label: '신딸 소개' },
  { page: 'gut', label: '굿 안내' },
  { page: 'guide', label: '처음 오시는 분' },
  { page: 'gallery', label: '신당 갤러리' },
  { page: 'notice', label: '공지사항' },
  { page: 'reviews', label: '손님 후기' },
  { page: 'faq', label: '자주 묻는 질문' },
  { page: 'faq', hash: '#saju', label: '사주 보기', badge: 'new' },
  { page: 'rice', label: '온라인 쌀점', badge: 'hot' },
  { page: 'contact', label: '상담 문의' },
];

// 방문자 수(게임 속 숫자). 9월 19일 뒤로 뉴스를 보고 찾아온 사람이 많다.
const BASE_TOTAL = 128406;
const BASE_TODAY = 287;

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** 반짝이 촛불 SVG(GIF 흉내). id 충돌을 피하려고 접두사를 받는다. */
export function candleSvg(p = 'c', { cls = 'wh-candle', label = '' } = {}) {
  return `<svg class="${cls}" viewBox="0 0 54 96" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>
  <defs>
    <radialGradient id="${p}g" cx="50%" cy="40%" r="50%"><stop offset="0" stop-color="#fff3b0" stop-opacity=".9"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".35"/><stop offset="1" stop-color="#ff7a00" stop-opacity="0"/></radialGradient>
    <linearGradient id="${p}w" x1="0" x2="1"><stop offset="0" stop-color="#e9dcc2"/><stop offset=".45" stop-color="#fffaf0"/><stop offset="1" stop-color="#d9c9a8"/></linearGradient>
    <linearGradient id="${p}f" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff6a00"/><stop offset=".5" stop-color="#ffc23a"/><stop offset="1" stop-color="#fff8d0"/></linearGradient>
  </defs>
  <circle class="gl" cx="27" cy="30" r="26" fill="url(#${p}g)"/>
  <g class="fl"><path d="M27 12c5 8 8 13 8 19a8 8 0 0 1-16 0c0-6 3-11 8-19z" fill="url(#${p}f)"/><path d="M27 23c2 4 3 6 3 9a3 3 0 0 1-6 0c0-3 1-5 3-9z" fill="#fff"/></g>
  <path d="M27 38v6" stroke="#3a2a1a" stroke-width="1.6"/>
  <rect x="17" y="43" width="20" height="40" rx="2" fill="url(#${p}w)"/>
  <path d="M17 47c4 2 6-1 9 1s7 0 11-1" fill="none" stroke="#efe3c8" stroke-width="2"/>
  <path d="M10 84h34l-4 8H14z" fill="#b8862a"/><path d="M8 82h38v4H8z" fill="#d9b45a"/>
  <path class="wh-spark" d="M8 18l1.6 4 4 1.6-4 1.6L8 29.2l-1.6-4-4-1.6 4-1.6z" fill="#fff3a0"/>
  <path class="wh-spark s2" d="M46 10l1.2 3 3 1.2-3 1.2L46 18.4l-1.2-3-3-1.2 3-1.2z" fill="#ffe27a"/>
  <path class="wh-spark s3" d="M45 44l1 2.4 2.4 1-2.4 1L45 50.8l-1-2.4-2.4-1 2.4-1z" fill="#fff"/>
</svg>`;
}

export function lotusSvg() {
  return `<svg class="wh-lotus" viewBox="0 0 26 18" aria-hidden="true">
  <path d="M13 2c3 3 4 6 4 9-1 3-2 5-4 6-2-1-3-3-4-6 0-3 1-6 4-9z" fill="#f08aa6"/>
  <path d="M4 7c4 0 7 3 9 9-5 1-9-2-10-6z" fill="#e66b8d"/><path d="M22 7c-4 0-7 3-9 9 5 1 9-2 10-6z" fill="#e66b8d"/>
  <path d="M2 15c4-1 8 0 11 2 3-2 7-3 11-2-3 2-7 3-11 3s-8-1-11-3z" fill="#4c9a5a"/>
  <path class="wh-spark" d="M13 0l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" fill="#fff6b0"/>
</svg>`;
}

function ribbonSvg() {
  return `<svg class="wh-band__ribbon" viewBox="0 0 26 30" aria-hidden="true">
  <path d="M13 9 4 28h6l3-7 3 7h6z" fill="#000" stroke="#4a4440" stroke-width=".8"/>
  <path d="M13 9C9 2 2 2 2 7s7 5 11 2c4 3 11 3 11-2s-7-5-11 2z" fill="#0b0b0b" stroke="#4a4440" stroke-width=".8"/>
  <circle cx="13" cy="9" r="2.6" fill="#1a1a1a" stroke="#5a544f" stroke-width=".8"/>
</svg>`;
}

// 게임 속 날짜의 음력(2026년 음력 8월 초하루 = 양력 9월 11일, 9월 초하루 = 10월 10일)
export function lunarOf(isoDate) {
  const d = new Date(isoDate + 'T12:00:00+09:00');
  const day = (iso) => Math.round((d - new Date(iso + 'T12:00:00+09:00')) / 86400000);
  const a = day('2026-09-11');
  if (a >= 0 && a < 29) return { m: 8, d: a + 1 };
  const b = day('2026-10-10');
  if (b >= 0 && b < 30) return { m: 9, d: b + 1 };
  return null;
}

function renderBand() {
  const el = document.getElementById('wh-band');
  if (!el) return;
  el.setAttribute('role', 'note');
  el.setAttribute('aria-label', '근조');
  el.innerHTML = `${ribbonSvg()}<b class="wh-band__geunjo">謹弔</b>
  <span class="wh-band__text">故 송만신(宋福禮) 어머니께서 2026년 9월 19일 신령님 곁으로 가셨습니다. 삼가 명복을 빕니다.</span>
  <span class="wh-band__mode" title="상중 모드"><i aria-hidden="true"></i>상중 모드</span>`;
}

function renderHead(chapter) {
  const el = document.getElementById('wh-head');
  if (!el) return;
  const lunar = lunarOf(chapter.date);
  el.innerHTML = `
  <div class="wh-headbar">
    <button type="button" class="wh-bgm" id="wh-bgm" aria-pressed="false">
      <span class="wh-bgm__eq" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>BGM ♪ 대금 산조 — <b class="wh-bgm__state">재생</b></span>
    </button>
    <div class="wh-today">오늘 <b>${esc(chapter.dateLabel)}</b>${lunar ? `<br>음력 ${lunar.m}월 ${lunar.d}일` : ''}</div>
  </div>
  <div class="wh-logo">
    ${candleSvg('hl')}
    <a class="wh-logo__link" href="index.html">
      <span class="wh-logo__title">月下堂</span>
      <span class="wh-logo__sub">${lotusSvg()} 송만신 <em>신점</em> · 점사 · 사주 · <em>굿</em> 봐드립니다 ${lotusSvg()}</span>
    </a>
    ${candleSvg('hr')}
  </div>
  <div class="wh-marquee" aria-hidden="true"><div class="wh-marquee__inner">★ 어서 오세요 ★ 서월산 아래 월하당입니다 ☆ 故 송만신 어머니의 명복을 빕니다 ☆ 상중에는 상담·굿 예약을 받지 않습니다 (49재 뒤에 다시 받습니다) ★ 온라인 쌀점은 재미로 보세요 ^^ ★ 아픈 데가 있으면 병원부터 다녀오세요 — 만신님 말씀 ★</div></div>`;
}

function renderSide(page, hash) {
  const el = document.getElementById('wh-side');
  if (!el) return;
  const items = MENU.map((m) => {
    const cur = m.page === page && !m.hash && !(page === 'faq' && hash === '#saju');
    const curSaju = m.hash && page === m.page && hash === m.hash;
    const badge = m.badge ? `<span class="wh-badge${m.badge === 'new' ? ' wh-badge--new' : ''}" aria-hidden="true">${m.badge.toUpperCase()}</span>` : '';
    return `<li><a href="${m.page}.html${m.hash || ''}"${cur || curSaju ? ' aria-current="page"' : ''}>${esc(m.label)}${badge}</a></li>`;
  }).join('');
  el.innerHTML = `
  <nav aria-label="월하당 메뉴"><ul class="wh-menu">${items}</ul></nav>
  <div class="wh-box">
    <p class="wh-box__t">◈ 상중(喪中)</p>
    <div class="wh-box__b wh-mourn">
      <svg viewBox="0 0 26 46" aria-hidden="true"><path class="wh-mourn__flame" d="M13 4c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" fill="#ffb84a"/><rect x="8" y="20" width="10" height="22" fill="#f6efe0"/><path d="M5 42h16v3H5z" fill="#8a6a3a"/></svg>
      <p>어머니 가신 길에<br>촛불 하나 켜 둡니다.<br><span class="wh-dim">49재 11월 6일(예정)</span></p>
    </div>
  </div>
  <div class="wh-box">
    <p class="wh-box__t">◈ 방문자</p>
    <div class="wh-box__b">
      <div class="wh-counter" data-counter>
        <div class="wh-counter__row"><span class="wh-counter__label">TODAY</span><span class="wh-counter__num" data-today></span></div>
        <div class="wh-counter__row"><span class="wh-counter__label">TOTAL</span><span class="wh-counter__num total" data-total></span></div>
      </div>
      <p class="wh-counter__note">since 2025.10.14</p>
    </div>
  </div>
  <div class="wh-box">
    <p class="wh-box__t">◈ 손 없는 날</p>
    <div class="wh-box__b" data-sonless></div>
  </div>`;
}

function renderFoot() {
  const el = document.getElementById('wh-foot');
  if (!el) return;
  el.innerHTML = `
  <div class="wh-foot-counter" aria-label="방문자 수">
    <span class="wh-counter__row"><span class="wh-counter__label" style="color:#cbb89a">TODAY</span><span class="wh-counter__num" data-today></span></span>
    <span class="wh-counter__row"><span class="wh-counter__label" style="color:#cbb89a">TOTAL</span><span class="wh-counter__num total" data-total></span></span>
  </div>
  <div>月下堂 · 송만신 신점 · 점사 · 굿 &nbsp;|&nbsp; 서월군 서월면 신당길, 서월산 아래</div>
  <div>상중에는 전화 상담을 받지 않습니다 · 월하당은 060 유료 전화 상담을 하지 않습니다</div>
  <div>Copyright ⓒ 2025 月下堂. All rights reserved. &nbsp;·&nbsp; 홈페이지 제작: 막내 명월 ♡</div>
  <div class="wh-dim" style="color:#9c8a70">이 홈페이지는 1024×768 화면에 맞춰 만들었지만 휴대폰에서도 보입니다 ^^</div>
  <div><a href="admin.html" class="wh-adminlink" style="display:inline-flex;align-items:center;min-height:44px;padding:0 10px;font-size:11px;color:#8f7d64">관리자</a></div>`;
}

function digits(n) {
  return String(n).split('').map((c) => `<span>${c}</span>`).join('');
}

function sonlessText(chapter) {
  // 손 없는 날: 음력으로 끝자리가 9·0인 날
  const l = lunarOf(chapter.date);
  if (!l) return '음력 9·10·19·20·29·30일';
  const base = new Date(chapter.date + 'T12:00:00+09:00');
  const out = [];
  for (let i = 0; i < 20 && out.length < 2; i++) {
    const dt = new Date(base.getTime() + i * 86400000);
    const iso = new Date(dt.getTime() + 9 * 3600000).toISOString().slice(0, 10);
    const ll = lunarOf(iso);
    if (ll && (ll.d % 10 === 9 || ll.d % 10 === 0)) {
      const w = '일월화수목금토'[dt.getUTCDay()];
      out.push(`${dt.getUTCMonth() + 1}월 ${dt.getUTCDate()}일(${w}) <span class="wh-dim">음 ${ll.m}/${ll.d}</span>`);
    }
  }
  return `이삿날·개업 날 잡으실 때<br>${out.join('<br>')}`;
}

function initCounter(g) {
  const t = Date.now();
  g.update(KEY, (d) => { d.counter = (d.counter || 0) + 1; d.lastVisit = t; });
  const paint = (bump = false) => {
    const n = g.get(KEY, {}).counter || 0;
    for (const el of document.querySelectorAll('[data-today]')) {
      el.innerHTML = digits(BASE_TODAY + n);
      el.classList.toggle('bump', bump);
    }
    for (const el of document.querySelectorAll('[data-total]')) {
      el.innerHTML = digits(BASE_TOTAL + n);
      el.classList.toggle('bump', bump);
    }
  };
  paint();
  g.on('change:' + KEY, () => paint(true));
  // 가끔 누가 또 들어온다
  const tick = () => {
    const next = 16000 + Math.random() * 38000;
    setTimeout(() => {
      if (document.visibilityState === 'visible') g.update(KEY, (d) => { d.counter = (d.counter || 0) + 1; });
      tick();
    }, next);
  };
  tick();
}

function initBgm(g) {
  const btn = document.getElementById('wh-bgm');
  if (!btn) return;
  const bgm = createBgm(g);
  const label = btn.querySelector('.wh-bgm__state');
  const sync = () => {
    const on = bgm.playing;
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = on ? '정지' : '재생';
    btn.setAttribute('aria-label', on ? 'BGM 대금 산조 정지' : 'BGM 대금 산조 재생');
  };
  sync();
  btn.addEventListener('click', () => {
    if (bgm.playing) bgm.stop(); else bgm.play();
    const on = bgm.playing;
    g.update(KEY, (d) => { d.bgm = on; });
    sync();
  });
  // 앞 페이지에서 켜 두었으면, 이 페이지에서 처음 누르는 순간 이어서 튼다(브라우저가 자동 재생을 막으므로).
  if (g.get(KEY, {}).bgm) {
    label.textContent = '재생';
    const resume = (e) => {
      window.removeEventListener('pointerdown', resume, true);
      window.removeEventListener('keydown', resume, true);
      if (btn.contains(e.target)) return;
      if (!bgm.playing && g.get(KEY, {}).bgm) { bgm.play(); sync(); }
    };
    window.addEventListener('pointerdown', resume, true);
    window.addEventListener('keydown', resume, true);
  }
  g.on('settings', () => bgm.refreshVolume());
}

/** 틀을 그리고 boot한다. */
export function start({ page, title }) {
  const chapter = game.chapter;
  renderBand();
  renderHead(chapter);
  renderSide(page, location.hash);
  renderFoot();
  const g = boot({ siteId: SITE, page, title });
  const sonless = document.querySelector('[data-sonless]');
  if (sonless) sonless.innerHTML = sonlessText(chapter);
  initCounter(g);
  initBgm(g);
  window.addEventListener('hashchange', () => renderMenuCurrent(page));
  return g;
}

function renderMenuCurrent(page) {
  const hash = location.hash;
  for (const a of document.querySelectorAll('.wh-menu a')) {
    const [p, h] = a.getAttribute('href').split('#');
    const isPage = p === page + '.html';
    const on = isPage && ((h && '#' + h === hash) || (!h && !(page === 'faq' && hash === '#saju')));
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

export { game };
