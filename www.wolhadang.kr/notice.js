// 공지사항: 목록 + 상세(notice.html?id=).
import { start, esc } from './wolhadang.js';
import { NOTICES, byId, boardOrder } from './notice-data.js';

const game = start({ page: 'notice', title: '공지사항 — 월하당' });
const params = new URLSearchParams(location.search);
const id = params.get('id');
const view = document.getElementById('notice-view');
const board = document.getElementById('notice-board');

const isNew = (n) => n.date >= '2026.09.20';

function renderPost(n) {
  const sorted = [...NOTICES].sort((a, b) => a.no - b.no);
  const idx = sorted.indexOf(n);
  const prev = sorted[idx - 1];
  const next = sorted[idx + 1];
  view.innerHTML = `
  <article class="wh-post" aria-labelledby="post-title">
    <header class="wh-post__head">
      <h2 class="wh-post__title" id="post-title"><span class="wh-red">[${esc(n.cat)}]</span> ${esc(n.title)}</h2>
      <div class="wh-post__meta">글쓴이 ${esc(n.author)} · ${esc(n.date)} ${esc(n.time)} · 조회 ${n.views.toLocaleString('ko-KR')}</div>
    </header>
    <div class="wh-post__body"${n.card ? ` data-view="${esc(n.card)}"` : ''}>${n.body}
      ${n.card ? `<div class="wh-collect"><md-collect card="${esc(n.card)}"></md-collect></div>` : ''}
    </div>
    <nav class="wh-post__nav" aria-label="글 이동">
      ${prev ? `<a href="notice.html?id=${prev.id}">◀ 이전 글</a>` : '<span></span>'}
      <a href="notice.html">목록</a>
      ${next ? `<a href="notice.html?id=${next.id}">다음 글 ▶</a>` : '<span></span>'}
    </nav>
  </article>`;
  game.setTitle(`${n.title} — 월하당 공지사항`);
}

function renderMissing() {
  view.innerHTML = `
  <div class="wh-msg wh-msg--err" role="alert">존재하지 않는 글입니다. 삭제되었거나 주소가 잘못되었습니다.</div>
  <p style="margin-top:8px"><a href="notice.html">공지사항 목록으로</a></p>`;
}

function row(n, { pin = false } = {}) {
  const cur = id && String(n.id) === String(id);
  return `<tr class="${pin ? 'is-pin' : ''}${cur ? ' is-current' : ''}">
    <td class="no">${pin ? '<span class="pin">공지</span>' : n.no}</td>
    <td class="subj"><a href="notice.html?id=${n.id}"${cur ? ' aria-current="page"' : ''}><span>${pin ? '<span class="pin pin--m">공지</span>' : ''}<span class="wh-red">[${esc(n.cat)}]</span> ${esc(n.title)}${isNew(n) ? '<span class="new" aria-label="새 글">new</span>' : ''}</span></a></td>
    <td class="who">${esc(n.author)}</td>
    <td class="date">${esc(n.date)}</td>
    <td class="views">${n.views.toLocaleString('ko-KR')}</td>
  </tr>`;
}

function renderBoard() {
  const { pins, rest } = boardOrder();
  board.innerHTML = `
  <table class="wh-board">
    <caption class="wh-sr">공지사항 목록</caption>
    <thead><tr><th scope="col">번호</th><th scope="col">제목</th><th scope="col">글쓴이</th><th scope="col">날짜</th><th scope="col">조회</th></tr></thead>
    <tbody>${pins.map((n) => row(n, { pin: true })).join('')}${rest.map((n) => row(n)).join('')}</tbody>
  </table>
  <p class="wh-dim" style="margin-top:8px">총 ${NOTICES.length}개의 글 · [1]</p>`;
}

if (id != null) {
  const n = byId(id);
  if (n) renderPost(n); else renderMissing();
}
renderBoard();
game.hydrate(view);
game.hydrate(board);
