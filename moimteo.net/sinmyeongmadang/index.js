// 신명마당 게시판 목록(index.html?board=…&q=…)
import { start, nickHtml, listDate, siteState, esc, ICON, BOARDS, POSTS } from './moim.js';
import { boardOf, commentCount } from './posts.js';

const params = new URLSearchParams(location.search);
const board = boardOf(params.get('board'));
const q = (params.get('q') || '').trim().slice(0, 40);
const active = board ? board.id : 'all';
const title = q ? `‘${q}’ 찾기 — 신명마당` : board ? `${board.name} — 신명마당` : '신명마당 — 무속인과 손님이 함께하는 마당 (모임터)';
const game = start({ page: 'index', title, active });
const root = document.getElementById('mt-body');
const st = siteState();

const norm = (s) => String(s || '').normalize('NFC').toLowerCase().replace(/<[^>]+>/g, '').replace(/\s+/g, '');
const myCount = (p) => (st.comments?.[p.id] || []).length;
const cc = (p) => commentCount(p, { ghostShown: !!st.ghost && !!p.ghost, extra: myCount(p) });
const boardName = (id) => BOARDS.find((b) => b.id === id)?.name || '';

function rowHtml(p, { showBoard }) {
  const n = cc(p);
  return `<li class="mt-row${p.pin ? ' mt-row--pin' : ''}">
  <a class="mt-row__a" href="post.html?id=${encodeURIComponent(p.id)}">
    <span class="mt-row__no">${p.pin ? '<b>공지</b>' : p.no}</span>
    <span class="mt-row__title">${showBoard && !p.pin ? `<span class="mt-row__board">${esc(boardName(p.board))}</span>` : ''}${p.tag ? `<span class="mt-tag">${esc(p.tag)}</span>` : ''}<span class="mt-row__t">${esc(p.title)}</span>${n ? `<span class="mt-row__cc">[${n}]</span>` : ''}${p.body.includes('<figure') ? '<span class="mt-row__img" aria-label="사진 있음">▣</span>' : ''}</span>
  </a>
  <span class="mt-row__who">${nickHtml(p.who, { badge: false })}</span>
  <span class="mt-row__date">${esc(listDate(p))}</span>
  <span class="mt-row__views">${p.views.toLocaleString('ko-KR')}</span>
</li>`;
}

const sortDesc = (a, b) => (b.date + b.time).localeCompare(a.date + a.time);
const visible = POSTS.filter((p) => p.date.replace(/\./g, '-') <= game.gameDate);

let html = '';
if (board?.locked) {
  html = `
<section class="mt-boardhead"><h1>${esc(board.name)}</h1><p>${esc(board.desc)}</p></section>
<div class="mt-locked" role="status">
  <p class="mt-locked__icon" aria-hidden="true">${ICON.lock}</p>
  <p class="mt-locked__h">이 게시판은 <b>‘${esc(board.locked)}’</b> 등급부터 볼 수 있어요.</p>
  <p>글 ${board.count}개가 있습니다. 단골 신청은 <a href="join.html">마당 들어가기</a> 화면에서 안내해 드려요.</p>
</div>`;
} else {
  const pins = visible.filter((p) => p.pin).sort(sortDesc);
  let list = visible.filter((p) => !p.pin && (!board || p.board === board.id));
  if (board?.id === 'notice') list = [];
  if (q) {
    const nq = norm(q);
    list = visible.filter((p) => norm(p.title + p.body).includes(nq) && (!board || p.board === board.id));
  }
  list.sort(sortDesc);
  const showPins = !q && (!board || board.id === 'notice' || board.id === 'sinbyeong');
  const pinRows = showPins ? (board?.id === 'sinbyeong' ? pins.filter((p) => p.id === 'notice-sinbyeong') : pins) : [];
  html = `
<section class="mt-boardhead">
  <h1>${q ? `‘${esc(q)}’ 찾기` : board ? esc(board.name) : '전체 글'}</h1>
  <p>${q ? `${list.length}개의 글을 찾았어요.` : board ? esc(board.desc) : '신명마당의 모든 글을 새 글부터 보여 드려요.'}</p>
  ${board?.notice ? `<p class="mt-boardhead__notice"><b>마당지기 공지</b> ${esc(board.notice)}</p>` : ''}
</section>
<div class="mt-tabs" role="navigation" aria-label="게시판 바로 가기">
  <a href="index.html"${!board && !q ? ' aria-current="page"' : ''}>전체</a>
  ${BOARDS.map((b) => `<a href="index.html?board=${b.id}"${board?.id === b.id ? ' aria-current="page"' : ''}>${esc(b.name)}${b.locked ? ICON.lock : ''}</a>`).join('')}
</div>
<div class="mt-boardbar">
  <span class="mt-boardbar__n">글 <b>${list.length + pinRows.length}</b></span>
  <a class="mt-btn mt-btn--sm" href="join.html">글쓰기</a>
</div>
<div class="mt-table" role="list">
  <div class="mt-thead" aria-hidden="true"><span>번호</span><span>제목</span><span>글쓴이</span><span>날짜</span><span>조회</span></div>
  <ul class="mt-rows">
    ${pinRows.map((p) => rowHtml(p, { showBoard: false })).join('')}
    ${list.map((p) => rowHtml(p, { showBoard: !board })).join('')}
  </ul>
  ${!list.length && !pinRows.length ? '<p class="mt-empty">아직 글이 없어요.</p>' : ''}
</div>`;
}

root.innerHTML = html;
game.hydrate(root);

// 글쓰기 버튼: 손님 등급은 아직 글을 쓸 수 없다(댓글만)
root.querySelector('.mt-boardbar .mt-btn')?.addEventListener('click', (e) => {
  if (!siteState().member) return; // 가입 안내 화면으로
  e.preventDefault();
  game.toast('새 글쓰기는 단골 등급부터 할 수 있어요. 손님은 댓글로 함께해 주세요.');
});
