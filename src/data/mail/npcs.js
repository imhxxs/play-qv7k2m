// 메일을 받는 인물(NPC)과 답장 규칙(기획서 §8.3). [누리메일 담당]
//
// NPC
//   addr      받는 주소(소문자)
//   name      표시 이름
//   autoreply (선택) { reply, delayMs } — 있으면 규칙을 보지 않고 늘 이 답장(보낸편지함에는 '읽지 않음')
//   rules     위에서부터 처음 맞는 규칙 하나를 쓴다
//   fallback  아무 규칙도 안 맞을 때. 실패 횟수 n에 따라 fallback[min(n, 길이) - 1]
//             §8.5: 1회 되묻기(기본 답장) → 2회 힌트성 답장 → 3회 '빠른 답장' 버튼
//   quick     (누리메일 화면 전용) 3회 실패 뒤 쓰기 창에 보이는 '빠른 답장' 3개 [{ label, body }]
//
// 규칙 필드는 docs/DEV.md §8.2. 규칙표 자체는 concepts.js에 있고(다른 사이트 폼 경로와 같은 판정),
// 여기서는 답장 템플릿과 지연만 붙인다.

import { SEONHEE_RULES, MOM_RULES, JUNHO_RULES, JISU_RULES, toNpcRules } from './concepts.js';

const MOM_DELAY = [40000, 90000];
const SEONHEE_DELAY = [40000, 90000];
const JUNHO_DELAY = [30000, 60000];
const JISU_DELAY = [50000, 100000];

const fb = (reply, delayMs, kinds) => kinds.map((kind) => ({ reply, delayMs, vars: { kind } }));

export default [
  {
    addr: 'daeun.seo@nurisaem.kr',
    name: '서다은',
    autoreply: { reply: 'daeun-autoreply', delayMs: [6000, 15000] },
  },
  {
    addr: 'jsuk.lee@nurisaem.kr',
    name: '엄마',
    rules: toNpcRules(MOM_RULES, 'mom-reply', MOM_DELAY),
    fallback: fb('mom-reply', MOM_DELAY, ['default', 'hint', 'quick']),
    quick: [
      { label: '콩떡이는 잘 있어요?', body: '엄마, 콩떡이는 잘 있어요?' },
      { label: '최 선생님은 어떤 분이에요?', body: '엄마한테 연락했다는 최 선생님은 어떤 분이에요?' },
      { label: '밥 잘 먹고 있어요', body: '엄마, 나 밥 잘 먹고 있어요. 걱정 마요.' },
    ],
  },
  {
    addr: 'help@seonhee-sinjeom.com',
    name: '선희보살',
    rules: toNpcRules(SEONHEE_RULES, 'seonhee-qna-reply', SEONHEE_DELAY),
    fallback: fb('seonhee-qna-reply', SEONHEE_DELAY, ['default', 'hint', 'quick']),
    quick: [
      { label: '그날 밤 어디 계셨나요?', body: '9월 19일 그날 밤, 휴식 시간에 어디 계셨는지 여쭤봐도 될까요?' },
      { label: '진오귀굿 날짜가 왜 바뀌었나요?', body: '진오귀굿과 신물 소각 날짜가 왜 10월 10일로 당겨졌나요?' },
      { label: '다은이 소식 아세요?', body: '서다은(명월선녀) 소식을 혹시 아세요?' },
    ],
  },
  {
    addr: 'contact@wolhadang.kr',
    name: '월하당',
    autoreply: { reply: 'wolhadang-autoreply', delayMs: [20000, 40000] },
  },
  {
    addr: 'ceo@seowol-healingtown.kr',
    name: '하준호',
    rules: toNpcRules(JUNHO_RULES, 'healingtown-reply', JUNHO_DELAY),
    fallback: fb('healingtown-reply', JUNHO_DELAY, ['default', 'hint', 'quick']),
    quick: [
      { label: '그날 밤 몇 시에 나오셨나요?', body: '9월 19일 그날 밤, 어머니와 다투신 뒤 몇 시에 신당을 나오셨나요?' },
      { label: '부검은 왜 안 하셨나요?', body: '어머니 부검은 왜 하지 않으셨나요?' },
      { label: '다은이를 왜 고소하셨나요?', body: '서다은 씨를 왜 고소하셨나요?' },
    ],
  },
  {
    addr: 'jebo@seowolilbo.kr',
    name: '서월일보 제보',
    rules: toNpcRules(JISU_RULES, 'jisu-reply', JISU_DELAY),
    fallback: fb('jisu-reply', JISU_DELAY, ['default']),
  },
  {
    addr: 'jisu.han@seowolilbo.kr',
    name: '한지수',
    rules: toNpcRules(JISU_RULES, 'jisu-reply', JISU_DELAY),
    fallback: fb('jisu-reply', JISU_DELAY, ['default']),
  },
];
