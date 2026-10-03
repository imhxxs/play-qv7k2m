// 신명마당 글 보기(post.html?id=…) · 댓글 · 공감 · 신벌 스레드의 깜짝 연출
import { start, nickHtml, avatarHtml, gradeBadge, longDate, nowStamp, siteState, updateSite, member, esc, BOARDS, POSTS } from './moim.js';
import { findPost, commentCount } from './posts.js';

const params = new URLSearchParams(location.search);
const id = params.get('id') || '';
const draft = findPost(id);
const game = start({
  page: 'post',
  title: draft ? `${draft.title} — 신명마당` : '글을 찾을 수 없습니다 — 신명마당',
  active: draft?.board || 'all',
});
const root = document.getElementById('mt-body');
const post = draft && draft.date.replace(/\./g, '-') <= game.gameDate ? draft : null;

if (!post) {
  game.setTitle('글을 찾을 수 없습니다 — 신명마당');
  root.innerHTML = `
<section class="mt-404">
  <h1>글을 찾을 수 없어요</h1>
  <p>삭제되었거나 주소가 바뀐 글입니다.</p>
  <p><a class="mt-btn" href="index.html">신명마당 첫 화면</a></p>
</section>`;
} else {
  render();
}

function boardName(b) { return BOARDS.find((x) => x.id === b)?.name || ''; }

function commentHtml(c) {
  if (c.del) return `<li class="mt-c mt-c--del${c.re ? ' mt-c--re' : ''}"><p class="mt-c__text">삭제된 댓글입니다.</p></li>`;
  if (c.hidden) return `<li class="mt-c mt-c--hidden${c.re ? ' mt-c--re' : ''}"><p class="mt-c__text">마당지기가 가린 댓글입니다. <span>사유: ${esc(c.hidden)}</span></p></li>`;
  return `<li class="mt-c${c.re ? ' mt-c--re' : ''}${c.who === '대추나무' ? ' mt-c--keeper' : ''}"${c.view ? ` data-view="${esc(c.view)}"` : ''}>
  <div class="mt-c__head">${avatarHtml(c.who, 30)}<span class="mt-c__who">${nickHtml(c.who)}</span><span class="mt-c__at">${esc(c.at)}</span></div>
  <p class="mt-c__text">${c.text}</p>
</li>`;
}

function myCommentHtml(c, i) {
  const me = member();
  return `<li class="mt-c mt-c--mine" data-i="${i}">
  <div class="mt-c__head">${avatarHtml(c.nick, 30)}<span class="mt-c__who">${nickHtml(c.nick, { badge: false })}${gradeBadge(me?.grade || '손님')}</span><span class="mt-c__at">${esc(c.at)}</span>
    <button type="button" class="mt-c__del" data-del="${i}" aria-label="내 댓글 지우기">지우기</button></div>
  <p class="mt-c__text">${esc(c.text)}</p>
</li>`;
}

function ghostHtml(state) {
  if (state === 'deleted') return '<p class="mt-c__text">삭제된 댓글입니다.</p>';
  return `<div class="mt-c__head">${avatarHtml('(탈퇴한 회원)', 30)}<span class="mt-c__who mt-c__who--gone">(탈퇴한 회원)</span><span class="mt-c__at">${esc(post.ghost.at)}</span></div>
  <p class="mt-c__text mt-ghost__text">${esc(post.ghost.text)}</p>`;
}

