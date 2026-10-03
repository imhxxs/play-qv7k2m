// 서월일보 기사 보기(article.html?id=…[&view=paper])
import { start, visibleArticles, photoHtml, itemHtml, articleHref, byHtml, mailLink, jeboLink, longDate, issueNo, siteState, updateSite, esc, JEBO_ADDR } from './ilbo.js';
import { findArticle, isoOf } from './articles.js';

const params = new URLSearchParams(location.search);
const id = params.get('id') || '';
const draft = findArticle(id);

const game = start({ page: 'article', title: draft ? `${draft.title} — 서월일보` : '기사를 찾을 수 없습니다 — 서월일보', section: draft?.sec || '' });
const root = document.getElementById('sw-article');
const all = visibleArticles(game);
const a = all.find((x) => x.id === id) || null;

if (!a) {
  game.setTitle('기사를 찾을 수 없습니다 — 서월일보');
  root.innerHTML = `
<section class="sw-404">
  <p class="sw-kicker">안내</p>
  <h1>요청하신 기사를 찾을 수 없습니다</h1>
  <p>기사 주소가 바뀌었거나 아직 디지털화되지 않은 지면일 수 있습니다.</p>
  <p class="sw-404__note">2020년 이후 기사만 검색됩니다. 2000~2019년 지면은 디지털화 작업 중이며 10월 3일 공개 예정입니다.</p>
  <p class="sw-404__btns"><a class="sw-btn" href="index.html">첫 화면으로</a><a class="sw-btn sw-btn--ghost" href="archive.html">기사 검색</a></p>
</section>`;
} else {
  render(a);
}

function paperHtml(art) {
  const iso = isoOf(art.date);
  const other = all.find((x) => x !== art && x.paper?.no === art.paper.no && !x.photo && x.date <= art.date)
    || all.find((x) => x !== art && x.sec === art.sec && x.date <= art.date && x.id !== art.id);
  return `
<div class="sw-paper" aria-hidden="true">
  <div class="sw-paper__head"><span>${esc(longDate(iso))}</span><span class="sw-paper__no">${art.paper.no}</span><span>${esc(art.paper.label)}</span><span>서월일보 · 제${esc(issueNo(iso))}호</span></div>
  <h2 class="sw-paper__h">${esc(art.title)}</h2>
  ${art.sub ? `<p class="sw-paper__sub">${esc(art.sub.split(' · ').join(' / '))}</p>` : ''}
  <div class="sw-paper__body">
    ${art.photo ? `<div class="sw-paper__fig">${photoHtml(art.photo, { lazy: false })}</div>` : ''}
    ${art.body.map((p) => `<p>${p}</p>`).join('')}
    <p class="sw-paper__by">${esc(byHtml(art.by))}</p>
  </div>
  ${other ? `<div class="sw-paper__other"><h3>${esc(other.title)}</h3>${other.body.slice(0, 2).map((p) => `<p>${p}</p>`).join('')}<p class="sw-paper__by">${esc(byHtml(other.by))}</p></div>` : ''}
  <div class="sw-paper__ad"><b>서월 오일장</b> 끝자리 3·8일 · 햇밤 대추 사과 · 서월상인회</div>
</div>`;
}

