// 핵심 퍼즐과 3단계 힌트(기획서 §6.1). 수첩 › 힌트 탭이 이 목록을 쓴다.
//
// 필드
//   id         'P01' …
//   chapter    속한 장
//   goal       스포일러 없는 목표명(힌트 목록에 보이는 이름)
//   hints      [1단계, 2단계, 3단계]. 2→3단계는 60초 쿨다운
//   openWhen   (s) => 힌트 목록에 보일지. 없으면 늘 보임
//   solvedWhen (s) => 참이 되면 엔진이 자동으로 game.solve(id)를 부른다.
//              사이트 코드에서 game.solve(id)를 직접 불러도 된다(둘 다 멱등).

export const HINT_COOLDOWN_MS = 60_000;

export const PUZZLES = [
  {
    id: 'P01',
    chapter: 1,
    goal: '깨진 메일',
    hints: [
      '깨진 글자 아래에 작은 버튼이 있어요.',
      '표시 오류일 뿐 원문은 남아 있어요.',
      "본문 아래 '원문 보기'를 누르세요.",
    ],
    solvedWhen: (s) => s.viewed('E01'),
  },
  {
    id: 'P02',
    chapter: 1,
    goal: '언니가 말한 신당',
    hints: [
      '언니가 찾아보라던 이름이 있어요.',
      '신당 이름은 세 글자예요.',
      "누리샘에서 '월하당'을 검색하세요.",
    ],
    openWhen: (s) => s.solved('P01') || s.has('visit:nurisaem'),
    solvedWhen: (s) => s.has('visit:wolhadang'),
  },
  {
    id: 'P03',
    chapter: 1,
    goal: '언니의 다른 이름',
    hints: [
      '언니는 신당에서 다른 이름으로 불려요.',
      "월하당 '신딸 소개'의 막내를 보세요.",
      "누리샘에서 '명월선녀'를 검색하세요.",
    ],
    openWhen: (s) => s.has('visit:wolhadang'),
    solvedWhen: (s) => s.has('visit:blog-myeongwol'),
  },
  {
    id: 'P04',
    chapter: 1,
    goal: '고쳐진 공지',
    hints: [
      "공지 제목 옆의 '수정됨'을 보세요.",
      '누리샘은 고쳐진 글의 옛 모습을 기억해요.',
      "누리샘에서 '선희당 진오귀굿'을 검색한 뒤, 결과 옆 '저장된 페이지'를 여세요.",
    ],
    openWhen: (s) => s.has('visit:wolhadang') || s.has('visit:seonhee'),
    solvedWhen: (s) => s.viewed('E09'),
  },
];
