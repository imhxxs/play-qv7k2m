// 사이트 리졸버: 가짜 주소 ↔ 사이트 ID·페이지. DOM에 의존하지 않는다.

import { SITES } from '../data/sites.js';

export { SITES };

const bareHost = (h) => String(h || '').toLowerCase().replace(/^www\./, '');

/** 사이트 정의. 없으면 null */
export function site(siteId) {
  return SITES[siteId] || null;
}

/** 사이트의 실제 파일 경로(웹 루트 기준). 예: ('wolhadang','gallery') → 'www.wolhadang.kr/gallery.html' */
export function sitePath(siteId, page = 'index') {
  const s = SITES[siteId];
  if (!s) throw new Error(`[md] 모르는 사이트 ID: ${siteId}`);
  const p = page || (s.pages?.[0] ?? 'index');
  return s.dir + p + '.html';
}

/** 가짜 주소창 표기. 예: https://www.wolhadang.kr/gallery?id=3 */
export function fakeAddress(siteId, page = 'index', search = '', hash = '') {
  const s = SITES[siteId];
  if (!s || !s.domain) return '';
  const p = !page || page === 'index' ? '' : page;
  return `https://${s.domain}${s.base || ''}/${p}${search || ''}${hash || ''}`;
}

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

/**
 * 주소창 입력을 해석한다.
 * 반환: null(모르는 주소) 또는 { siteId, page, search, hash, known }
 *   known=false면 사이트는 있지만 그런 페이지가 없음(404).
 */
export function resolveAddress(input) {
  let s = String(input ?? '').trim();
  if (!s) return null;
  s = s.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/^\/\//, '');
  const m = s.match(/^([^/?#\s]+)([^?#]*)(\?[^#]*)?(#.*)?$/);
  if (!m) return null;
  const host = bareHost(m[1].replace(/:\d+$/, '').replace(/\.$/, ''));
  if (!host.includes('.')) return null;
  const path = safeDecode(m[2] || '').replace(/\/{2,}/g, '/');
  const search = m[3] && m[3] !== '?' ? m[3] : '';
  const hash = m[4] && m[4] !== '#' ? m[4] : '';

  const candidates = [];
  for (const [siteId, def] of Object.entries(SITES)) {
    if (!def.domain || bareHost(def.domain) !== host) continue;
    const bases = def.base ? [def.base, ...(def.baseAliases || [])] : [''];
    for (const b of bases) {
      const lb = b.toLowerCase();
      const lp = path.toLowerCase();
      if (!b || lp === lb || lp.startsWith(lb + '/')) candidates.push({ siteId, def, rest: path.slice(b.length), baseLen: b.length });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.baseLen - a.baseLen);
  const { siteId, def, rest } = candidates[0];
  let page = rest.replace(/^\/+|\/+$/g, '').replace(/\.html?$/i, '').toLowerCase();
  if (!page) page = 'index';
  const known = !page.includes('/') && def.pages.includes(page);
  return { siteId, page, search, hash, known };
}
