// 메일 규칙이 같이 쓰는 '개념'(동의어 묶음)과 분류기. [누리메일 담당]
//
// 같은 규칙표를 두 길에서 쓴다.
//   1) 누리메일에서 NPC 주소로 보낸 메일 → npcs.js 규칙(엔진의 send())
//   2) 다른 사이트 폼이 템플릿을 바로 예약한 경우(game.mail.schedule('seonhee-qna-reply', { vars }))
//      → 템플릿의 prepare()가 여기 classify()로 같은 판정을 한다.
//
// 매칭은 엔진과 같다: 제목+본문을 NFC → 소문자 → 공백·문장부호 제거한 뒤 부분 일치.
// 동의어도 같은 정규화를 거치므로 '그날 밤'과 '그날밤'은 같다. 너무 짧은 낱말('약' 한 글자 등)은
// '예약'·'약초' 같은 엉뚱한 말에 걸리므로 두 글자 이상 조합으로 쓴다.

import { normalize, conceptHit } from '../../core/text.js';

export { normalize };

// ── 개념(동의어 묶음) ───────────────────────────────────────────

export const C = {
  // 9월 19일 그날 밤·휴식 시간·촬영
  night: ['그날 밤', '그날밤', '그 날 밤', '9월 19일', '9월19일', '19일 밤', '진적굿 날', '진적굿날', '22:47', '22시 47분', '22시47분',
    '휴식', '쉬는 시간', '쉬는시간', '유튜버', '유투버', '유튜브', '촬영', '카메라', '찍었', '찍은', '찍던', '인터뷰'],
  // 진오귀굿·신물 소각·49재·날짜
  jinogwi: ['진오귀', '진오기', '소각', '태우', '태워', '태운', '49재', '사십구재', '날짜', '일정', '10월 10일', '10월10일',
    '11월 6일', '11월6일', '당겨', '당긴', '당기', '앞당', '서두', '서둘'],
  // 선희당 상담사·대본·모집·060(O2 이후)
  script: ['상담사', '대본', '모집', '060', '혜원', '달무리', '선생님 모집', '신내림 여부'],
  // 다은·약
  daeunYak: ['다은', '명월', '막내 신딸', '약 먹', '약을', '약은', '약 끊', '약끊', '복용', '병원'],
  // 열쇠·벽장(제5장)
  keys: ['열쇠', '벽장', '자물쇠', '열쇠공'],
  // 경필
  kyungpil: ['경필', '산울림', '장구 선생님', '장구선생님', '최 선생님', '최선생님', '장구 치시는', '장구치시는', '장구잽이'],

  // 엄마
  kongtteok: ['콩떡'],
  momChoi: ['최 선생님', '최선생님', '경필', '산울림', '장구', '선생님'],
  momBap: ['밥', '먹었', '먹고 있', '먹고있', '잘 지내', '잘지내', '괜찮아요'],

  // 하준호
  junhoNight: ['어머니', '엄마', '그날 밤', '그날밤', '언쟁', '다투', '다툰', '싸우', '싸운', '싸움', '고성', '9월 19일', '9월19일',
    '진적굿', '휴게소', '알리바이', '어디 계셨', '어디계셨', '몇 시', '몇시'],
  junhoAutopsy: ['부검', '칼 대지', '칼대지', '유언', '화장'],
  junhoDaeun: ['다은', '명월', '고소', '신딸', '신물', '재물은닉', '은닉'],
  junhoLand: ['땅', '토지', '신당 터', '신당터', '월하당 터', '철거', '부지', '매각', '파셨', '동티'],
  junhoSettle: ['합의금', '합의', '소송', '하청', '공사대금', '박 사장', '박사장'],
  junhoBunyang: ['분양', '평형', '분양가', '모델하우스', '입주', '계약금', '세대'],
  yeoni: ['연이', '최연이', '然伊'],

  // 한지수(서월일보)
  jisuOld: ['2005', '연이', '최연이', '然伊', '저수지', '옛 기사', '옛기사', '지난 기사', '지난기사', '아카이브', '2000년대', '20년 전', '스무 해'],
};

