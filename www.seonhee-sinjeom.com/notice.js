// 공지사항: notice.html(목록) · notice.html?id=<글 id>(본문·댓글)
// 장(章)으로 막힌 글은 아직 올라오지 않은 글이라 목록에도 없고, 주소로 열어도 '없는 글'이다.
// P04: 진오귀굿 공지 제목 옆 '(수정됨 09.23)'. 옛 모습은 누리샘 '저장된 페이지'에만 있다 — 여기서 직접 안내하지 않는다.

import { start } from './site.js';
import { visibleNotices, neighbors, NOTICES } from './data.js';

const game = start({ page: 'notice', title: '공지사항 | 선희당' });
const root = document.getElementById('notice-root');
const esc = game.esc;

const params = new URLSearchParams(location.search);
const wantId = params.get('id');

const badgeHtml = (n) => {
  const k = n.badgeKind === 'ev' ? ' sh-badge--ev' : '';
  const hot = n.hot ? '<span class="sh-badge sh-badge--hot">HOT</span>' : '';
  return `${hot}<span class="sh-badge${k}">${esc(n.badge || '안내')}</span>`;
};
const editedHtml = (n) => (n.edited ? ` <span class="sh-edited">(수정됨 ${esc(n.edited)})</span>` : '');
const cnumHtml = (n) => {
  const c = (n.comments || []).length;
  return c ? `<span class="sh-cnum">[${c}]</span>` : '';
};
const views = (n) => Number(n.views || 0).toLocaleString('ko-KR');
const shortTitle = (n) => n.title.replace(/^\[[^\]]+\]\s*/, '');

function listHtml(chapter) {
  const list = visibleNotices(chapter);
  let num = 118 + NOTICES.filter((n) => !n.pin && (!n.minChapter || chapter >= n.minChapter)).length;
  const rows = list.map((n) => {
    const no = n.pin ? '<span class="sh-badge">공지</span>' : String(num--);
    return `
<tr${n.pin ? ' class="is-pin"' : ''}>
  <td>${no}</td>
  <td class="sh-board__t"><a href="notice.html?id=${encodeURIComponent(n.id)}"><span>${badgeHtml(n)}${esc(shortTitle(n))}</span>${editedHtml(n)}${cnumHtml(n)}<span class="sh-board__m">${esc(n.author)} · ${esc(n.date)} · 조회 ${views(n)}</span></a></td>
  <td>${esc(n.author)}</td>
  <td>${esc(n.date)}</td>
  <td>${views(n)}</td>
</tr>`;
  }).join('');
  return `
<h1 class="sh-h1">공지사항<small>선희당 소식 · 안내 · 이벤트</small></h1>
<table class="sh-board">
  <caption class="sh-sr">공지사항 목록</caption>
  <thead><tr><th scope="col" style="width:64px">번호</th><th scope="col">제목</th><th scope="col" style="width:96px">글쓴이</th><th scope="col" style="width:104px">날짜</th><th scope="col" style="width:64px">조회</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<ul class="sh-pager" aria-label="쪽"><li><span class="is-on" aria-current="page">1</span></li></ul>`;
}

function commentsHtml(n) {
  const list = n.comments || [];
  if (!list.length) {
    return `<section class="sh-cmts" aria-label="댓글"><h2 class="sh-cmts__h">댓글 <b>0</b></h2><p class="sh-hint">첫 댓글을 남겨 주세요.</p>${cmtFormHtml()}</section>`;
  }
  const items = list.map((c) => {
    if (c.blind) {
      return `<li class="sh-cmt sh-cmt--blind"><p class="sh-cmt__who"><b>(블라인드)</b><time>${esc(c.at)}</time></p><p class="sh-cmt__txt">${esc(c.text)}</p></li>`;
    }
    const cls = `sh-cmt${c.reply ? ' sh-cmt--reply' : ''}`;
    const mine = c.mine ? '<span class="sh-cmt__mine">작성자</span>' : '';
    const collect = c.card ? `<md-collect card="${esc(c.card)}" label="담기"></md-collect>` : '';
    return `<li class="${cls}"><p class="sh-cmt__who"><b>${esc(c.who)}</b>${mine}<time>${esc(c.at)}</time></p><p class="sh-cmt__txt">${esc(c.text)}</p>${collect}</li>`;
  }).join('');
  return `
<section class="sh-cmts" aria-labelledby="cmt-h">
  <h2 class="sh-cmts__h" id="cmt-h">댓글 <b>${list.length}</b></h2>
  <ol>${items}</ol>
  ${cmtFormHtml()}
</section>`;
}

