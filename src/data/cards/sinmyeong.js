// 신명마당 담당 카드. 제1장에는 핵심(E) 카드가 없다.
// 글 하나에 카드 하나(필러 글까지 열람 기록에 조용히 쌓인다) + 눈여겨볼 댓글 몇 개는 댓글 카드.
// 글 원고는 moimteo.net/sinmyeongmadang/posts.js — 글을 더하면 여기에도 더한다(tests/news-moim.spec.js가 맞춰 본다).

const post = (id) => ({ page: 'post', query: `id=${id}` });
const base = { site: 'sinmyeong', key: false, chapter: 1 };

const GENERAL = [
  {
    id: 'X-sinmyeong-sinbeol',
    title: "신명마당 「월하당 만신 작두에서 신벌 받았다」",
    desc: '9월 22일 무속계 소식 게시판. 그날 굿판에 있던 굿판구경꾼의 글: 장군거리에서 막내 신딸이 녹기를 뽑았고, 작두 위에서 공수를 내리다 쓰러졌다. 촬영 조명이 넘어갔다. 막내가 캐 온 명두가 남의 신이라 신벌을 받았다는 말이 돈다.',
    ref: post('sinbeol'),
  },
  {
    id: 'X-sinmyeong-junho',
    title: "신벌 스레드 댓글 — '10시 반쯤 마당에서 아들과 크게 다투셨다'",
    desc: "서월토박이: 그날 밤 10시 반쯤 마당에서 아들과 만신님이 크게 다퉜다(땅 얘기). 그 뒤 아들은 차를 타고 가 버렸다.",
    ref: post('sinbeol'),
  },
  {
    id: 'X-sinmyeong-curse',
    title: "신벌 스레드 댓글 — '죽은 무당 신을 훔쳐 와 저주가 붙었다'",
    desc: '굿판구경꾼: 막내가 내림굿 전에 산에서 놋거울을 캐 와 명두로 모셨는데, 원래 죽은 무당 것이라 저주가 붙었다는 소문. 청수한그릇: 묻힌 명두를 훗날 다른 사람이 캐서 모시는 일은 예전에도 있었다.',
    ref: post('sinbeol'),
  },
  {
    id: 'X-sinmyeong-jinogwi',
    title: "신벌 스레드 댓글 — '선희당이 진오귀를 10월로 당겼다더라'",
    desc: '도토리묵: 49재 날 하는 줄 알았는데 선희당이 진오귀를 10월로 당겼다더라. 하얀고무신: 선희당 공지에 날짜가 올라와 있는데 한 번 고친 글이더라.',
    ref: post('sinbeol'),
  },
  {
    id: 'X-sinmyeong-sanullim',
    title: "신벌 스레드 댓글 — 산울림 '사람 일은 사람이 한 겁니다'",
    desc: "9월 23일 21:47 산울림의 댓글: '신벌이라니 말 같지 않은 소리. 사람 일은 사람이 한 겁니다.'",
    ref: post('sinbeol'),
  },
  {
    id: 'X-sinmyeong-youtuber',
    title: "신명마당 「탐사 유튜버가 신당 안까지 들어와 찍었다」",
    desc: '9월 21일 자유 게시판, 방울소리의 글. 큰신딸 쪽에서 부른 촬영자가 신당 안은 장군거리부터만 찍기로 했는데 쉬는 시간에도 신당을 들락날락했다고. 영상은 올라왔다가 내려갔다. 채널 이름은 적지 않았다.',
    ref: post('youtuber'),
  },
  {
    id: 'X-sinmyeong-thumb',
    title: '흐릿한 영상 썸네일 캡처',
    desc: "'탐사 유튜버' 글에 붙은 흐린 캡처. 검은 바탕에 번진 형광 노란 큰 글씨(‘작두 위… 마지막…’처럼 보인다), 붉은 동그라미와 화살표. 채널 이름은 보이지 않는다.",
    ref: post('youtuber'),
    image: 'assets/sinmyeong/thumb-blur.svg',
  },
  {
    id: 'X-sinmyeong-rumor',
    title: "신명마당 「명두 캐낸 막내 신딸 얘기 들으셨어요?」",
    desc: '9월 24일 자유 게시판. 막내 신딸이 꿈에서 본 자리에서 놋거울을 캐 와 명두로 모셨고, 내림굿 날 만신님이 그 거울 뒷면을 보고 한참 굿을 멈췄다는 말. 장례 뒤 연락 두절. 댓글: 막내 블로그(신병일기)의 마지막 글은 산에 기도 들어간다는 글.',
    ref: post('rumor'),
  },
  {
    id: 'X-sinmyeong-teacher-wolha',
    title: "신명마당 「월하당 송만신께서 병원부터 보내셨다」",
    desc: "2025년 4월 좋은 선생님 후기. 어지럽다는 어머니를 보고 송만신이 점 대신 '내일 당장 병원 가서 피검사부터 해라'. 굿이 필요하면 쌀 한 말만 가져오라 했다.",
    ref: post('teacher-wolha'),
  },
  {
    id: 'X-sinmyeong-sinbyeong-dream',
    title: "신명마당 신병 상담 「몇 달째 같은 꿈에 머리가 아파요」",
    desc: "신병일까 묻는 글에 무속인 방울소리가 '제일 먼저 하실 건 병원'이라며 '병원도 같이 가 보자'고 말해 보라고 했다.",
    ref: post('sinbyeong-dream'),
  },
].map((c) => ({ ...base, kind: 'general', ...c }));

// 필러 글 [id, 제목]
const FILLERS = [
  ['rules', '마당 규칙 — 처음 오신 분은 꼭 읽어 주세요'],
  ['notice-sinbyeong', '신병 상담 게시판 이용 안내'],
  ['notice-0923', '월하당 관련 글 — 고인과 유족을 생각해 주세요'],
  ['news-boheo', '서월 굿 문화 보존회 가을 정기 공연'],
  ['news-sangi', '가을 산기도 철 — 입산 기도 안전 수칙'],
  ['news-jindo', '진도 씻김굿 여름 강습 다녀왔습니다'],
  ['rv-first', '처음 신점 보고 왔어요'],
  ['rv-060', '유명한 보살님 이름 걸린 060 상담 받았다가 후회한 후기'],
  ['rv-ssal', '쌀점이 이렇게 신기한 거였네요'],
  ['rv-yeopjeon', '엽전점 보고 온 날'],
  ['teacher-yeonkkot', '연꽃보살님, 말씀이 따뜻했어요'],
  ['teacher-rice', '굿값이 없다니까 쌀 한 말이면 된다고 하신 분'],
  ['sinbyeong-mom', '어머니가 신병 같다고 굿을 하자고 하세요'],
  ['sinbyeong-fear', '신 받으라는 말을 들었는데 너무 무서워요'],
  ['free-mirror', '요즘 꿈에 거울이 자꾸 나와요'],
  ['free-tonight', '오늘 밤 서월 월하당 진적굿 구경 가시는 분 계세요?'],
  ['free-hello', '처음 왔습니다. 잘 부탁드려요'],
  ['free-tteok', '굿 끝나고 남은 떡, 다들 어떻게 하세요?'],
  ['free-market', '서월 오일장 떡집 추천해 주세요'],
  ['free-bangul', '방울 녹 닦는 법 아시는 분'],
];

export default [
  ...GENERAL,
  ...FILLERS.map(([id, title]) => ({
    ...base,
    id: `X-sinmyeong-${id}`,
    title: `신명마당 「${title}」`,
    kind: 'filler',
    desc: '모임터 신명마당 게시글.',
    ref: post(id),
  })),
];