function render() {
  const st = siteState();
  const mine = st.comments?.[post.id] || [];
  const liked = !!st.likes?.[post.id];
  const ghostDone = !!st.ghost;
  const sameBoard = POSTS.filter((p) => p.board === post.board && p.date.replace(/\./g, '-') <= game.gameDate)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const idx = sameBoard.indexOf(post);
  const newer = idx > 0 ? sameBoard[idx - 1] : null;
  const older = idx >= 0 && idx < sameBoard.length - 1 ? sameBoard[idx + 1] : null;
  const me = member();
  const n = commentCount(post, { ghostShown: post.ghost && ghostDone, extra: mine.length });

  root.innerHTML = `
<article class="mt-post" data-view="${esc(post.card)}" aria-labelledby="post-h">
  <p class="mt-post__board"><a href="index.html?board=${post.board}">${esc(boardName(post.board))}</a></p>
  <h1 class="mt-post__h" id="post-h">${post.tag ? `<span class="mt-tag">${esc(post.tag)}</span>` : ''}${esc(post.title)}</h1>
  <div class="mt-post__meta">
    ${avatarHtml(post.who, 40)}
    <div class="mt-post__metatxt">
      <p class="mt-post__who">${nickHtml(post.who)}</p>
      <p class="mt-post__info"><span>${esc(longDate(post))}</span><span>조회 ${post.views.toLocaleString('ko-KR')}</span><span>댓글 <b class="mt-cc">${n}</b></span></p>
    </div>
  </div>
  <div class="mt-post__body">${post.body}</div>
  <div class="mt-post__act">
    <button type="button" class="mt-like" id="btn-like" aria-pressed="${liked}"><span aria-hidden="true">♡</span> 공감 <b>${post.likes + (liked ? 1 : 0)}</b></button>
    <md-collect card="${esc(post.card)}"></md-collect>
    <a class="mt-btn mt-btn--line mt-post__list" href="index.html?board=${post.board}">목록</a>
  </div>
</article>
<section class="mt-cmts" aria-labelledby="h-cmt">
  <h2 class="mt-cmts__h" id="h-cmt">댓글 <b class="mt-cc">${n}</b></h2>
  <ol class="mt-clist" id="clist">
    ${post.comments.map(commentHtml).join('')}
    ${post.ghost ? `<li class="mt-c mt-c--ghost${ghostDone ? ' mt-c--del' : ''}" id="ghost"${ghostDone ? '' : ' hidden'}>${ghostDone ? ghostHtml('deleted') : ''}</li>` : ''}
    ${mine.map(myCommentHtml).join('')}
  </ol>
  <div class="mt-c-end" id="mt-c-end" aria-hidden="true"></div>
  ${me ? `<form class="mt-cform" id="cform">
    <label class="mt-cform__who" for="c-text">${avatarHtml(me.nick, 26)}<b>${esc(me.nick)}</b>님으로 댓글 쓰기</label>
    <textarea id="c-text" name="text" rows="3" maxlength="300" placeholder="서로 존중하는 말로 남겨 주세요. 실제 개인정보는 적지 마세요." required></textarea>
    <div class="mt-cform__row"><span class="mt-cform__n" id="c-n">0 / 300</span><button class="mt-btn" type="submit">등록</button></div>
  </form>` : `<div class="mt-cform mt-cform--guest"><p>마당에 들어오면 댓글을 쓸 수 있어요.</p><a class="mt-btn" href="join.html">마당 들어가기</a></div>`}
</section>
<nav class="mt-prevnext" aria-label="이전·다음 글">
  ${newer ? `<a href="post.html?id=${encodeURIComponent(newer.id)}"><span>다음 글</span><b>${esc(newer.title)}</b></a>` : ''}
  ${older ? `<a href="post.html?id=${encodeURIComponent(older.id)}"><span>이전 글</span><b>${esc(older.title)}</b></a>` : ''}
</nav>`;

  game.hydrate(root);
  bind();
  if (post.ghost && !ghostDone) armGhost();
}

function setCount() {
  const st = siteState();
  const n = commentCount(post, { ghostShown: post.ghost && !!st.ghost, extra: (st.comments?.[post.id] || []).length });
  root.querySelectorAll('.mt-cc').forEach((b) => { b.textContent = String(n); });
}

