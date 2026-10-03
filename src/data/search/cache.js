// 누리샘 '저장된 페이지'(기획서 §7.7 중 제1장 범위).
//
// 필드
//   id, link(entries.js LINKS 키 — 원래 주소), title(저장 당시 제목), pageTitle(탭 제목)
//   saved: { label: '9월 22일 18시' }  change: { kind: 'modified'|'deleted', label: '수정됨 9월 23일' } | null
//   card(열람 시 열람 기록에 넣을 카드), solve(풀리는 퍼즐), theme(스냅숏 CSS 이름, snapshots.css)
//   html: 저장 당시 모습. {ASSET} 은 assets/nurisaem/ 까지의 상대 경로로 바뀐다.
// 필러 결과의 저장본은 fillers.js의 글로 cache.html이 바로 그린다(id가 'f-'로 시작).

const SEONHEE_JINOGWI = `
<div class="sh">
  <div class="sh-top">
    <span>상담 060-XXXX-XXXX · 24시간 상담</span>
    <span class="sh-top__r">로그인 · 회원가입 · 장바구니</span>
  </div>
  <header class="sh-head">
    <span class="sh-logo">
      <svg class="sh-logo__mark" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="#5b2a86"/><circle cx="20" cy="20" r="14" fill="none" stroke="#f1cf6b" stroke-width="1.5"/><text x="20" y="27" text-anchor="middle" font-size="18" fill="#f1cf6b" font-family="serif">善</text></svg>
      <span class="sh-logo__text"><b>선희당</b><small>선희보살 신점·사주·궁합 봐드립니다</small></span>
    </span>
    <nav class="sh-nav" aria-label="선희당 메뉴(저장본)">
      <span>홈</span><span>선희보살 인사말</span><span>상담사 30인</span><span>오방기 점 체험</span><span>오늘의 사주</span><span>무료 신점</span><span class="is-on">공지</span><span>1:1 문의</span>
    </nav>
  </header>
  <div class="sh-banner"><b>첫 신점 무료</b> ✦ 지금 신청하면 선생님이 바로 배정됩니다 ✦</div>
  <main class="sh-board">
    <p class="sh-crumb">홈 › 공지사항</p>
    <h1 class="sh-title"><span class="sh-badge">공지</span> 故 송만신 49재 11월 6일</h1>
    <p class="sh-meta">선희당 · 2026.09.22 14:20 · 조회 412</p>
    <div class="sh-body">
      <p>월하당 송만신 어머니께서 9월 19일 진적굿을 올리시던 중 신령님 곁으로 가셨습니다.</p>
      <p>평생 손님을 먼저 생각하신 어머니를 기억해 주시는 모든 분께, 큰신딸 선희가 대신 인사 올립니다.</p>
      <ul class="sh-info">
        <li><b>49재</b> 2026년 11월 6일(금) 오전 10시 · 서월 월하당</li>
        <li>49재 날 진오귀굿으로 어머니를 좋은 곳에 모시고, 남기신 신물도 그날 법도대로 정리해 보내 드립니다.</li>
        <li>조화와 부의는 정중히 사양합니다. 마음으로 함께해 주세요.</li>
      </ul>
      <p>어머니 가시는 길, 선희당이 끝까지 정성으로 모시겠습니다.</p>
      <p class="sh-sign">큰신딸 선희보살 합장</p>
    </div>
    <section class="sh-comments" aria-label="댓글(저장 당시)">
      <h2>댓글 <b>2</b></h2>
      <ol>
        <li><p class="sh-c__who"><b>서월댁</b> <span>09.22 15:02</span></p><p>송만신님 덕에 우리 손주 병원 일찍 갔었어요. 좋은 곳 가세요.</p></li>
        <li><p class="sh-c__who"><b>단골손님</b> <span>09.22 16:47</span></p><p>49재 날 꼭 가겠습니다. 선희 보살님도 힘내세요.</p></li>
      </ol>
    </section>
    <p class="sh-pager"><span>목록</span><span>이전 글 · 9월 추석 연휴 상담 시간 안내</span></p>
  </main>
  <footer class="sh-foot">
    <p>선희당 | 운영 대행 (주)달무리컴퍼니 | 사업자등록번호 XXX-XX-XXXXX | 통신판매업 신고 제2019-서월-XXXX호</p>
    <p>유료 전화 상담 060-XXXX-XXXX (30초당 이용료 부과) | 상담 내용은 참고용이며 결과를 보장하지 않습니다.</p>
    <p>© 선희당. All rights reserved.</p>
  </footer>
</div>`;

