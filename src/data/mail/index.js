// 메일 데이터 합치기: 초기 받은편지함 + 템플릿 + NPC 규칙.

import inbox from './inbox.js';
import templates from './templates.js';
import npcs from './npcs.js';

export const INITIAL_INBOX = inbox;

export const TEMPLATES = {};
for (const t of templates) {
  if (!t || !t.id) { console.warn('[md] id 없는 메일 템플릿', t); continue; }
  if (TEMPLATES[t.id]) console.warn(`[md] 메일 템플릿 id 중복: ${t.id}`);
  TEMPLATES[t.id] = t;
}

export const NPCS = npcs.map((n) => ({ rules: [], fallback: [], ...n, addr: String(n.addr).trim().toLowerCase() }));
