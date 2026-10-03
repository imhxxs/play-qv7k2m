// 서월 힐링타운 — 한 페이지 분양 홍보 + 대표 문의(→ ceo@seowol-healingtown.kr). [힐링타운 담당]
// 대표 문의는 누리메일에서 직접 보낸 것과 똑같이 game.mail.send()로 보낸다(보낸편지함에 남고 §8.5 실패 처리까지 탄다).
// 답장 원고는 누리메일 담당의 'healingtown-reply' 템플릿(NPC 규칙: src/data/mail/npcs.js).

import { boot } from '../src/game.js';

const CEO_ADDR = 'ceo@seowol-healingtown.kr';
const game = boot({ siteId: 'healingtown', page: 'index', title: '서월 힐링타운 — 자연 속 프리미엄 전원 단지 선착순 분양' });
game.flag('addr:' + CEO_ADDR);

const $ = (id) => document.getElementById(id);

// ── 실시간 사전 접수(번들거리는 분양 광고의 그것) ─────────────────
const TICKS = [
  '김*희 님 · B블록 39평형 사전 접수',
  '이*수 님 · A블록 34평형 방문 상담 예약',
  '박*영 님 · B블록 39평형 사전 접수',
  '최*진 님 · A블록 34평형 사전 접수',
  '정*훈 님 · 관심 고객 등록',
  '한*미 님 · B블록 39평형 방문 상담 예약',
];
let ti = 0;
const ticker = $('ticker');
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  ti = (ti + 1) % TICKS.length;
  if (game.settings.reduceMotion) { ticker.textContent = TICKS[ti]; return; }
  ticker.classList.add('is-out');
  setTimeout(() => { ticker.textContent = TICKS[ti]; ticker.classList.remove('is-out'); }, 260);
}, 4200);

// ── 대표 문의 ─────────────────────────────────────────────────
const form = $('ask-form');
const done = $('ask-done');
const err = $('f-err');
$('f-name').value = game.profile?.name || '';
$('f-mail').value = game.email;

form.addEventListener('submit', (e) => {
  e.preventDefault();
  err.textContent = '';
  const name = $('f-name').value.trim();
  const subjectIn = $('f-subject').value.trim();
  const body = $('f-body').value.trim();
  const kind = form.querySelector('input[name=kind]:checked')?.value || 'ceo';
  if (!game.profile) { err.textContent = '시작 화면에서 이름과 메일 아이디를 먼저 정해 주세요. 답장은 누리메일로 갑니다.'; return; }
  if (!subjectIn) { err.textContent = '제목을 적어 주세요.'; $('f-subject').focus(); return; }
  if (!body) { err.textContent = '내용을 적어 주세요.'; $('f-body').focus(); return; }
  if (!$('f-agree').checked) { err.textContent = '정보 수집·이용에 동의해 주세요.'; $('f-agree').focus(); return; }
  // 폼의 이름은 본문에 넣지 않는다(이름 낱말이 답장 분류에 섞이지 않게). 유형만 제목 머리에 붙인다.
  const subject = (kind === 'sale' ? '[분양 상담] ' : '') + subjectIn;
  game.mail.send({ to: CEO_ADDR, subject, body });
  const t = Date.now();
  game.update('site.healingtown', (d) => { d.asked = (d.asked || 0) + 1; d.lastAskedAt = t; });
  game.flag('healingtown:asked');
  $('done-msg').textContent = `${name || game.profile.name}님의 문의를 대표에게 전달했습니다. 답장은 누리메일(${game.email})로 보내 드립니다.`;
  form.hidden = true;
  done.hidden = false;
  game.hydrate(done);
  done.focus();
});

$('ask-again').addEventListener('click', () => {
  $('f-subject').value = '';
  $('f-body').value = '';
  done.hidden = true;
  form.hidden = false;
  $('f-subject').focus();
});

// 접힌 공지·Q&A는 열어 본 순간 열람 기록에 넣는다(제목만 본 것은 기록하지 않는다)
document.querySelectorAll('details[data-view-open]').forEach((d) => {
  d.addEventListener('toggle', () => { if (d.open) game.view(d.dataset.viewOpen); });
});