function bind() {
  const like = document.getElementById('btn-like');
  like?.addEventListener('click', () => {
    const on = like.getAttribute('aria-pressed') !== 'true';
    like.setAttribute('aria-pressed', String(on));
    like.querySelector('b').textContent = String(post.likes + (on ? 1 : 0));
    updateSite((d) => { d.likes ||= {}; if (on) d.likes[post.id] = true; else delete d.likes[post.id]; });
  });

  const form = document.getElementById('cform');
  if (form) {
    const ta = form.querySelector('textarea');
    const cn = document.getElementById('c-n');
    ta.addEventListener('input', () => { cn.textContent = `${[...ta.value].length} / 300`; });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = ta.value.trim().slice(0, 300);
      if (!text) { ta.focus(); return; }
      const me = member();
      const c = { nick: me.nick, text, at: nowStamp() };
      const list = document.getElementById('clist');
      const i = (siteState().comments?.[post.id] || []).length;
      list.insertAdjacentHTML('beforeend', myCommentHtml(c, i));
      updateSite((d) => { d.comments ||= {}; (d.comments[post.id] ||= []).push(c); }).then(setCount);
      ta.value = '';
      cn.textContent = '0 / 300';
      setCount();
    });
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    const i = Number(b.dataset.del);
    const li = b.closest('.mt-c');
    const text = li?.querySelector('.mt-c__text')?.textContent || '';
    updateSite((d) => {
      const l = d.comments?.[post.id];
      if (!l) return;
      const k = l.findIndex((c, j) => j === i && c.text === text);
      if (k >= 0) l.splice(k, 1);
    }).then(() => {
      const list = document.getElementById('clist');
      list.querySelectorAll('.mt-c--mine').forEach((x) => x.remove());
      (siteState().comments?.[post.id] || []).forEach((c, j) => list.insertAdjacentHTML('beforeend', myCommentHtml(c, j)));
      setCount();
    });
  });
}

// ── 깜짝 연출: 맨 아래까지 처음 내려오면 '(탈퇴한 회원)'의 댓글 ─────────────
// 설정 '깜짝 연출'이 꺼져 있으면 조용히 '삭제된 댓글입니다'만 남는다. 진행에 필요한 단서가 아니다.
function armGhost() {
  const slot = document.getElementById('ghost');
  const end = document.getElementById('mt-c-end');
  let fired = false;
  let raf = 0;
  const check = () => {
    raf = 0;
    if (fired) return;
    if (window.scrollY < 160) return; // 한 번은 내려와야 한다(긴 화면에서 열자마자 터지지 않게)
    const r = end.getBoundingClientRect();
    if (r.top > window.innerHeight - 20 || r.bottom < 0) return; // 댓글 끝이 화면 안에 있을 때만(옆 메뉴까지 내려간 경우 제외)
    fired = true;
    window.removeEventListener('scroll', onScroll);
    setTimeout(() => runGhost(slot), 1200);
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
  window.addEventListener('scroll', onScroll, { passive: true });
}

function runGhost(slot) {
  if (siteState().ghost) return;
  const t = Date.now();
  updateSite((d) => { if (!d.ghost) d.ghost = { at: t }; });
  const s = game.settings;
  const canScare = s.scares && document.visibilityState === 'visible' && !game.has('scare:sinmyeong-ghost');
  if (!canScare) {
    slot.classList.add('mt-c--del');
    slot.innerHTML = ghostHtml('deleted');
    slot.hidden = false;
    setCount();
    return;
  }
  slot.innerHTML = ghostHtml('shown');
  slot.hidden = false;
  if (!s.reduceMotion) slot.classList.add('is-flicker');
  setCount();
  setTimeout(() => {
    if (!s.reduceMotion) {
      document.body.classList.add('mt-ripple');
      setTimeout(() => document.body.classList.remove('mt-ripple'), 760);
    }
    // text가 비면 엔진이 'null'을 그리므로 보이지 않는 공백을 넘긴다(core_requests 참고)
    game.scare({ id: 'sinmyeong-ghost', kind: 'whisper', text: '\u00a0', sound: 'jing', durationMs: 900 });
    setTimeout(() => {
      slot.classList.remove('is-flicker');
      slot.classList.add('is-fading');
      setTimeout(() => {
        slot.classList.remove('is-fading');
        slot.classList.add('mt-c--del');
        slot.innerHTML = ghostHtml('deleted');
      }, 280);
    }, 900 + 1500);
  }, 500);
}
