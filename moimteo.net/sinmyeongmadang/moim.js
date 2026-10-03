// 신명마당(모임터) 공용 모듈. [신명마당 담당]
//   start({ page, title, board })  모임터 막대·마당 현판·옆 메뉴·꼬리말을 넣고 boot() → game
//   siteState / updateSite         'site.sinmyeong' 상태 { member, comments, likes, ghost }
//   nickHtml / avatarHtml / when   그리기 도우미
//   openProfile(nick)              회원 프로필 창
//
// 머리말은 boot() 전에 넣는다(data-site 링크가 함께 처리되게).

import { boot, game } from '../../src/game.js';
import { BOARDS, MEMBERS, POSTS, GRADES } from './posts.js';

export const SITE_ID = 'sinmyeong';
export const ASSET = '../../assets/sinmyeong/';
export const esc = (s) => game.esc(s);

export const siteState = () => game.get('site.sinmyeong', {}) || {};
export const updateSite = (fn) => game.update('site.sinmyeong', fn, {});
export const member = () => siteState().member || null;

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];

/** 지금 시각(게임 날짜 + 실제 시:분) → 'MM.DD HH:MM' */
export function nowStamp() {
  const [, m, d] = game.gameDate.split('-');
  const t = new Date();
  return `${m}.${d} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

/** 목록 날짜 표기: 게임 '오늘'이면 시:분, 올해면 MM.DD, 아니면 YY.MM.DD */
export function listDate(p) {
  const iso = p.date.replace(/\./g, '-');
  if (iso === game.gameDate) return p.time;
  if (p.date.startsWith(game.gameDate.slice(0, 4))) return p.date.slice(5);
  return p.date.slice(2);
}

export function longDate(p) {
  const [y, m, d] = p.date.split('.').map(Number);
  return `${p.date}(${WEEK[new Date(y, m - 1, d).getDay()]}) ${p.time}`;
}

// ── 아바타·닉네임 ─────────────────────────────────────────────

const AV = {
  tree: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="20" fill="#e9dcc4"/><path d="M20 30v-8" stroke="#6b4a2a" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="17" r="9" fill="#5f8a4a"/><g fill="#c8352b"><circle cx="16" cy="16" r="2"/><circle cx="23" cy="14" r="2"/><circle cx="22" cy="20" r="2"/></g></svg>',
  lotus: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="20" fill="#f4e4ea"/><path d="M20 12c3 4 3 9 0 13-3-4-3-9 0-13zM20 25c-3-4-7-5-11-4 1 4 5 6 11 4zm0 0c3-4 7-5 11-4-1 4-5 6-11 4z" fill="#d06a8a"/><path d="M10 29h20" stroke="#6f8f5a" stroke-width="2" stroke-linecap="round"/></svg>',
  bell: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="20" fill="#f3e6bf"/><path d="M20 9v4" stroke="#8a6a2a" stroke-width="2"/><g fill="#c9a23a" stroke="#8a6a2a" stroke-width="1.2"><circle cx="15" cy="20" r="4"/><circle cx="25" cy="20" r="4"/><circle cx="20" cy="27" r="4"/></g></svg>',
  bowl: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="20" fill="#dfe8ef"/><path d="M10 19h20c0 6-4 10-10 10s-10-4-10-10z" fill="#b8a27a"/><ellipse cx="20" cy="19" rx="10" ry="2.6" fill="#cfe4f2"/></svg>',
  janggu: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="20" fill="#e6dccd"/><path d="M8 14c4 0 6 3 12 3s8-3 12-3v12c-4 0-6-3-12-3s-8 3-12 3z" fill="#8a3a22"/><ellipse cx="8" cy="20" rx="2.6" ry="6" fill="#efe6d4" stroke="#5a2a18"/><ellipse cx="32" cy="20" rx="2.6" ry="6" fill="#efe6d4" stroke="#5a2a18"/><path d="M8 14 32 26M8 26 32 14" stroke="#d9b45a" stroke-width="1"/></svg>',
  ghost: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="20" fill="#d9dbe0"/><circle cx="20" cy="16" r="6" fill="#b5b8bf"/><path d="M9 33c1-7 6-10 11-10s10 3 11 10z" fill="#b5b8bf"/></svg>',
};
const TINTS = ['#e3e7f3', '#efe3d8', '#e2efe6', '#f2e8c9', '#ece2f0', '#dfecef'];

export function avatarHtml(nick, size = 36) {
  const m = MEMBERS[nick];
  const key = m?.avatar;
  if (key && AV[key]) return `<span class="mt-av" style="width:${size}px;height:${size}px">${AV[key]}</span>`;
  if (!m && nick !== member()?.nick) return `<span class="mt-av" style="width:${size}px;height:${size}px">${AV.ghost}</span>`;
  const ch = [...String(nick || '?')][0];
  const tint = TINTS[[...String(nick)].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return `<span class="mt-av mt-av--text" style="width:${size}px;height:${size}px;background:${tint}">${esc(ch)}</span>`;
}

export function gradeOf(nick) {
  if (MEMBERS[nick]) return MEMBERS[nick].grade;
  const me = member();
  if (me && me.nick === nick) return me.grade || '손님';
  return '';
}

export function gradeBadge(grade) {
  if (!grade) return '';
  return `<span class="mt-grade mt-grade--${GRADES[grade] || 'guest'}">${esc(grade)}</span>`;
}

/** 닉네임 버튼(누르면 프로필) */
export function nickHtml(nick, { badge = true } = {}) {
  return `<button type="button" class="mt-nick" data-nick="${esc(nick)}">${esc(nick)}</button>${badge ? gradeBadge(gradeOf(nick)) : ''}`;
}

// ── 회원 프로필 창 ────────────────────────────────────────────

let profileEl = null;
let lastFocus = null;

function ensureProfile() {
  if (profileEl) return profileEl;
  profileEl = document.createElement('div');
  profileEl.className = 'mt-pf';
  profileEl.hidden = true;
  profileEl.innerHTML = '<div class="mt-pf__back" data-close></div><div class="mt-pf__card" role="dialog" aria-modal="true" aria-labelledby="mt-pf-h" tabindex="-1"></div>';
  document.body.append(profileEl);
  profileEl.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeProfile(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !profileEl.hidden) closeProfile(); });
  return profileEl;
}

function activityOf(nick) {
  const out = [];
  for (const p of POSTS) {
    if (p.who === nick) out.push({ p, kind: '글' });
    for (const c of p.comments || []) if (c.who === nick) out.push({ p, kind: '댓글', c });
  }
  const mine = siteState().comments || {};
  if (member()?.nick === nick) {
    for (const [pid, list] of Object.entries(mine)) {
      const p = POSTS.find((x) => x.id === pid);
      if (p) for (const c of list) out.push({ p, kind: '댓글', c: { text: esc(c.text), at: c.at } });
    }
  }
  return out;
}

export function openProfile(nick) {
  const el = ensureProfile();
  const card = el.querySelector('.mt-pf__card');
  const m = MEMBERS[nick];
  const me = member();
  const isMe = me && me.nick === nick;
  const acts = activityOf(nick).slice(-6).reverse();
  const strip = (h) => String(h).replace(/<[^>]+>/g, '');
  card.innerHTML = `
<button type="button" class="mt-pf__x" data-close aria-label="닫기">×</button>
<div class="mt-pf__top">
  ${avatarHtml(nick, 56)}
  <div>
    <h2 id="mt-pf-h">${esc(nick)} ${gradeBadge(m?.grade || (isMe ? me.grade || '손님' : ''))}</h2>
    <p class="mt-pf__meta">${m ? `가입 ${esc(m.joined)} · 글 ${m.posts} · 댓글 ${m.comments}` : isMe ? `가입 ${esc(me.joinedLabel || '')} · 오늘 들어온 손님` : '탈퇴했거나 정보를 볼 수 없는 회원입니다.'}</p>
  </div>
</div>
${m?.intro ? `<p class="mt-pf__intro">${esc(m.intro)}</p>` : ''}
${acts.length ? `<h3 class="mt-pf__h3">최근 활동</h3><ul class="mt-pf__acts">${acts.map(({ p, kind, c }) => `<li><a href="post.html?id=${encodeURIComponent(p.id)}"><span class="mt-pf__kind">${kind}</span><span class="mt-pf__t">${esc(kind === '글' ? p.title : strip(c.text).slice(0, 48))}</span><span class="mt-pf__d">${esc(kind === '글' ? p.date.slice(2) : c.at)}</span></a></li>`).join('')}</ul>` : ''}`;
  lastFocus = document.activeElement;
  el.hidden = false;
  card.focus();
}

export function closeProfile() {
  if (!profileEl) return;
  profileEl.hidden = true;
  try { lastFocus?.focus?.(); } catch { /* ignore */ }
}

/** 닉네임 버튼 클릭을 한곳에서 받는다 */
function bindNicks() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.mt-nick');
    if (b) { e.preventDefault(); openProfile(b.dataset.nick); }
  });
}

// ── 머리말·옆 메뉴·꼬리말 ─────────────────────────────────────

const OBANG = `<svg class="mt-hp__flags" viewBox="0 0 260 150" aria-hidden="true">
  <defs><linearGradient id="mtpole" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a5a32"/><stop offset="1" stop-color="#b48a52"/></linearGradient></defs>
  <g stroke="url(#mtpole)" stroke-width="3.2" stroke-linecap="round">
    <path d="M130 146 L44 18"/><path d="M130 146 L86 8"/><path d="M130 146 L130 4"/><path d="M130 146 L174 8"/><path d="M130 146 L216 18"/>
  </g>
  <g stroke="#0e1530" stroke-width="1" stroke-linejoin="round">
    <path d="M45 20 C60 18 70 30 84 26 L94 52 C80 56 70 44 56 46z" fill="#c8352b"/>
    <path d="M87 10 C102 10 110 22 124 20 L128 48 C114 50 106 38 92 38z" fill="#e4b52f"/>
    <path d="M131 6 C146 8 152 20 166 18 L166 46 C152 48 146 36 132 34z" fill="#f4f1e8"/>
    <path d="M174 10 C188 12 192 24 206 24 L200 52 C186 52 182 40 168 38z" fill="#2c5aa8"/>
    <path d="M216 20 C230 24 232 36 246 38 L234 62 C220 60 218 48 206 46z" fill="#3f8a4a"/>
  </g>
  <g fill="#e2b04a"><circle cx="44" cy="17" r="3"/><circle cx="86" cy="7" r="3"/><circle cx="130" cy="3" r="3"/><circle cx="174" cy="7" r="3"/><circle cx="216" cy="17" r="3"/></g>
</svg>`;

const MOIMTEO_MARK = '<svg class="mt-bar__mark" viewBox="0 0 28 28" aria-hidden="true"><rect width="28" height="28" rx="8" fill="#c45a3b"/><path d="M6 17c2-5 5-8 8-8s6 3 8 8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><circle cx="9" cy="19.5" r="2" fill="#fff"/><circle cx="14" cy="19.5" r="2" fill="#fff"/><circle cx="19" cy="19.5" r="2" fill="#fff"/></svg>';

const LOCK = '<svg class="mt-ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5.3a2.5 2.5 0 0 1 5 0V7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
export const ICON = { lock: LOCK };

function boardCount(id) {
  return POSTS.filter((p) => p.board === id).length;
}

function barHtml() {
  const me = member();
  return `
<div class="mt-bar">
  <div class="mt-wrap mt-bar__in">
    <span class="mt-bar__logo">${MOIMTEO_MARK}<b>모임터</b><span class="mt-bar__tag">마음 맞는 사람들의 마당</span></span>
    <span class="mt-bar__me">${me ? `${avatarHtml(me.nick, 26)}<b>${esc(me.nick)}</b>님` : `<a class="mt-bar__join" href="join.html">마당 들어가기</a>`}</span>
  </div>
</div>`;
}

function heroHtml() {
  const me = member();
  const total = 3482 + (me ? 1 : 0);
  return `
<header class="mt-hp">
  <div class="mt-wrap mt-hp__in">
    <a class="mt-hp__name" href="index.html" aria-label="신명마당 첫 화면">
      ${OBANG}
      <span class="mt-hp__txt"><span class="mt-hp__title">신명마당</span><span class="mt-hp__sub">무속인과 손님이 함께하는 마당</span></span>
    </a>
    <div class="mt-hp__side">
      <p class="mt-hp__stat">마당 식구 <b>${total.toLocaleString('ko-KR')}</b> · 마당지기 <b>대추나무</b></p>
      <p class="mt-hp__since">2009년 4월에 문을 연 마당</p>
      ${me ? `<p class="mt-hp__me">${esc(me.nick)}님 · ${gradeBadge(me.grade || '손님')}</p>` : '<a class="mt-btn mt-btn--gold" href="join.html">마당 들어가기</a>'}
    </div>
  </div>
</header>`;
}

function menuHtml(active) {
  const items = [
    `<li><a href="index.html"${active === 'all' ? ' aria-current="page"' : ''}><span>전체 글</span><em>${POSTS.length}</em></a></li>`,
    ...BOARDS.map((b) => `<li><a href="index.html?board=${b.id}"${active === b.id ? ' aria-current="page"' : ''}${b.locked ? ' class="is-locked"' : ''}><span>${esc(b.name)}${b.locked ? ` ${LOCK}<small>${esc(b.locked)} 이상</small>` : ''}</span><em>${b.locked ? b.count : boardCount(b.id)}</em></a></li>`),
  ].join('');
  return `
<nav class="mt-menu" aria-label="게시판">
  <h2 class="mt-menu__h">게시판</h2>
  <ul class="mt-menu__list">${items}</ul>
</nav>`;
}

function sideHtml(active) {
  const me = member();
  return `
<aside class="mt-side">
  <section class="mt-mebox" aria-label="내 정보">
    ${me ? `<div class="mt-mebox__row">${avatarHtml(me.nick, 40)}<div><p class="mt-mebox__nick"><b>${esc(me.nick)}</b>님 ${gradeBadge(me.grade || '손님')}</p><p class="mt-mebox__s">쓴 댓글 ${Object.values(siteState().comments || {}).reduce((a, l) => a + l.length, 0)}개</p></div></div>
      <a class="mt-btn mt-btn--line" href="join.html">단골 신청 안내</a>`
    : `<p class="mt-mebox__guest">마당에 들어오면 댓글을 쓸 수 있어요.</p><a class="mt-btn" href="join.html">마당 들어가기</a>`}
  </section>
  ${menuHtml(active)}
  <form class="mt-find" action="index.html" method="get" role="search">
    <label for="mt-q">마당 안 찾기</label>
    <div class="mt-find__row"><input id="mt-q" name="q" type="search" placeholder="제목·내용" autocomplete="off" enterkeyhint="search"><button type="submit">찾기</button></div>
  </form>
  <section class="mt-sidebox" aria-label="마당 알림">
    <h2 class="mt-menu__h">마당지기 한마디</h2>
    <p>아픈 분은 병원부터. 소문보다 안부를. 서로 존중하는 말로 이야기해 주세요.</p>
  </section>
</aside>`;
}

function footerHtml() {
  return `
<footer class="mt-foot">
  <div class="mt-wrap">
    <p class="mt-foot__links"><span>모임터 이용약관</span><span>개인정보 처리 방침</span><span>모임 신고하기</span></p>
    <p>신명마당은 모임터에서 회원들이 꾸려 가는 모임입니다. 게시글의 내용은 글쓴이의 생각이며 모임터의 의견이 아닙니다.</p>
    <p class="mt-foot__c">© 모임터</p>
  </div>
</footer>`;
}

/**
 * 페이지 공용 시작. 본문은 <div id="mt-body"></div> 안에 그린다.
 * HTML에는 <div id="mt-head"></div> · <div id="mt-layout"><div id="mt-body"></div></div> · <div id="mt-foot"></div>
 */
export function start({ page, title, active = 'all' }) {
  const head = document.getElementById('mt-head');
  const layout = document.getElementById('mt-layout');
  const foot = document.getElementById('mt-foot');
  if (head) head.outerHTML = barHtml() + heroHtml();
  if (layout) layout.insertAdjacentHTML('afterbegin', sideHtml(active));
  if (foot) foot.outerHTML = footerHtml();
  const g = boot({ siteId: SITE_ID, page, title });
  bindNicks();
  return g;
}

/** 내 정보가 바뀌면(가입) 머리말을 다시 그린다 */
export function refreshChrome(active) {
  document.querySelector('.mt-bar')?.replaceWith(htmlToEl(barHtml()));
  document.querySelector('.mt-hp')?.replaceWith(htmlToEl(heroHtml()));
  const side = document.querySelector('.mt-side');
  if (side) side.replaceWith(htmlToEl(sideHtml(active)));
}

function htmlToEl(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export { BOARDS, MEMBERS, POSTS, GRADES, game };
