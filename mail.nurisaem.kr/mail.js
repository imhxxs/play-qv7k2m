// 누리메일 — 게임의 허브. 해시 라우팅:
//   #inbox #spam #sent #drafts #contacts       메일함
//   #read/<id>                                 받은 메일 읽기
//   #sent/<id>                                 보낸 메일 보기(읽음 표시)
//   #compose  #compose/<draftId>  #compose?to=|re=|fw=   쓰기(자동 임시 저장)
//   #card/<cardId>                             그 카드를 준 메일 찾아 열기(수첩 '원문 보기'용)
// 3단(메일함 / 목록 / 본문). 760px 이하에서는 목록 ↔ 본문 전환, 메일함은 서랍.

import { boot } from '../src/game.js';
import { h, rafOnce } from './util.js';
import { createViewer, createPicker } from './attach.js';
import { contactsOf } from './book.js';
import { renderCompose } from './compose.js';
import { listItems, emptyListText, renderReader, renderSent, renderContacts, renderPlaceholder, extrasOf, FOLDER_TITLES } from './views.js';

const game = boot({ siteId: 'nurimail', page: 'index', title: '누리메일', reserveBottom: false });

const $ = (id) => document.getElementById(id);
const el = { app: $('app'), list: $('list'), main: $('main'), folders: $('folders'), scrim: $('scrim'), menu: $('btn-menu'), me: $('me') };
const SITE_KEY = 'site.nurimail';
const FOLDERS = ['inbox', 'spam', 'sent', 'drafts'];

const app = {
  game,
  state: { folder: 'inbox', q: '', route: null },
  mainView: null,
  mainKey: '',
  drafts() {
    const d = game.get(SITE_KEY, {})?.drafts || {};
    return Object.values(d).filter(Boolean).sort((a, b) => (b.t || 0) - (a.t || 0));
  },
  saveDraft(rec) {
    const copy = JSON.parse(JSON.stringify(rec));
    return game.update(SITE_KEY, (d) => {
      d.drafts ||= {};
      d.drafts[copy.id] = copy;
    });
  },
  deleteDraft(id) {
    if (!id) return Promise.resolve();
    return game.update(SITE_KEY, (d) => {
      if (d.drafts) delete d.drafts[id];
    });
  },
  inboxRaw: () => game.get('mail', {})?.inbox || [],
  contacts: () => contactsOf(game),
};
app.viewer = createViewer(app);
app.picker = createPicker(app);

// ── 머리줄 ────────────────────────────────────────────────────

function renderMe() {
  const p = game.profile;
  el.me.replaceChildren(p ? h('span', null, h('b', null, p.name), ' ', h('span', { class: 'addr' }, game.email)) : '');
}

// ── 메일함(폴더) ──────────────────────────────────────────────

