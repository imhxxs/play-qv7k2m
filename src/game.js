// 명두 게임 엔진의 입구. 모든 페이지가 이 파일 하나를 import 한다.
//
//   <script type="module">
//     import { boot } from '../src/game.js';
//     const game = boot({ siteId: 'wolhadang', page: 'gallery', title: '신당 갤러리 — 월하당' });
//   </script>
//
// API 전체 설명은 docs/DEV.md 를 본다.

import * as state from './core/state.js';
import * as progress from './core/progress.js';
import * as chapters from './core/chapters.js';
import { createMail } from './core/mail.js';
import { initAudio, setAudioSettings, sfx as playSfx, SFX_KEYS } from './core/audio.js';
import { fill as fillTemplate, josa } from './core/josa.js';
import { SITES, fakeAddress, resolveAddress } from './core/sites.js';
import { url as realUrl, ROOT } from './core/url.js';
import { exportCode, importCode, parseCode } from './core/code.js';
import { clone, esc, createEmitter } from './core/util.js';
import { CARDS } from './data/cards/index.js';
import { CHAPTERS, DEADLINE } from './data/chapters.js';
import { PUZZLES, HINT_COOLDOWN_MS } from './data/hints.js';
import { mountChrome, applyHtmlFlags } from './ui/chrome.js';
import { createUrlbar } from './ui/urlbar.js';
import { createToaster } from './ui/toast.js';
import { createDeadline, createBanners, showStaleOverlay } from './ui/topbars.js';
import { createNotebook } from './ui/notebook.js';
import { showChapterCard } from './ui/chapter-card.js';
import { playScare, SCARE_KINDS } from './ui/scare.js';
import { defineCollect } from './ui/collect.js';
import { setFavicon } from './ui/favicon.js';

const CORE_KEYS = ['profile', 'progress', 'evidence', 'mail', 'hints', 'settings'];
const RESERVED_IDS = new Set(['sanullim63', 'mailerdaemon', 'admin', 'postmaster', 'root', 'guest']);

const emitter = createEmitter();
const ctx = {
  siteId: null,
  page: null,
  booted: false,
  opts: {},
  ui: null,
  baseTitle: '',
  addressOverride: null,
  queuedMail: [],
  shownCards: new Set(),
  cardOpen: false,
  lastJing: 0,
  scareActive: false,
};

state.init({ watchKeys: CORE_KEYS });

const settings = () => state.peek('settings');
const profileNow = () => state.peek('profile');

// ── game 객체 ─────────────────────────────────────────────────

export const game = {
  /** 현재 페이지의 사이트 ID / 페이지 이름 */
  get siteId() { return ctx.siteId; },
  get page() { return ctx.page; },
  /** 프로필 { name, id, honorific, createdAt } 또는 null */
  get profile() { return clone(profileNow()); },
  /** 플레이어 메일 주소 '{아이디}@nurisaem.kr' */
  get email() { return game.mail.myAddress(); },
  /** 현재 설정 복사본 { sound, volume, scares, fastMail, reduceMotion } */
  get settings() { return { ...settings() }; },
  /** 현재 장 정의 { id, title, date, dateLabel, dday, comingSoon? } */
  get chapter() { return chapters.currentChapter(); },
  /** 게임 날짜 'YYYY-MM-DD' */
  get gameDate() { return chapters.currentChapter().date; },
  chapters: CHAPTERS,
  puzzles: PUZZLES,
  sites: SITES,
  sfxKeys: SFX_KEYS,
  scareKinds: SCARE_KINDS,
  root: ROOT.href,

  // 텍스트
  fill: (text) => fillTemplate(text, profileNow()),
  josa,
  esc,

  // 저장소
  get: state.get,
  update: state.update,

  // 플래그·퍼즐
  flag: progress.flag,
  has: progress.has,
  solve: progress.solve,
  solved: progress.solved,
  /** 조건 함수용 상태 보기 { chapter, has, viewed, collected, solved } */
  state: progress.stateView,

  // 카드
  view: (id) => progress.view(id),
  viewed: progress.viewed,
  collect: progress.collect,
  uncollect: progress.uncollect,
  collected: progress.collected,
  collectButton(el, cardId, { view = true, label } = {}) {
    const c = document.createElement('md-collect');
    c.setAttribute('card', cardId);
    if (!view) c.setAttribute('noview', '');
    if (label) c.setAttribute('label', label);
    el?.append(c);
    return c;
  },
  cards: {
    get: (id) => CARDS.get(id) || null,
    all: () => [...CARDS.values()],
    viewed: () => cardEntries().sort((a, b) => b.viewedAt - a.viewedAt),
    collected: () => cardEntries().filter((e) => e.collected).sort((a, b) => b.pinnedAt - a.pinnedAt),
  },

  // 주소·링크
  url: realUrl,
  link,
  open: openSite,
  resolve: resolveAddress,
  fakeAddress,
  setAddress,
  setTitle,
  hydrate,

  // 메일
  mail: null, // 아래에서 채움

  // 연출
  toast(msg, opts) {
    if (!ctx.ui) { console.info('[md toast]', msg); return null; }
    return ctx.ui.toast(msg, opts);
  },
  sfx: (key, opts) => playSfx(key, opts),
  scare,

  // 설정
  setSetting(key, value) {
    const t = Date.now();
    const p = state.update('settings', (d) => { d[key] = value; d.t = t; });
    if (key === 'fastMail' && value) game.mail.hurryPending();
    return p;
  },

  // 이벤트
  on: emitter.on,

  // 수첩
  notebook: {
    open: (tab) => ctx.ui?.notebook.open(tab),
    close: () => ctx.ui?.notebook.close(),
    toggle: (tab) => ctx.ui?.notebook.toggle(tab),
    isOpen: () => !!ctx.ui?.notebook.isOpen(),
  },

  // 진행 관리
  validateProfile,
  newGame,
  reset: () => state.wipe({ keep: ['settings'] }),
  progressCode: { export: exportCode, import: importCode, parse: parseCode },
  isMemoryMode: state.isMemoryMode,

  boot,
};

