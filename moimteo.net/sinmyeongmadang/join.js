// 신명마당 가입(마당 들어가기). 닉네임 = 플레이어 이름, 등급 '손님'.
// 단골 신청(선택 퍼즐 O3)은 아직 '준비 중'.
import { start, refreshChrome, siteState, updateSite, member, nowStamp, gradeBadge, avatarHtml, esc } from './moim.js';

const game = start({ page: 'join', title: '마당 들어가기 — 신명마당 (모임터)', active: '' });
const root = document.getElementById('mt-body');

function joinedHtml(me, fresh) {
  return `
<section class="mt-join mt-join--done" aria-labelledby="join-h">
  <div class="mt-join__welcome">
    ${avatarHtml(me.nick, 64)}
    <div>
      <h1 id="join-h">${fresh ? '마당에 오신 것을 환영합니다' : '이미 마당 식구예요'}</h1>
      <p><b>${esc(me.nick)}</b>님 · ${gradeBadge(me.grade || '손님')} · 가입 ${esc(me.joinedLabel || '')}</p>
    </div>
  </div>
  <ul class="mt-join__can">
    <li>모든 게시판의 글을 읽고 댓글을 쓸 수 있어요.</li>
    <li>새 글쓰기, ‘기도터 정보’와 ‘옛글 보관함’은 <b>단골</b>부터 열려요.</li>
  </ul>
  <div class="mt-join__btns"><a class="mt-btn" href="index.html">게시판 보러 가기</a><a class="mt-btn mt-btn--line" href="post.html?id=rules">마당 규칙 다시 읽기</a></div>
</section>
<section class="mt-dangol" aria-labelledby="dangol-h">
  <h2 id="dangol-h">단골 신청 <span class="mt-badge-soon">준비 중</span></h2>
  <p>단골 신청은 마당 이야기 세 가지를 묻는 짧은 문답으로 합니다. 마당지기가 문답을 새로 손보는 중이라 지금은 잠시 쉬고 있어요.</p>
  <p class="mt-dangol__s">그동안은 손님으로 마음껏 둘러보세요. 다시 열리면 이곳에 알려 드릴게요.</p>
</section>`;
}

function formHtml(name) {
  return `
<section class="mt-join" aria-labelledby="join-h">
  <h1 id="join-h">마당 들어가기</h1>
  <p class="mt-join__lead">신명마당은 무속인과 손님이 함께 쓰는 모임입니다. 가입하면 바로 <b>손님</b> 등급이 되어 댓글을 쓸 수 있어요.</p>
  <form class="mt-jform" id="jform" novalidate>
    <div class="mt-jfield">
      <label for="j-nick">닉네임</label>
      <input id="j-nick" type="text" value="${esc(name || '')}" readonly aria-describedby="j-nick-d">
      <p class="mt-jfield__d" id="j-nick-d">모임터 프로필 이름을 그대로 씁니다. 실명 대신 별명을 권해요.</p>
    </div>
    <fieldset class="mt-jagree">
      <legend>마당 규칙에 동의해 주세요</legend>
      <label><input type="checkbox" name="a1" required> 서로 존중하는 말로 이야기합니다.</label>
      <label><input type="checkbox" name="a2" required> 실명·연락처·사진을 함부로 올리지 않습니다.</label>
      <label><input type="checkbox" name="a3" required> 아프면 병원이 먼저라는 것을 압니다.</label>
      <p class="mt-jfield__d"><a href="post.html?id=rules">마당 규칙 전문 보기</a></p>
    </fieldset>
    <div class="mt-jfield">
      <label for="j-hello">가입 인사 <small>(선택 · ‘처음 왔습니다’ 글에 댓글로 남아요)</small></label>
      <textarea id="j-hello" rows="2" maxlength="120" placeholder="예) 잘 부탁드립니다."></textarea>
    </div>
    <p class="mt-jerr" id="j-err" role="alert"></p>
    <button class="mt-btn mt-btn--big" type="submit">마당 들어가기</button>
    <p class="mt-jfield__d">게임 속 모임입니다. 실제 개인정보를 적지 마세요.</p>
  </form>
</section>`;
}

function render(fresh = false) {
  const me = member();
  const name = game.profile?.name || '';
  if (me) {
    root.innerHTML = joinedHtml(me, fresh);
  } else if (!name) {
    root.innerHTML = `<section class="mt-join"><h1>마당 들어가기</h1><p>먼저 시작 화면에서 이름을 정해 주세요. 그 이름이 닉네임이 됩니다.</p><p><a class="mt-btn" data-site="start" data-page="index" data-same-tab>시작 화면으로</a></p></section>`;
  } else {
    root.innerHTML = formHtml(name);
    bindForm(name);
  }
  game.hydrate(root);
}

function bindForm(name) {
  const form = document.getElementById('jform');
  const err = document.getElementById('j-err');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const boxes = [...form.querySelectorAll('input[type=checkbox]')];
    if (!boxes.every((b) => b.checked)) {
      err.textContent = '마당 규칙 세 가지에 모두 동의해 주세요.';
      boxes.find((b) => !b.checked)?.focus();
      return;
    }
    const hello = form.querySelector('#j-hello').value.trim().slice(0, 120);
    const t = Date.now();
    const [, m, d] = game.gameDate.split('-');
    const joinedLabel = `${game.gameDate.slice(0, 4)}.${m}.${d}`;
    const at = nowStamp();
    updateSite((s) => {
      if (!s.member) s.member = { nick: name, grade: '손님', joinedAt: t, joinedLabel };
      if (hello) {
        s.comments ||= {};
        const l = (s.comments['free-hello'] ||= []);
        if (!l.some((c) => c.text === hello && c.nick === name)) l.push({ nick: name, text: hello, at });
      }
    });
    game.flag('sinmyeong:joined');
    refreshChrome('');
    render(true);
    window.scrollTo({ top: 0 });
  });
}

render();
game.on('change:site.sinmyeong', ({ source }) => { if (source === 'remote') { refreshChrome(''); render(); } });