function cmtFormHtml() {
  return `
<div class="sh-cmtform">
  <label class="sh-sr" for="cmt-in">댓글 쓰기</label>
  <textarea class="sh-textarea" id="cmt-in" placeholder="로그인한 회원만 댓글을 남길 수 있습니다." disabled></textarea>
  <div class="sh-actions"><button type="button" class="sh-btn sh-btn--ghost sh-btn--sm" id="cmt-login">로그인하고 댓글 쓰기</button></div>
  <p class="sh-status" id="cmt-status" role="status"></p>
</div>`;
}

function postHtml(n, chapter) {
  const nb = neighbors(chapter, n.id);
  const nav = (label, x) => `<li><span>${label}</span>${x ? `<a href="notice.html?id=${encodeURIComponent(x.id)}">${esc(x.title)}${x.edited ? ` <em>(수정됨 ${esc(x.edited)})</em>` : ''}</a>` : '<em style="padding:12px 0">없습니다</em>'}</li>`;
  const cards = (n.cards || []).map((id) => `<md-collect card="${esc(id)}"></md-collect>`).join('');
  const ad = n.ad
    ? `<a class="sh-ad" href="fortune.html"><span class="sh-ad__tag">광고</span><span><small>마음이 무거운 날엔</small><b>첫 신점 무료</b> · 1분 안에 선생님 배정</span><span class="sh-ad__go">신청</span></a>`
    : '';
  return `
<article class="sh-post">
  <h1 class="sh-post__title">${badgeHtml(n)} ${esc(n.title)}${editedHtml(n)}</h1>
  <p class="sh-post__meta"><span>${esc(n.author)}</span><span>${esc(n.date)} ${esc(n.time)}</span>${n.editedAt ? `<span>수정 ${esc(n.editedAt)}</span>` : ''}<span>조회 ${views(n)}</span></p>
  <div class="sh-post__body">${n.body}</div>
  ${cards ? `<div class="sh-post__tools">${cards}</div>` : ''}
  ${ad}
  ${commentsHtml(n)}
  <ul class="sh-postnav" aria-label="이전 글·다음 글">${nav('다음 글', nb.newer)}${nav('이전 글', nb.older)}</ul>
  <div class="sh-actions" style="margin-top:14px;justify-content:flex-end"><a class="sh-btn sh-btn--ghost sh-btn--sm" href="notice.html" style="flex:0 0 auto">목록</a></div>
</article>`;
}

function render() {
  const chapter = game.state().chapter;
  const n = wantId ? visibleNotices(chapter).find((x) => x.id === wantId) : null;
  if (wantId && n) {
    root.innerHTML = `<p class="sh-crumb">홈 › <a href="notice.html">공지사항</a></p>${postHtml(n, chapter)}`;
    game.setTitle(`${shortTitle(n)} | 선희당`);
  } else if (wantId) {
    root.innerHTML = `<p class="sh-crumb">홈 › <a href="notice.html">공지사항</a></p><p class="sh-empty" style="margin-bottom:16px">존재하지 않거나 삭제된 글입니다.</p>${listHtml(chapter)}`;
    game.setTitle('공지사항 | 선희당');
  } else {
    root.innerHTML = `<p class="sh-crumb">홈 › 공지사항</p>${listHtml(chapter)}`;
  }
  game.hydrate(root);
  root.querySelector('#cmt-login')?.addEventListener('click', () => {
    root.querySelector('#cmt-status').textContent = '회원 서비스 점검 중입니다. 잠시 뒤에 다시 시도해 주세요.';
  });
}

render();
game.on('chapter', render);
