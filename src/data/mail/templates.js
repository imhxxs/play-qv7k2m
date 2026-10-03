// 메일 템플릿(원고). [누리메일 담당] 다른 사이트는 id로 호출만 한다.
//
// ┌─ 다른 사이트가 부르는 템플릿(계약) ───────────────────────────────────────────┐
// │ wolhadang-autoreply   월하당 상담 문의 → 공수 자동응답(현지 시각대 5종, 같은 날 재문의 시   │
// │                       다음 시각대로 순환, 해원부.png 첨부). vars.name(선택: 폼에 적은 이름)  │
// │ seonhee-fortune-reply 선희당 무료 신점 → '혜원 선생님 배정' 대본 답장.                      │
// │                       vars.name(폼 이름) · vars.concern(고민) · vars.birth(생년월일, 선택)   │
// │ seonhee-qna-reply     선희당 1:1 문의 → 선희 직접 답장. vars.subject/body(또는 message)를  │
// │                       concepts.js의 SEONHEE_RULES로 분류한다(NPC 메일과 같은 판정).         │
// │ healingtown-reply     힐링타운 대표 문의 → 하준호 답장. vars.subject/body(또는 message)     │
// │ daemon-bounce         모르는 주소로 보낸 메일의 반송(엔진이 자동으로 부른다)                 │
// └──────────────────────────────────────────────────────────────────────────────┘
// 부르는 법(둘 중 하나):
//   game.mail.schedule('seonhee-qna-reply', { delayMs: [40000, 90000], vars: { subject, body } })
//   game.mail.send({ to: 'help@seonhee-sinjeom.com', subject, body })   ← 보낸편지함에도 남고 §8.5 실패 처리까지 탄다
//
// ┌─ 선희당 '혜원 선생님' 대본(O2 비교 재료) ──────────────────────────────────────┐
// │ 아래 다섯 문장이 무료 신점 답장의 '풀이'다. 선희당 '오늘의 사주' 결과와 '함께할 선생님      │
// │ 모집' 페이지의 대본 예시는 이 문장을 토씨 하나 바꾸지 않고 그대로 써야 한다(FORTUNE_SCRIPT). │
// │                                                                                │
// │ 손님의 기운을 보니 요즘 마음에 걸린 일이 하나 있어 밤잠이 얕으시겠습니다.                    │
// │ 가까운 인연과 실이 엉켜 있으나 끊어진 것이 아니라 잠시 꼬인 것이니 너무 애태우지 마십시오.     │
// │ 올가을 찬바람이 불면 막혔던 소식이 먼저 손님을 찾아옵니다.                                  │
// │ 다만 서두르면 일이 어긋나니 큰 결정은 보름만 미루시는 것이 좋습니다.                         │
// │ 손님 곁을 지키는 조상님의 기운이 아직 든든하니 마음을 놓으셔도 됩니다.                        │
// └──────────────────────────────────────────────────────────────────────────────┘
//
// 템플릿 필드(엔진)
//   id · from · subject · body · attachments · dateLabel · folder · setFlags · grantCards · prepare
//   (설명은 docs/DEV.md §8.2. 본문의 {이름아} 같은 토큰은 엔진이 채운다)
// 누리메일 화면만 쓰는 추가 필드
//   grantCardsFor(ctx) → [cardId]  메일을 열 때 열람 기록에 더 넣을 카드(답장 종류에 따라 다를 때)
//   attachmentsFor(ctx) → [cardId] 답장 종류에 따라 붙는 첨부(폼 경로로 예약돼도 보이도록)
//
// 규칙: 제목은 '평문'(HTML 아님, 이스케이프하지 않는다 — 토스트와 목록이 textContent로 쓴다).
//       본문에 폼 입력값(ctx.vars.*)을 넣을 때는 반드시 ctx.esc().
//       다른 사이트 링크는 <a data-site="…" data-page="…">. 누리메일 화면이 그린 뒤 hydrate 한다.
//
// ctx = { vars, profile, fill, josa, esc, game, item }

import { classify, textOfVars, SEONHEE_RULES, JUNHO_RULES, MOM_RULES, JISU_RULES } from './concepts.js';

