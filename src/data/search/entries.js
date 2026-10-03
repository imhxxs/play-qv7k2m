// 누리샘 검색 엔트리(기획서 §7.2 중 제1장에 구현된 대상) + 다른 사이트 주소표.
//
// ── LINKS ── 결과가 가리키는 다른 사이트 페이지. 다른 담당이 글 id를 정하면 여기만 고친다.
//   { site, page, query }  — site·page는 src/data/sites.js 값. 그 사이트·페이지가 sites.js에 없으면
//   엔진이 결과를 빼 버린다(아직 없는 사이트 = '색인되지 않음').
//
// ── 엔트리 ──
//   id, headword(표제어·제안에 쓰는 이름), synonyms(동의어·변형·흔한 오타), typos(제안 전용, 매칭엔 쓰지 않음)
//   suggest(자동완성에 보일 말), related(함께 찾는 말), chapter(공개 장, 기본 1)
//   results: [ { link | filler | type:'snippet'|'map'|'weather'|'ganji'|'savedinfo', title, snippet, date, press, cache, chapter } ]
//   images: [images.js id], dict: [dict.js id]
//   solve: 'P02' 처럼 결과를 보이면 풀리는 퍼즐 · band: true 면 서월일보 아카이브 공지 띠
//   noSuggest: 자동완성에서 뺀다(독초 관련 등 §11.4) · suggestMin: 자동완성에 뜨는 최소 음절 수
//   scare: 결과를 보였을 때 한 번 쓰는 깜짝 연출 { id, kind, text, delayMs }

export const LINKS = {
  // 누리샘·누리메일
  'nurisaem.home': { site: 'nurisaem', page: 'index' },
  'nurisaem.dict': { site: 'nurisaem', page: 'dict' },
  'nurimail.home': { site: 'nurimail', page: 'index', query: '' },

  // 월하당
  'wolhadang.home': { site: 'wolhadang', page: 'index' },
  'wolhadang.about': { site: 'wolhadang', page: 'about' },
  'wolhadang.daughters': { site: 'wolhadang', page: 'daughters' },
  'wolhadang.gut': { site: 'wolhadang', page: 'gut' },
  'wolhadang.guide': { site: 'wolhadang', page: 'guide' },
  'wolhadang.gallery': { site: 'wolhadang', page: 'gallery' },
  'wolhadang.notice': { site: 'wolhadang', page: 'notice' },
  'wolhadang.notice.cuesheet': { site: 'wolhadang', page: 'notice', query: 'id=2' },
  'wolhadang.notice.will': { site: 'wolhadang', page: 'notice', query: 'id=3' },
  'wolhadang.notice.49': { site: 'wolhadang', page: 'notice', query: 'id=4' },
  'wolhadang.reviews': { site: 'wolhadang', page: 'reviews' },
  'wolhadang.faq': { site: 'wolhadang', page: 'faq' },
  'wolhadang.rice': { site: 'wolhadang', page: 'rice' },
  'wolhadang.contact': { site: 'wolhadang', page: 'contact' },
  'wolhadang.admin': { site: 'wolhadang', page: 'admin' },

  // 선희당
  'seonhee.home': { site: 'seonhee', page: 'index' },
  'seonhee.greeting': { site: 'seonhee', page: 'greeting' },
  'seonhee.counselors': { site: 'seonhee', page: 'counselors' },
  'seonhee.flags': { site: 'seonhee', page: 'flags' },
  'seonhee.saju': { site: 'seonhee', page: 'saju' },
  'seonhee.fortune': { site: 'seonhee', page: 'fortune' },
  'seonhee.notice': { site: 'seonhee', page: 'notice' },
  'seonhee.notice.jinogwi': { site: 'seonhee', page: 'notice', query: 'id=jinogwi' },
  'seonhee.qna': { site: 'seonhee', page: 'qna' },
  'seonhee.recruit': { site: 'seonhee', page: 'recruit' },

  // 서월일보
  'seowolilbo.home': { site: 'seowolilbo', page: 'index' },
  'seowolilbo.archive': { site: 'seowolilbo', page: 'archive' },
  'seowolilbo.0921': { site: 'seowolilbo', page: 'article', query: 'id=20260921' },
  'seowolilbo.0925': { site: 'seowolilbo', page: 'article', query: 'id=20260925' },
  'seowolilbo.healing2025': { site: 'seowolilbo', page: 'article', query: 'id=20250612' },

  // 신명마당(모임터)
  'sinmyeong.home': { site: 'sinmyeong', page: 'index' },
  'sinmyeong.sinbeol': { site: 'sinmyeong', page: 'post', query: 'id=sinbeol' },
  'sinmyeong.rumor': { site: 'sinmyeong', page: 'post', query: 'id=rumor' },
  'sinmyeong.sinbyeong': { site: 'sinmyeong', page: 'index', query: 'board=sinbyeong' },
  'sinmyeong.join': { site: 'sinmyeong', page: 'join' },

  // 서월 힐링타운
  'healingtown.home': { site: 'healingtown', page: 'index' },

  // 명월선녀의 신병일기
  'blog.home': { site: 'blog-myeongwol', page: 'index' },
};

