// 공용 작은 도구들. DOM에 의존하지 않는다(Node 테스트에서도 import 가능).

/** 짧은 고유 ID. prefix를 붙일 수 있다. */
export function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** JSON 데이터 깊은 복사. (상태에는 JSON으로 표현 가능한 값만 넣는다) */
export function clone(v) {
  if (v === undefined || v === null || typeof v !== 'object') return v;
  if (typeof structuredClone === 'function') {
    try { return structuredClone(v); } catch { /* 함수가 섞인 경우 아래로 */ }
  }
  return JSON.parse(JSON.stringify(v));
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** HTML 특수문자 이스케이프. 폼 입력값을 HTML 본문에 넣을 때 반드시 쓴다. */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

/** 아주 작은 이벤트 발행기. on()은 구독 해제 함수를 돌려준다. */
export function createEmitter() {
  const map = new Map();
  return {
    on(event, fn) {
      if (!map.has(event)) map.set(event, new Set());
      map.get(event).add(fn);
      return () => map.get(event)?.delete(fn);
    },
    emit(event, payload) {
      const set = map.get(event);
      if (!set) return;
      for (const fn of [...set]) {
        try { fn(payload); } catch (e) { console.error(`[md] '${event}' 구독자 오류`, e); }
      }
    },
  };
}

/** min~max 사이 정수 난수. [min,max] 배열이나 숫자 하나도 받는다. */
export function pickDelay(d, fallback = 0) {
  if (Array.isArray(d)) {
    const [a, b = a] = d;
    return Math.round(a + Math.random() * (b - a));
  }
  return typeof d === 'number' ? d : fallback;
}

/** 'id=3&tab=web' | '?id=3#x' | '#inbox' | {id:3} → { search: '?id=3', hash: '#x' } */
export function splitQuery(query) {
  if (query == null || query === '') return { search: '', hash: '' };
  if (typeof query === 'object') {
    const params = new URLSearchParams();
    let hash = '';
    for (const [k, v] of Object.entries(query)) {
      if (k === '#') { hash = '#' + String(v).replace(/^#/, ''); continue; }
      if (v != null) params.set(k, String(v));
    }
    const s = params.toString();
    return { search: s ? '?' + s : '', hash };
  }
  let s = String(query);
  let hash = '';
  const hi = s.indexOf('#');
  if (hi >= 0) { hash = s.slice(hi); s = s.slice(0, hi); }
  s = s.replace(/^\?/, '');
  return { search: s ? '?' + s : '', hash };
}

const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
/** '2026-09-27' → { m: 9, d: 27, w: '일' } */
export function dateParts(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  const w = WEEK[new Date(y, (m || 1) - 1, d || 1).getDay()];
  return { y, m, d, w };
}

export function hhmm(ts) {
  const t = new Date(ts);
  return String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0');
}
