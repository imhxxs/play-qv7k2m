// 서월 힐링타운 담당 카드. 일반·필러 카드는 'X-healingtown-<name>' 형식.
// E58(대표 사진)은 §9.1의 단서 카드다. 제1장에는 필요하지 않지만 사진은 처음부터 걸려 있으므로 열람 기록에 쌓인다.
// desc에는 플레이어가 페이지에서 이미 본 것만 쓴다(무엇이 '없는지'는 쓰지 않는다).

const base = { site: 'healingtown', chapter: 1, ref: { page: 'index' } };

export default [
  {
    ...base,
    id: 'E58',
    title: '하준호 대표 인사말 사진',
    kind: 'evidence',
    key: false,
    desc: '서월 힐링타운 대표 인사말의 사진. 검은 정장에 흰 셔츠, 남색 넥타이. 두 손을 앞으로 모았고 왼손목에 은색 손목시계를 찼다. 얼굴은 사진 위로 잘려 보이지 않는다.',
    ref: { page: 'index', query: '#ceo' },
    image: 'assets/healingtown/ceo.svg',
  },
  {
    ...base,
    id: 'X-healingtown-birdseye',
    title: '서월 힐링타운 조감도 — C블록 토지 확보 2026.10 예정',
    kind: 'general',
    key: false,
    desc: "서월산 남쪽 자락 48세대 단지 조감도. 산 바로 아래 붉은 점선의 C블록(8세대)에 '토지 확보 2026.10 예정' 표지가 있고, 그 자리에 옛 기와집 한 채가 흐리게 그려져 있다.",
    ref: { page: 'index', query: '#view' },
    image: 'assets/healingtown/birdseye.svg',
  },
  {
    ...base,
    id: 'X-healingtown-demolish',
    title: '힐링타운 공지 — 기존 건축물 10월 중 철거',
    kind: 'general',
    key: false,
    desc: "9월 22일 공지: 사업 부지 안의 기존 건축물은 토지 확보를 마치는 대로 10월 중 철거할 예정. 준호개발(주).",
    ref: { page: 'index', query: '#notice' },
  },
  {
    ...base,
    id: 'X-healingtown-qna-dongti',
    title: "힐링타운 Q&A — '신당 터에 짓는다고 동티 난다던데요?'",
    kind: 'general',
    key: false,
    desc: '서월 주민의 질문에 힐링타운 측은 풍수 컨설팅을 거친 명당 단지이며 착공 전 안전 기원 행사를 하겠다고 답했다. 남은 일부 부지(C블록)는 2026년 10월 중 확보 예정.',
    ref: { page: 'index', query: '#qna' },
  },
];
