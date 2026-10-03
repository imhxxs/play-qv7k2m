// 장 상태 기계와 퍼즐 자동 해결.
// 상태가 바뀔 때마다 evaluate()가 불린다(마이크로태스크로 묶어서 한 번).

import * as state from './state.js';
import { stateView, solve } from './progress.js';
import { CHAPTERS, DEADLINE } from '../data/chapters.js';
import { PUZZLES } from '../data/hints.js';

export { CHAPTERS, DEADLINE, PUZZLES };

export function chapterById(id) {
  return CHAPTERS.find((c) => c.id === id) || null;
}

/** 현재 장 정의(저장된 장 번호가 표에 없으면 마지막 장) */
export function currentChapter() {
  const n = state.peek('progress').chapter || 1;
  return chapterById(n) || CHAPTERS[CHAPTERS.length - 1];
}

export function deadlineVisible() {
  try { return !!DEADLINE.showWhen(stateView()); } catch { return false; }
}

/** 현재 장에서 힌트 목록에 보일 퍼즐들 */
export function openPuzzles() {
  const s = stateView();
  const ch = currentChapter();
  return PUZZLES.filter((p) => p.chapter === ch.id && (!p.openWhen || safe(() => p.openWhen(s))));
}

function safe(fn) {
  try { return !!fn(); } catch (e) { console.error('[md] 조건 함수 오류', e); return false; }
}

let queued = false;
let onEnterHook = null;

/** game.js가 장 진입 훅을 연결한다(onEnter(chapter) 실행용) */
export function setOnEnter(fn) { onEnterHook = fn; }

export function scheduleEvaluate() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    evaluate();
  });
}

export function evaluate() {
  if (state.isStale()) return;
  const s = stateView();
  // 1) 퍼즐 자동 해결
  for (const p of PUZZLES) {
    if (p.solvedWhen && !s.solved(p.id) && safe(() => p.solvedWhen(s))) solve(p.id);
  }
  // 2) 장 종료 조건
  const ch = currentChapter();
  if (!ch || ch.comingSoon || !ch.endWhen) return;
  if (!safe(() => ch.endWhen(stateView()))) return;
  const next = chapterById(ch.id + 1);
  if (!next) return;
  advance(ch.id, next);
}

function advance(fromId, next) {
  const t = Date.now();
  let did = false;
  state.update('progress', (d) => {
    did = false;
    if ((d.chapter || 1) !== fromId) return d;
    did = true;
    d.chapter = next.id;
    d.transitions ||= {};
    if (!d.transitions[fromId]) d.transitions[fromId] = t;
    return d;
  }).then(() => {
    if (did && onEnterHook) onEnterHook(next);
  });
}
