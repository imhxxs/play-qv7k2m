// 장(챕터) 정의와 시한 바.
//
// 조건 함수는 상태 보기 s를 받는다:
//   s.chapter        현재 장 번호
//   s.has(flag)      플래그가 있는가
//   s.viewed(card)   카드를 열람했는가(열람 기록)
//   s.collected(card) 카드를 수첩에 담았는가
//   s.solved(pid)    퍼즐을 풀었는가
//
// 엔진은 상태가 바뀔 때마다 '현재 장의 endWhen'을 평가하고, 참이면 다음 장으로 넘긴 뒤
// 전환 카드를 띄운다(탭마다 최대 1회, 어느 탭에서든 닫으면 다른 탭에는 다시 뜨지 않음).
// onEnter(game)는 그 전환을 실제로 기록한 탭에서 한 번만 실행된다(예: 장 시작 메일 예약).

export const CHAPTERS = [
  {
    id: 1,
    title: '부고',
    date: '2026-09-27',
    dateLabel: '9월 27일(일)',
    dday: 13,
    endWhen: (s) => s.has('visit:blog-myeongwol') && s.viewed('E09'),
    endCard: {
      text: '언니가 지키려던 것이 열사흘 뒤 태워진다.',
    },
  },
  {
    id: 2,
    title: '신병일기',
    date: '2026-09-28',
    dateLabel: '9월 28일(월)',
    dday: 12,
    comingSoon: true,
    comingSoonText: '제작 중입니다',
    // onEnter: (game) => game.mail.schedule('M06', { delayMs: 120000, once: true }),
  },
];

export const DEADLINE = {
  label: '진오귀굿·신물 소각까지',
  // 제1장 P04(E09 열람)를 풀면 켜진다. 장이 바뀔 때만 숫자가 줄어든다.
  showWhen: (s) => s.solved('P04') || s.chapter >= 2,
  notice: '게임 속 날짜는 당신이 단서를 찾을 때만 흐릅니다. 서두르지 않아도 됩니다.',
};