game.mail = createMail({
  game,
  getProfile: profileNow,
  getGameDate: () => chapters.currentChapter().date,
  getSettings: settings,
});

export default game;

// ── 내부 도우미 ────────────────────────────────────────────────

function cardEntries() {
  const cards = state.peek('evidence').cards || {};
  return Object.entries(cards).map(([id, e]) => ({
    id,
    card: CARDS.get(id) || null,
    viewedAt: e.viewedAt || 0,
    pinnedAt: e.pinnedAt || 0,
    collected: !!e.pinnedAt,
  }));
}

/** <a> 요소 만들기. 다른 사이트면 target="mdw_<siteId>"(새 탭), 같은 사이트면 같은 탭. */
function link(siteId, page = 'index', query, { text, className, sameTab = false, html } = {}) {
  const a = document.createElement('a');
  a.href = realUrl(siteId, page, query);
  if (siteId !== ctx.siteId && !sameTab) a.target = 'mdw_' + siteId;
  a.dataset.site = siteId;
  if (className) a.className = className;
  if (html != null) a.innerHTML = html;
  else if (text != null) a.textContent = text;
  return a;
}

/**
 * 자바스크립트로 사이트 탭을 연다. 반드시 클릭 핸들러 안에서 await 없이 부른다(팝업 차단 방지).
 * 차단되면 토스트로 '눌러서 열기'를 보여 준다. 반환: 열린 창 또는 null
 */
function openSite(siteId, page = 'index', query) {
  const href = realUrl(siteId, page, query);
  const name = siteId === ctx.siteId ? '_self' : 'mdw_' + siteId;
  let w = null;
  try { w = window.open(href, name); } catch { w = null; }
  if (!w && name !== '_self') {
    game.toast('새 창이 차단되었어요.', { kind: 'warn', action: { label: '여기를 눌러 열기', href, target: name }, sticky: true });
  }
  return w;
}

function currentAddress() {
  if (ctx.addressOverride != null) return ctx.addressOverride;
  return fakeAddress(ctx.siteId, ctx.page, location.search, location.hash);
}

function refreshAddress() {
  ctx.ui?.urlbar?.setAddress(currentAddress());
}

/** 주소창 표기를 바꾼다. 문자열이면 그대로, 객체면 { page, query }로 계산. null이면 자동 */
function setAddress(addr) {
  if (addr == null) ctx.addressOverride = null;
  else if (typeof addr === 'string') ctx.addressOverride = addr;
  else {
    const q = addr.query ?? '';
    const s = typeof q === 'string' ? q : new URLSearchParams(q).toString();
    const search = s && !s.startsWith('?') && !s.startsWith('#') ? '?' + s : s;
    ctx.addressOverride = fakeAddress(ctx.siteId, addr.page || ctx.page, search, addr.hash || '');
  }
  refreshAddress();
}