// '지금 서월에서 많이 찾는 말' — 장마다(그 장 번호 이하 중 가장 큰 것을 쓴다). 제2장 이후는 그 장을 만들 때 더한다.
export const TRENDING = {
  1: ['서월 월하당', '작두 만신', '서월 힐링타운'],
};

// '이 이미지로 검색' — 수첩 카드 → 유사 이미지 결과(기획서 §7.8 중 제1장에 있는 대상)
export const IMAGE_QUERY = {
  E08: { dict: ['myeongdu'], images: ['wolhadang-myeongdu'] },
  E12: { dict: ['myeongdu'], images: ['wolhadang-myeongdu'] },
  'X-haewonbu': { dict: ['haewonbu', 'bujeok'] },
  // 이미지 탭의 결과 사진으로 다시 찾기('img:' + images.js id)
  'img:wolhadang-myeongdu': { dict: ['myeongdu'] },
  'img:seonhee-flags': { dict: ['obanggi'] },
};

// 수첩 카드 중 '이미지 카드'로 보는 것(이미지로 검색 고르기 목록)
export const IMAGE_CARDS = ['E06', 'E07', 'E08', 'E12', 'E59', 'X-haewonbu'];

const ILBO_0921 = {
  link: 'seowolilbo.0921', press: '서월일보', kind: 'news',
  title: '무속인, 굿 도중 작두서 떨어져 숨져',
  snippet: '서월산 아래 신당 월하당에서 진적굿을 하던 무속인 송복례(69)씨가 작두 위에서 떨어져 숨졌다. 경찰은 부정맥 병력 등으로 미뤄 범죄 혐의점이 없다고 보고 내사를 종결할 방침이다.',
  date: '2026.09.21 07:10', cache: 'seowolilbo-0921',
};
const ILBO_0925 = {
  link: 'seowolilbo.0925', press: '서월일보', kind: 'news',
  title: '신딸 행방 묘연… 유족, 열쇠·신물 반출로 고소',
  snippet: '숨진 무속인의 막내 신딸 서모(27)씨가 신당 열쇠와 신물을 가지고 사라졌다며 유족이 고소장을 냈다. 유족 측은 “살인 의혹과는 무관하다”고 밝혔다.',
  date: '2026.09.25 08:30',
};
const SINBEOL = {
  link: 'sinmyeong.sinbeol', source: '신명마당 › 무속계 소식',
  title: '월하당 만신 작두에서 신벌 받았다 [댓글 47]',
  snippet: '그날 굿판에 있던 사람인데요, 장군거리에서 녹기가 나왔어요. 작두 오르시기 전부터 분위기가 이상했다는 사람이 한둘이 아닙니다…',
  date: '2026.09.22',
};
const WOLHADANG_HOME = {
  link: 'wolhadang.home', source: '월하당',
  title: '월하당(月下堂) — 송만신 신점·점사·사주·굿 봐드립니다',
  snippet: '서월산 아래 월하당입니다. 황해도굿·작두 송만신. 신점, 점사, 굿 문의는 상담 문의로 남겨 주세요. [근조] 송만신 어머니께서 9월 19일 신령님 곁으로 가셨습니다.',
  date: '2026.09.21',
};
const SEONHEE_HOME = {
  link: 'seonhee.home', source: '선희당',
  title: '선희당 — 선희보살 신점·사주·궁합 봐드립니다',
  snippet: '첫 신점 무료! 선희보살과 선생님 30인이 기다립니다. 오방기 점 체험 · 오늘의 사주 · 무료 신점 신청 · 1:1 문의.',
  date: '2026.09.23',
};
const SEONHEE_FLAGS = {
  link: 'seonhee.flags', source: '선희당',
  title: '오방기 점 체험 — 선희당',
  snippet: '말아 쥔 다섯 깃발 중 하나를 뽑아 보세요. 깃발 빛깔에 담긴 뜻을 선희당의 풀이로 알려 드립니다.',
  date: '2026.03.02',
};
const WOLHADANG_GALLERY = {
  link: 'wolhadang.gallery', source: '월하당',
  title: '신당 갤러리 — 월하당',
  snippet: '장군님 상과 명두(9월 6일) · 장구 40년, 최경필 선생님 · 대감거리 · 봄맞이 신당 단장. 사진을 누르면 크게 볼 수 있습니다.',
  date: '2026.09.06',
};
const WOLHADANG_FAQ = {
  link: 'wolhadang.faq', source: '월하당',
  title: '자주 묻는 질문 — 월하당',
  snippet: 'Q. 사주도 보시나요? Q. 아픈데 신병인가요? Q. 굿값은 얼마인가요? 처음 오시는 손님들이 자주 물으시는 것들을 모았습니다.',
  date: '2025.11.20',
};

