// 저장소 계층: localStorage('md1:' 접두사) + 탭 간 동기화 + epoch + 메모리 모드.
//
// 규칙
// - 모든 값은 JSON. 키 이름은 접두사 없이 쓴다(예: 'progress' → 실제 키 'md1:progress').
// - get(key)는 복사본을 준다. 바꾸려면 update(key, fn).
// - update의 fn은 "순수 함수"여야 한다. 같은 입력에 같은 결과, 부작용 없음.
//   (낙관적 반영과 락 안의 확정 반영에서 두 번 이상 불릴 수 있다.
//    Date.now()·Math.random()·uid()는 fn 바깥에서 미리 만들어 넣는다.)
// - navigator.locks가 있으면 'md1-state' 락 안에서 '최신 값 다시 읽기 → fn → 쓰기'를 한다.
// - 다른 탭의 변경은 storage 이벤트로 받아 캐시를 비우고 'change'를 알린다.
// - 저장소를 쓸 수 없으면(시크릿 모드 차단 등) 메모리 모드로 돌고 memory=true.

import { uid, clone, createEmitter } from './util.js';

export const PREFIX = 'md1:';
const LOCK_NAME = 'md1-state';

const prefersReducedMotion = () => {
  try { return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/** 키별 기본값. 함수면 호출해서 새로 만든다. */
export const DEFAULTS = {
  profile: () => null,
  progress: () => ({ chapter: 1, flags: {}, puzzles: {}, transitions: {}, cardsSeen: {} }),
  evidence: () => ({ cards: {} }),
  mail: () => ({ pending: [], inbox: [], sent: [], read: {}, miss: {} }),
  hints: () => ({}),
  settings: () => ({
    sound: true,
    volume: 0.5,
    scares: true,
    fastMail: false,
    reduceMotion: prefersReducedMotion(),
  }),
};

const emitter = createEmitter();
export const on = emitter.on;

let ls = null;
let memory = false;
const mem = new Map();
let myEpoch = null;
let stale = false;
let inited = false;

const base = new Map(); // key → 확정 값(저장소에서 읽은 것)
const ops = new Map(); // key → 아직 확정되지 않은 fn 목록(낙관적 반영용)
const views = new Map(); // key → base + ops 계산 결과 캐시
const lastEmitted = new Map(); // key → 마지막으로 알린 값(diff용)
const inflight = new Set(); // 락을 기다리는 commit 함수들(pagehide 때 동기로 마무리)

export const isMemoryMode = () => memory;
export const isStale = () => stale;
export const epoch = () => myEpoch;

function detect() {
  try {
    const s = window.localStorage;
    const k = PREFIX + '__probe';
    s.setItem(k, '1');
    s.removeItem(k);
    ls = s;
    memory = false;
  } catch {
    ls = null;
    memory = true;
  }
}

function rawGet(key) {
  const k = PREFIX + key;
  if (memory) return mem.has(k) ? mem.get(k) : null;
  try { return ls.getItem(k); } catch { return null; }
}

function rawSet(key, str) {
  const k = PREFIX + key;
  if (memory) { mem.set(k, str); return true; }
  try {
    ls.setItem(k, str);
    return true;
  } catch (e) {
    console.warn('[md] 저장 실패 — 메모리 모드로 전환합니다.', e);
    enterMemoryMode();
    mem.set(k, str);
    return false;
  }
}

function rawKeys() {
  if (memory) return [...mem.keys()].filter((k) => k.startsWith(PREFIX));
  const out = [];
  try {
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(PREFIX)) out.push(k);
    }
  } catch { /* ignore */ }
  return out;
}

function rawRemoveFull(fullKey) {
  if (memory) { mem.delete(fullKey); return; }
  try { ls.removeItem(fullKey); } catch { /* ignore */ }
}

function enterMemoryMode() {
  if (memory) return;
  // 지금까지의 값을 메모리로 옮긴다.
  try {
    for (const k of rawKeys()) mem.set(k, ls.getItem(k));
  } catch { /* ignore */ }
  memory = true;
  emitter.emit('memory', true);
}

function makeDefault(key) {
  const d = DEFAULTS[key];
  if (typeof d === 'function') return d();
  return d === undefined ? undefined : clone(d);
}

function withDefaults(key, v) {
  const d = makeDefault(key);
  if (d && typeof d === 'object' && !Array.isArray(d) && v && typeof v === 'object' && !Array.isArray(v)) {
    return { ...d, ...v };
  }
  return v;
}

function readFresh(key) {
  const raw = rawGet(key);
  if (raw == null) return makeDefault(key);
  try { return withDefaults(key, JSON.parse(raw)); } catch { return makeDefault(key); }
}

function committed(key) {
  if (!base.has(key)) base.set(key, readFresh(key));
  return base.get(key);
}

function applyOp(op, value) {
  const draft = value === undefined ? clone(op.initial) : clone(value);
  const r = op.fn(draft);
  return r === undefined ? draft : r;
}

/** 내부용: 복사하지 않은 현재 값(낙관적 반영 포함). 절대 직접 고치지 말 것. */
export function peek(key) {
  if (!views.has(key)) {
    let v = committed(key);
    const list = ops.get(key);
    if (list && list.length) {
      for (const op of list) {
        try { v = applyOp(op, v); } catch (e) { console.error('[md] update 함수 오류', e); }
      }
    }
    views.set(key, v);
  }
  return views.get(key);
}

/** 현재 값의 복사본. 없으면 기본값(DEFAULTS), 그것도 없으면 fallback. */
export function get(key, fallback) {
  const v = peek(key);
  return clone(v === undefined ? fallback : v);
}