function navigate(input) {
  const r = resolveAddress(input);
  if (r && r.known) {
    location.href = realUrl(r.siteId, r.page, r.search + r.hash);
    return;
  }
  location.href = realUrl('notfound', 'notfound', { u: input });
}

function setTitle(t) {
  ctx.baseTitle = String(t ?? '');
  refreshTitle();
}

function refreshTitle() {
  if (!ctx.booted) return;
  const n = ctx.opts.unreadBadge ? game.mail.unreadCount() : 0;
  document.title = (n ? `(${n}) ` : '') + ctx.baseTitle;
  const def = SITES[ctx.siteId];
  const icon = ctx.opts.favicon || def?.icon || { bg: '#333', fg: '#fff', text: '?' };
  try { setFavicon(icon, typeof icon === 'string' ? 0 : n); } catch { /* ignore */ }
}

/** data-site 링크, data-fill 텍스트, data-view 열람 기록을 채운다. 동적으로 넣은 HTML에도 부른다. */
function hydrate(root = document) {
  const all = (sel) => [...(root.matches?.(sel) ? [root] : []), ...root.querySelectorAll(sel)];
  for (const a of all('a[data-site]')) {
    const sid = a.dataset.site;
    if (!SITES[sid]) { console.warn(`[md] data-site="${sid}" — sites.js에 없는 사이트`); continue; }
    try { a.href = realUrl(sid, a.dataset.page || 'index', a.dataset.query || ''); } catch (e) { console.warn(e); }
    if (sid !== ctx.siteId && !a.hasAttribute('data-same-tab')) a.target = 'mdw_' + sid;
  }
  for (const el of all('[data-fill]')) fillTextNodes(el);
  for (const el of all('[data-view]')) observeView(el);
  return root;
}

function fillTextNodes(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) if (n.nodeValue.includes('{')) n.nodeValue = game.fill(n.nodeValue);
}

const observed = new WeakSet();
let viewIO = null;
function observeView(el) {
  if (observed.has(el)) return;
  observed.add(el);
  const ids = String(el.dataset.view || '').split(/[\s,]+/).filter(Boolean);
  if (!ids.length) return;
  if (!('IntersectionObserver' in window)) { ids.forEach((id) => progress.view(id)); return; }
  viewIO ||= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      String(e.target.dataset.view || '').split(/[\s,]+/).filter(Boolean).forEach((id) => progress.view(id));
      viewIO.unobserve(e.target);
    }
  });
  viewIO.observe(el);
}

/** 프로필 검사. 반환: { ok, value, errors: { name?, id?, honorific? } } */
function validateProfile({ name, id, honorific } = {}) {
  const errors = {};
  const n = String(name ?? '').trim().replace(/\s+/g, ' ');
  const i = String(id ?? '').trim().toLowerCase();
  if (!n) errors.name = '이름을 적어 주세요.';
  else if ([...n].length > 10) errors.name = '이름은 10자 이내로 적어 주세요.';
  else if (!/^[가-힣a-zA-Z0-9 ·]+$/.test(n)) errors.name = '이름은 한글·영문·숫자만 쓸 수 있어요.';
  if (!i) errors.id = '아이디를 적어 주세요.';
  else if (!/^[a-z0-9]{3,16}$/.test(i)) errors.id = '아이디는 영문 소문자와 숫자 3~16자예요.';
  else if (RESERVED_IDS.has(i)) errors.id = '이미 쓰이는 아이디예요. 다른 아이디를 골라 주세요.';
  if (honorific !== '언니' && honorific !== '누나') errors.honorific = '호칭을 골라 주세요.';
  const ok = !Object.keys(errors).length;
  return { ok, errors, value: ok ? { name: n, id: i, honorific } : null };
}

/** 새 게임: 진행을 지우고(설정은 남김) 프로필과 초기 받은편지함을 만든다. */
function newGame(input) {
  const { ok, errors, value } = validateProfile(input);
  if (!ok) {
    const err = new Error(Object.values(errors)[0]);
    err.errors = errors;
    throw err;
  }
  state.wipe({ keep: ['settings'] });
  const now = Date.now();
  state.writeAll({
    profile: { ...value, createdAt: now, warnAck: true },
    progress: state.DEFAULTS.progress(),
    evidence: state.DEFAULTS.evidence(),
    mail: game.mail.initialMailState(now, CHAPTERS[0].date),
    hints: {},
  });
  try { navigator.storage?.persist?.(); } catch { /* ignore */ }
  return game.profile;
}

