// 주소록: 게임에서 알게 된 주소만 모은다(src/data/mail/contacts.js 규칙).

import { NOREPLY, DISCOVERY, KNOWN_NAMES } from '../src/data/mail/contacts.js';

/** [{ addr, name, where, at }] — 알게 된 순서대로 */
export function contactsOf(game) {
  const me = game.email;
  const flags = game.get('progress', {})?.flags || {};
  const map = new Map();

  const add = (addr, name, where, at) => {
    const a = String(addr || '').trim().toLowerCase();
    if (!a || a === me || NOREPLY.has(a) || !a.includes('@')) return;
    const known = KNOWN_NAMES[a];
    const npc = game.mail.findNpc(a);
    const prev = map.get(a);
    if (prev) {
      if (at && (!prev.at || at < prev.at)) { prev.at = at; if (where) prev.where = where; }
      return;
    }
    map.set(a, {
      addr: a,
      name: known?.name || name || npc?.name || a.split('@')[0],
      where: where || known?.where || '',
      at: at || 0,
    });
  };

  for (const m of game.mail.inbox()) add(m.from?.addr, m.from?.name, KNOWN_NAMES[m.from?.addr]?.where || '받은 메일', m.at);
  for (const s of game.mail.sent()) if (game.mail.findNpc(s.to)) add(s.to, null, '보낸 메일', s.at);
  for (const d of DISCOVERY) {
    const ts = d.flags.map((f) => flags[f]).filter(Boolean);
    if (ts.length) add(d.addr, d.name, d.where, Math.min(...ts));
  }
  for (const [f, t] of Object.entries(flags)) if (f.startsWith('addr:')) add(f.slice(5), null, '사이트에서 본 주소', t);

  return [...map.values()].sort((a, b) => (a.at || 0) - (b.at || 0));
}

export function displayName(game, addr) {
  const a = String(addr || '').toLowerCase();
  if (a === game.email) return '나';
  return KNOWN_NAMES[a]?.name || game.mail.findNpc(a)?.name || '';
}