function notify(key, source) {
  views.delete(key);
  const next = peek(key);
  const prev = lastEmitted.has(key) ? lastEmitted.get(key) : undefined;
  lastEmitted.set(key, next);
  emitter.emit('change', { key, prev, next, source });
}

function checkEpoch() {
  if (memory) return true;
  const e = rawGet('epoch');
  if (e && myEpoch && e !== myEpoch) {
    markStale('epoch');
    return false;
  }
  return true;
}

function markStale(reason) {
  if (stale) return;
  stale = true;
  emitter.emit('stale', reason);
}

/**
 * 값을 바꾼다. fn(draft)는 draft를 고치거나 새 값을 돌려준다. 순수 함수여야 한다.
 * initial: 저장된 값도 기본값(DEFAULTS)도 없을 때 draft로 쓸 값(기본 {}).
 * 반환: 확정된 새 값(Promise).
 */
export function update(key, fn, initial = {}) {
  if (typeof fn !== 'function') throw new TypeError('update(key, fn): fn이 필요합니다');
  if (stale) return Promise.resolve(get(key));
  let list = ops.get(key);
  if (!list) ops.set(key, (list = []));
  const op = { fn, initial };
  list.push(op);
  notify(key, 'local');

  let done = false;
  const commit = () => {
    if (done) return get(key);
    done = true;
    inflight.delete(commit);
    const i = list.indexOf(op);
    if (i >= 0) list.splice(i, 1);
    if (!checkEpoch()) { notify(key, 'local'); return get(key); }
    let next;
    try {
      next = applyOp(op, readFresh(key));
    } catch (e) {
      console.error('[md] update 함수 오류', e);
      notify(key, 'local');
      return get(key);
    }
    rawSet(key, JSON.stringify(next));
    base.set(key, next);
    notify(key, 'local');
    return clone(next);
  };

  if (!memory && typeof navigator !== 'undefined' && navigator.locks?.request) {
    inflight.add(commit);
    return navigator.locks.request(LOCK_NAME, commit).catch((e) => {
      console.warn('[md] Web Lock 실패 — 락 없이 저장합니다.', e);
      return commit();
    });
  }
  return Promise.resolve(commit());
}

/** 통째로 덮어쓴다(update의 줄임). */
export function set(key, value) {
  const v = clone(value);
  return update(key, () => v);
}

function onStorage(e) {
  try {
    if (e.storageArea && e.storageArea !== window.localStorage) return;
  } catch { return; }
  if (e.key === null) { markStale('clear'); return; }
  if (!e.key.startsWith(PREFIX)) return;
  const key = e.key.slice(PREFIX.length);
  if (key === 'epoch') {
    if (e.newValue !== myEpoch) markStale('epoch');
    return;
  }
  base.delete(key);
  notify(key, 'remote');
}

/** 모든 캐시를 버리고 저장소에서 다시 읽는다(bfcache 복귀 등). */
export function refreshAll() {
  if (!memory) {
    const e = rawGet('epoch');
    if (e && myEpoch && e !== myEpoch) { markStale('epoch'); return; }
  }
  const keys = new Set([...base.keys(), ...lastEmitted.keys()]);
  base.clear();
  for (const k of keys) notify(k, 'remote');
}

/** 한 번만 초기화. */
export function init({ watchKeys = [] } = {}) {
  if (inited) return;
  inited = true;
  detect();
  myEpoch = rawGet('epoch');
  if (!myEpoch) {
    myEpoch = uid('e');
    rawSet('epoch', myEpoch);
  }
  for (const k of watchKeys) lastEmitted.set(k, peek(k));
  if (!memory) window.addEventListener('storage', onStorage);
  window.addEventListener('pageshow', (ev) => { if (ev.persisted) refreshAll(); });
  // 탭을 닫거나 다른 페이지로 갈 때, 락을 기다리던 쓰기를 동기로 마무리한다.
  window.addEventListener('pagehide', flushPending);
}

/** 락을 기다리는 쓰기를 지금 바로(락 없이) 확정한다. */
export function flushPending() {
  for (const c of [...inflight]) c();
}

/**
 * md1: 키를 지우고 새 epoch을 발급한다. keep에 있는 키는 남긴다.
 * 이 탭은 계속 쓸 수 있고, 다른 탭들은 '진행이 바뀌었습니다' 상태가 된다.
 */
export function wipe({ keep = ['settings'] } = {}) {
  const keepFull = new Set(keep.map((k) => PREFIX + k));
  for (const k of rawKeys()) if (!keepFull.has(k)) rawRemoveFull(k);
  myEpoch = uid('e');
  rawSet('epoch', myEpoch);
  stale = false;
  base.clear();
  views.clear();
  ops.clear();
  for (const k of [...lastEmitted.keys()]) notify(k, 'reset');
}

/** 여러 키를 한꺼번에 쓴다(락 없이). 새 게임·진행 코드 불러오기에서만 쓴다. */
export function writeAll(obj) {
  for (const [key, val] of Object.entries(obj)) {
    if (key === 'epoch') continue;
    rawSet(key, JSON.stringify(val));
    base.delete(key);
  }
  for (const key of Object.keys(obj)) notify(key, 'reset');
}

/** epoch을 뺀 모든 md1: 값을 객체로. exclude에 있는 키는 뺀다. */
export function dumpAll({ exclude = ['epoch'] } = {}) {
  const out = {};
  const ex = new Set(exclude);
  const keys = new Set(rawKeys().map((full) => full.slice(PREFIX.length)));
  // 아직 락을 기다리는(확정 전) 변경도 포함한다
  for (const [key, list] of ops) if (list.length) keys.add(key);
  for (const key of keys) {
    if (ex.has(key) || key.startsWith('__')) continue;
    const v = peek(key);
    if (v !== undefined) out[key] = clone(v);
  }
  return out;
}