export const FORTUNE_SCRIPT = [
  '손님의 기운을 보니 요즘 마음에 걸린 일이 하나 있어 밤잠이 얕으시겠습니다.',
  '가까운 인연과 실이 엉켜 있으나 끊어진 것이 아니라 잠시 꼬인 것이니 너무 애태우지 마십시오.',
  '올가을 찬바람이 불면 막혔던 소식이 먼저 손님을 찾아옵니다.',
  '다만 서두르면 일이 어긋나니 큰 결정은 보름만 미루시는 것이 좋습니다.',
  '손님 곁을 지키는 조상님의 기운이 아직 든든하니 마음을 놓으셔도 됩니다.',
];

// 월하당 공수 자동응답 5종(§8.3). 시각대: 05~10 · 11~16 · 17~20 · 21~23 · 00~04
export const GONGSU_LINES = [
  '새벽 청수가 맑다. 맑은 물엔 얼굴이 비치는 법이다.',
  '해가 높을 땐 그림자가 짧다. 짧은 것을 살펴라.',
  '해 질 녘엔 장구 소리가 멀리 간다.',
  '작두 위가 춥구나.',
  '이 시각엔 장군님도 주무신다. 너는 왜 깨어 있느냐.',
];
export const GONGSU_CARDS = ['X-nurimail-gongsu-dawn', 'X-nurimail-gongsu-noon', 'X-nurimail-gongsu-dusk', 'X-nurimail-gongsu-night', 'X-nurimail-gongsu-late'];

/** 현지 시각 → 공수 시각대 번호(0~4) */
export function gongsuSlot(hour) {
  if (hour >= 5 && hour <= 10) return 0;
  if (hour >= 11 && hour <= 16) return 1;
  if (hour >= 17 && hour <= 20) return 2;
  if (hour >= 21) return 3;
  return 4;
}

// ── 작은 도우미 ────────────────────────────────────────────────

