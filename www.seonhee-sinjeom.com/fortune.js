// 무료 신점 신청 → 1분 뒤 누리메일로 '혜원 선생님 배정' 대본 답장(seonhee-fortune-reply)
// - 고민 칸 기본값은 게임 속 문장 '{호칭이랑} 연락이 안 돼요'(§4.5). 이름 칸은 시작 화면에서 정한 이름.
// - '실제 개인정보를 적지 마세요' + '내 입력 삭제'(입력과 이 브라우저의 신청 기록을 지운다).
// - 신청 기록은 site.seonhee.fortunes에 남아 '지난 상담 다시 보기'에서 조회된다.
// - '빨리 받기' 설정은 엔진이 지연을 5초로 줄인다.

import { start, siteState, updateSite, parseBirth } from './site.js';

const TEMPLATE = 'seonhee-fortune-reply';
const DELAY_MS = 60000;

const game = start({ page: 'fortune', title: '무료 신점 신청 | 선희당' });

const form = document.getElementById('f-form');
const err = document.getElementById('f-err');
const status = document.getElementById('f-status');
const count = document.getElementById('f-count');
const card = document.getElementById('form-card');
const done = document.getElementById('f-done');

const defaultConcern = () => game.fill('{호칭이랑} 연락이 안 돼요');

function fillForm() {
  const draft = siteState(game).draft;
  if (draft && typeof draft === 'object') {
    form.person.value = draft.name ?? '';
    form.birth.value = draft.birth ?? '';
    form.concern.value = draft.concern ?? '';
    if (draft.kind) form.kind.value = draft.kind;
  } else {
    form.person.value = game.profile?.name || '';
    form.birth.value = '';
    form.concern.value = defaultConcern();
  }
  count.textContent = String([...form.concern.value].length);
}

const values = () => ({
  name: form.person.value.trim(),
  birth: form.birth.value.trim(),
  concern: form.concern.value.trim(),
  kind: form.kind.value,
});

let saveTimer = null;
form.addEventListener('input', () => {
  count.textContent = String([...form.concern.value].length);
  status.textContent = '';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const v = values();
    updateSite(game, (d) => { d.draft = v; });
  }, 400);
});

document.getElementById('f-clear').addEventListener('click', () => {
  clearTimeout(saveTimer);
  const had = (siteState(game).fortunes || []).length;
  form.reset();
  form.person.value = '';
  form.birth.value = '';
  form.concern.value = '';
  count.textContent = '0';
  err.textContent = '';
  updateSite(game, (d) => {
    d.draft = { name: '', birth: '', concern: '', kind: '신점' };
    d.fortunes = [];
  });
  status.textContent = had
    ? '입력한 내용을 지웠어요. 이 브라우저에 남아 있던 무료 신점 신청 기록도 지웠습니다.'
    : '입력한 내용을 지웠어요.';
  form.person.focus();
});

function showDone(rec) {
  card.hidden = true;
  done.hidden = false;
  done.innerHTML = `
<section class="sh-done sh-reveal" aria-labelledby="done-h" tabindex="-1">
  <svg class="sh-done__icon" viewBox="0 0 54 54" aria-hidden="true"><circle cx="27" cy="27" r="25" fill="#5b2a86"/><circle cx="27" cy="27" r="20" fill="none" stroke="#f1cf6b" stroke-width="1.5"/><path d="m17 28 7 7 13-15" fill="none" stroke="#f6dc8a" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <h2 id="done-h">무료 신점 신청이 접수되었습니다</h2>
  <p><b>${game.esc(rec.name)}</b>님의 고민이 잘 도착했어요.<br>1분 안에 담당 선생님이 배정되어 <b>누리메일(${game.esc(game.email)})</b>로 풀이를 보내 드립니다.</p>
  <div class="sh-actions">
    <a class="sh-btn sh-btn--gold" data-site="nurimail" data-page="index" data-query="#inbox">누리메일 열기</a>
    <a class="sh-btn sh-btn--ghost" href="saju.html#history">지난 상담 다시 보기</a>
  </div>
  <p class="sh-fine" style="margin-top:12px">무료 신점은 1인 1회 제공됩니다. 더 깊은 이야기는 060 전화 상담(유료)에서 같은 선생님과 이어 가실 수 있습니다.</p>
  <button type="button" class="sh-btn sh-btn--ghost sh-btn--sm" id="f-again" style="margin-top:6px">신청서 다시 보기</button>
</section>`;
  game.hydrate(done);
  done.querySelector('#f-again').addEventListener('click', () => {
    done.hidden = true;
    card.hidden = false;
    fillForm();
    form.person.focus();
  });
  done.querySelector('section').focus();
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = values();
  const birth = parseBirth(v.birth);
  const problem =
    !v.name ? ['person', '이름(닉네임)을 적어 주세요.']
      : [...v.name].length > 10 ? ['person', '이름은 10자 이내로 적어 주세요.']
        : !birth ? ['birth', '생년월일을 다시 확인해 주세요. 예) 1995.05.05']
          : [...v.concern].length < 2 ? ['concern', '고민을 한 줄이라도 적어 주세요.']
            : !form.agree.checked ? ['agree', '개인정보 수집·이용에 동의해 주세요.']
              : null;
  if (problem) {
    err.textContent = problem[1];
    form[problem[0]].focus();
    return;
  }
  if (game.mail.pending().some((p) => p.templateId === TEMPLATE)) {
    err.textContent = '이미 접수된 신청이 있어요. 선생님 배정까지 잠시만 기다려 주세요(1분 이내).';
    return;
  }
  err.textContent = '';
  clearTimeout(saveTimer);
  const t = Date.now();
  const mailId = game.mail.schedule(TEMPLATE, {
    delayMs: DELAY_MS,
    vars: { name: v.name, formName: v.name, concern: v.concern, birth: birth.label, kind: v.kind },
  });
  const rec = { id: 'f' + t, name: v.name, birthKey: birth.key, birthLabel: birth.label, concern: v.concern, kind: v.kind, at: t, mailId };
  updateSite(game, (d) => {
    d.fortunes = [...(d.fortunes || []).filter((x) => x.id !== rec.id), rec].slice(-10);
    delete d.draft;
  });
  game.flag('seonhee:fortune-sent');
  game.toast('무료 신점 신청이 접수되었어요. 곧 누리메일로 풀이가 옵니다.', { id: 'seonhee-fortune-' + t });
  showDone(rec);
});

fillForm();
