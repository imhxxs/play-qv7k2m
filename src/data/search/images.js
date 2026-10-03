// 누리샘 이미지 탭 결과. 썸네일은 누리샘이 만든 축소본(SVG, assets/nurisaem/img/).
// 필드: id · src(웹 루트 기준) · title · source(출처 표시) · link(entries.js LINKS 키) 또는 filler(fillers.js id)
//       w·h(원본 비율) · alt · chapter

export default {
  'wolhadang-hall': {
    id: 'wolhadang-hall', src: 'assets/nurisaem/img/wolhadang-hall.svg', w: 320, h: 220,
    title: '월하당 신당 전경', source: '월하당', link: 'wolhadang.home',
    alt: '산 아래 붉은 기둥의 작은 한옥 신당. 처마 밑에 등이 걸려 있고, 대문에 근조 띠가 둘러져 있다.',
  },
  'wolhadang-myeongdu': {
    id: 'wolhadang-myeongdu', src: 'assets/nurisaem/img/wolhadang-myeongdu.svg', w: 320, h: 240,
    title: '장군님 상과 명두', source: '월하당 › 신당 갤러리', link: 'wolhadang.gallery',
    alt: '신당 벽에 걸린 둥근 놋거울과 그 아래 상보를 덮은 상. 위에 月下堂 현판.',
  },
  'wolhadang-janggu': {
    id: 'wolhadang-janggu', src: 'assets/nurisaem/img/wolhadang-janggu.svg', w: 320, h: 220,
    title: '장구 40년, 최경필 선생님', source: '월하당 › 신당 갤러리', link: 'wolhadang.gallery',
    alt: '마루 위에 놓인 붉은 장구와 궁채.',
  },
  'wolhadang-rice': {
    id: 'wolhadang-rice', src: 'assets/nurisaem/img/wolhadang-rice.svg', w: 320, h: 220,
    title: '온라인 쌀점', source: '월하당', link: 'wolhadang.rice',
    alt: '검은 소반 위에 흩어진 흰 쌀알.',
  },
  'seonhee-banner': {
    id: 'seonhee-banner', src: 'assets/nurisaem/img/seonhee-banner.svg', w: 320, h: 180,
    title: '첫 신점 무료 — 선희당', source: '선희당', link: 'seonhee.home',
    alt: '보라색과 금색 배너. 큰 글씨로 첫 신점 무료.',
  },
  'seonhee-flags': {
    id: 'seonhee-flags', src: 'assets/nurisaem/img/seonhee-flags.svg', w: 320, h: 220,
    title: '오방기 점 체험', source: '선희당', link: 'seonhee.flags',
    alt: '빨강·노랑·흰색·파랑·초록 다섯 깃발.',
  },
  healingtown: {
    id: 'healingtown', src: 'assets/nurisaem/img/healingtown.svg', w: 320, h: 200,
    title: '서월 힐링타운 조감도', source: '서월 힐링타운', link: 'healingtown.home',
    alt: '산자락에 늘어선 하얀 전원주택 단지 조감도.',
  },
  'ilbo-0921': {
    id: 'ilbo-0921', src: 'assets/nurisaem/img/ilbo-0921.svg', w: 320, h: 210,
    title: '월하당 대문 앞(9월 21일 기사 초판 사진)', source: '서월일보', link: 'seowolilbo.0921',
    alt: '새벽녘 한옥 대문 앞. 대문 위 등이 꺼져 있고 길 끝에 차 불빛이 번진다.',
  },
  'seowol-mountain': {
    id: 'seowol-mountain', src: 'assets/nurisaem/img/seowol-mountain.svg', w: 320, h: 200,
    title: '안개 낀 서월산', source: '산마루 걷기', filler: 'f-trail',
    alt: '겹겹의 산 능선 사이로 안개가 흐른다.',
  },
  reservoir: {
    id: 'reservoir', src: 'assets/nurisaem/img/reservoir.svg', w: 320, h: 200,
    title: '서월저수지 둘레길', source: '서월군 문화관광', filler: 'f-reservoir',
    alt: '잔잔한 저수지와 둑길, 물가의 큰 소나무.',
  },
  kongtteok: {
    id: 'kongtteok', src: 'assets/nurisaem/img/kongtteok.svg', w: 320, h: 240,
    title: '콩떡이 첫 산책', source: '멍멍 다이어리', filler: 'f-kongtteok',
    alt: '얼굴에 까만 점이 있는 하얀 강아지가 혀를 내밀고 웃는다.',
  },
};
