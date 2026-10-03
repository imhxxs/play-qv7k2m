// 누리샘 '저장된 페이지' 뷰어: cache.html?id=…
//   - 위쪽 회색 띠: '누리샘이 ○월 ○일 ○시에 저장한 페이지입니다 · 수정됨 ○월 ○일'
//   - 저장 당시 원래 사이트의 생김새를 흉내 낸 스냅숏(snapshots.css)
//   - 선희당 진오귀 공지 원본(E09)을 열면 열람 기록 + P04(시한 바 D-13은 엔진이 켠다)
import { boot } from '../src/game.js';
import DATA from '../src/data/search/index.js';
import { mountSearchBox, logoHtml, topLinksHtml, footerHtml, ICON, asset } from './nurisaem.js';

const params = new URLSearchParams(location.search);
const id = (params.get('id') || '').trim();
const entry = DATA.cache[id] || null;
const filler = !entry && id.startsWith('f-') ? DATA.fillers.find((f) => f.id === id) : null;

const title = entry ? entry.pageTitle : filler ? `${filler.title} — 누리샘 저장된 페이지` : '저장된 페이지 — 누리샘';
const game = boot({ siteId: 'nurisaem', page: 'cache', title });
const esc = game.esc;
const $ = (x) => document.getElementById(x);

$('logo').innerHTML = logoHtml();
$('links').innerHTML = topLinksHtml(game);
mountSearchBox(game, $('searchbox'));
$('foot').outerHTML = footerHtml();

const main = $('main');

function band({ savedLabel, change, original, acts = '' }) {
  const sec = document.createElement('section');
  sec.setAttribute('aria-label', '저장된 페이지 안내');
  sec.innerHTML = `
  <div class="ns-cache-band"><div class="ns-wrap ns-cache-band__row">
    <p class="ns-cache-band__text" id="cache-band">누리샘이 ${esc(savedLabel)}에 저장한 페이지입니다${change ? ` · <span class="is-change">${esc(change)}</span>` : ''}</p>
    <div class="ns-cache-band__acts">${acts}</div>
  </div></div>
  <div class="ns-cache-meta"><div class="ns-wrap"><p>${original}</p></div></div>`;
  return sec;
}

if (entry) {
  const t = DATA.links[entry.link];
  const addr = t ? game.fakeAddress(t.site, t.page, t.query ? '?' + t.query : '') : '';
  const liveLink = t && game.sites[t.site]?.pages.includes(t.page)
    ? `<a class="ns-btn" data-site="${esc(t.site)}" data-page="${esc(t.page)}" data-query="${esc(t.query || '')}">${ICON.ext}지금 페이지 보기</a>`
    : '';
  const changeNote = entry.change?.kind === 'modified'
    ? '이 페이지는 저장된 뒤 고쳐졌습니다. 아래는 저장 당시의 모습이며, 지금 페이지와 다를 수 있습니다.'
    : entry.change?.kind === 'deleted' ? '이 페이지는 저장된 뒤 지워졌습니다. 아래는 저장 당시의 모습입니다.' : '아래는 저장 당시의 모습입니다.';
  main.append(band({
    savedLabel: entry.saved.label,
    change: entry.change?.label,
    original: `원래 주소 <b>${esc(addr)}</b> · ${changeNote} 저장본의 링크와 메뉴는 동작하지 않습니다.`,
    acts: `${liveLink}<span id="collect-slot"></span>`,
  }));
  const snap = document.createElement('div');
  snap.className = 'ns-snap';
  snap.innerHTML = `<div class="ns-wrap"><div class="ns-snap__frame snap--${esc(entry.theme || 'plain')}" data-snapshot="${esc(entry.id)}">${entry.html.replaceAll('{ASSET}', asset('assets/nurisaem/'))}</div></div>`;
  main.append(snap);
  if (entry.card) {
    game.view(entry.card);
    if (game.cards.get(entry.card)) game.collectButton($('collect-slot'), entry.card);
  }
  if (entry.solve) game.solve(entry.solve);
} else if (filler) {
  const [, m, d] = String(filler.date).split('.').map(Number);
  const saved = m && d ? `${m}월 ${d}일` : '얼마 전';
  main.append(band({
    savedLabel: saved,
    change: null,
    original: `원래 주소 <b>${esc(filler.url)}</b> · 원래 사이트에 연결할 수 없어 누리샘이 저장해 둔 사본을 보여 드립니다.`,
  }));
  const img = filler.img ? DATA.images[filler.img] : null;
  const snap = document.createElement('div');
  snap.className = 'ns-snap';
  snap.innerHTML = `<div class="ns-wrap"><div class="ns-snap__frame" data-snapshot="${esc(filler.id)}"><article class="snap-plain">
    <p class="snap-plain__site">${esc(filler.source)}</p>
    <h1>${esc(filler.title)}</h1>
    <p class="snap-plain__date">${esc(filler.date)}</p>
    ${img ? `<img src="${esc(asset(img.src))}" alt="${esc(img.alt || img.title)}" width="${img.w}" height="${img.h}">` : ''}
    ${filler.body.map((p) => `<p>${esc(p)}</p>`).join('')}
  </article></div></div>`;
  main.append(snap);
} else {
  const div = document.createElement('div');
  div.className = 'ns-wrap ns-cache-help';
  div.innerHTML = id
    ? `<h1>저장된 페이지를 찾을 수 없습니다</h1><p>주소가 바뀌었거나 저장 기간이 지났을 수 있어요. 검색 결과 옆의 ‘저장된 페이지’ 버튼으로 다시 열어 보세요.</p>`
    : `<h1>누리샘 도움말</h1>
      <h2 style="font-size:18px;margin:22px 0 6px">저장된 페이지</h2>
      <p>누리샘은 사이트를 둘러볼 때 그 모습을 저장해 둡니다. 글이 나중에 고쳐지거나 지워져도, 저장해 둔 그때의 모습을 볼 수 있어요.</p>
      <p>찾고 싶은 페이지를 위 검색창에서 찾은 뒤, 결과 옆 <b>‘저장된 페이지’</b>를 누르세요. 저장본 위쪽 회색 띠에 저장한 때와 고친 때가 함께 나옵니다.</p>
      <h2 style="font-size:18px;margin:22px 0 6px">누리샘 사전</h2>
      <p><a href="dict.html">사전</a>에서 낱말 풀이와 한자 음훈을 찾고, 간지와 연도를 서로 바꿀 수 있어요. 음력 ↔ 양력 바꾸기는 준비 중입니다.</p>
      <h2 style="font-size:18px;margin:22px 0 6px">이 이미지로 검색</h2>
      <p>검색 결과의 <a href="search.html?tab=image">이미지</a> 탭에서 수첩에 모인 사진을 고르면 비슷한 이미지를 찾아 드려요.</p>
      <h2 style="font-size:18px;margin:22px 0 6px">검색 기록</h2>
      <p>검색창을 비워 두고 누르면 최근 검색어가 보입니다. 하나씩 지우거나 ‘전체 삭제’할 수 있어요. 기록은 이 브라우저에만 남습니다.</p>`;
  main.append(div);
}

game.hydrate(document.body);
