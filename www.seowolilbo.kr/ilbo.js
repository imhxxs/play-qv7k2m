// 서월일보 공용 모듈(이 사이트 페이지만 쓴다). [서월일보 담당]
//   start({ page, title, section })  머리말·꼬리말을 넣고 boot() → game
//   visibleArticles(game)  게임 날짜까지 나온 기사(최신순)
//   photoHtml / itemHtml / byHtml / jeboLink / dateTime 등 그리기 도우미
//
// 머리말·꼬리말은 boot() 전에 넣는다(data-site 링크가 함께 처리되게).

import { boot, game } from '../src/game.js';
import { ARTICLES, SECTIONS, JEBO_ADDR, ARCHIVE_NOTICE, isoOf } from './articles.js';

export const ASSET = '../assets/seowolilbo/';
export const SITE_ID = 'seowolilbo';
const esc = (s) => game.esc(s);

// 게임 날짜별 음력·날씨(누리샘 날씨와 같은 값)
const DAY_INFO = {
  '2026-09-27': { lunar: '8월 17일', sky: '흐리고 오후 한때 비', lo: 11, hi: 19 },
  '2026-09-28': { lunar: '8월 18일', sky: '맑음, 일교차 큼', lo: 8, hi: 21 },
  '2026-09-30': { lunar: '8월 20일', sky: '구름 많음', lo: 10, hi: 20 },
  '2026-10-03': { lunar: '8월 23일', sky: '맑음', lo: 9, hi: 22 },
  '2026-10-06': { lunar: '8월 26일', sky: '흐림', lo: 10, hi: 18 },
};
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export function weekday(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return WEEK[new Date(y, m - 1, d).getDay()];
}

/** '2026-09-27' → '2026년 9월 27일 일요일' */
export function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일 ${weekday(iso)}요일`;
}

/** 지령(호수) — 2026년 9월 27일 = 제12,408호 */
export function issueNo(iso) {
  const base = Date.UTC(2026, 8, 27);
  const [y, m, d] = iso.split('-').map(Number);
  const n = 12408 + Math.round((Date.UTC(y, m - 1, d) - base) / 86400000);
  return n.toLocaleString('ko-KR');
}

/** 게임 날짜까지 나온 기사(최신순). minChapter가 있으면 그 장부터 */
export function visibleArticles(g = game) {
  const today = g.gameDate;
  const ch = g.chapter?.id || 1;
  return ARTICLES
    .filter((a) => isoOf(a.date) <= today && (!a.minChapter || ch >= a.minChapter))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
}

export const articleHref = (id, extra = '') => `article.html?id=${encodeURIComponent(id)}${extra}`;
export const dateTime = (a) => `${a.date} ${a.time}`;

export function lead(a, max = 90) {
  const t = String(a.body?.[0] || '').replace(/<[^>]+>/g, '');
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

// ── 그리기 도우미 ─────────────────────────────────────────────

/** 망점 사진(누런 지면 인쇄 느낌). photo = { src, alt, cap } */
export function photoHtml(photo, { cls = '', cap = true, lazy = true } = {}) {
  if (!photo) return '';
  return `<figure class="sw-photo ${cls}">
  <div class="sw-ht"><img src="${ASSET}${esc(photo.src)}" alt="${esc(photo.alt)}" width="640" height="420"${lazy ? ' loading="lazy"' : ''} decoding="async"></div>
  ${cap && photo.cap ? `<figcaption>${esc(photo.cap)}</figcaption>` : ''}
</figure>`;
}

export function byHtml(by) {
  if (!by) return '';
  return `${esc(by.name)}${by.role ? ' ' + esc(by.role) : ''}`;
}

/** jebo@seowolilbo.kr 같은 주소 → 누리메일 쓰기 화면(새 탭) */
export function mailLink(addr, text = addr) {
  return `<a class="sw-mail" data-site="nurimail" data-page="index" data-query="#compose?to=${encodeURIComponent(addr)}">${esc(text)}</a>`;
}
export const jeboLink = (text) => mailLink(JEBO_ADDR, text || JEBO_ADDR);

/** 기사 목록 한 줄 */
export function itemHtml(a, { photo = false, leadMax = 80, sec = true } = {}) {
  return `<li class="sw-item${photo && a.photo ? ' sw-item--photo' : ''}">
  <a class="sw-item__a" href="${articleHref(a.id)}">
    ${photo && a.photo ? `<span class="sw-item__thumb">${photoHtml(a.photo, { cap: false })}</span>` : ''}
    <span class="sw-item__txt">
      <strong class="sw-item__title">${esc(a.title)}</strong>
      ${leadMax ? `<span class="sw-item__lead">${esc(lead(a, leadMax))}</span>` : ''}
      <span class="sw-item__meta">${sec ? `<em>${esc(a.sec)}</em> · ` : ''}${esc(a.date)}</span>
    </span>
  </a>