function render(art) {
  const fs = Number(siteState().fontSize) || 2;
  const related = all.filter((x) => x !== art && x.sec === art.sec).slice(0, 4);
  const caseRel = ['20260921', '20260925'].includes(art.id) ? all.filter((x) => ['20260921', '20260925'].includes(x.id) && x !== art) : [];
  const rel = [...caseRel, ...related.filter((x) => !caseRel.includes(x))].slice(0, 4);
  const hot = all.filter((x) => x.hot).sort((x, y) => x.hot - y.hot).slice(0, 5);

  root.innerHTML = `
<div class="sw-grid">
  <article class="sw-col sw-art sw-fs-${fs}" data-view="${esc(art.card)}" aria-labelledby="art-h">
    <p class="sw-crumb"><a href="index.html">홈</a> › <a href="index.html?sec=${encodeURIComponent(art.sec)}">${esc(art.sec)}</a></p>
    <p class="sw-kicker">${esc(art.sec)}</p>
    <h1 class="sw-art__h" id="art-h">${esc(art.title)}</h1>
    ${art.sub ? `<div class="sw-art__sub">${art.sub.split(' · ').map((s) => `<p>${esc(s)}</p>`).join('')}</div>` : ''}
    <div class="sw-art__meta">
      <p class="sw-art__by">${esc(byHtml(art.by))}${art.by.email ? ` <span class="sw-art__email">${mailLink(art.by.email)}</span>` : ''}</p>
      <p class="sw-art__time">입력 ${esc(art.date)} ${esc(art.time)}${art.edited ? ` <span>· 수정 ${esc(art.edited)}</span>` : ''}</p>
    </div>
    <div class="sw-tools" role="toolbar" aria-label="기사 도구">
      <button type="button" class="sw-tool" data-fs="-1" aria-label="글자 작게"><span class="sw-tool__a sw-tool__a--s">가</span></button>
      <button type="button" class="sw-tool" data-fs="1" aria-label="글자 크게"><span class="sw-tool__a sw-tool__a--l">가</span></button>
      ${art.paper ? `<button type="button" class="sw-tool sw-tool--paper" id="btn-paper" aria-expanded="false" aria-controls="scan">지면 보기</button>` : ''}
      <span class="sw-tools__sp"></span>
      <md-collect card="${esc(art.card)}" label="수첩에 스크랩"></md-collect>
    </div>
    ${art.paper ? `<section class="sw-scan" id="scan" hidden aria-label="지면 보기">
      <div class="sw-scan__bar">
        <p><b>${esc(art.date)}자 ${art.paper.no}면</b> · ${esc(art.paper.label)} <span class="sw-scan__hint">끌어서 옮기고 버튼으로 확대하세요</span></p>
        <div class="sw-zoom">
          <button type="button" data-z="out" aria-label="축소">−</button>
          <output id="zoom-v" aria-live="polite">100%</output>
          <button type="button" data-z="in" aria-label="확대">+</button>
          <button type="button" data-z="fit" class="sw-zoom__fit">맞춤</button>
        </div>
      </div>
      <div class="sw-scan__view" id="scan-view" tabindex="0" role="img" aria-label="${esc(art.date)}자 서월일보 ${art.paper.no}면 지면 스캔">
        <div class="sw-scan__spacer" id="scan-spacer">${paperHtml(art)}</div>
      </div>
    </section>` : ''}
    ${photoHtml(art.photo, { lazy: false })}
    <div class="sw-art__body">
      ${art.body.map((p) => `<p>${p}</p>`).join('\n')}
    </div>
    ${art.note ? `<p class="sw-art__note">${esc(art.note)}</p>` : ''}
    <div class="sw-art__end">
      <p><b>${esc(byHtml(art.by))}</b>${art.by.email ? ` · ${mailLink(art.by.email)}` : ''}</p>
      ${art.paper ? `<p class="sw-art__paperline">이 기사는 ${esc(art.date)}자 지면 ${art.paper.no}면에 실렸습니다.</p>` : ''}
    </div>
    ${art.jebo ? `<aside class="sw-jebobox" aria-label="제보 안내">
      <p class="sw-jebobox__k">제보</p>
      <p>이 기사와 관련해 알고 계신 사실이 있다면 ${jeboLink()}로 알려 주세요. 제보자의 신원은 철저히 보호됩니다.</p>
      <p class="sw-jebobox__more"><a href="report.html">제보 안내 자세히 ›</a></p>
    </aside>` : ''}
    <p class="sw-copy">ⓒ 서월일보. 무단 전재·재배포 금지</p>
    ${rel.length ? `<section class="sw-sec sw-rel" aria-labelledby="h-rel"><h2 class="sw-sec__h" id="h-rel">관련 기사</h2><ul class="sw-list">${rel.map((x) => itemHtml(x, { leadMax: 0 })).join('')}</ul></section>` : ''}
  </article>
  <aside class="sw-side" aria-label="곁다리">
    <section class="sw-box">
      <h2 class="sw-box__h">많이 본 기사</h2>
      <ol class="sw-rank">${hot.map((x, i) => `<li><a href="${articleHref(x.id)}"${x === art ? ' aria-current="page"' : ''}><b>${i + 1}</b><span>${esc(x.title)}</span></a></li>`).join('')}</ol>
    </section>
    <section class="sw-box sw-jebo">
      <h2 class="sw-box__h">사건 제보</h2>
      <p>서월의 일, 서월일보가 듣겠습니다.</p>
      <p class="sw-jebo__addr">${jeboLink()}</p>
    </section>
  </aside>
</div>`;

  game.hydrate(root);
  if (art.jebo) game.flag('addr:' + JEBO_ADDR);
  if (art.by.email) game.flag('addr:' + art.by.email);

  // 글자 크기
  const artEl = root.querySelector('.sw-art');
  root.querySelectorAll('[data-fs]').forEach((b) => b.addEventListener('click', () => {
    const cur = Number(artEl.className.match(/sw-fs-(\d)/)?.[1] || 2);
    const next = Math.min(4, Math.max(1, cur + Number(b.dataset.fs)));
    artEl.className = artEl.className.replace(/sw-fs-\d/, 'sw-fs-' + next);
    updateSite((d) => { d.fontSize = next; });
  }));

  if (art.paper) setupScan(params.get('view') === 'paper');
}

