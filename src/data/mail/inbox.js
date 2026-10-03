// 새 게임 때 받은편지함에 미리 넣는 메일(위 → 아래 = 최신 → 오래된 순). [누리메일 담당]
// 받은편지함 항목의 id는 templateId와 같다(#read/M01). 스팸(M03·M04)은 템플릿의 folder: 'spam'으로 스팸함에 간다.
// 날짜 표기는 각 템플릿의 dateLabel(9/27 05:00 · 9/26 21:30 · 9/26 14:07 · 9/25 19:30 · 9/14 10:24)과 순서가 맞는다.

export default [
  { templateId: 'M01' },
  { templateId: 'M02' },
  { templateId: 'M04' },
  { templateId: 'M03' },
  { templateId: 'M05' },
];