// ── 규칙표(우선순위 순) ─────────────────────────────────────────
// kind  = 답장 템플릿 안에서 고를 원고 이름
// any / all / minChapter / maxChapter / when / attachmentsAny 는 엔진 규칙과 같은 뜻

export const SEONHEE_RULES = [
  { kind: 'night', any: [C.night] },
  { kind: 'jinogwi', any: [C.jinogwi] },
  // O2(대본 비교) 이후 — 모집 페이지(E52)를 보았거나 O2를 풀었을 때만
  { kind: 'script', any: [C.script], when: (s) => s.viewed('E52') || s.solved('O2') || s.has('visit:seonhee/recruit') },
  { kind: 'daeun', any: [C.daeunYak] },
  { kind: 'keys', any: [C.keys], minChapter: 5 },
  { kind: 'kyungpil', any: [C.kyungpil] },
];

export const MOM_RULES = [
  { kind: 'kongtteok', any: [C.kongtteok] },
  { kind: 'choi', any: [C.momChoi] },
  { kind: 'bap', any: [C.momBap] },
];

export const JUNHO_RULES = [
  { kind: 'o5', attachmentsAny: ['E42'] },
  { kind: 'night', any: [C.junhoNight] },
  { kind: 'autopsy', any: [C.junhoAutopsy] },
  { kind: 'daeun', any: [C.junhoDaeun] },
  { kind: 'land', any: [C.junhoLand] },
  { kind: 'settle', any: [C.junhoSettle] },
  { kind: 'yeoni', any: [C.yeoni] },
  { kind: 'bunyang', any: [C.junhoBunyang] },
];

export const JISU_RULES = [
  { kind: 'archiveSoon', any: [C.jisuOld], maxChapter: 3 },
  { kind: 'archiveOpen', any: [C.jisuOld], minChapter: 4 },
];

/** 규칙 하나가 맞는가(엔진 ruleOk와 같은 판정). text는 normalize()된 문자열 */
export function ruleMatches(rule, text, s, attachments = []) {
  if (rule.flags && !rule.flags.every((f) => s.has(f))) return false;
  if (rule.notFlags && rule.notFlags.some((f) => s.has(f))) return false;
  if (rule.minChapter && s.chapter < rule.minChapter) return false;
  if (rule.maxChapter && s.chapter > rule.maxChapter) return false;
  if (rule.all && !rule.all.every((c) => conceptHit(c, text))) return false;
  if (rule.any && rule.any.length && !rule.any.some((c) => conceptHit(c, text))) return false;
  if (rule.attachmentsAny && !rule.attachmentsAny.some((c) => attachments.includes(c))) return false;
  if (rule.when) {
    try { if (!rule.when(s, { text, attachments })) return false; } catch { return false; }
  }
  return true;
}

/** 규칙표에서 처음 맞는 kind. 없으면 null */
export function classify(rules, text, s, attachments = []) {
  const hit = rules.find((r) => ruleMatches(r, text, s, attachments));
  return hit ? hit.kind : null;
}

// 폼에서 넘어온 vars 가운데 '분류에 쓰지 않을' 값(이름이 '다은'이어도 다은 규칙에 걸리지 않게)
const META_KEYS = new Set(['to', 'npc', 'sentId', 'kind', 'slot', 'name', 'userName', 'nickname', 'birth', 'birthday', 'email', 'phone', 'tel', 'gender']);

/** 다른 사이트 폼이 넘긴 vars에서 분류용 글(제목·본문·문의 내용 등)을 모아 정규화한다. */
export function textOfVars(vars = {}) {
  const parts = [];
  for (const [k, v] of Object.entries(vars)) {
    if (META_KEYS.has(k)) continue;
    if (typeof v === 'string') parts.push(v);
  }
  return normalize(parts.join(' '));
}

/** 같은 규칙표를 엔진 NPC 규칙으로 바꾼다(답장 템플릿 하나 + vars.kind). */
export function toNpcRules(rules, reply, delayMs) {
  return rules.map(({ kind, ...r }) => ({ ...r, reply, delayMs, vars: { kind } }));
}