// ── 지면 보기(확대·이동) ─────────────────────────────────────
function setupScan(openNow) {
  const box = document.getElementById('scan');
  const btn = document.getElementById('btn-paper');
  const view = document.getElementById('scan-view');
  const spacer = document.getElementById('scan-spacer');
  const paper = spacer.querySelector('.sw-paper');
  const out = document.getElementById('zoom-v');
  const PAPER_W = 760;
  let scale = 0;
  let fit = 1;

  function apply() {
    const h = paper.offsetHeight;
    spacer.style.width = Math.round(PAPER_W * scale) + 'px';
    spacer.style.height = Math.round(h * scale) + 'px';
    paper.style.transform = `scale(${scale})`;
    out.textContent = Math.round((scale / fit) * 100) + '%';
  }
  function refit() {
    fit = Math.max(0.2, (view.clientWidth - 2) / PAPER_W);
    if (!scale || scale < fit) scale = fit;
    apply();
  }
  function zoom(f, cx, cy) {
    const old = scale;
    scale = Math.min(fit * 4, Math.max(fit, f === 'fit' ? fit : scale * f));
    const r = view.getBoundingClientRect();
    const px = cx ?? r.width / 2;
    const py = cy ?? r.height / 2;
    const ox = (view.scrollLeft + px) / old;
    const oy = (view.scrollTop + py) / old;
    apply();
    view.scrollLeft = ox * scale - px;
    view.scrollTop = oy * scale - py;
  }
  function toggle(on) {
    box.hidden = !on;
    btn.setAttribute('aria-expanded', String(on));
    btn.classList.toggle('is-on', on);
    btn.textContent = on ? '지면 닫기' : '지면 보기';
    if (on) {
      requestAnimationFrame(refit);
      game.sfx('paper');
    }
  }
  btn.addEventListener('click', () => toggle(box.hidden));
  box.querySelectorAll('[data-z]').forEach((b) => b.addEventListener('click', () => {
    const z = b.dataset.z;
    zoom(z === 'in' ? 1.4 : z === 'out' ? 1 / 1.4 : 'fit');
  }));
  view.addEventListener('dblclick', (e) => {
    const r = view.getBoundingClientRect();
    zoom(scale > fit * 1.5 ? 'fit' : 2, e.clientX - r.left, e.clientY - r.top);
  });
  view.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1.4); }
    if (e.key === '-') { e.preventDefault(); zoom(1 / 1.4); }
  });
  // 마우스로 끌어서 옮기기(터치는 브라우저 기본 스크롤)
  let drag = null;
  view.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, y: e.clientY, l: view.scrollLeft, t: view.scrollTop };
    view.classList.add('is-drag');
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    view.scrollLeft = drag.l - (e.clientX - drag.x);
    view.scrollTop = drag.t - (e.clientY - drag.y);
  });
  window.addEventListener('pointerup', () => { drag = null; view.classList.remove('is-drag'); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (!box.hidden) refit(); }).observe(view);
  if (openNow) {
    toggle(true);
    setTimeout(() => box.scrollIntoView({ block: 'start' }), 60);
  }
}
