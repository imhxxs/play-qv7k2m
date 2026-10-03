// 서월일보 첫 화면 · 섹션 목록(index.html?sec=사회)
import { start, visibleArticles, itemHtml, photoHtml, articleHref, lead, jeboLink, esc, SECTIONS } from './ilbo.js';

const params = new URLSearchParams(location.search);
const sec = SECTIONS.includes(params.get('sec')) ? params.get('sec') : '';
const game = start({
  page: 'index',
  title: sec ? `${sec} — 서월일보` : '서월일보 — 서월의 오늘을 기록합니다',
  section: sec || '종합',
});

const root = document.getElementById('sw-front');
const all = visibleArticles(game);
const PINNED = ['20260925', '20260921']; // 편집국이 올려 둔 머리기사

function sideHtml() {
  const hot = all.filter((a) => a.hot).sort((a, b) => a.hot - b.hot).slice(0, 5);
  const op = all.filter((a) => a.sec === '오피니언').slice(0, 2);
  const paperTarget = all.find((a) => a.paper && a.id === PINNED[0]) || all.find((a) => a.paper);
  return `
<aside class="sw-side" aria-label="곁다리">
  <section class="sw-box">
    <h2 class="sw-box__h">많이 본 기사</h2>
    <ol class="sw-rank">${hot.map((a, i) => `<li><a href="${articleHref(a.id)}"><b>${i + 1}</b><span>${esc(a.title)}</span></a></li>`).join('')}</ol>
  </section>
  ${paperTarget ? `<section class="sw-box sw-paperbox">
    <h2 class="sw-box__h">지면 보기</h2>
    <a class="sw-paperthumb" href="${articleHref(paperTarget.id, '&view=paper')}">
      <span class="sw-paperthumb__page" aria-hidden="true">
        <span class="pt-mast">서월일보</span><span class="pt-h"></span><span class="pt-h pt-h--s"></span>
        <span class="pt-cols"><i></i><i></i><i></i></span><span class="pt-ph"></span><span class="pt-cols"><i></i><i></i><i></i></span>
      </span>
      <span class="sw-paperthumb__cap">${esc(paperTarget.date)}자 ${paperTarget.paper.no}면 · ${esc(paperTarget.paper.label)}<br><b>${esc(paperTarget.title)}</b></span>
    </a>
  </section>` : ''}
  ${op.length ? `<section class="sw-box"><h2 class="sw-box__h">오피니언</h2><ul class="sw-list sw-list--tight">${op.map((a) => itemHtml(a, { leadMax: 54, sec: false })).join('')}</ul></section>` : ''}
  <section class="sw-box sw-ad" aria-label="광고">
    <p class="sw-ad__tag">광고</p>
    <a class="sw-ad__ht" data-site="healingtown" data-page="index">
      <span class="sw-ad__sky" aria-hidden="true"><svg viewBox="0 0 200 70"><path d="M0 52 C30 30 60 26 84 40 C104 20 140 14 160 34 C176 26 190 28 200 34 V70 H0z" fill="#9fd0ea"/><path d="M0 60 C50 50 100 52 200 56 V70 H0z" fill="#86c495"/><g fill="#fff" stroke="#3d7fb0" stroke-width=".8"><path d="M40 58 l6-5 6 5 v6 h-12z"/><path d="M60 59 l5-4 5 4 v5 h-10z"/><path d="M120 57 l7-6 7 6 v7 h-14z"/><path d="M142 59 l5-4 5 4 v5 h-10z"/></g><circle cx="176" cy="14" r="7" fill="#fff3b0"/></svg></span>
      <span class="sw-ad__t">서월산 품에 안긴<br><b>서월 힐링타운</b></span>
      <span class="sw-ad__s">1차 48세대 선착순 사전 접수 · 분양 홍보관 1600-XXXX</span>
    </a>
  </section>
  <section class="sw-box sw-jebo">
    <h2 class="sw-box__h">사건 제보</h2>
    <p>서월의 일, 서월일보가 듣겠습니다. 제보자의 신원은 지켜 드립니다.</p>
    <p class="sw-jebo__addr">${jeboLink()}</p>
    <p><a class="sw-more" href="report.html">제보 안내 보기 ›</a></p>
  </section>
  <section class="sw-box sw-ad sw-ad--small" aria-label="광고">
    <p class="sw-ad__tag">광고</p>
    <p class="sw-ad__plain"><b>장터 국밥</b> 오일장 입구 · 새벽 6시부터<br>국밥 한 그릇 9천 원 · 장날엔 수육 덤</p>
  </section>
</aside>`;
}

