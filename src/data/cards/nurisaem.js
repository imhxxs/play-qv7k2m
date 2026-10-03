// 누리샘 담당 카드. 일반·필러 카드는 'X-nurisaem-<name>' 형식으로 추가한다.
// ref.query 는 저장된 페이지 id(src/data/search/cache.js)와 같다.

export default [
  {
    id: 'E09',
    title: '진오귀굿 공지 저장본 — 11월 6일 → 10월 10일',
    site: 'nurisaem',
    kind: 'evidence',
    key: true,
    chapter: 1,
    desc: "누리샘이 9월 22일 18:00에 저장해 둔 선희당 공지의 옛 모습. 원래 제목은 '故 송만신 49재 11월 6일'이었고, 49재 날 진오귀굿과 신물 정리를 함께 한다고 적혀 있었다. 9월 23일에 '진오귀굿 및 신물 소각 10월 10일'로 고쳐졌다.",
    ref: { page: 'cache', query: 'id=seonhee-jinogwi' },
  },
  {
    id: 'X-nurisaem-ilbo-first',
    title: '서월일보 9월 21일 기사 초판(저장된 페이지)',
    site: 'nurisaem',
    kind: 'general',
    key: false,
    chapter: 1,
    desc: "누리샘이 9월 21일 7시 10분에 저장한 서월일보 1보 '무속인, 굿 도중 작두서 떨어져 숨져'. 부정맥 병력, 수십 명 앞에서의 낙상, 경찰 내사 종결 방침, 유족은 부검을 원하지 않음, 21일 발인·화장. 나중에 사진이 바뀌었다.",
    ref: { page: 'cache', query: 'id=seowolilbo-0921' },
  },
];