// ── 깜짝 연출 ──────────────────────────────────────────────────

/**
 * scare({ kind, text, sound, durationMs, id, chance })
 *   kind  'flash'(기본) | 'glitch' | 'mirror' | 'shadow' | 'whisper'(은은함, 기본 무음)
 *   sound 효과음 키(기본 'sting', whisper는 null). null이면 무음
 *   id    주면 게임 전체에서 한 번만
 *   chance 0~1 확률로만 실행
 * 설정 '깜짝 연출'이 꺼져 있거나 탭이 안 보이면 아무것도 하지 않고 false.
 * 진행에 필요한 단서를 이 연출에만 두지 않는다.
 */
async function scare(opts = {}) {
  if (!ctx.ui) return false;
  if (!settings().scares) return false;
  if (document.visibilityState !== 'visible') return false;
  if (ctx.scareActive) return false;
  if (opts.chance != null && Math.random() >= opts.chance) return false;
  if (opts.id) {
    const f = 'scare:' + opts.id;
    if (progress.has(f)) return false;
    progress.flag(f);
  }
  const kind = opts.kind || 'flash';
  const sound = opts.sound === undefined ? (kind === 'whisper' ? null : 'sting') : opts.sound;
  ctx.scareActive = true;
  try {
    if (sound) playSfx(sound);
    await playScare(ctx.ui.layer, { kind, text: opts.text ? game.fill(opts.text) : '', durationMs: opts.durationMs, reduceMotion: !!settings().reduceMotion });
  } finally {
    ctx.scareActive = false;
  }
  return true;
}

// ── 상태 변경 → 이벤트·UI ─────────────────────────────────────

function diffAndEmit(key, prev, next) {
  if (key === 'progress') {
    const pf = prev?.flags || {};
    for (const f of Object.keys(next?.flags || {})) if (!pf[f]) emitter.emit('flag', f);
    const pp = prev?.puzzles || {};
    for (const [id, v] of Object.entries(next?.puzzles || {})) if (v?.solvedAt && !pp[id]?.solvedAt) emitter.emit('solve', id);
    const a = prev?.chapter || 1;
    const b = next?.chapter || 1;
    if (a !== b) emitter.emit('chapter', { from: a, to: b });
  } else if (key === 'evidence') {
    const pc = prev?.cards || {};
    for (const [id, v] of Object.entries(next?.cards || {})) {
      if (!pc[id]) emitter.emit('view', id);
      if (v?.pinnedAt && !pc[id]?.pinnedAt) emitter.emit('collect', id);
    }
  } else if (key === 'mail') {
    const ids = new Set((prev?.inbox || []).map((x) => x.id));
    const fresh = (next?.inbox || []).filter((x) => !ids.has(x.id));
    if (fresh.length) emitter.emit('mail', fresh.map((x) => game.mail.render(x)));
  } else if (key === 'settings') {
    emitter.emit('settings', { ...next });
  } else if (key === 'profile') {
    emitter.emit('profile', next ? { ...next } : null);
  }
}

state.on('change', ({ key, prev, next, source }) => {
  diffAndEmit(key, prev, next);
  emitter.emit('change', { key, source });
  emitter.emit('change:' + key, { key, source, value: next });
  chapters.scheduleEvaluate();
  if (ctx.booted) refreshUi(key);
});

state.on('stale', () => {
  emitter.emit('stale');
  if (ctx.ui) showStaleOverlay(ctx.ui.layer);
});

state.on('memory', () => refreshBanners());

chapters.setOnEnter((ch) => {
  try { ch.onEnter?.(game); } catch (e) { console.error('[md] onEnter 오류', e); }
});

emitter.on('mail', (items) => {
  if (!ctx.booted || !ctx.opts.mailToasts) return;
  ctx.queuedMail.push(...items);
  flushMailToasts();
});

emitter.on('collect', () => {
  if (ctx.booted && !ctx.ui.notebook.isOpen()) ctx.ui.notebook.setDot(true);
});