/** 빈 줄로 나눈 원고 → <p> 문단. 한 줄 바꿈은 <br>. (원고 안에 HTML을 써도 된다) */
function paras(text) {
  return String(text).trim().split(/\n\s*\n/).map((p) => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('\n');
}

/** UTF-8 글자를 EUC-KR(CP949)로 잘못 읽은 '진짜' 모지바케. 지원하지 않는 환경이면 결정적 대체 */
function mojibake(text) {
  try {
    const out = new TextDecoder('euc-kr').decode(new TextEncoder().encode(text));
    if (out && out !== text) return out;
  } catch { /* 아래로 */ }
  const odd = '洹몃곕뜲吏誘쇱遊ㅼ臾대誘우嫄곗궯뀈됈떎�';
  let out = '';
  let n = 7;
  for (const ch of text) {
    n = (n * 31 + ch.charCodeAt(0)) % 9973;
    out += ch === ' ' ? (n % 3 ? ' ' : '') : odd[n % odd.length];
  }
  return out;
}

/** 폼 vars에서 첫 번째로 있는 문자열 값 */
function pick(vars, keys, fallback = '') {
  for (const k of keys) if (typeof vars?.[k] === 'string' && vars[k].trim()) return vars[k].trim();
  return fallback;
}

/** 문의 내용 인용(앞부분만) */
function quoteOf(ctx, max = 140) {
  const t = pick(ctx.vars, ['body', 'message', 'content', 'question', 'text', 'concern']);
  if (!t) return '';
  const s = t.length > max ? t.slice(0, max) + '…' : t;
  return ctx.esc(s).replace(/\n/g, '<br>');
}

/** 엔진 규칙이 vars.kind를 정하지 않았으면(다른 사이트 폼 경로) 같은 규칙표로 분류한다. */
function kindFrom(ctx, rules, fallback = 'default') {
  if (ctx.vars?.kind) return {};
  let s = null;
  try { s = ctx.game?.state?.(); } catch { s = null; }
  const text = textOfVars(ctx.vars);
  const k = s ? classify(rules, text, s) : null;
  return { kind: k || fallback };
}

const SIG_SEONHEE = '<p class="mb-sign">선희 드림</p>';
const SIG_JUNHO = '<p class="mb-sign">하준호<br><span class="mb-meta">준호개발(주) 대표 · 서월 힐링타운</span></p>';
const SIG_JISU = '<p class="mb-sign">한지수 기자<br><span class="mb-meta">서월일보 사회부 · jisu.han@seowolilbo.kr</span></p>';

// 깨진 문단의 원문(M01). 엔진이 {이름아}를 채운 뒤 모지바케로 만든다.
const M01_ORIGINAL = '그런데 {이름아}. 그 잔, 내가 따른 것보다 넘쳐 있었어. 나 그거 봤어. 근데 아무도 안 믿을 거야.';

// 샘물 방울(누리샘 로고) — 메일 본문 장식
const DROP_SVG = '<svg class="nr-drop" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4c4.8 6.4 8 10.4 8 14.4a8 8 0 0 1-16 0C8 14.4 11.2 10.4 16 4z" fill="currentColor"/><path d="M12.2 19.2a3.9 3.9 0 0 0 3.5 3.7" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg>';

export default [
  // ════════════════════════════════════════════════════════════════
  // 제1장 시작 받은편지함(M01~M05, inbox.js)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'M01',
    from: { name: '서다은', addr: 'daeun.seo@nurisaem.kr' },
    subject: '이 메일이 갔다면',
    dateLabel: '9월 27일(일) 05:00',
    // 누리메일 화면이 '원문 보기'(data-action="reveal-original")를 연결한다:
    // 누르면 .m01-original이 서서히 살아나고 game.solve('P01'), E01·E02 열람(m01.js).
    body: (ctx) => `
<p>{이름아}.</p>
<p>이건 예약 메일이야. 내가 산에 들어가고 닷새가 지나도 취소를 안 했으면 너한테 가게 해 뒀어. 취소를 못 했다는 건 {호칭이} 아직 기도터에 있다는 거야. 걱정 마. 보살님 계시고 밥도 주셔. 신어머니 49재(11월 6일)까지만 기도하고 내려갈게.</p>
<p>신어머니가 돌아가셨어. 진적굿 하다가, 작두 위에서.</p>
<p>사람들은 내가 상문기를 뽑아서 그렇게 됐대. 내가 남의 신을 훔쳐 와서 그렇대. 준호 오빠는 내가 신당 열쇠랑 신물을 들고 사라졌다고 고소한대.</p>
<div class="m01-broken" data-card="E01">
  <p class="m01-garbled" aria-label="글자가 깨져 읽을 수 없는 문단">${ctx.esc(mojibake(ctx.fill(M01_ORIGINAL)))}</p>
  <p class="m01-original" hidden>${M01_ORIGINAL}</p>
  <p class="m01-tools"><button type="button" class="m01-reveal" data-action="reveal-original">원문 보기</button><span class="m01-note">일부 글자가 깨져 보이나요?</span></p>
</div>
<p>궁금하면 '월하당' 찾아봐. 내가 만든 홈페이지야.</p>
<p>1년 동안 전화 안 받은 거, 괜찮아. 내려가면 콩떡이랑 산책 가자.</p>
<p class="m01-ps" data-card="E02">P.S. 누가 너한테 나를 증명하라고 하면, 콩떡이라고 해. 우리 콩떡이.</p>
<p class="mb-meta">(예약 발송 · 설정 2026.09.21 23:40)</p>`,
  },
  {
    id: 'M02',
    from: { name: '엄마', addr: 'jsuk.lee@nurisaem.kr' },
    subject: '다은이 연락 왔니',
    dateLabel: '9월 26일(토) 21:30',
    grantCards: ['X-nurimail-M02'],
    body: () => paras(`
{이름아}, 엄마야.

오늘 저녁에 경찰서에서 전화가 왔어. 다은이 지금 어디 있느냐고. 다은이 신어머니 아드님 되는 분이 다은이를 고소했다더라. 신당 열쇠랑 무슨 물건을 들고 사라졌다고. 엄마는 무슨 소린지 하나도 모르겠다.

다은이가 입산 전날 와서 콩떡이를 한참 안아 주고 갔다. 기도터 들어간다고, 49재 지나면 온다더라. 어딘지는 말 안 했어. 물어봐도 웃기만 하고.

장구 치시는 최 선생님이 걱정된다고 연락이 와서 네 메일 주소를 알려 드렸다. 메일 오면 잘 받아 드려.

너 {호칭이랑} 싸운 거 엄마도 안다. 그래도 혹시 다은이한테서 연락 오면 엄마한테 꼭 말해 줘.

밥 챙겨 먹고.`),
  },
  {
    id: 'M03',
    from: { name: '선희당', addr: 'event@seonhee-sinjeom.com' },
    subject: '[광고] 첫 신점 무료 — 선희보살',
    dateLabel: '9월 25일(금) 19:30',
    folder: 'spam',
    grantCards: ['X-nurimail-M03'],
    body: () => `
<div class="ad ad--sh">
  <div class="ad-sh__top">
    <span class="ad-sh__logo" aria-hidden="true">善</span>
    <span class="ad-sh__brand">선희당<small>선희보살 신점 · 사주 · 궁합</small></span>
  </div>
  <div class="ad-sh__banner">
    <p class="ad-sh__kicker">✦ 처음 오신 분께만 드리는 인연 ✦</p>
    <p class="ad-sh__big">첫 신점 <em>무료</em></p>
    <p class="ad-sh__sub">월하당 큰신딸 <b>선희보살</b>(2001년 신내림)과<br>상담 선생님 30분이 24시간 기다립니다.</p>
    <a class="ad-sh__cta" data-site="seonhee" data-page="fortune">무료 신점 신청하기</a>
  </div>
  <ul class="ad-sh__menu">
    <li><a data-site="seonhee" data-page="flags"><b>오방기 점</b><span>다섯 깃발로 보는 오늘</span></a></li>
    <li><a data-site="seonhee" data-page="saju"><b>오늘의 사주</b><span>생년월일만 넣으면 끝</span></a></li>
    <li><a data-site="seonhee" data-page="counselors"><b>상담사 30인</b><span>나와 맞는 선생님 찾기</span></a></li>
  </ul>
  <p class="ad-sh__tel">전화 상담 <b>060-XXXX-XXXX</b> <small>(유료 · 30초당 1,300원)</small></p>
  <p class="ad__go"><a data-site="seonhee" data-page="index">선희당 바로 가기 ›</a></p>
  <p class="ad__foot">(광고) 선희당 · 운영 대행 (주)달무리컴퍼니 · 사업자등록번호 XXX-XX-XXXXX<br>본 메일은 발신 전용입니다. 문의는 홈페이지 1:1 문의를 이용해 주세요. 수신을 원하지 않으시면 수신거부를 눌러 주세요.</p>
</div>`,
  },
  {
    id: 'M04',
    from: { name: '서월 힐링타운', addr: 'info@seowol-healingtown.kr' },
    subject: '[광고] 선착순 분양',
    dateLabel: '9월 26일(토) 14:07',
    folder: 'spam',
    grantCards: ['X-nurimail-M04'],
    body: () => `
<div class="ad ad--ht">
  <div class="ad-ht__sky">
    <svg class="ad-ht__art" viewBox="0 0 320 120" aria-hidden="true" preserveAspectRatio="xMidYMax slice">
      <path d="M0 92 C40 60 70 52 104 70 C130 40 170 26 206 54 C236 38 270 44 320 70 V120 H0z" fill="#9fd0ea"/>
      <path d="M0 104 C60 84 120 86 170 96 C220 86 270 84 320 96 V120 H0z" fill="#7fbf8e"/>
      <g fill="#fff" stroke="#3d7fb0" stroke-width="1.2">
        <path d="M70 96 l12 -10 l12 10 v12 h-24z"/><path d="M104 98 l10 -8 l10 8 v10 h-20z"/>
        <path d="M186 94 l14 -11 l14 11 v14 h-28z"/><path d="M224 98 l10 -8 l10 8 v10 h-20z"/>
      </g>
      <circle cx="262" cy="26" r="11" fill="#fff3b0"/>
    </svg>
    <p class="ad-ht__eyebrow">서월산 품에 안긴 프리미엄 힐링 전원 단지</p>
    <p class="ad-ht__big">서월 힐링타운<br><em>선착순 분양</em></p>
  </div>
  <ul class="ad-ht__points">
    <li><b>명당 자리</b> 예부터 사람들이 기도하러 찾던 서월산 아래</li>
    <li><b>1차 48세대</b> 선착순 사전 접수 중</li>
    <li><b>계약금 정액제</b> 부담은 낮추고 품격은 높이고</li>
  </ul>
  <p class="ad__go"><a class="ad-ht__cta" data-site="healingtown" data-page="index">분양 정보 자세히 보기</a></p>
  <p class="ad-ht__tel">분양 홍보관 <b>1600-XXXX</b></p>
  <p class="ad__foot">(광고) 준호개발(주) · 대표 하준호 · 서월 힐링타운 분양 홍보관<br>본 메일은 발신 전용입니다. 대표 문의는 홈페이지를 이용해 주세요. 수신거부</p>
</div>`,
  },
  {
    id: 'M05',
    from: { name: '누리샘', addr: 'welcome@nurisaem.kr' },
    subject: '누리샘 가입을 환영합니다',
    dateLabel: '9월 14일(월) 10:24',
    grantCards: ['X-nurimail-M05'],
    body: () => `
<div class="nr-welcome">
  <div class="nr-welcome__hero">${DROP_SVG}
    <p class="nr-welcome__title">누리샘 가입을 환영합니다</p>
    <p>{이름}님의 누리메일 주소는 <b>{메일}</b>입니다.</p>
  </div>
  <p>누리샘은 서월과 온 나라의 소식을 맑게 길어 올리는 검색 서비스입니다. 처음 오신 {이름}님께 자주 쓰는 기능 세 가지를 소개합니다.</p>
  <ol class="nr-welcome__list">
    <li><b>저장된 페이지</b> — 누리샘은 검색되는 페이지를 때때로 저장해 둡니다. 글이 나중에 고쳐졌다면 검색 결과 옆 <b>‘저장된 페이지’</b>를 눌러 고치기 전 모습을 볼 수 있어요. 저장본 위쪽 띠에는 ‘누리샘이 ○월 ○일 ○시에 저장한 페이지입니다 · 수정됨 ○월 ○일’처럼 저장한 때와 고친 때가 함께 나옵니다.</li>
    <li><b>누리샘 사전</b> — 낱말 풀이와 한자 음훈은 물론, 간지와 연도를 서로 바꾸고(예: 갑자년 → 1984년) 음력 날짜를 양력으로 바꿔 볼 수 있어요.</li>
    <li><b>이미지 검색</b> — 검색 결과의 ‘이미지’ 탭에서 사진을 찾고, ‘이 이미지로 검색’으로 비슷한 사진을 찾아보세요.</li>
  </ol>
  <p class="nr-welcome__links">
    <a class="nr-btn" data-site="nurisaem" data-page="index">누리샘 바로 가기</a>
    <a class="nr-btn nr-btn--ghost" data-site="nurisaem" data-page="dict">누리샘 사전</a>
    <a class="nr-btn nr-btn--ghost" data-site="nurisaem" data-page="search" data-query="tab=image">이미지 검색</a>
  </p>
  <p class="mb-meta">이 메일은 발신 전용입니다. 궁금한 점은 누리샘 홈 맨 아래 ‘도움말’을 봐 주세요.</p>
</div>`,
  },

  // ════════════════════════════════════════════════════════════════
  // 다른 사이트가 부르는 템플릿(계약 id)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'daemon-bounce',
    from: { name: 'MAILER-DAEMON', addr: 'mailer-daemon@nurisaem.kr' },
    subject: (ctx) => `반송: ${ctx.vars.subject || '(제목 없음)'}`,
    body: (ctx) => `
<div class="bounce">
  <p class="bounce__head">메일을 보내지 못했습니다.</p>
  <p>받는 사람의 주소를 찾을 수 없어 메일이 되돌아왔습니다.</p>
  <dl class="bounce__t">
    <dt>받는 사람</dt><dd>${ctx.esc(ctx.vars.to || '(비어 있음)')}</dd>
    <dt>제목</dt><dd>${ctx.esc(ctx.vars.subject || '(제목 없음)')}</dd>
    <dt>사유</dt><dd>수신자를 찾을 수 없습니다 (550 User unknown)</dd>
  </dl>
  <p>주소의 철자를 다시 확인해 주세요. 주소록에는 지금까지 알게 된 주소가 모여 있습니다.</p>
  <p class="mb-meta">※ 게임 속 주소입니다. 게임 안에서 찾은 주소만 메일을 받을 수 있어요.<br>— mail.nurisaem.kr 메일 전송 시스템</p>
</div>`,
  },
  {
    // 월하당 상담 문의 → 공수 자동응답. 현지 시각대 + 같은 날 받은 횟수만큼 다음 시각대로 순환.
    id: 'wolhadang-autoreply',
    from: { name: '월하당', addr: 'contact@wolhadang.kr' },
    subject: '[월하당] 문의 주신 분께',
    attachments: ['X-haewonbu'],
    grantCards: ['X-haewonbu'],
    grantCardsFor: (ctx) => ['X-haewonbu', GONGSU_CARDS[(ctx.vars?.slot ?? 0) % 5]],
    prepare: (ctx) => {
      if (Number.isInteger(ctx.vars?.slot)) return {};
      const now = new Date();
      const base = gongsuSlot(now.getHours());
      const today = now.toDateString();
      let prior = 0;
      try {
        prior = [...ctx.game.mail.inbox(), ...ctx.game.mail.pending()]
          .filter((m) => m.templateId === 'wolhadang-autoreply' && new Date(m.at ?? m.deliverAt).toDateString() === today).length;
      } catch { prior = 0; }
      return { slot: (base + prior) % 5 };
    },
    body: (ctx) => {
      const formName = pick(ctx.vars, ['name', 'userName', 'nickname']);
      const call = formName ? ctx.esc(ctx.josa(formName, '아/야')) : '{이름아}';
      const line = GONGSU_LINES[(ctx.vars.slot ?? 0) % 5];
      return `
<div class="gongsu">
  <p class="gongsu__line">${call}, ${line}</p>
</div>
<p>월하당에 마음을 내어 주셔서 고맙습니다.</p>
<p>월하당은 9월 20일부터 상중입니다. 상담과 굿 예약은 49재(11월 6일)가 지난 뒤에 다시 받습니다.</p>
<p>함께 보내 드리는 해원부는 마음에 맺힌 것이 많은 분들께 만신님이 손수 써 주시던 것입니다.</p>
<p class="mb-meta">이 메일은 자동으로 보내졌습니다.<br>月下堂 · 서월산 아래 · <a data-site="wolhadang" data-page="index">www.wolhadang.kr</a></p>`;
    },
  },
  {
    // 선희당 무료 신점 → 1분 뒤 '혜원 선생님 배정' 대본 답장(폼 이름 반영, 운세 문구는 '손님')
    id: 'seonhee-fortune-reply',
    from: { name: '선희당 무료 신점', addr: 'fortune@seonhee-sinjeom.com' },
    subject: (ctx) => `[선희당] ${pick(ctx.vars, ['name', 'userName', 'nickname'], '손님')}님, 혜원 선생님이 배정되었습니다`,
    grantCards: ['X-nurimail-fortune'],
    body: (ctx) => {
      const name = ctx.esc(pick(ctx.vars, ['name', 'userName', 'nickname'], '손님'));
      const concern = ctx.esc(pick(ctx.vars, ['concern', 'worry', 'message', 'body', 'content', 'question']));
      return `
<div class="fortune">
  <p class="fortune__head">선희당 무료 신점 · 담당 선생님 배정 안내</p>
  <p><b>${name}</b>님, 무료 신점 신청이 접수되어 <b>혜원 선생님</b>이 배정되었습니다.</p>
  ${concern ? `<blockquote class="fortune__q">남기신 고민 — “${concern}”</blockquote>` : ''}
  <div class="fortune__script">
    <p class="fortune__by">혜원 선생님의 풀이</p>
    <p>${FORTUNE_SCRIPT.join(' ')}</p>
    <p class="fortune__sign">— 혜원 드림</p>
  </div>
  <p>더 깊은 이야기는 1:1 전화 상담(<b>060-XXXX-XXXX</b> · 유료)에서 혜원 선생님과 이어 가실 수 있습니다.</p>
  <p class="mb-meta">무료 신점은 1인 1회 제공됩니다. 본 메일은 발신 전용입니다.<br>(광고) 선희당 · 운영 대행 (주)달무리컴퍼니</p>
</div>`;
    },
  },
  {
    // 선희당 1:1 문의 → 선희 직접 답장. vars.kind는 NPC 규칙이 정하거나(누리메일 경로), prepare가 분류한다(폼 경로).
    id: 'seonhee-qna-reply',
    from: (ctx) => (['default'].includes(ctx.vars?.kind) ? { name: '선희당 고객센터', addr: 'help@seonhee-sinjeom.com' } : { name: '선희보살', addr: 'help@seonhee-sinjeom.com' }),
    subject: '[선희당] 1:1 문의에 답변드립니다',
    prepare: (ctx) => kindFrom(ctx, SEONHEE_RULES),
    grantCardsFor: (ctx) => ({
      night: ['E45'], jinogwi: ['X-nurimail-seonhee-jinogwi'], script: ['X-nurimail-seonhee-script'],
      daeun: ['X-nurimail-seonhee-daeun'], keys: ['X-nurimail-seonhee-keys'], kyungpil: ['X-nurimail-seonhee-kyungpil'],
    }[ctx.vars?.kind] || []),
    body: (ctx) => {
      const k = ctx.vars.kind || 'default';
      const q = quoteOf(ctx);
      const quote = q ? `<blockquote class="mb-quote"><span class="mb-quote__label">문의하신 내용</span>${q}</blockquote>` : '';
      const T = {
        night: `안녕하세요. 선희예요.

그 시간엔 마당에서 기묘탐사 유튜버랑 인터뷰 중이었어요. 제가 부른 사람이에요. 어머니 마지막 진적굿 기록 남기려고요. 신당 안은 장군거리부터만 찍으라 했는데… 장군님 상 앞은 지나기만 했어요.

경황이 없어서 답이 늦었어요.`,
        jinogwi: `안녕하세요. 선희예요.

어머니 뜻이에요… 준호 씨가 10월 안에 정리해 달라고 해서요. 신물은 태워 보내 드리는 게 맞아요.`,
        script: `…그 일은… 업체랑 계약 끝내려던 참이었어요. 어머니한테 크게 혼났어요. 살인이랑은 상관없어요.`,
        daeun: `안녕하세요. 선희예요.

다은이한테 약은 먹으라고 했었는데… 연락 오면 꼭 알려 주세요.`,
        keys: `10월 9일에 선생님이 열쇠공이랑 정리해 주시기로 했어요. 다은이가 안 나타나면 어쩔 수 없어요.`,
        kyungpil: `안녕하세요. 선희예요.

선생님은 어머니 쓰러지셨을 때 제일 먼저 달려가신 분이에요.`,
        hint: `안녕하세요. 선희예요.

혹시 어머니(송만신) 일로 문의 주신 건가요? 요즘 그런 문의가 많아서요.
그날 밤 일이든, 진오귀굿 일정이든, 궁금하신 걸 조금만 더 구체적으로 적어 주시면 제가 아는 대로 말씀드릴게요.`,
        quick: `문의하신 내용을 제가 잘 못 알아들었어요. 죄송해요.

메일 쓰기 창 위쪽 ‘빠른 답장’에서 궁금하신 걸 하나 골라 보내 주시면 바로 답드릴게요.`,
      };
      if (k === 'default') {
        return `${quote}
<p>안녕하세요~ 선희당입니다^^<br>소중한 문의 남겨 주셔서 감사합니다.</p>
<p>선희당은 선희보살님과 상담 선생님 30분이 24시간 함께하고 있어요^^<br>처음 오신 분께는 첫 신점을 무료로 봐 드리고 있으니 홈페이지 <a data-site="seonhee" data-page="fortune">무료 신점 신청</a>에 고민을 남겨 주세요.<br>오방기 점 체험과 오늘의 사주도 무료로 이용하실 수 있답니다^^</p>
<p>어떤 고민이신지 조금만 더 적어 주시면 맞는 선생님을 연결해 드릴게요^^<br>오늘도 좋은 기운 가득한 하루 되세요^^</p>
<p class="mb-sign">선희당 고객센터 드림</p>`;
      }
      return `${quote}\n${paras(T[k] || T.hint)}\n${SIG_SEONHEE}`;
    },
  },
  {
    // 서월 힐링타운 대표 문의 → 하준호. vars.kind는 NPC 규칙 또는 prepare 분류.
    id: 'healingtown-reply',
    from: { name: '하준호', addr: 'ceo@seowol-healingtown.kr' },
    subject: '[서월 힐링타운] 대표 회신',
    prepare: (ctx) => kindFrom(ctx, JUNHO_RULES),
    attachmentsFor: (ctx) => (ctx.vars?.kind === 'night' ? ['E46'] : []),
    grantCardsFor: (ctx) => ({
      night: ['E46'], autopsy: ['X-nurimail-junho-autopsy'], daeun: ['X-nurimail-junho-complaint'],
      land: ['X-nurimail-junho-land'], settle: ['X-nurimail-junho-settle'],
    }[ctx.vars?.kind] || []),
    body: (ctx) => {
      const k = ctx.vars.kind || 'default';
      const T = {
        night: '22시 41분에 나왔습니다. 23시 18분 휴게소 영수증 있습니다. 경찰에도 냈습니다. 그 유튜버, 기묘탐사인지 하는 사람이 다 찍었을 거요.',
        autopsy: '어머니 유언이었습니다. 칼 대지 말라고. 무당 일은 싫어도 어머니 말은 들었습니다.',
        daeun: '살인이라고 한 적 없습니다. 열쇠랑 신물 들고 사라졌으니 고소한 겁니다.',
        land: '어머니는 끝까지 안 파셨습니다. 이제 정리해야죠.',
        settle: '끝난 일입니다.',
        yeoni: '모르는 이름입니다.',
        o5: '…박 사장이 해결했다던 합의금이 어머니 돈이었군요.<div class="mb-gap" aria-hidden="true"></div>진오귀 날 가겠습니다. 술은 제가 올리겠습니다.',
        bunyang: `안녕하십니까. 서월 힐링타운입니다.

1차 48세대 선착순 사전 접수를 받고 있습니다. 평형과 분양가는 홈페이지 분양 안내를 참고해 주십시오. 상담 예약은 분양 홍보관(1600-XXXX)으로 부탁드립니다.`,
        default: '분양 문의가 아니면 답하지 않습니다.',
        hint: '분양 문의가 아니면 답하지 않습니다. 어머니 일이라면 경찰에 다 말했습니다.',
        quick: '용건만 짧게 적으십시오.',
      };
      return `${paras(T[k] || T.default)}\n${SIG_JUNHO}`;
    },
  },

  // ════════════════════════════════════════════════════════════════
  // NPC 답장(npcs.js 규칙이 부른다)
  // ════════════════════════════════════════════════════════════════
  {
    id: 'daeun-autoreply',
    from: { name: '서다은', addr: 'daeun.seo@nurisaem.kr' },
    subject: '[자동응답] 기도 중이에요',
    grantCards: ['X-nurimail-daeun-auto'],
    body: () => `
<p>기도 중이라 메일을 볼 수 없어요. 49재 지나면 내려가요. — 명월</p>
<p class="mb-meta">자동응답 · 설정 2026.09.21</p>`,
  },
  {
    id: 'mom-reply',
    from: { name: '엄마', addr: 'jsuk.lee@nurisaem.kr' },
    subject: '엄마야',
    prepare: (ctx) => kindFrom(ctx, MOM_RULES),
    grantCardsFor: (ctx) => ({ kongtteok: ['X-nurimail-mom-kongtteok'], choi: ['X-nurimail-mom-choi'] }[ctx.vars?.kind] || []),
    body: (ctx) => {
      const T = {
        kongtteok: `콩떡이는 잘 있다. 걱정 마.

다은이가 입산 전날 와서 콩떡이를 한참 안아 주고 갔다. 콩떡이도 뭘 아는지 그날은 다은이 옆에서 안 떨어지더라.

너도 시간 나면 한번 와서 안아 줘라.`,
        choi: `최 선생님? 점잖은 분이더라.

목소리가 차분하시고, 다은이를 친딸처럼 아낀다고 하시더라. 다은이 소식 들으면 꼭 알려 달라고 하셨어.`,
        bap: '그래, 다행이다. 엄마도 먹었어. 너무 늦게 자지 말고.',
        default: `밥은 먹고 다니니.

엄마는 괜찮다. 뭐가 궁금한 건데? 다은이 소식 있으면 꼭 알려 주고.`,
        hint: `엄마는 다은이 일은 잘 몰라. 입산 전날 와서 콩떡이 안아 주고 간 거, 장구 치시는 최 선생님한테서 연락 온 거, 그게 다야.

밥은 먹고 다니니.`,
        quick: '휴대폰으로 보니까 글씨가 작아서 엄마가 잘 못 알아보겠다. 짧게 물어봐 줘.',
      };
      return `${paras(T[ctx.vars.kind] || T.default)}\n<p class="mb-meta">엄마 휴대폰에서 보냄</p>`;
    },
  },
  {
    id: 'jisu-reply',
    from: { name: '한지수', addr: 'jisu.han@seowolilbo.kr' },
    subject: '[서월일보] 제보 회신',
    prepare: (ctx) => kindFrom(ctx, JISU_RULES),
    grantCardsFor: (ctx) => (ctx.vars?.kind === 'archiveSoon' ? ['X-nurimail-jisu-archive'] : []),
    body: (ctx) => {
      const T = {
        archiveSoon: `서월일보 사회부 한지수입니다.

말씀하신 옛 기사는 지금 온라인에서는 찾기 어려우실 거예요. 2000년대 지면은 10월 3일 공개 예정이에요. 디지털화 작업이 끝나면 아카이브에서 연도별로 보실 수 있습니다.

자료가 더 모이면 보내 주세요.`,
        archiveOpen: `서월일보 사회부 한지수입니다.

아카이브에 공개됐어요. 연도 필터를 써 보세요.`,
        default: `서월일보 사회부 한지수입니다.

보내 주신 내용 잘 읽었습니다. 지금 가진 자료만으로는 기사로 다루기 어렵습니다. 자료가 더 모이면 보내 주세요.`,
      };
      return `${paras(T[ctx.vars.kind] || T.default)}\n${SIG_JISU}`;
    },
  },
];
