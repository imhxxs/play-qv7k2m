// 누리메일 주소록: '게임에서 알게 된 주소'만 모은다. [누리메일 담당]
//
// 주소록에 들어오는 길
//   1) 받은 메일의 보낸 사람(NOREPLY 제외)
//   2) 보낸 메일의 받는 사람(등록된 NPC일 때만 — 반송된 주소는 넣지 않는다)
//   3) 사이트에서 주소를 본 경우 — 아래 DISCOVERY 표(방문 플래그로 판정)
//   4) 어느 사이트든 game.flag('addr:<주소>')를 켜면 그 주소가 들어온다(가장 정확한 방법)
//      예) 서월일보 9/25 기사 하단: game.flag('addr:jebo@seowolilbo.kr')

/** 답장할 수 없는 발신 전용 주소(주소록·자동완성에 넣지 않는다) */
export const NOREPLY = new Set([
  'mailer-daemon@nurisaem.kr',
  'welcome@nurisaem.kr',
  'event@seonhee-sinjeom.com',
  'fortune@seonhee-sinjeom.com',
  'info@seowol-healingtown.kr',
]);

/** 사이트 방문으로 알게 되는 주소. when(s)는 상태 보기(game.state()) */
export const DISCOVERY = [
  { addr: 'contact@wolhadang.kr', name: '월하당', where: '월하당 · 상담 문의', flags: ['visit:wolhadang/contact'] },
  { addr: 'help@seonhee-sinjeom.com', name: '선희보살', where: '선희당 · 1:1 문의', flags: ['visit:seonhee/qna'] },
  { addr: 'ceo@seowol-healingtown.kr', name: '하준호', where: '서월 힐링타운 · 대표 문의', flags: ['visit:healingtown'] },
  { addr: 'jebo@seowolilbo.kr', name: '서월일보 제보', where: '서월일보 · 제보 안내', flags: ['visit:seowolilbo/article', 'visit:seowolilbo/report'] },
  { addr: 'jisu.han@seowolilbo.kr', name: '한지수', where: '서월일보 · 기사', flags: ['visit:seowolilbo/article'] },
];

/** 주소별 표시 이름·출처 설명(받은 메일로 알게 된 경우) */
export const KNOWN_NAMES = {
  'daeun.seo@nurisaem.kr': { name: '서다은', where: '언니의 예약 메일' },
  'jsuk.lee@nurisaem.kr': { name: '엄마', where: '엄마의 메일' },
  'contact@wolhadang.kr': { name: '월하당', where: '월하당' },
  'help@seonhee-sinjeom.com': { name: '선희보살', where: '선희당' },
  'ceo@seowol-healingtown.kr': { name: '하준호', where: '서월 힐링타운' },
  'jebo@seowolilbo.kr': { name: '서월일보 제보', where: '서월일보' },
  'jisu.han@seowolilbo.kr': { name: '한지수', where: '서월일보' },
};