</li>`;
}

// ── 머리말·꼬리말 ─────────────────────────────────────────────

const NAV = [
  { key: '종합', href: 'index.html' },
  ...SECTIONS.map((s) => ({ key: s, href: `index.html?sec=${encodeURIComponent(s)}` })),
  { key: '아카이브', href: 'archive.html' },
  { key: '사건 제보', href: 'report.html', cls: 'sw-nav__jebo' },
];

const SEARCH_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

function headerHtml(active, iso) {
  const info = DAY_INFO[iso] || DAY_INFO['2026-09-27'];
  const nav = NAV.map((n) => `<li><a href="${n.href}"${n.key === active ? ' aria-current="page"' : ''}${n.cls ? ` class="${n.cls}"` : ''}>${esc(n.key)}</a></li>`).join('');
  return `
<div class="sw-util">
  <div class="sw-wrap sw-util__in">
    <p class="sw-util__date"><b>${esc(longDate(iso))}</b><span> · 음력 ${esc(info.lunar)}</span></p>
    <p class="sw-util__weather">서월 ${esc(info.sky)} <b>${info.lo}~${info.hi}℃</b></p>
    <p class="sw-util__r">구독 문의 0XX-XXX-XXXX</p>
  </div>
</div>
<header class="sw-mast">
  <div class="sw-wrap sw-mast__in">
    <div class="sw-ear sw-ear--l" aria-hidden="true">
      <span class="sw-ear__k">오늘의 지면</span>
      <span class="sw-ear__v">제${esc(issueNo(iso))}호</span>
      <span class="sw-ear__s">1990년 창간</span>
    </div>
    <a class="sw-logo" href="index.html" aria-label="서월일보 첫 화면">
      <span class="sw-logo__ko">서월일보</span>
      <span class="sw-logo__sub"><span class="sw-logo__hanja">西月日報</span><span class="sw-logo__motto">서월의 오늘을 기록합니다</span></span>
    </a>
    <div class="sw-ear sw-ear--r" aria-hidden="true">
      <span class="sw-ear__k">서월 오일장</span>
      <span class="sw-ear__v">3·8일</span>
      <span class="sw-ear__s">서월상인회</span>
    </div>
  </div>
</header>
<nav class="sw-nav" aria-label="서월일보 섹션">
  <div class="sw-wrap sw-nav__in">
    <ul class="sw-nav__list">${nav}</ul>
    <form class="sw-search" action="archive.html" method="get" role="search">
      <label class="sw-sr" for="sw-q">기사 검색</label>
      <input id="sw-q" name="q" type="search" placeholder="기사 검색" autocomplete="off" enterkeyhint="search">
      <button type="submit" aria-label="검색">${SEARCH_ICON}</button>
    </form>
  </div>
</nav>
<div class="sw-ticker"><div class="sw-wrap"><b>알림</b><a href="archive.html">${esc(ARCHIVE_NOTICE)}</a></div></div>`;
}

function footerHtml() {
  return `
<footer class="sw-foot">
  <div class="sw-wrap">
    <p class="sw-foot__logo">서월일보 <span>西月日報</span></p>
    <ul class="sw-foot__links">
      <li><a href="report.html">사건 제보</a></li>
      <li><a href="archive.html">기사 아카이브</a></li>
      <li><a href="report.html#rule">제보자 보호 원칙</a></li>
    </ul>
    <p>서월군 서월읍 장터길 12 · 대표전화 0XX-XXX-XXXX · 제보 ${jeboLink()}</p>
    <p>등록번호 서월 아00XXX · 등록일 2009.03.02 · 발행·편집인 정만수 · 청소년보호책임자 오태호</p>
    <p class="sw-foot__c">이 신문의 모든 기사와 사진은 서월일보의 허락 없이 옮겨 쓸 수 없습니다.</p>
  </div>
</footer>`;
}

/**
 * 페이지 공용 시작. 본문 앞뒤에 <div id="sw-head"></div>, <div id="sw-foot"></div>가 있어야 한다.
 * 반환: game
 */
export function start({ page, title, section = '' }) {
  const iso = game.gameDate;
  const head = document.getElementById('sw-head');
  const foot = document.getElementById('sw-foot');
  if (head) head.outerHTML = headerHtml(section, iso);
  if (foot) foot.outerHTML = footerHtml();
  const g = boot({ siteId: SITE_ID, page, title });
  return g;
}

/** 'site.seowolilbo' 상태(글자 크기 등) */
export const siteState = () => game.get('site.seowolilbo', {}) || {};
export function updateSite(fn) {
  return game.update('site.seowolilbo', fn, {});
}

export { ARTICLES, SECTIONS, JEBO_ADDR, esc };
