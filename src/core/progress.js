// 플래그·퍼즐·카드 열람/담기. 모두 'md1:progress', 'md1:evidence'에 저장되고 합집합처럼 늘어나기만 한다.

import * as state from './state.js';

/** 조건 함수(endWhen, solvedWhen, openWhen 등)에 넘기는 상태 보기 */
export function stateView() {
  const p = state.peek('progress');
  const e = state.peek('evidence');
  return {
    chapter: p.chapter,
    has: (f) => !!p.flags?.[f],
    solved: (id) => !!p.puzzles?.[id]?.solvedAt,
    viewed: (c) => !!e.cards?.[c],
    collected: (c) => !!e.cards?.[c]?.pinnedAt,
  };
}

export const has = (name) => !!state.peek('progress').flags?.[name];

/** 플래그를 켠다. 이름 하나 또는 배열. */
export function flag(names) {
  const list = [].concat(names).filter(Boolean).map(String);
  const p = state.peek('progress');
  const missing = list.filter((n) => !p.flags?.[n]);
  if (!missing.length) return Promise.resolve();
  const t = Date.now();
  return state.update('progress', (d) => {
    d.flags ||= {};
    for (const n of missing) if (!d.flags[n]) d.flags[n] = t;
  });
}

export const solved = (id) => !!state.peek('progress').puzzles?.[id]?.solvedAt;

export function solve(id) {
  if (!id || solved(id)) return Promise.resolve();
  const t = Date.now();
  return state.update('progress', (d) => {
    d.puzzles ||= {};
    const e = (d.puzzles[id] ||= {});
    if (!e.solvedAt) e.solvedAt = t;
  });
}

export const viewed = (id) => !!state.peek('evidence').cards?.[id];
export const collected = (id) => !!state.peek('evidence').cards?.[id]?.pinnedAt;

/** 열람 기록에 조용히 추가(토스트·알림 없음). */
export function view(id) {
  if (!id || viewed(id)) return Promise.resolve();
  const t = Date.now();
  return state.update('evidence', (d) => {
    d.cards ||= {};
    if (!d.cards[id]) d.cards[id] = { viewedAt: t };
  });
}

/** 수첩 증거함에 담는다(열람도 함께 기록). */
export function collect(id) {
  if (!id || collected(id)) return Promise.resolve();
  const t = Date.now();
  return state.update('evidence', (d) => {
    d.cards ||= {};
    const c = (d.cards[id] ||= { viewedAt: t });
    if (!c.pinnedAt) c.pinnedAt = t;
  });
}

/** 증거함에서 뺀다(열람 기록에는 남는다). */
export function uncollect(id) {
  if (!collected(id)) return Promise.resolve();
  return state.update('evidence', (d) => {
    if (d.cards?.[id]) delete d.cards[id].pinnedAt;
  });
}