function flushMailToasts() {
  if (document.visibilityState !== 'visible' || !ctx.queuedMail.length) return;
  const items = ctx.queuedMail.splice(0);
  const inMail = ctx.siteId === 'nurimail';
  for (const m of items) {
    const msg = `새 메일 · ${m.from?.name || m.from?.addr || ''} — ${m.subject}`;
    const href = realUrl('nurimail', 'index', '#read/' + m.id);
    ctx.ui.toast(msg, {
      id: 'mail:' + m.id,
      kind: 'mail',
      action: { label: '열기', href, target: inMail ? null : 'mdw_nurimail' },
    });
  }
  playSfx('ding');
}

function refreshUi(key) {
  const ui = ctx.ui;
  if (key === 'settings') {
    const s = settings();
    applyHtmlFlags(ui.wrap, s);
    setAudioSettings(s);
  }
  if (key === 'progress' || key === 'evidence') {
    refreshDeadline();
    checkChapterCards();
  }
  if (key === 'mail') refreshTitle();
  if (key === 'profile') refreshBanners();
  if (key !== 'mail') ui.notebook.render();
}

function refreshDeadline() {
  const ui = ctx.ui;
  if (!ui || !ctx.opts.deadline) return;
  const visible = chapters.deadlineVisible();
  const ch = chapters.currentChapter();
  ui.deadline.update({ visible, dday: ch.dday, text: DEADLINE.label });
  if (visible && !progress.has('deadline:noticed') && document.visibilityState === 'visible') {
    progress.flag('deadline:noticed');
    ctx.lastJing = Date.now();
    playSfx('jing');
    ui.toast(DEADLINE.notice, { id: 'deadline-notice', kind: 'deadline', durationMs: 12000 });
  }
}

function refreshBanners() {
  const ui = ctx.ui;
  if (!ui) return;
  if (ctx.opts.profileBanner && !profileNow()) {
    ui.banners.show('profile', {
      text: '아직 시작 화면을 거치지 않았어요. 이름을 정하면 메일과 단서가 제대로 이어집니다.',
      action: { label: '시작 화면으로', href: realUrl('start', 'index') },
      dismissable: false,
    });
  } else ui.banners.hide('profile');
  if (state.isMemoryMode()) {
    ui.banners.show('memory', {
      kind: 'warn',
      text: '이 브라우저에서는 진행이 저장되지 않습니다(저장소 차단 또는 시크릿 모드). 탭을 닫으면 처음부터 시작하고, 다른 탭과도 이어지지 않아요.',
    });
  }
}

function checkChapterCards() {
  if (!ctx.booted || ctx.cardOpen || ctx.opts.chapterCards === false) return;
  if (document.visibilityState !== 'visible' || state.isStale()) return;
  const p = state.peek('progress');
  const froms = Object.keys(p.transitions || {})
    .map(Number)
    .filter((f) => !p.cardsSeen?.[f] && !ctx.shownCards.has(f))
    .sort((a, b) => a - b);
  if (!froms.length) return;
  const from = froms[0];
  const fromCh = chapters.chapterById(from);
  if (!fromCh) { ctx.shownCards.add(from); return; }
  ctx.shownCards.add(from);
  ctx.cardOpen = true;
  const fresh = Date.now() - (p.transitions[from] || 0) < 8000;
  setTimeout(() => {
    if (Date.now() - ctx.lastJing > 4000) playSfx('jing');
    showChapterCard(ctx.ui.layer, {
      from: fromCh,
      to: chapters.chapterById(from + 1),
      reduceMotion: !!settings().reduceMotion,
      onCopyCode: copyProgressCode,
    }).then(() => {
      ctx.cardOpen = false;
      const t = Date.now();
      state.update('progress', (d) => {
        d.cardsSeen ||= {};
        if (!d.cardsSeen[from]) d.cardsSeen[from] = t;
      });
      checkChapterCards();
    });
  }, fresh ? 1600 : 250);
}

async function copyProgressCode() {
  const code = exportCode();
  try {
    await navigator.clipboard.writeText(code);
    game.toast('진행 코드를 복사했습니다. 메모장 같은 곳에 붙여 넣어 보관하세요.');
  } catch {
    game.toast('복사하지 못했어요. 수첩 › 설정에서 진행 코드를 직접 복사해 주세요.', { kind: 'warn' });
  }
}

