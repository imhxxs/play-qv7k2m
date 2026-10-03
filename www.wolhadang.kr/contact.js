// 상담 문의 → 공수 자동응답(누리메일, 20~40초 뒤). 실제 현지 시각대 문구 5종이 같은 날 재문의마다 순환한다
// (문구 고르기는 메일 템플릿 'wolhadang-autoreply'가 한다). 첨부 해원부.png.
// 폼 입력은 이 브라우저 안에만 남는다. '내 입력 삭제'는 폼과 접수 내역의 이름을 지운다.

import { start, esc } from './wolhadang.js';

const game = start({ page: 'contact', title: '상담 문의 — 월하당' });
const KEY = 'site.wolhadang';
const MAX_PENDING = 3;

const form = document.getElementById('contact-form');
const nameIn = document.getElementById('c-name');
const contactIn = document.getElementById('c-contact');
const msgIn = document.getElementById('c-msg');
const out = document.getElementById('contact-msg');
const logBody = document.querySelector('#contact-log tbody');

function fillDefaults() {
  nameIn.value = game.profile?.name || '';
  contactIn.value = game.profile ? game.email : '';
  msgIn.value = '';
}

function pendingReplies() {
  return game.mail.pending().filter((p) => p.templateId === 'wolhadang-autoreply');
}

function say(html, kind = '') {
  out.innerHTML = `<div class="wh-msg${kind ? ' wh-msg--' + kind : ''}" role="${kind === 'err' ? 'alert' : 'status'}">${html}</div>`;
  game.hydrate(out);
}

function renderLog() {
  const list = game.get(KEY, {}).inquiries || [];
  const pend = new Set(pendingReplies().map((p) => p.id));
  if (!list.length) {
    logBody.innerHTML = '<tr><td colspan="3" class="wh-dim" style="text-align:center">아직 남긴 문의가 없습니다.</td></tr>';
    return;
  }
  logBody.innerHTML = list.slice().reverse().map((q, i) => `<tr>
    <td>${list.length - i}</td>
    <td>${q.name ? esc(q.name) : '<span class="wh-dim">(지움)</span>'}</td>
    <td>${pend.has(q.mailId) ? '공수 보내는 중…' : '답장 메일 보냄'}</td>
  </tr>`).join('');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameIn.value.trim().replace(/\s+/g, ' ');
  if (!name) {
    say('이름을 적어 주세요. 게임 속 이름이면 됩니다.', 'err');
    nameIn.focus();
    return;
  }
  if (!game.profile) {
    say('아직 시작 화면을 거치지 않아 받을 메일함이 없습니다. 위쪽 안내의 \'시작 화면으로\'를 눌러 주세요.', 'err');
    return;
  }
  if (pendingReplies().length >= MAX_PENDING) {
    say('앞서 남기신 문의의 공수가 아직 가는 중입니다. 조금 뒤에 다시 남겨 주세요.', 'err');
    return;
  }
  const mailId = game.mail.schedule('wolhadang-autoreply', {
    delayMs: [20000, 40000],
    vars: { name },
  });
  const t = Date.now();
  game.update(KEY, (d) => {
    d.inquiries ||= [];
    if (!d.inquiries.some((q) => q.mailId === mailId)) d.inquiries.push({ at: t, name, mailId });
  });
  game.flag('wolhadang:contact-sent');
  game.sfx('paper');
  say(`문의가 접수되었습니다. 상중이라 <b>만신님 말씀(공수)이 누리메일로 갑니다.</b><br>
    받는 곳: <b>${esc(game.email)}</b> · 조금만 기다려 주세요.
    <br><a class="wh-btn wh-btn--plain" data-site="nurimail" data-page="index" data-query="#inbox" style="margin-top:8px">누리메일 열기</a>`, 'ok');
  msgIn.value = '';
  renderLog();
});

document.getElementById('c-clear').addEventListener('click', () => {
  nameIn.value = '';
  contactIn.value = '';
  msgIn.value = '';
  game.update(KEY, (d) => {
    for (const q of d.inquiries || []) q.name = '';
  });
  say('입력한 내용을 지웠습니다. 접수 내역의 이름도 지웠어요.');
  renderLog();
  nameIn.focus();
});

fillDefaults();
renderLog();
game.on('change:mail', renderLog);
game.on('profile', () => { if (!nameIn.value) fillDefaults(); });