const ILBO_0921_FIRST = `
<div class="sw">
  <header class="sw-mast">
    <p class="sw-date">2026년 9월 21일 월요일</p>
    <p class="sw-logo">서월일보</p>
    <p class="sw-motto">서월의 오늘을 기록합니다</p>
  </header>
  <nav class="sw-nav" aria-label="서월일보 메뉴(저장본)"><span>종합</span><span class="is-on">사회</span><span>생활</span><span>문화</span><span>오피니언</span><span>지면 보기</span></nav>
  <article class="sw-art">
    <p class="sw-sec">사회</p>
    <h1>무속인, 굿 도중 작두서 떨어져 숨져</h1>
    <p class="sw-sub">서월산 아래 신당서 진적굿… 경찰 “부정맥 병력, 범죄 혐의점 없어”</p>
    <p class="sw-by">입력 2026.09.21 07:10 · 서월일보 사회부</p>
    <figure class="sw-fig">
      <img src="{ASSET}img/ilbo-0921.svg" alt="새벽녘 한옥 대문 앞. 대문 위 등이 꺼져 있고 길 끝에 차 불빛이 번진다." width="640" height="420">
      <figcaption>20일 새벽 서월군 서월읍 월하당 대문 앞. 현장을 확인한 경찰 차량이 돌아가고 있다. /독자 제공</figcaption>
    </figure>
    <p>서월군 서월읍 서월산 아래 신당 ‘월하당’에서 굿을 하던 무속인이 작두에서 떨어져 숨졌다.</p>
    <p>21일 서월경찰서에 따르면 지난 19일 오후 11시 31분쯤 월하당에서 진적굿을 하던 무속인 송복례(69)씨가 작두 위에서 쓰러져 떨어졌다. 송씨는 출동한 구급대에 의해 서월의료원으로 옮겨졌으나 같은 날 오후 11시 58분 숨졌다.</p>
    <p>당시 신당 안팎에는 단골 신도와 악사 등 수십 명이 있었다. 한 목격자는 “작두 위에서 공수를 내리시다가 갑자기 몸을 휘청이더니 그대로 쓰러지셨다”고 말했다.</p>
    <p>경찰은 송씨에게 평소 부정맥 병력이 있었고, 여러 사람이 지켜보는 앞에서 쓰러진 점 등으로 미뤄 범죄 혐의점은 없는 것으로 보고 내사를 종결할 방침이다. 유족은 부검을 원하지 않는다는 뜻을 밝혔다.</p>
    <p>송씨는 서월산 아래에서 40여 년 동안 황해도굿과 작두로 이름을 알렸다. 발인은 21일 오전이며, 고인은 화장된다.</p>
    <p class="sw-end">서월일보 사회부 · 제보 jebo@seowolilbo.kr</p>
  </article>
</div>`;

export default {
  'seonhee-jinogwi': {
    id: 'seonhee-jinogwi',
    link: 'seonhee.notice.jinogwi',
    title: '[공지] 故 송만신 49재 11월 6일',
    pageTitle: '故 송만신 49재 11월 6일 — 선희당 (누리샘 저장된 페이지)',
    saved: { label: '9월 22일 18시' },
    change: { kind: 'modified', label: '수정됨 9월 23일' },
    card: 'E09',
    solve: 'P04',
    theme: 'seonhee',
    html: SEONHEE_JINOGWI,
  },
  'seowolilbo-0921': {
    id: 'seowolilbo-0921',
    link: 'seowolilbo.0921',
    title: '무속인, 굿 도중 작두서 떨어져 숨져',
    pageTitle: '무속인, 굿 도중 작두서 떨어져 숨져 — 서월일보 (누리샘 저장된 페이지)',
    saved: { label: '9월 21일 7시 10분' },
    change: { kind: 'modified', label: '수정됨 9월 21일(사진 교체)' },
    card: 'X-nurisaem-ilbo-first',
    theme: 'seowolilbo',
    html: ILBO_0921_FIRST,
  },
};