function frontHtml() {
  const pinned = PINNED.map((id) => all.find((a) => a.id === id)).filter(Boolean);
  const top = pinned[0] || all[0];
  const second = pinned[1] || all.find((a) => a !== top);
  const rest = all.filter((a) => a !== top && a !== second);
  const recent = rest.filter((a) => a.date >= '2026.09.01').slice(0, 10);
  const life = rest.filter((a) => a.photo && a.date >= '2026.09.01').slice(0, 4);
  return `
<div class="sw-grid">
  <div class="sw-col">
    <section class="sw-lead" aria-label="머리기사">
      ${top ? `<article class="sw-lead__top">
        <a class="sw-lead__a" href="${articleHref(top.id)}">
          <p class="sw-kicker">${esc(top.sec)}</p>
          <h1 class="sw-lead__h">${esc(top.title)}</h1>
          ${top.sub ? `<p class="sw-lead__sub">${esc(top.sub.split(' · ')[0])}</p>` : ''}
          ${photoHtml(top.photo, { cls: 'sw-photo--lead', lazy: false })}
          <p class="sw-lead__p">${esc(lead(top, 150))}</p>
          <p class="sw-item__meta">${esc(top.by.name)}${top.by.role ? ' ' + esc(top.by.role) : ''} · ${esc(top.date)}</p>
        </a>
      </article>` : ''}
      ${second ? `<article class="sw-lead__second">
        <a class="sw-lead__a" href="${articleHref(second.id)}">
          ${photoHtml(second.photo, { cap: false })}
          <p class="sw-kicker">${esc(second.sec)}</p>
          <h2 class="sw-lead__h2">${esc(second.title)}</h2>
          <p class="sw-lead__p">${esc(lead(second, 110))}</p>
          <p class="sw-item__meta">${esc(second.date)}</p>
        </a>
      </article>` : ''}
    </section>
    <section class="sw-sec" aria-labelledby="h-latest">
      <h2 class="sw-sec__h" id="h-latest">최신 기사</h2>
      <ul class="sw-list">${recent.map((a) => itemHtml(a, { photo: true })).join('')}</ul>
      <p class="sw-more-row"><a class="sw-more" href="archive.html">지난 기사 더 보기 ›</a></p>
    </section>
    ${life.length ? `<section class="sw-sec" aria-labelledby="h-life">
      <h2 class="sw-sec__h" id="h-life">서월 사는 이야기</h2>
      <ul class="sw-cards">${life.map((a) => `<li><a href="${articleHref(a.id)}">${a.photo ? photoHtml(a.photo, { cap: false }) : '<span class="sw-cards__nophoto" aria-hidden="true">西</span>'}<strong>${esc(a.title)}</strong><span>${esc(a.date)}</span></a></li>`).join('')}</ul>
    </section>` : ''}
  </div>
  ${sideHtml()}
</div>`;
}

function sectionHtml() {
  const list = all.filter((a) => a.sec === sec);
  return `
<div class="sw-grid">
  <div class="sw-col">
    <section class="sw-sec" aria-labelledby="h-sec">
      <p class="sw-crumb"><a href="index.html">홈</a> › ${esc(sec)}</p>
      <h1 class="sw-sec__h sw-sec__h--big" id="h-sec">${esc(sec)}</h1>
      ${list.length ? `<ul class="sw-list">${list.map((a) => itemHtml(a, { photo: true, sec: false, leadMax: 110 })).join('')}</ul>` : '<p class="sw-empty">이 섹션에 올라온 기사가 없습니다.</p>'}
      <p class="sw-more-row"><a class="sw-more" href="archive.html?sec=${encodeURIComponent(sec)}">${esc(sec)} 지난 기사 검색 ›</a></p>
    </section>
  </div>
  ${sideHtml()}
</div>`;
}

root.innerHTML = sec ? sectionHtml() : frontHtml();
game.hydrate(root);
