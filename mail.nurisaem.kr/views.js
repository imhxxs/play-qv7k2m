// 목록·읽기·보낸 메일·주소록 화면.

import { h, icon, shortDate, snippetOf, initialOf, toneOf, dateLabelOf, hhmm } from './util.js';
import { attachmentTiles } from './attach.js';
import { contactsOf, displayName } from './book.js';
import { enhanceM01, firstOpenAtmosphere } from './m01.js';

export const FOLDER_TITLES = { inbox: '받은편지함', sent: '보낸편지함', drafts: '임시보관함', spam: '스팸함', contacts: '주소록' };

const safe = (fn, fb) => { try { return fn() ?? fb; } catch (e) { console.warn('[nurimail]', e); return fb; } };

/** 템플릿의 추가 첨부·열람 카드(답장 종류에 따라 다른 것) */
export function extrasOf(game, mail) {
  const t = game.mail.templates[mail.templateId];
  const ctx = { vars: mail.vars || {}, game };
  const atts = [...new Set([...(mail.attachments || []), ...safe(() => t?.attachmentsFor?.(ctx), [])])];
  const grant = [...new Set([...(t?.grantCards || []), ...safe(() => t?.grantCardsFor?.(ctx), [])])];
  return { atts, grant };
}

function avatar(name, addr, small = false) {
  return h('span', { class: 'avatar' + (small ? ' avatar--sm' : ''), style: `--tone:${toneOf(addr)}`, 'aria-hidden': 'true' }, initialOf(name, addr));
}

// ── 목록 ──────────────────────────────────────────────────────

function matchQ(q, ...fields) {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  return fields.some((f) => String(f || '').toLowerCase().includes(s));
}

export function listItems(app) {
  const { game, state } = app;
  const f = state.folder;
  const q = state.q;
  const activeId = state.route?.id;

  if (f === 'inbox' || f === 'spam') {
    const mails = game.mail.inbox({ folder: f });
    const items = [];
    for (const m of mails) {
      const snip = snippetOf(m.body);
      if (!matchQ(q, m.subject, m.from?.name, m.from?.addr, snip)) continue;
      const { atts } = extrasOf(game, m);
      const a = h('a', {
        class: 'item' + (m.read ? '' : ' is-unread') + (state.route?.name === 'read' && activeId === m.id ? ' is-active' : ''),
        href: '#read/' + encodeURIComponent(m.id),
        dataset: { id: m.id },
        'aria-current': state.route?.name === 'read' && activeId === m.id ? 'true' : null,
      },
      avatar(m.from?.name, m.from?.addr),
      h('span', { class: 'item__main' },
        h('span', { class: 'item__top' },
          h('span', { class: 'item__from' }, m.from?.name || m.from?.addr || ''),
          h('span', { class: 'item__date' }, shortDate(m.dateLabel, game.gameDate))),
        h('span', { class: 'item__subject' },
          m.read ? null : h('span', { class: 'sr' }, '안 읽음 · '),
          atts.length ? icon('clip', 'ico ico--clip') : null,
          m.subject || '(제목 없음)'),
        h('span', { class: 'item__snippet' }, snip)));
      items.push(a);
    }
    return { items, total: mails.length, unread: mails.filter((m) => !m.read).length };
  }

  if (f === 'sent') {
    const sent = game.mail.sent();
    const items = [];
    for (const s of sent) {
      const name = displayName(game, s.to);
      if (!matchQ(q, s.subject, s.to, name, s.body)) continue;
      const rc = receiptOf(app, s);
      items.push(h('a', {
        class: 'item item--sent' + (state.route?.name === 'sent' && activeId === s.id ? ' is-active' : ''),
        href: '#sent/' + encodeURIComponent(s.id),
        'aria-current': state.route?.name === 'sent' && activeId === s.id ? 'true' : null,
      },
      avatar(name || s.to, s.to),
      h('span', { class: 'item__main' },
        h('span', { class: 'item__top' },
          h('span', { class: 'item__from' }, name ? `${name} <${s.to}>` : s.to),
          h('span', { class: 'item__date' }, shortDate(dateLabelOf(s.gd, s.at), game.gameDate))),
        h('span', { class: 'item__subject' }, s.attachments?.length ? icon('clip', 'ico ico--clip') : null, s.subject || '(제목 없음)'),
        h('span', { class: 'item__snippet' }, h('span', { class: `rc rc--${rc.kind}` }, rc.text), ' ', (s.body || '').slice(0, 60)))));
    }
    return { items, total: sent.length };
  }

  if (f === 'drafts') {
    const drafts = app.drafts();
    const items = drafts.filter((d) => matchQ(q, d.subject, d.to, d.body)).map((d) => h('a', {
      class: 'item item--draft' + (state.route?.name === 'compose' && activeId === d.id ? ' is-active' : ''),
      href: '#compose/' + encodeURIComponent(d.id),
    },
    avatar(d.to || '?', d.to || 'draft'),
    h('span', { class: 'item__main' },
      h('span', { class: 'item__top' },
        h('span', { class: 'item__from' }, h('span', { class: 'tag tag--draft' }, '임시'), ' ', d.to || '(받는 사람 없음)'),
        h('span', { class: 'item__date' }, hhmm(d.t))),
      h('span', { class: 'item__subject' }, d.attachments?.length ? icon('clip', 'ico ico--clip') : null, d.subject || '(제목 없음)'),
      h('span', { class: 'item__snippet' }, (d.body || '').slice(0, 80)))));
    return { items, total: drafts.length };
  }
  return { items: [], total: 0 };
}

