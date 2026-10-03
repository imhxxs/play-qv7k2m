// 1:1 문의 → game.mail.send({ to: help@seonhee-sinjeom.com }) — 누리메일에서 보낸 것과 똑같이 판정된다.
// 답장(선희 직접 / 고객센터)은 누리메일 담당의 NPC 규칙(src/data/mail/npcs.js · concepts.js)이 고른다.

import { start, siteState, updateSite, dateLabel } from './site.js';
import { HELP_ADDR } from './data.js';

const game = start({ page: 'qna', title: '1:1 문의 | 선희당' });
const esc = game.esc;

const form = document.getElementById('q-form');
const err = document.getElementById('q-err');
const status = document.getElementById('q-status');
const card = document.getElementById('q-card');
const done = document.getElementById('q-done');
const mineEl = document.getElementById('q-mine');

document.getElementById('q-mail').value = game.email;

// 초안 복원·저장
{
  const d = siteState(game).qnaDraft;
  if (d) {
    form.subject.value = d.subject || '';
    form.body.value = d.body || '';
    if (d.qtype) form.qtype.value = d.qtype;
  }
}
let saveTimer = null;
form.addEventListener('input', () => {
  status.textContent = '';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const v = { subject: form.subject.value, body: form.body.value, qtype: form.qtype.value };
    updateSite(game, (d) => { d.qnaDraft = v; });
  }, 400);
});

document.getElementById('q-clear').addEventListener('click', () => {
  clearTimeout(saveTimer);
  form.subject.value = '';
  form.body.value = '';
  form.qtype.selectedIndex = 0;
  err.textContent = '';
  updateSite(game, (d) => { delete d.qnaDraft; });
  status.textContent = '입력한 내용을 지웠어요.';
  form.subject.focus();
});

function renderMine() {
  const sent = game.mail.sent().filter((s) => s.to === HELP_ADDR);
  if (!sent.length) {
    mineEl.innerHTML = '<li><span class="sh-hint">아직 남기신 문의가 없습니다.</span></li>';
    return;
  }
  const waiting = new Set(game.mail.pending().map((p) => p.vars?.sentId).filter(Boolean));
  mineEl.innerHTML = sent.map((s) => {
    const wait = waiting.has(s.id);
    return `<li><span class="sh-record__tag${wait ? ' is-wait' : ''}">${wait ? '답변 대기' : '답변 완료'}</span><b>${esc(s.subject || '(제목 없음)')}</b><time>${esc(dateLabel(game, s.at, s.gd))}</time></li>`;
  }).join('');
}

function showDone(subject) {
  card.hidden = true;
  done.hidden = false;
  done.innerHTML = `
<section class="sh-done sh-reveal" aria-labelledby="qd-h" tabindex="-1">
  <svg class="sh-done__icon" viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="25" fill="#19b38a"/><path d="M15 19h24v15H24l-6 5v-5h-3z" fill="#fff"/></svg>
  <h2 id="qd-h">문의가 접수되었습니다</h2>
  <p>‘${esc(subject)}’<br>답변은 누리메일(<b>${esc(game.email)}</b>)로 갑니다.</p>
  <div class="sh-actions">
    <a class="sh-btn" data-site="nurimail" data-page="index" data-query="#inbox">누리메일 열기</a>
    <button type="button" class="sh-btn sh-btn--ghost" id="q-again">새 문의 쓰기</button>
  </div>
</section>`;
  game.hydrate(done);
  done.querySelector('#q-again').addEventListener('click', () => {
    done.hidden = true;
    card.hidden = false;
    form.subject.focus();
  });
  done.querySelector('section').focus();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const subject = form.subject.value.trim();
  const body = form.body.value.trim();
  if ([...subject].length < 2) { err.textContent = '제목을 두 글자 이상 적어 주세요.'; form.subject.focus(); return; }
  if ([...body].length < 5) { err.textContent = '내용을 조금만 더 적어 주세요.'; form.body.focus(); return; }
  err.textContent = '';
  game.mail.send({ to: HELP_ADDR, subject, body });
  clearTimeout(saveTimer);
  form.subject.value = '';
  form.body.value = '';
  updateSite(game, (d) => { delete d.qnaDraft; });
  game.flag('seonhee:qna-sent');
  game.toast('문의를 보냈어요. 답변은 누리메일로 갑니다.', { id: 'seonhee-qna-' + Date.now() });
  showDone(subject);
  renderMine();
});

renderMine();
game.on('change:mail', renderMine);
