// 단서 카드 레지스트리. 소유자별 파일을 합친다(충돌 방지).
//
// 카드 필드
//   id      'E01' … (기획서 §9.1) / 일반·필러 카드는 'X-<site>-<name>' (예외: 'X-haewonbu')
//   title   수첩에 보이는 제목
//   site    출처 사이트 ID(src/data/sites.js)
//   kind    'evidence'(핵심 단서) | 'general'(일반 카드) | 'filler'
//   key     true면 핵심 카드(힌트 2단계를 쓴 뒤에만 열람 기록에 '핵심' 표시가 보인다)
//   chapter 처음 나오는 장
//   desc    수첩에 보이는 설명(플레이어가 이미 본 내용만 요약)
//   ref     { page, query } — 수첩의 '원문 보기' 링크(선택). query는 game.url()과 같은 형식
//   image   (선택) 웹 루트 기준 이미지 경로 또는 data URL

import nurimail from './nurimail.js';
import nurisaem from './nurisaem.js';
import wolhadang from './wolhadang.js';
import seonhee from './seonhee.js';
import seowolilbo from './seowolilbo.js';
import sinmyeong from './sinmyeong.js';
import healingtown from './healingtown.js';
import blog from './blog.js';

const ALL = [...nurimail, ...nurisaem, ...wolhadang, ...seonhee, ...seowolilbo, ...sinmyeong, ...healingtown, ...blog];

export const CARDS = new Map();
for (const c of ALL) {
  if (!c || !c.id) { console.warn('[md] id 없는 카드', c); continue; }
  if (CARDS.has(c.id)) console.warn(`[md] 카드 ID 중복: ${c.id} — 나중 정의가 이깁니다`);
  CARDS.set(c.id, { kind: 'evidence', key: false, chapter: 1, ...c });
}

export function card(id) {
  return CARDS.get(id) || null;
}