export function emptyListText(folder, q) {
  if (q) return '검색 결과가 없습니다.';
  return {
    inbox: '받은 메일이 없습니다.',
    spam: '스팸 메일이 없습니다.',
    sent: '보낸 메일이 없습니다. 오른쪽 위 ‘쓰기’로 메일을 보내 보세요.',
    drafts: '임시 저장된 메일이 없습니다. 쓰던 메일은 자동으로 여기에 저장됩니다.',
  }[folder] || '';
}

// ── 보낸 메일 읽음 표시 ───────────────────────────────────────

/** { kind: 'read'|'unread'|'bounce'|'self', text } */
export function receiptOf(app, s) {
  const { game } = app;
  if (s.to === game.email) return { kind: 'self', text: '나에게 보냄' };
  const npc = game.mail.findNpc(s.to);
  if (!npc) return { kind: 'bounce', text: '반송됨' };
  if (npc.autoreply) return { kind: 'unread', text: '읽지 않음' };
  const reply = app.inboxRaw().find((m) => m.vars?.sentId === s.id);
  if (reply) {
    const readAt = s.at + Math.round((reply.at - s.at) * 0.6);
    return { kind: 'read', text: `읽음 ${hhmm(readAt)}` };
  }
  return { kind: 'unread', text: '읽지 않음' };
}

// ── 읽기 ──────────────────────────────────────────────────────

function readerBar(app, ...right) {
  return h('div', { class: 'rbar' },
    h('a', { class: 'tbtn tbtn--back', href: '#' + app.state.folder, 'aria-label': `${FOLDER_TITLES[app.state.folder] || '목록'}으로` }, icon('back'), h('span', { class: 'tbtn__t' }, '목록')),
    ...right);
}

export function renderReader(app, id) {
  const { game } = app;
  const m = game.mail.get(id);
  if (!m) {
    return h('div', { class: 'reader' }, readerBar(app),
      h('div', { class: 'reader__scroll' }, h('div', { class: 'empty' },
        h('p', { class: 'empty__t' }, '메일을 찾을 수 없습니다.'),
        h('p', null, '지워졌거나 아직 도착하지 않은 메일입니다.'),
        h('a', { class: 'tbtn', href: '#inbox' }, '받은편지함으로'))));
  }
  const { atts, grant } = extrasOf(game, m);
  const body = h('div', { class: 'mailbody', html: m.body });
  game.hydrate(body);
  if (m.templateId === 'M01') enhanceM01(body, app);

  const spam = m.folder === 'spam'
    ? h('p', { class: 'note note--warn' }, '스팸으로 분류된 메일입니다. 모르는 곳에서 온 링크는 조심해서 눌러 주세요.')
    : null;

  const paper = h('article', { class: 'paper', 'aria-labelledby': 'r-subject' },
    h('h1', { class: 'reader__subject', id: 'r-subject', tabindex: '-1' }, m.subject || '(제목 없음)'),
    h('div', { class: 'reader__meta' },
      avatar(m.from?.name, m.from?.addr),
      h('div', { class: 'reader__who' },
        h('p', { class: 'reader__from' }, h('b', null, m.from?.name || ''), ' ', h('span', { class: 'addr' }, `<${m.from?.addr || ''}>`)),
        h('p', { class: 'reader__to' }, '받는 사람: 나 ', h('span', { class: 'addr' }, `<${game.email}>`))),
      h('time', { class: 'reader__date' }, m.dateLabel)),
    spam,
    body,
    attachmentTiles(app, atts));

  const el = h('div', { class: 'reader' },
    readerBar(app,
      h('a', { class: 'tbtn', href: '#compose?re=' + encodeURIComponent(m.id) }, icon('reply'), h('span', { class: 'tbtn__t' }, '답장')),
      h('a', { class: 'tbtn', href: '#compose?fw=' + encodeURIComponent(m.id) }, icon('forward'), h('span', { class: 'tbtn__t' }, '전달'))),
    h('div', { class: 'reader__scroll' }, paper));

  // 열기 = 읽음 + 열람 기록
  game.mail.markRead(m.id);
  for (const c of grant) game.view(c);
  if (m.templateId === 'M01') firstOpenAtmosphere(app);
  return el;
}

