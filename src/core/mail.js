// 메일 엔진: 예약(schedule) → 대기 큐 → 보이는 탭이 배달(deliverDue) → 받은편지함.
// 대기 큐와 받은편지함은 한 키('md1:mail')에 있어서 탭이 중간에 닫혀도 메일이 사라지거나 두 번 오지 않는다.

import * as state from './state.js';
import { stateView, flag, view } from './progress.js';
import { fill, josa } from './josa.js';
import { normalize, conceptHit, normalizeAddr } from './text.js';
import { uid, esc, pickDelay, dateParts, hhmm } from './util.js';
import { TEMPLATES, NPCS, INITIAL_INBOX } from '../data/mail/index.js';

export { TEMPLATES, NPCS, INITIAL_INBOX };

const FAST_MAX_MS = 5000;
const DEFAULT_NPC_DELAY = [30000, 90000];
const DAEMON_DELAY = [4000, 8000];

/**
 * deps: { game, getProfile, getGameDate, getSettings }
 */
export function createMail(deps) {
  const { game, getProfile, getGameDate, getSettings } = deps;

  const tpl = (id) => TEMPLATES[id] || null;
  const field = (v, ctx) => (typeof v === 'function' ? v(ctx) : v);
  const makeCtx = (item) => ({ vars: item?.vars || {}, profile: getProfile(), fill: (t) => fill(t, getProfile()), josa, esc, game, item });

  function myAddress() {
    const p = getProfile();
    return p ? `${p.id}@nurisaem.kr` : 'guest@nurisaem.kr';
  }

  function formatDate(item) {
    const t = tpl(item.templateId);
    if (t?.dateLabel) return fill(field(t.dateLabel, makeCtx(item)), getProfile());
    const { m, d, w } = dateParts(item.gd || getGameDate());
    return `${m}월 ${d}일(${w}) ${hhmm(item.at)}`;
  }

  function render(item) {
    const m = state.peek('mail');
    const t = tpl(item.templateId);
    const base = {
      id: item.id,
      templateId: item.templateId,
      to: myAddress(),
      at: item.at,
      gameDate: item.gd,
      read: !!m.read?.[item.id],
      vars: item.vars || {},
    };
    if (!t) {
      return { ...base, from: { name: '(알 수 없음)', addr: '' }, subject: '(불러올 수 없는 메일)', body: '<p>이 메일의 내용을 불러올 수 없습니다.</p>', attachments: item.attachments || [], folder: 'inbox', dateLabel: formatDate(item) };
    }
    const ctx = makeCtx(item);
    const p = getProfile();
    let subject = '';
    let body = '';
    try {
      subject = fill(field(t.subject, ctx) ?? '', p);
      body = fill(field(t.body, ctx) ?? '', p);
    } catch (e) {
      console.error(`[md] 메일 템플릿 ${t.id} 오류`, e);
      body = '<p>(메일을 표시하는 중 오류가 났습니다)</p>';
    }
    return {
      ...base,
      from: field(t.from, ctx) || { name: '', addr: '' },
      subject,
      body,
      attachments: item.attachments ?? t.attachments ?? [],
      folder: t.folder || 'inbox',
      dateLabel: formatDate(item),
    };
  }

  function inbox({ folder } = {}) {
    const m = state.peek('mail');
    let list = (m.inbox || []).map(render);
    if (folder) list = list.filter((x) => x.folder === folder);
    return list.sort((a, b) => b.at - a.at);
  }

  function get(id) {
    const item = (state.peek('mail').inbox || []).find((x) => x.id === id);
    return item ? render(item) : null;
  }

  const sent = () => [...(state.peek('mail').sent || [])].sort((a, b) => b.at - a.at);
  const pending = () => [...(state.peek('mail').pending || [])].sort((a, b) => a.deliverAt - b.deliverAt);
  // 본문을 그리지 않고 센다(탭 제목 배지가 메일이 바뀔 때마다 부른다)
  const unreadCount = () => {
    const m = state.peek('mail');
    return (m.inbox || []).filter((x) => !m.read?.[x.id] && (tpl(x.templateId)?.folder || 'inbox') !== 'spam').length;
  };

  function markRead(id) {
    const item = (state.peek('mail').inbox || []).find((x) => x.id === id);
    if (!item) return Promise.resolve();
    const t = tpl(item.templateId);
    if (t?.grantCards) for (const c of t.grantCards) view(c);
    if (state.peek('mail').read?.[id]) return Promise.resolve();
    return state.update('mail', (d) => {
      d.read ||= {};
      d.read[id] = true;
    });
  }

  function effectiveDelay(ms) {
    const s = getSettings();
    return s.fastMail ? Math.min(ms, FAST_MAX_MS) : ms;
  }

  /**
   * 메일 예약. 반환: 대기 항목 id(이미 같은 key가 있으면 null).
   * opts: { delayMs=0 (숫자 또는 [min,max]), vars={}, attachments, key, once }
   *   key  같은 key의 메일이 대기 중이거나 이미 받았으면 다시 예약하지 않는다.
   *   once true면 key = templateId
   */
  function schedule(templateId, opts = {}) {
    const t = tpl(templateId);
    if (!t) console.warn(`[md] 메일 템플릿이 아직 없습니다: ${templateId} (배달은 되지만 내용이 비어 보입니다)`);
    const key = opts.key || (opts.once ? templateId : null);
    if (key && hasKey(key)) return null;
    const id = opts.id || uid('m');
    const delay = effectiveDelay(pickDelay(opts.delayMs, 0));
    const deliverAt = Date.now() + delay;
    let vars = { ...(opts.vars || {}) };
    if (t?.prepare) {
      try { vars = { ...vars, ...(t.prepare({ ...makeCtx({ vars }), vars }) || {}) }; } catch (e) { console.error(`[md] ${templateId}.prepare 오류`, e); }
    }
    const entry = { id, templateId, deliverAt, vars };
    if (opts.attachments) entry.attachments = [...opts.attachments];
    if (key) entry.key = key;
    state.update('mail', (d) => {
      d.pending ||= [];
      d.inbox ||= [];
      if (d.pending.some((p) => p.id === id) || d.inbox.some((x) => x.id === id)) return d;
      if (key && (d.pending.some((p) => p.key === key) || d.inbox.some((x) => x.key === key))) return d;
      d.pending.push(entry);
      return d;
    }).then(() => {
      if (delay <= 0) deliverDue();
    });
    return id;
  }

  function hasKey(key) {
    const m = state.peek('mail');
    return (m.pending || []).some((p) => p.key === key) || (m.inbox || []).some((x) => x.key === key);
  }

  function findNpc(addr) {
    const a = normalizeAddr(addr);
    return NPCS.find((n) => n.addr === a) || null;
  }

  function ruleOk(rule, text, attachments, s) {
    if (rule.flags && !rule.flags.every((f) => s.has(f))) return false;
    if (rule.notFlags && rule.notFlags.some((f) => s.has(f))) return false;
    if (rule.minChapter && s.chapter < rule.minChapter) return false;
    if (rule.maxChapter && s.chapter > rule.maxChapter) return false;
    if (rule.all && !rule.all.every((c) => conceptHit(c, text))) return false;
    if (rule.any && rule.any.length && !rule.any.some((c) => conceptHit(c, text))) return false;
    if (rule.attachmentsAny && !rule.attachmentsAny.some((c) => attachments.includes(c))) return false;
    if (rule.when) {
      try { if (!rule.when(s, { text, attachments, game })) return false; } catch (e) { console.error('[md] 규칙 when 오류', e); return false; }
    }
    return true;
  }

  /**
   * 플레이어가 메일을 보낸다. 규칙에 따라 답장을 예약한다.
   * 반환: { id, to, npc: 이름|null, bounced, reply: 템플릿 id|null }
   */
  function send({ to, subject = '', body = '', attachments = [] } = {}) {
    const addr = normalizeAddr(to);
    const id = uid('s');
    const at = Date.now();
    const gd = getGameDate();
    const atts = [...new Set((attachments || []).filter(Boolean))].slice(0, 5);
    const sentItem = { id, to: addr, subject: String(subject), body: String(body), attachments: atts, at, gd };
    const text = normalize(`${subject} ${body}`);
    const s = stateView();
    const npc = findNpc(addr);
    let reply = null;
    let missKey = null;

    if (addr === myAddress()) {
      reply = null; // 나에게 보낸 메일: 답장 없음
    } else if (!npc) {
      reply = { reply: 'daemon-bounce', delayMs: DAEMON_DELAY };
    } else if (npc.autoreply && (!npc.autoreply.when || safeWhen(npc.autoreply, s, text, atts))) {
      reply = npc.autoreply;
    } else {
      const rule = (npc.rules || []).find((r) => ruleOk(r, text, atts, s));
      if (rule) {
        reply = rule;
      } else if (npc.fallback?.length) {
        missKey = npc.addr;
        const n = (state.peek('mail').miss?.[missKey] || 0) + 1;
        const fb = npc.fallback[Math.min(n, npc.fallback.length) - 1];
        reply = typeof fb === 'string' ? { reply: fb } : fb;
      }
    }

    let pendingEntry = null;
    if (reply && reply.reply) {
      const delay = effectiveDelay(pickDelay(reply.delayMs ?? DEFAULT_NPC_DELAY, 30000));
      const vars = { to: addr, subject: String(subject), body: String(body), sentId: id, npc: npc?.name || null, ...(reply.vars || {}) };
      let v = vars;
      const t = tpl(reply.reply);
      if (t?.prepare) {
        try { v = { ...vars, ...(t.prepare({ ...makeCtx({ vars }), vars }) || {}) }; } catch (e) { console.error(e); }
      }
      pendingEntry = { id: uid('m'), templateId: reply.reply, deliverAt: at + delay, vars: v, inReplyTo: id };
      if (reply.attachments) pendingEntry.attachments = [...reply.attachments];
    }

    const matchedRule = reply && !missKey;
    state.update('mail', (d) => {
      d.sent ||= [];
      d.pending ||= [];
      d.miss ||= {};
      if (!d.sent.some((x) => x.id === id)) d.sent.push(sentItem);
      if (pendingEntry && !d.pending.some((p) => p.id === pendingEntry.id)) d.pending.push(pendingEntry);
      if (missKey) d.miss[missKey] = (d.miss[missKey] || 0) + 1;
      else if (matchedRule && npc) delete d.miss[npc.addr];
      return d;
    });

    if (reply?.setFlags) flag(reply.setFlags);
    if (reply?.grantCards) for (const c of reply.grantCards) view(c);

    return { id, to: addr, npc: npc?.name || null, bounced: !npc && addr !== myAddress(), reply: pendingEntry?.templateId || null };
  }

  function safeWhen(r, s, text, attachments) {
    try { return !!r.when(s, { text, attachments, game }); } catch { return false; }
  }

  /** 기한이 지난 대기 메일을 받은편지함으로 옮긴다. 보이는 탭에서만 부른다. */
  function deliverDue() {
    const now = Date.now();
    const m = state.peek('mail');
    if (!(m.pending || []).some((p) => p.deliverAt <= now)) return Promise.resolve([]);
    const gd = getGameDate();
    let delivered = [];
    return state.update('mail', (d) => {
      delivered = [];
      d.pending ||= [];
      d.inbox ||= [];
      const due = d.pending.filter((p) => p.deliverAt <= now);
      if (!due.length) return d;
      const ids = new Set(d.inbox.map((x) => x.id));
      for (const p of due) {
        if (ids.has(p.id)) continue;
        const item = { id: p.id, templateId: p.templateId, at: p.deliverAt, gd, vars: p.vars || {} };
        if (p.attachments) item.attachments = p.attachments;
        if (p.key) item.key = p.key;
        if (p.inReplyTo) item.inReplyTo = p.inReplyTo;
        d.inbox.push(item);
        delivered.push(item);
      }
      d.pending = d.pending.filter((p) => p.deliverAt > now);
      return d;
    }).then(() => {
      for (const item of delivered) {
        const t = tpl(item.templateId);
        if (t?.setFlags) flag(t.setFlags);
      }
      return delivered;
    });
  }

  /** '빨리 받기'를 켰을 때 이미 대기 중인 메일도 5초 안으로 당긴다. */
  function hurryPending() {
    const limit = Date.now() + FAST_MAX_MS;
    if (!(state.peek('mail').pending || []).some((p) => p.deliverAt > limit)) return;
    state.update('mail', (d) => {
      for (const p of d.pending || []) if (p.deliverAt > limit) p.deliverAt = limit;
      return d;
    });
  }

  /** 받은편지함 변경 구독. fn(inbox)를 즉시 한 번, 이후 바뀔 때마다 부른다. 해제 함수 반환. */
  function subscribe(fn) {
    const run = () => { try { fn(inbox()); } catch (e) { console.error(e); } };
    run();
    return game.on('change:mail', run);
  }

  /** 새 게임용 초기 받은편지함 */
  function initialMailState(now, gd) {
    return {
      pending: [],
      inbox: INITIAL_INBOX.map((e, i) => ({ id: e.id || e.templateId, templateId: e.templateId, at: now - i * 60000, gd, vars: e.vars || {} })),
      sent: [],
      read: {},
      miss: {},
    };
  }

  return {
    schedule,
    send,
    inbox,
    get,
    sent,
    pending,
    markRead,
    unreadCount,
    subscribe,
    render,
    formatDate,
    deliverDue,
    hurryPending,
    findNpc,
    myAddress,
    initialMailState,
    templates: TEMPLATES,
    npcs: NPCS,
  };
}
