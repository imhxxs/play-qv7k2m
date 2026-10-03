// 사이트 표 — 모든 페이지·링크·주소창이 이 표 하나를 기준으로 움직인다.
//
// 필드
//   name     탭·수첩에 보이는 사이트 이름
//   domain   가짜 도메인(주소창 표시). null이면 게임 밖 화면(시작·오류)
//   base     도메인 뒤에 붙는 가짜 기본 경로(예: '/@myeongwol')
//   baseAliases  주소창에 쳐도 같은 사이트로 인정할 다른 기본 경로
//   dir      웹 루트 기준 실제 폴더(끝에 '/'). 실제 파일 = dir + page + '.html'
//   pages    존재하는 페이지 이름 목록('.html' 없이). 여기 없는 페이지는 주소창에서 404
//   icon     파비콘(SVG data URL로 만든다): { bg, fg, text } 또는 { bg, svg }
//
// 가짜 주소 표기: https://<domain><base>/<page — index는 생략>[?쿼리][#해시]

export const SITES = {
  start: {
    name: '명두',
    domain: null,
    dir: '',
    pages: ['index'],
    icon: { bg: '#0d0b08', fg: '#c9a45c', text: '明' },
  },
  notfound: {
    name: '서버를 찾을 수 없음',
    domain: null,
    dir: '',
    pages: ['notfound'],
    icon: { bg: '#4a4d55', fg: '#ffffff', text: '!' },
  },
  nurimail: {
    name: '누리메일',
    domain: 'mail.nurisaem.kr',
    dir: 'mail.nurisaem.kr/',
    pages: ['index'],
    hashRouting: true, // #inbox #read/<id> #compose #sent #spam #contacts
    icon: {
      bg: '#24408e',
      svg: '<rect x="6" y="9" width="20" height="14" rx="2.5" fill="none" stroke="#fff" stroke-width="2"/><path d="M7 11l9 6 9-6" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>',
    },
  },
  nurisaem: {
    name: '누리샘',
    domain: 'www.nurisaem.kr',
    dir: 'www.nurisaem.kr/',
    pages: ['index', 'search', 'cache', 'dict'],
    icon: {
      bg: '#24408e',
      svg: '<path d="M16 5c4.5 6 7.5 9.8 7.5 13.6A7.5 7.5 0 0 1 8.5 18.6C8.5 14.8 11.5 11 16 5z" fill="#fff"/><path d="M12.4 19.2a3.8 3.8 0 0 0 3.4 3.6" fill="none" stroke="#24408e" stroke-width="1.6" stroke-linecap="round"/>',
    },
  },
  wolhadang: {
    name: '월하당',
    domain: 'www.wolhadang.kr',
    dir: 'www.wolhadang.kr/',
    pages: ['index', 'about', 'daughters', 'gut', 'guide', 'gallery', 'notice', 'reviews', 'faq', 'rice', 'contact', 'admin'],
    icon: { bg: '#7a1414', fg: '#f3d27a', text: '月' },
  },
  seonhee: {
    name: '선희당',
    domain: 'www.seonhee-sinjeom.com',
    dir: 'www.seonhee-sinjeom.com/',
    pages: ['index', 'greeting', 'counselors', 'flags', 'saju', 'fortune', 'notice', 'qna', 'recruit'],
    icon: { bg: '#5b2a86', fg: '#f1cf6b', text: '善' },
  },
  seowolilbo: {
    name: '서월일보',
    domain: 'www.seowolilbo.kr',
    dir: 'www.seowolilbo.kr/',
    pages: ['index', 'article', 'archive', 'report'],
    icon: { bg: '#e9e1cc', fg: '#1d1d1d', text: '西' },
  },
  sinmyeong: {
    name: '신명마당',
    domain: 'moimteo.net',
    base: '/sinmyeongmadang',
    dir: 'moimteo.net/sinmyeongmadang/',
    pages: ['index', 'post', 'join'],
    icon: { bg: '#1f2a5a', fg: '#ffffff', text: '마' },
  },
  healingtown: {
    name: '서월 힐링타운',
    domain: 'www.seowol-healingtown.kr',
    dir: 'www.seowol-healingtown.kr/',
    pages: ['index'],
    icon: { bg: '#3d9ad1', fg: '#ffffff', text: '힐' },
  },
  'blog-myeongwol': {
    name: '명월선녀의 신병일기',
    domain: 'solgeul.net',
    base: '/@myeongwol',
    baseAliases: ['/myeongwol'],
    dir: 'solgeul.net/myeongwol/', // 실제 폴더에는 @가 없다
    pages: ['index', 'post'],
    icon: { bg: '#f3eee4', fg: '#3b3328', text: '月' },
  },
};

// 기획서에 있지만 아직 만들지 않은 사이트(제2장 이후). 리졸버는 이 도메인을 '찾을 수 없음'으로 보낸다.
// 사이트를 만들면 위 SITES로 옮기고 이 목록에서 지운다.
export const PLANNED_DOMAINS = [
  'solgeul.net/@seokjin',
  'solgeul.net/@sanullim',
  'www.gimyo-tamsa.tv',
  'www.gureumham.net',
  'www.harugyeol.com',
  'www.chilseong-gidoteo.kr',
];