// ── 보낸 메일 읽기 ────────────────────────────────────────────

export function renderSent(app, id) {
  const { game } = app;
  const s = game.mail.sent().find((x) => x.id === id);
  if (!s) {
    return h('div', { class: 'reader' }, readerBar(app),
      h('div', { class: 'reader__scroll' }, h('div', { class: 'empty' }, h('p', { class: 'empty__t' }, '보낸 메일을 찾을 수 없습니다.'))));
  }
  const name = displayName(game, s.to);
  const chip = h('span', { class: 'rc' });
  const update = () => {
    const rc = receiptOf(app, s);
    chip.className = `rc rc--${rc.kind}`;
    chip.textContent = rc.text;
  };
  update();
  const paper = h('article', { class: 'paper', 'aria-labelledby': 'r-subject' },
    h('h1', { class: 'reader__subject', id: 'r-subject', tabindex: '-1' }, s.subject || '(제목 없음)'),
    h('div', { class: 'reader__meta' },
      avatar('나', game.email),
      h('div', { class: 'reader__who' },
        h('p', { class: 'reader__from' }, h('b', null, '나'), ' ', h('span', { class: 'addr' }, `<${game.email}>`)),
        h('p', { class: 'reader__to' }, '받는 사람: ', name ? `${name} ` : '', h('span', { class: 'addr' }, `<${s.to}>`), ' ', chip)),
      h('time', { class: 'reader__date' }, dateLabelOf(s.gd, s.at))),
    h('div', { class: 'mailbody mailbody--plain' }, s.body || ''),
    attachmentTiles(app, s.attachments || [], { title: '보낸 첨부' }));
  const el = h('div', { class: 'reader' },
    readerBar(app, h('a', { class: 'tbtn', href: '#compose?to=' + encodeURIComponent(s.to) }, icon('pencil'), h('span', { class: 'tbtn__t' }, '다시 쓰기'))),
    h('div', { class: 'reader__scroll' }, paper));
  el._update = update;
  return el;
}

// ── 주소록 ────────────────────────────────────────────────────

export function renderContacts(app) {
  const { game } = app;
  const list = contactsOf(game);
  const rows = list.map((c) => h('li', { class: 'contact' },
    avatar(c.name, c.addr),
    h('div', { class: 'contact__text' },
      h('p', { class: 'contact__name' }, c.name),
      h('p', { class: 'contact__addr addr' }, c.addr),
      c.where ? h('p', { class: 'contact__where' }, `알게 된 곳 · ${c.where}`) : null),
    h('a', { class: 'tbtn', href: '#compose?to=' + encodeURIComponent(c.addr), 'aria-label': `${c.name}에게 메일 쓰기` }, icon('pencil'), h('span', { class: 'tbtn__t' }, '메일 쓰기'))));
  const el = h('div', { class: 'reader reader--contacts' },
    h('div', { class: 'rbar' },
      h('a', { class: 'tbtn tbtn--back', href: '#inbox', 'aria-label': '받은편지함으로' }, icon('back'), h('span', { class: 'tbtn__t' }, '메일')),
      h('h1', { class: 'rbar__title' }, '주소록')),
    h('div', { class: 'reader__scroll' },
      h('div', { class: 'paper paper--wide' },
        h('p', { class: 'note' }, '게임에서 알게 된 주소만 여기에 모입니다. 메일을 받거나 사이트에서 주소를 보면 자동으로 추가돼요.'),
        rows.length ? h('ul', { class: 'contacts' }, rows) : h('p', { class: 'muted' }, '아직 아는 주소가 없습니다.'))));
  return el;
}

// ── 빈 화면 ───────────────────────────────────────────────────

export function renderPlaceholder(app) {
  const { game, state } = app;
  let sub = '';
  if (state.folder === 'inbox') {
    const n = game.mail.unreadCount();
    sub = n ? `안 읽은 메일 ${n}통` : '모든 메일을 읽었습니다.';
  }
  return h('div', { class: 'reader reader--empty' },
    h('div', { class: 'empty' },
      h('span', { class: 'empty__drop', html: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3.5c5 6.6 8.4 10.8 8.4 15A8.4 8.4 0 0 1 7.6 18.5C7.6 14.3 11 10.1 16 3.5z" fill="currentColor"/></svg>' }),
      h('p', { class: 'empty__t' }, state.folder === 'drafts' ? '이어 쓸 메일을 고르세요' : '읽을 메일을 고르세요'),
      sub ? h('p', null, sub) : null));
}
