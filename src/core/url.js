// 실제 URL 헬퍼. 웹 루트는 이 파일 위치(src/core/)에서 계산하므로
// GitHub Pages 하위 경로(https://imhxxs.github.io/may/)에서도 그대로 동작한다.
// 결과는 항상 "현재 페이지 기준 상대 경로"다(절대 경로 '/...'를 만들지 않는다).

import { sitePath } from './sites.js';
import { splitQuery } from './util.js';

/** 웹 루트(저장소 루트)의 절대 URL 객체 */
export const ROOT = new URL('../../', import.meta.url);

/** from(기본: 현재 문서) 기준으로 target까지의 상대 경로 */
export function relative(target, from) {
  const fromHref = from ?? (typeof location !== 'undefined' ? location.href : ROOT.href);
  const f = new URL(fromHref);
  const t = new URL(target, fromHref);
  if (f.origin !== t.origin) return t.href;
  const fp = f.pathname.split('/');
  fp.pop(); // 파일 이름 제거 → 디렉터리 조각
  const tp = t.pathname.split('/');
  const file = tp.pop();
  let i = 0;
  while (i < fp.length && i < tp.length && fp[i] === tp[i]) i++;
  const up = fp.length - i;
  let rel = '../'.repeat(up) + tp.slice(i).map((seg) => seg + '/').join('') + file;
  if (!rel) rel = './';
  return rel + t.search + t.hash;
}

/** 웹 루트 기준 경로 → 절대 URL 문자열 */
export function abs(pathFromRoot) {
  return new URL(pathFromRoot, ROOT).href;
}

/**
 * 사이트 페이지의 실제 URL(현재 페이지 기준 상대 경로).
 * query: 'id=3' | '?id=3' | '#inbox' | 'q=x#y' | { id: 3, '#': 'inbox' }
 */
export function url(siteId, page = 'index', query) {
  const { search, hash } = splitQuery(query);
  const target = new URL(sitePath(siteId, page) + search + hash, ROOT);
  return relative(target.href);
}