function renderFolders() {
  const counts = {
    inbox: game.mail.inbox({ folder: 'inbox' }).filter((m) => !m.read).length,
    spam: game.mail.inbox({ folder: 'spam' }).filter((m) => !m.read).length,
    drafts: app.drafts().length,
  };
  for (const c of el.folders.querySelectorAll('[data-count]')) {
    const n = counts[c.dataset.count] || 0;
    c.textContent = n ? String(n) : '';
    c.hidden = !n;
    c.closest('.folder')?.setAttribute('aria-label', `${FOLDER_TITLES[c.dataset.count]}${n ? ` ${c.dataset.count === 'drafts' ? '' : '안 읽음 '}${n}` : ''}`);
  }
  const cur = app.state.route?.name === 'contacts' ? 'contacts' : app.state.folder;
  for (const a of el.folders.querySelectorAll('.folder')) {
    const on = a.dataset.folder === cur;
    a.classList.toggle('is-active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}

// ── 목록 ──────────────────────────────────────────────────────

let listHead = null;
let listBody = null;
let listTitle = null;
let listCount = null;
let searchIn = null;

function mountList() {
  listTitle = h('h2', { class: 'list__title' });
  listCount = h('span', { class: 'list__count' });
  searchIn = h('input', { class: 'list__search', type: 'search', placeholder: '메일 검색', 'aria-label': '이 메일함에서 검색', autocomplete: 'off', enterkeyhint: 'search' });
  searchIn.addEventListener('input', () => { app.state.q = searchIn.value; renderListBody(); });
  listHead = h('div', { class: 'list__head' }, h('div', { class: 'list__titlerow' }, listTitle, listCount), h('div', { class: 'list__searchwrap' }, searchIn));
  listBody = h('div', { class: 'list__body', role: 'list' });
  el.list.replaceChildren(listHead, listBody);
}

function renderListBody() {
  const f = app.state.folder;
  listTitle.textContent = FOLDER_TITLES[f] || '';
  const { items, total, unread } = listItems(app);
  listCount.textContent = f === 'inbox' || f === 'spam' ? (unread ? `안 읽음 ${unread} · 전체 ${total}` : `전체 ${total}`) : (total ? `${total}통` : '');
  const banner = f === 'spam'
    ? h('p', { class: 'note note--warn note--list' }, '스팸으로 분류된 메일입니다. 받은 지 30일이 지나면 자동으로 지워집니다.')
    : null;
  const rows = items.length ? items.map((a) => h('div', { role: 'listitem' }, a)) : [h('p', { class: 'list__empty' }, emptyListText(f, app.state.q))];
  listBody.replaceChildren(...[banner, ...rows].filter(Boolean));
}

// ── 본문(읽기·쓰기·주소록) ────────────────────────────────────

function setMain(view, key) {
  try { app.mainView?._leave?.(); } catch (e) { console.warn(e); }
  app.mainView = view;
  app.mainKey = key;
  el.main.replaceChildren(view);
}

const contactsSig = () => contactsOf(game).map((c) => c.addr).join(',');

function renderMain(r) {
  if (r.name === 'read') return setMain(renderReader(app, r.id), 'read:' + r.id + (game.mail.get(r.id) ? '' : ':missing'));
  if (r.name === 'sent' && r.id) return setMain(renderSent(app, r.id), 'sent:' + r.id);
  if (r.name === 'compose') {
    const v = renderCompose(app, { draftId: r.id, query: r.query });
    setMain(v, 'compose:' + (r.id || r.query.toString()));
    if (!matchMedia('(hover: none)').matches) requestAnimationFrame(() => v._focus?.());
    return;
  }
  if (r.name === 'contacts') { const v = renderContacts(app); v._sig = contactsSig(); return setMain(v, 'contacts'); }
  return setMain(renderPlaceholder(app), 'empty:' + app.state.folder);
}

// ── 라우터 ────────────────────────────────────────────────────

function parseHash() {
  let raw = location.hash.replace(/^#/, '');
  try { raw = decodeURIComponent(raw); } catch { /* 그대로 */ }
  const qi = raw.indexOf('?');
  const path = qi >= 0 ? raw.slice(0, qi) : raw;
  const query = new URLSearchParams(qi >= 0 ? raw.slice(qi + 1) : '');
  const [name, ...rest] = path.split('/');
  return { name: name || 'inbox', id: rest.join('/') || null, query };
}

function findMailForCard(cardId) {
  for (const m of game.mail.inbox()) {
    const { atts, grant } = extrasOf(game, m);
    if (grant.includes(cardId) || atts.includes(cardId)) return m;
  }
  return null;
}

function route() {
  const r = parseHash();
  closeDrawer();
  if (r.name === 'card') {
    const m = r.id ? findMailForCard(r.id) : null;
    if (!m) game.toast('그 카드가 온 메일을 찾지 못했어요.', { kind: 'warn' });
    location.replace('#' + (m ? 'read/' + encodeURIComponent(m.id) : 'inbox'));
    return;
  }
  if (!['inbox', 'spam', 'sent', 'drafts', 'contacts', 'read', 'compose'].includes(r.name)) {
    location.replace('#inbox');
    return;
  }
  app.state.route = r;
  let pane = 'list';
  let mode = 'mail';
  if (r.name === 'read') {
    const m = game.mail.get(r.id);
    if (m) app.state.folder = m.folder === 'spam' ? 'spam' : 'inbox';
    pane = 'main';
  } else if (r.name === 'sent') {
    app.state.folder = 'sent';
    if (r.id) pane = 'main';
  } else if (r.name === 'compose') {
    pane = 'main';
  } else if (r.name === 'contacts') {
    pane = 'main';
    mode = 'contacts';
  } else if (FOLDERS.includes(r.name)) {
    if (app.state.folder !== r.name) { app.state.q = ''; if (searchIn) searchIn.value = ''; }
    app.state.folder = r.name;
  }
  el.app.dataset.pane = pane;
  el.app.dataset.mode = mode;
  el.app.dataset.folder = app.state.folder;
  renderFolders();
  renderListBody();
  renderMain(r);
  if (pane === 'main') {
    el.main.scrollTop = 0;
    el.main.querySelector('.reader__scroll')?.scrollTo?.(0, 0);
  }
  // 받은 메일을 열면 제목으로 초점(화면 읽기 프로그램용), 목록으로 돌아오면 목록으로
  if (r.name === 'read' || (r.name === 'sent' && r.id)) setTimeout(() => el.main.querySelector('#r-subject')?.focus({ preventScroll: true }), 0);
}

// ── 데이터가 바뀌면 ───────────────────────────────────────────

const refresh = rafOnce(() => {
  renderFolders();
  renderListBody();
  const r = app.state.route;
  if (!r) return;
  // 기다리던 메일이 도착했으면 다시 그린다
  if (r.name === 'read' && app.mainKey.endsWith(':missing') && game.mail.get(r.id)) renderMain(r);
  else if (r.name === 'sent' && r.id) app.mainView?._update?.();
  else if (r.name === 'compose') app.mainView?._refresh?.();
  else if (r.name === 'contacts') { if (app.mainView?._sig !== contactsSig()) renderMain(r); }
  else if (app.mainKey.startsWith('empty:')) renderMain(r);
});

game.mail.subscribe(refresh);
game.on('change:' + SITE_KEY, refresh);
game.on('flag', (f) => { if (String(f).startsWith('visit:') || String(f).startsWith('addr:')) refresh(); });
game.on('profile', () => { renderMe(); refresh(); });

// 탭을 떠날 때 쓰던 메일을 저장
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') { try { app.mainView?._leave?.(); } catch { /* ignore */ } }
});

// ── 모바일 메일함 서랍 ────────────────────────────────────────

function openDrawer() {
  el.app.classList.add('is-drawer');
  el.scrim.hidden = false;
  el.menu.setAttribute('aria-expanded', 'true');
  el.menu.setAttribute('aria-label', '메일함 목록 닫기');
  el.folders.querySelector('.folder.is-active, .folder')?.focus();
}
function closeDrawer() {
  if (!el.app.classList.contains('is-drawer')) return;
  el.app.classList.remove('is-drawer');
  el.scrim.hidden = true;
  el.menu.setAttribute('aria-expanded', 'false');
  el.menu.setAttribute('aria-label', '메일함 목록 열기');
}
el.menu.addEventListener('click', () => (el.app.classList.contains('is-drawer') ? closeDrawer() : openDrawer()));
el.scrim.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && el.app.classList.contains('is-drawer')) { e.preventDefault(); closeDrawer(); el.menu.focus(); } });
el.folders.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });

// ── 시작 ──────────────────────────────────────────────────────

mountList();
renderMe();
window.addEventListener('hashchange', route);
if (!location.hash || location.hash === '#') history.replaceState(null, '', '#inbox');
route();
game.setAddress(null);