export const ENTRIES = [
  // ── 핵심(제1장) ───────────────────────────────────────────
  {
    id: 'wolhadang', headword: '월하당',
    synonyms: ['월하당', '월하 당', '月下堂', '월화당', '월하당 송만신', '서월 월하당', '월하당 홈페이지', '월하당 신당', '월하당 점집', 'wolhadang', 'wolhadang.kr', 'www.wolhadang.kr'],
    typos: ['월하담', '월아당'],
    suggest: ['월하당', '월하당 작두', '월하당 신벌', '월하당 진오귀굿', '월하당 송만신', '월하당 신딸'],
    related: ['월하당 작두', '월하당 신벌', '월하당 진오귀굿', '송만신', '진적굿 큐시트', '명두'],
    solve: 'P02', band: true,
    results: [WOLHADANG_HOME, ILBO_0921, SINBEOL],
    images: ['wolhadang-hall', 'wolhadang-myeongdu', 'wolhadang-janggu', 'wolhadang-rice'],
  },
  {
    id: 'songbokrye', headword: '송복례',
    synonyms: ['송복례', '송만신', '송 만신', '월하당 만신', '宋福禮', '송복례 만신', '송만신님'],
    suggest: ['송복례', '송만신'],
    related: ['월하당', '작두 사망', '진오귀굿', '만신 뜻'],
    results: [
      {
        link: 'wolhadang.about', source: '월하당',
        title: '만신 소개 — 월하당',
        snippet: '송만신(송복례) 어머니는 서월산 아래 월하당을 여시고 마흔 해 넘게 황해도굿과 작두로 손님을 맞으셨습니다. 아픈 손님은 병원부터 보내셨습니다.',
        date: '2025.10.14',
      },
      ILBO_0921,
    ],
    dict: ['mansin'],
  },
  {
    id: 'jakdu-death', headword: '작두 사망',
    synonyms: ['작두 사망', '무속인 작두', '작두 사고', '서월 무속인', '진적굿 사고', '작두 만신', '작두에서 떨어져', '작두서 떨어져', '무속인 사망', '굿 도중 사망', '작두 낙상', '만신 사망', '무당 사망'],
    suggest: ['작두 사망', '작두 만신', '작두 사고'],
    related: ['월하당', '송만신', '신벌', '부정맥', '진적굿'],
    results: [ILBO_0921, SINBEOL],
    images: ['ilbo-0921'],
  },
  {
    id: 'sinbeol', headword: '신벌',
    synonyms: ['신벌', '월하당 신벌', '신벌 받았다', '신벌 받은 만신', '신의 벌', '神罰'],
    suggest: ['신벌', '월하당 신벌'],
    related: ['월하당', '작두 사망', '신명마당', '상문'],
    results: [SINBEOL, ILBO_0921],
  },
  {
    id: 'daeun', headword: '서다은',
    synonyms: ['서다은', '다은', '다은이', '서 다은', '徐多恩', '신딸 서모씨', '서모씨', '서모 씨', '신딸 서씨', '막내 신딸 서모씨'],
    suggest: ['서다은'],
    related: ['명월선녀', '월하당 신딸', '신딸 고소', '서월일보'],
    results: [
      ILBO_0925,
      {
        link: 'sinmyeong.rumor', source: '신명마당 › 자유',
        title: '명두 캐낸 막내 신딸 얘기 들으셨어요?',
        snippet: '월하당 막내가 어디서 놋거울을 캐 왔다더니… 죽은 무당 신을 훔쳐 왔다는 말까지 돌던데, 확인 안 된 얘기는 다들 말조심합시다.',
        date: '2026.09.24',
      },
    ],
  },
  {
    id: 'myeongwol', headword: '명월선녀',
    synonyms: ['명월선녀', '명월 선녀', '명월', '명월선여', '明月仙女', 'myeongwol', '@myeongwol', 'solgeul.net/@myeongwol', '명월선녀 블로그', '명월선녀의 신병일기', '신병일기'],
    suggest: ['명월선녀', '명월선녀의 신병일기'],
    suggestMin: 2, // 한 글자('명')만으로는 언니의 신명이 뜨지 않게
    related: ['월하당 신딸', '내림굿', '신병', '월하당'],
    solve: 'P03',
    results: [
      {
        link: 'blog.home', source: '솔글 · @myeongwol',
        title: '명월선녀의 신병일기',
        snippet: '1999.03.14 · 웹디자인 하다 신 받은 사람. 신병일기 · 신당 일 · 만든 것들 · 일상. 최근 글: 입산.',
        date: '2026.09.22',
      },
      {
        link: 'wolhadang.daughters', source: '월하당',
        title: '신딸 소개 — 월하당',
        snippet: '송만신 어머니의 신딸들을 소개합니다. 막내 명월선녀는 2026년 9월 5일 내림을 받았습니다.',
        date: '2026.09.06',
      },
    ],
  },
  {
    id: 'sinttal', headword: '월하당 신딸',
    synonyms: ['월하당 신딸', '송만신 신딸', '월하당 막내', '월하당 큰신딸'],
    suggest: ['월하당 신딸'],
    related: ['명월선녀', '선희보살', '신딸 뜻', '내림굿'],
    results: [
      {
        link: 'wolhadang.daughters', source: '월하당',
        title: '신딸 소개 — 월하당',
        snippet: '송만신 어머니의 신딸들을 소개합니다. 큰신딸 선희보살(2001년 내림, 선희당 운영), 막내 명월선녀(2026년 9월 5일 내림).',
        date: '2026.09.06',
      },
    ],
    dict: ['sineomeoni'],
  },
  {
    id: 'sinmyeong', headword: '신명마당',
    synonyms: ['신명마당', '신명 마당', '무속 모임', '무당 모임', '모임터', 'moimteo', 'moimteo.net', '무속 게시판', '신명마당 모임터'],
    suggest: ['신명마당'],
    related: ['월하당 신벌', '신병', '좋은 선생님 후기', '선희당'],
    results: [
      {
        link: 'sinmyeong.home', source: '모임터',
        title: '신명마당 — 무속인과 손님이 함께하는 마당 (모임터)',
        snippet: '무속계 소식 · 점사 후기 · 좋은 선생님 후기 · 신병 상담 · 자유. 손님 → 단골 → 마당지기. 서로 존중하는 말로 이야기해 주세요.',
        date: '2026.09.26',
      },
      SINBEOL,
    ],
  },
  {
    id: 'seonhee', headword: '선희당',
    synonyms: ['선희당', '선희보살', '선희 보살', '문선희', '선희 신점', '선희', 'seonhee', 'seonhee-sinjeom', 'seonhee-sinjeom.com', '선희당 신점'],
    suggest: ['선희당', '선희당 진오귀굿', '선희당 무료 신점', '선희당 오방기', '선희당 상담사 모집', '선희보살'],
    related: ['선희당 진오귀굿', '선희당 무료 신점', '오방기', '선희당 상담사 모집', '신점'],
    results: [
      SEONHEE_HOME,
      {
        link: 'seonhee.greeting', source: '선희당',
        title: '선희보살 인사말 — 선희당',
        snippet: '월하당 송만신 어머니의 큰신딸, 선희보살입니다. 어머니께 배운 대로 손님 한 분 한 분의 마음을 먼저 듣겠습니다.',
        date: '2024.05.10',
      },
    ],
    images: ['seonhee-banner', 'seonhee-flags'],
  },
  {
    id: 'seonhee-free', headword: '선희당 무료 신점',
    synonyms: ['선희당 무료 신점', '무료 신점', '첫 신점 무료', '무료신점', '신점 무료', '무료 상담'],
    suggest: ['선희당 무료 신점'],
    related: ['선희당', '신점', '오늘의 사주'],
    results: [
      {
        link: 'seonhee.fortune', source: '선희당',
        title: '첫 신점 무료 신청 — 선희당',
        snippet: '이름과 생년월일, 고민을 남겨 주시면 선생님이 배정되어 메일로 답을 드립니다. 실제 개인정보는 적지 마세요.',
        date: '2026.09.01',
      },
      SEONHEE_HOME,
    ],
  },
  {
    id: 'seonhee-jinogwi', headword: '선희당 진오귀굿',
    synonyms: [
      '선희당 진오귀굿', '선희당 진오귀', '선희당 진오기굿', '선희당 공지', '선희당 49재', '진오귀굿', '진오귀', '진오기굿', '진오기',
      '신물 소각', '신물소각', '신물 태우기', '송만신 진오귀', '송만신 진오귀굿', '송만신 49재', '49재', '사십구재', '월하당 진오귀굿', '월하당 49재',
    ],
    suggest: ['선희당 진오귀굿', '진오귀굿', '신물 소각', '송만신 49재'],
    related: ['선희당', '진오귀굿 뜻', '49재 뜻', '무구', '월하당'],
    results: [
      {
        link: 'seonhee.notice.jinogwi', source: '선희당 › 공지',
        title: '[공지] 故 송만신 진오귀굿 및 신물 소각 10월 10일',
        snippet: '故 송만신 어머니를 보내 드리는 진오귀굿과 남기신 신물 소각을 10월 10일 월하당에서 모십니다. (수정됨 09.23)',
        date: '2026.09.22', cache: 'seonhee-jinogwi',
      },
      {
        link: 'wolhadang.notice.49', source: '월하당 › 공지사항',
        title: '故 송만신 49재 11월 6일(예정)',
        snippet: '어머니의 49재는 11월 6일에 모실 예정입니다. 오시는 길과 시간은 다시 알려 드리겠습니다. — 명월',
        date: '2026.09.21',
      },
    ],
    dict: ['jinogwi', '49jae'],
  },
  {
    id: 'seonhee-recruit', headword: '선희당 상담사 모집',
    synonyms: ['선희당 상담사 모집', '선희당 채용', '선희당 선생님 모집', '선희당 모집', '달무리컴퍼니', '달무리', '함께할 선생님', '함께할 선생님 모집', '상담사 모집', '상담사 채용', '점술 상담사 모집'],
    suggest: ['선희당 상담사 모집', '달무리컴퍼니'],
    related: ['선희당', '사주', '타로'],
    results: [
      {
        link: 'seonhee.recruit', source: '선희당',
        title: '함께할 선생님 모집 — 선희당',
        snippet: '선희당과 함께할 선생님을 모십니다. 재택 가능, 교육 제공. 자세한 조건은 본문을 확인해 주세요. 운영 대행 (주)달무리컴퍼니.',
        date: '2026.08.03',
      },
    ],
  },
  {
    id: 'sinjeom', headword: '신점',
    synonyms: ['신점', '神占', '신점 보는 곳', '신점 잘 보는 곳', '신점 뜻', '신점 보기'],
    suggest: ['신점', '신점 사주 차이', '신점 뜻'],
    related: ['사주', '점사', '타로', '신점 사주 차이'],
    results: [
      WOLHADANG_HOME,
      {
        link: 'seonhee.fortune', source: '선희당',
        title: '첫 신점 무료 신청 — 선희당',
        snippet: '이름과 생년월일, 고민을 남겨 주시면 선생님이 배정되어 메일로 답을 드립니다.',
        date: '2026.09.01',
      },
    ],
    dict: ['sinjeom', 'saju'],
  },
  {
    id: 'sinjeom-saju', headword: '신점 사주 차이',
    synonyms: ['신점 사주 차이', '신점과 사주', '사주 신점 차이', '신점 사주', '사주와 신점'],
    related: ['신점', '사주', '철학관', '타로'],
    results: [WOLHADANG_FAQ],
    dict: ['sinjeom', 'saju', 'yeoksul'],
  },
  {
    id: 'saju', headword: '사주',
    synonyms: ['사주', '四柱', '사주팔자', '오늘의 사주', '사주 보는 법', '운세', '오늘의 운세', '사주풀이'],
    suggest: ['사주', '오늘의 사주', '사주팔자'],
    related: ['신점 사주 차이', '철학관', '간지', '만세력'],
    results: [
      {
        link: 'seonhee.saju', source: '선희당',
        title: '오늘의 사주 — 선희당',
        snippet: '생년월일을 넣으면 오늘의 사주 풀이를 무료로 보여 드립니다. 지난 상담 다시 보기도 여기서.',
        date: '2026.09.27',
      },
      WOLHADANG_FAQ,
    ],
    dict: ['saju', 'ganji'],
  },
  {
    id: 'jeomsa', headword: '점사',
    synonyms: ['점사', '占辭', '점사 뜻', '점사 보기'],
    related: ['신점', '사주'],
    results: [WOLHADANG_HOME],
    dict: ['jeomsa', 'sinjeom'],
  },
  {
    id: 'tarot', headword: '타로',
    synonyms: ['타로', '타로카드', '타로점', 'tarot', '타로 카드'],
    related: ['신점', '사주', '선희당'],
    results: [
      {
        link: 'seonhee.counselors', source: '선희당',
        title: '상담사 30인 — 선희당',
        snippet: '신점·사주·타로 선생님 30인. 원하시는 선생님을 골라 상담받으세요.',
        date: '2026.09.20',
      },
    ],
    dict: ['tarot'],
  },
  {
    id: 'yeoksul', headword: '철학관',
    synonyms: ['철학관', '철학원', '역술', '역술인', '易術', '작명소'],
    related: ['사주', '신점 사주 차이'],
    results: [WOLHADANG_FAQ],
    dict: ['yeoksul', 'saju'],
  },
  {
    id: 'seowolilbo', headword: '서월일보',
    synonyms: ['서월일보', '서월 일보', '서월 신문', '서월신문', 'seowolilbo', 'seowolilbo.kr', '서월일보 기사'],
    suggest: ['서월일보'],
    related: ['작두 사망', '서월 힐링타운', '서월 날씨'],
    results: [
      {
        link: 'seowolilbo.home', source: '서월일보',
        title: '서월일보 — 서월의 오늘을 기록합니다',
        snippet: '서월군 지역신문. 사회 · 생활 · 문화 · 오피니언 · 지면 보기. 사건 제보 jebo@seowolilbo.kr',
        date: '2026.09.27',
      },
      ILBO_0925,
      ILBO_0921,
    ],
  },
  {
    id: 'obanggi', headword: '오방기',
    synonyms: ['오방기', '五方旗', '오방기 뜻', '오방기 색', '오방기 색깔', '오방신기', '오방 깃발', '오방기 점', '다섯 깃발', '깃발 점'],
    suggest: ['오방기', '오방기 뜻', '오방기 색'],
    related: ['상문', '선희당', '내림굿', '무구'],
    results: [SEONHEE_FLAGS],
    images: ['seonhee-flags'],
    dict: ['obanggi', 'sangmun'],
  },
  {
    id: 'myeongdu', headword: '명두',
    synonyms: ['명두', '明斗', '명도', '무당 거울', '무당거울', '놋거울', '놋쇠 거울', '명두 거울', '신의 눈'],
    suggest: ['명두', '명두 뜻'],
    related: ['무구', '월하당', '칠성', '놋거울'],
    results: [WOLHADANG_GALLERY],
    images: ['wolhadang-myeongdu'],
    dict: ['myeongdu', 'mugu'],
    scare: { id: 'nurisaem-myeongdu', kind: 'mirror', text: '보았다', delayMs: 1400 },
  },
  {
    id: 'jakdu', headword: '작두',
    synonyms: ['작두', '작두굿', '작두거리', '작두타기', '작두 타기', '장군거리', '장군님 첫 잔', '장군님 첫잔', '장군님 잔', '작두 위'],
    suggest: ['작두', '작두 만신', '장군거리'],
    related: ['작두 사망', '진적굿', '월하당', '만신'],
    results: [
      {
        link: 'wolhadang.gut', source: '월하당',
        title: '굿 안내 — 월하당',
        snippet: '월하당에서 모시는 굿을 안내합니다. 진적굿·재수굿·진오귀굿, 장군거리와 작두, 그리고 월하당이 지켜 온 법도.',
        date: '2025.10.14',
      },
    ],
    dict: ['jakdu', 'janggungeori'],
  },
  {
    id: 'sinbyeong', headword: '신병',
    synonyms: ['신병', '神病', '무병', '신병 증상', '신병 앓이', '신병인지 병인지', '신내림', '신 내림'],
    suggest: ['신병', '신병 증상'],
    related: ['내림굿', '신명마당', '명월선녀'],
    results: [
      {
        link: 'sinmyeong.sinbyeong', source: '신명마당 › 신병 상담',
        title: '신병 상담 게시판 — 신명마당',
        snippet: '신병인지 병인지 모르겠다는 고민은 여기로. 마당지기 공지: 먼저 병원 진료를 꼭 받아 보시고, 그다음에 이야기 나눠요.',
        date: '2026.09.25',
      },
    ],
    dict: ['sinbyeong', 'naerimgut'],
  },
  {
    id: 'sangmun', headword: '상문',
    synonyms: ['상문', '喪門', '상문살', '상문기', '녹기', '상문 뜻', '녹색 깃발', '상문 들다', '상문이 들었다'],
    suggest: ['상문', '상문살'],
    related: ['오방기', '월하당 쌀점', '신벌'],
    results: [
      { ...SEONHEE_FLAGS, snippet: '다섯 깃발에 담긴 뜻을 선희당의 풀이로 알려 드립니다. 녹기는 상문(喪門), 슬픈 기운이 든 것으로 풉니다.' },
    ],
    images: ['seonhee-flags'],
    dict: ['sangmun', 'obanggi'],
  },
  {
    id: 'ssaljeom', headword: '쌀점',
    synonyms: ['쌀점', '쌀 점', '온라인 쌀점', '월하당 쌀점', '쌀점 보기'],
    suggest: ['쌀점', '월하당 쌀점'],
    related: ['오방기', '상문', '월하당'],
    results: [
      {
        link: 'wolhadang.rice', source: '월하당',
        title: '온라인 쌀점 — 월하당',
        snippet: '쌀알을 집어 흩어 보세요. 홀짝으로 오늘의 점괘가 나옵니다.',
        date: '2025.10.14',
      },
    ],
    images: ['wolhadang-rice'],
    dict: ['ssaljeom'],
  },
  {
    id: 'junho', headword: '서월 힐링타운',
    synonyms: ['서월 힐링타운', '힐링타운', '서월힐링타운', '하준호', '준호개발', '준호 개발', 'healingtown', 'seowol-healingtown', '힐링타운 분양', '서월 분양', '서월 전원주택', '서월 타운하우스'],
    suggest: ['서월 힐링타운', '하준호', '준호개발'],
    related: ['서월일보', '월하당', '서월 날씨'],
    results: [
      {
        link: 'healingtown.home', source: '서월 힐링타운',
        title: '서월 힐링타운 — 자연 속 프리미엄 전원 단지 선착순 분양',
        snippet: '서월산 자락 숲세권 전원 단지. 토지 확보 2026년 10월 예정. 조감도 · 분양 안내 · Q&A · 대표 인사말 · 대표 문의.',
        date: '2026.09.15',
      },
      {
        link: 'seowolilbo.healing2025', press: '서월일보', kind: 'news',
        title: '서월 힐링타운 추진… 준호개발 “서월산 자락에 전원 단지”',
        snippet: '준호개발(대표 하준호)이 서월산 아래에 전원주택 단지를 추진한다. 회사는 현재 하청업체와 공사대금 소송 중이다.',
        date: '2025.06.12',
      },
      ILBO_0925,
    ],
    images: ['healingtown'],
  },
  {
    id: 'hyugeso', headword: '서월휴게소',
    synonyms: ['서월휴게소', '서월 휴게소', '서월휴게소 위치'],
    related: ['서월 날씨', '서월 힐링타운'],
    results: [
      {
        type: 'map', id: 'hyugeso', title: '서월휴게소',
        addr: '서월군 서월읍 7번 국도변 (상·하행 공용)',
        note: '서월 신당 마을에서 차로 약 30분',
        info: '24시간 · 편의점 · 호두과자 · 주유소',
      },
    ],
  },
  {
    id: 'hospital', headword: '서월대학병원',
    synonyms: ['서월대학병원', '서월대병원', '서월대학교병원', '서월대학병원 신경외과', '측두엽', '신경외과', '서월의료원'],
    related: ['신병', '부정맥'],
    results: [
      {
        type: 'snippet', id: 'hospital', title: '서월대학병원 — 진료 안내',
        source: '병원 정보',
        lines: [
          '신경과 · 신경외과 · 심장내과 외래: 평일 09:00~17:00, 토 09:00~12:00(일·공휴일 휴진)',
          '응급실 24시간 · 예약은 대표전화(XXX-XXXX-XXXX) 또는 방문 접수',
          '서월의료원(서월읍)과 진료 협력 중',
        ],
      },
    ],
  },
  {
    id: 'tugukkot', headword: '투구꽃',
    synonyms: ['투구꽃', '초오', '草烏', '부자', '附子', '독초', '투구꽃 독'],
    noSuggest: true, band: true,
    related: [],
    results: [],
    dict: ['tugukkot'],
  },
  {
    id: 'jeorim', headword: '입술 저림',
    synonyms: ['입술 저림', '입술이 저려요', '입술 저려', '손끝 저림', '손 저림', '혀 저림', '입이 얼얼', '저림'],
    noSuggest: true, band: true,
    results: [],
    dict: ['jeorim'],
  },
  {
    id: 'buljeongmaek', headword: '부정맥',
    synonyms: ['부정맥', '不整脈', '부정맥 약', '심장 두근거림'],
    related: ['작두 사망'],
    results: [],
    dict: ['buljeongmaek'],
  },
  {
    id: 'choigyeongpil', headword: '최경필',
    synonyms: ['최경필', '경필', '崔京弼', '최경필 선생님', '장구 선생님', '장구잽이 최경필', '장구 40년'],
    suggest: ['최경필'],
    band: true,
    related: ['월하당', '장구잽이'],
    results: [
      {
        ...WOLHADANG_GALLERY,
        snippet: '장구 40년, 최경필 선생님 — 스무 해 넘게 우리 집 장구를 쳐 주신 선생님. 장군님 상과 명두(9월 6일) · 대감거리 · 봄맞이 신당 단장.',
      },
    ],
    images: ['wolhadang-janggu'],
  },
  {
    id: 'yeoni', headword: '연이',
    synonyms: ['연이', '최연이'],
    noSuggest: true, band: true,
    results: [],
    dict: ['yeoni'],
  },
  {
    id: 'reservoir', headword: '서월저수지',
    synonyms: ['서월저수지', '서월 저수지', '저수지', '저수지 둘레길', '저수지 사고', '서월저수지 2005', '넋건지기 서월'],
    noSuggest: true, band: true,
    related: ['서월 날씨', '서월산'],
    results: [{ filler: 'f-reservoir' }],
    images: ['reservoir'],
  },
  {
    id: 'ganji', headword: '간지',
    synonyms: ['간지', '干支', '육십갑자', '60갑자', '띠', '간지 계산', '간지 변환', '간지 연도', '세차', '을유', '乙酉', '을유년', '기미', '己未', '기미년', '병오년', '올해 간지'],
    suggest: ['간지', '간지 계산', '육십갑자'],
    related: ['만세력', '사주'],
    results: [{ type: 'ganji', id: 'ganji' }],
    dict: ['ganji'],
  },
  {
    id: 'manseryeok', headword: '만세력',
    synonyms: ['만세력', '萬歲曆', '음력 변환', '음력 양력', '음력 양력 변환', '음력', '양력 변환', '음양력', '음력 날짜'],
    suggest: ['만세력', '음력 변환'],
    related: ['간지', '사주'],
    results: [{ type: 'ganji', id: 'ganji' }],
    dict: ['manseryeok', 'ganji'],
  },
  {
    id: 'chilseong', headword: '칠성',
    synonyms: ['칠성', '七星', '북두칠성', '칠성기도', '칠성님', '일곱 별', '칠성 뜻'],
    suggest: ['칠성', '북두칠성'],
    related: ['명두', '기도터'],
    results: [{ filler: 'f-stars' }],
    dict: ['chilseong'],
  },
  {
    id: 'haewonbu', headword: '해원부',
    synonyms: ['해원부', '解冤符', '해원 부적', '부적', '符籍', '부적 뜻', '경면주사', '鏡面朱砂'],
    suggest: ['해원부', '부적'],
    related: ['월하당', '공수'],
    results: [],
    dict: ['haewonbu', 'bujeok', 'gyeongmyeon'],
  },
  {
    id: 'jinjeok', headword: '진적굿',
    synonyms: ['진적굿', '진적', '진적 굿', '진적굿 큐시트', '큐시트', '굿 순서', '진적굿 순서'],
    suggest: ['진적굿', '진적굿 큐시트'],
    related: ['작두', '월하당', '장군거리'],
    results: [
      {
        link: 'wolhadang.notice.cuesheet', source: '월하당 › 공지사항',
        title: '9월 19일 진적굿 순서(큐시트)',
        snippet: '9월 19일(토) 진적굿 순서를 올립니다. 18:00 부정거리부터 시작합니다. 오시는 분들은 순서를 참고해 주세요.',
        date: '2026.09.15',
      },
      {
        link: 'wolhadang.gut', source: '월하당',
        title: '굿 안내 — 월하당',
        snippet: '월하당에서 모시는 굿을 안내합니다. 진적굿·재수굿·진오귀굿, 장군거리와 작두.',
        date: '2025.10.14',
      },
    ],
    dict: ['jinjeok'],
  },
  {
    id: 'admin', headword: '월하당 관리자',
    synonyms: ['월하당 관리자', '월하당 관리자 페이지', '월하당 로그인', '월하당 admin', 'wolhadang admin', '관리자 로그인'],
    suggest: ['월하당 관리자'],
    related: ['월하당'],
    results: [
      {
        link: 'wolhadang.admin', source: '월하당',
        title: '관리자 로그인 — 월하당',
        snippet: '관리자 전용 페이지입니다. 아이디와 비밀번호를 입력해 주세요.',
        date: '',
      },
    ],
  },
  {
    id: 'kongtteok', headword: '콩떡',
    synonyms: ['콩떡', '콩떡이', '콩떡 강아지'],
    suggest: ['콩떡', '콩떡 만들기'],
    related: ['강아지 이름', '콩떡 만들기'],
    results: [{ filler: 'f-kongtteok' }, { filler: 'f-kongtteok-recipe' }],
    images: ['kongtteok'],
  },
  {
    id: 'weather', headword: '서월 날씨',
    synonyms: ['서월 날씨', '서월군 날씨', '서월 기온', '서월산 날씨', '날씨', '오늘 날씨', '내일 날씨', '미세먼지', '안개'],
    suggest: ['서월 날씨'],
    related: ['서월산', '서월 힐링타운', '서월 억새 축제'],
    results: [{ type: 'weather', id: 'weather' }, { filler: 'f-weather-blog' }],
  },
  {
    id: 'seowol', headword: '서월',
    synonyms: ['서월', '서월군', '서월읍', '서월산', '서월 관광', '서월 가볼만한곳', '서월 여행', '서월 맛집', '서월 등산'],
    suggest: ['서월 날씨', '서월산', '서월 맛집'],
    related: ['서월 날씨', '서월일보', '서월 힐링타운', '서월저수지'],
    results: [{ type: 'weather', id: 'weather' }, { link: 'seowolilbo.home', source: '서월일보', title: '서월일보 — 서월의 오늘을 기록합니다', snippet: '서월군 지역신문. 사회 · 생활 · 문화 · 오피니언 · 지면 보기.', date: '2026.09.27' }, { filler: 'f-tour' }, { filler: 'f-trail' }, { filler: 'f-gomtang' }],
    images: ['seowol-mountain'],
  },
  {
    id: 'nurimail', headword: '누리메일',
    synonyms: ['누리메일', '누리 메일', '메일', '이메일', 'nurimail', 'mail.nurisaem.kr', '메일함', '받은편지함'],
    suggest: ['누리메일'],
    results: [
      {
        link: 'nurimail.home', source: '누리샘',
        title: '누리메일 — 누리샘 메일',
        snippet: '받은편지함 · 보낸편지함 · 쓰기 · 주소록. 누리샘 아이디로 바로 쓰는 메일.',
        date: '',
      },
    ],
  },
  {
    id: 'nurisaem', headword: '누리샘',
    synonyms: ['누리샘', 'nurisaem', 'www.nurisaem.kr', '저장된 페이지', '누리샘 저장된 페이지', '캐시', '저장본', '옛날 페이지', '수정 전 페이지', '고쳐진 글'],
    suggest: ['저장된 페이지'],
    results: [{ type: 'savedinfo', id: 'savedinfo' }, { link: 'nurisaem.dict', source: '누리샘', title: '누리샘 사전 — 용어 풀이 · 한자 찾기 · 간지 변환', snippet: '무속·명리 용어 풀이, 한자 음훈 찾기, 연도와 간지 바꾸기.', date: '' }],
  },
];

export default ENTRIES;