// 수첩이 쓰는 내부 도우미(game을 상속한 객체로 넘긴다)
const notebookApi = Object.assign(Object.create(game), {
  _openPuzzles: () => chapters.openPuzzles(),
  _hintState: (id) => state.peek('hints')[id] || { level: 0 },
  _hintsUsedMax: () => Math.max(0, ...Object.values(state.peek('hints')).map((e) => e?.level || 0)),
  _revealHint(id, level) {
    const st = state.peek('hints')[id] || { level: 0 };
    const cur = st.level || 0;
    if (level !== cur + 1) return;
    if (level === 3 && st.t2 && Date.now() - st.t2 < HINT_COOLDOWN_MS) return;
    const t = Date.now();
    state.update('hints', (d) => {
      const e = (d[id] ||= { level: 0 });
      if ((e.level || 0) < level) {
        e.level = level;
        e['t' + level] = t;
      }
    });
  },
  _deadlineText: () => (chapters.deadlineVisible() ? `D-${chapters.currentChapter().dday}` : ''),
  _markNotebookSeen: () => {},
});

// ── boot ──────────────────────────────────────────────────────

/**
 * 페이지마다 한 번 부른다.
 * opts: {
 *   siteId, page, title,
 *   urlbar=true, notebookButton=true, mailToasts=true, deadline=true, profileBanner=true,
 *   chapterCards=true, reserveBottom=true, unreadBadge=(siteId==='nurimail'),
 *   address(주소창 표기 고정), favicon(아이콘 객체 또는 URL)
 * }  — 시작 화면(siteId 'start')은 주소창·수첩 버튼·메일 토스트·시한 바·배너가 기본으로 꺼진다.
 */
export function boot(opts = {}) {
  if (ctx.booted) {
    console.warn('[md] boot()는 한 페이지에서 한 번만 부릅니다.');
    return game;
  }
  const siteId = opts.siteId || 'unknown';
  const page = opts.page || 'index';
  const isStart = siteId === 'start';
  ctx.siteId = siteId;
  ctx.page = page;
  const o = (ctx.opts = {
    urlbar: !isStart,
    notebookButton: !isStart,
    mailToasts: !isStart,
    deadline: !isStart,
    profileBanner: !isStart,
    chapterCards: true,
    reserveBottom: !isStart,
    unreadBadge: siteId === 'nurimail',
    ...opts,
  });
  const def = SITES[siteId];
  if (!def) console.warn(`[md] src/data/sites.js에 없는 사이트 ID: '${siteId}'`);
  try {
    if (def && (!window.name || window.name.startsWith('mdw_'))) window.name = 'mdw_' + siteId;
  } catch { /* ignore */ }
  if (o.address != null) ctx.addressOverride = String(o.address);
  ctx.baseTitle = o.title || document.title || def?.name || '명두';

  const cssHref = new URL('./styles/common.css', import.meta.url).href;
  const ui = (ctx.ui = mountChrome({ cssHref, reserveBottom: o.reserveBottom }));
  if (o.urlbar) {
    ui.urlbar = createUrlbar(ui.top, { onNavigate: navigate, insecure: siteId === 'notfound' });
    window.addEventListener('hashchange', refreshAddress);
    window.addEventListener('popstate', refreshAddress);
  }
  ui.deadline = createDeadline(ui.top);
  ui.banners = createBanners(ui.top);
  ui.toast = createToaster(ui.toasts);
  ui.notebook = createNotebook(ui.layer, notebookApi);
  ui.notebook.setButtonVisible(!!o.notebookButton);
  defineCollect(game);
  const s = settings();
  applyHtmlFlags(ui.wrap, s);
  initAudio(s);

  ctx.booted = true;
  refreshAddress();
  refreshTitle();
  refreshDeadline();
  refreshBanners();
  hydrate(document);
  progress.flag(['visit:' + siteId, `visit:${siteId}/${page}`]);

  // 메일 배달: 보이는 탭만, 1초 간격 + 탭이 다시 보일 때
  const deliver = () => {
    if (document.visibilityState === 'visible' && !state.isStale()) game.mail.deliverDue();
  };
  setInterval(deliver, 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    deliver();
    flushMailToasts();
    refreshDeadline();
    checkChapterCards();
  });
  window.addEventListener('focus', deliver);
  deliver();

  chapters.scheduleEvaluate();
  checkChapterCards();
  if (state.isStale()) showStaleOverlay(ui.layer);
  try { window.mdGame = game; } catch { /* ignore */ }
  return game;
}
