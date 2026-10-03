// 누리샘 검색 결과: search.html?q=…&tab=web|news|image|dict
import { boot } from '../src/game.js';
import DATA from '../src/data/search/index.js';
import { search, imageSearch, imageCard, trendingFor, compact } from '../src/data/search/engine.js';
import {
  mountSearchBox, logoHtml, topLinksHtml, footerHtml, ICON, siteIcon, asset, searchUrl,
  addHistory, getHistory, weatherCard, ganjiWidget, dictItemEl,
} from './nurisaem.js';

const TABS = [
  { id: 'web', label: '웹' },
  { id: 'news', label: '뉴스' },
  { id: 'image', label: '이미지' },
  { id: 'dict', label: '사전' },
];

const params = new URLSearchParams(location.search);
const q = (params.get('q') || '').trim().slice(0, 100);
let tab = params.get('tab') || 'web';
if (!TABS.some((t) => t.id === tab)) tab = 'web';

const title = q ? `${q} — 누리샘 검색` : '누리샘 검색';
const game = boot({ siteId: 'nurisaem', page: 'search', title });
const esc = game.esc;
const $ = (id) => document.getElementById(id);
/** 조사만(예: pp('월하당', '와/과') → '과') */
const pp = (word, pair) => game.josa(word, pair).slice(String(word).length);

// 주소창에는 한글을 그대로 보여 준다(실제 브라우저처럼)
const shownQ = q.replace(/[&#?%]/g, (c) => encodeURIComponent(c));
game.setAddress(q || tab !== 'web'
  ? `https://www.nurisaem.kr/search?${q ? 'q=' + shownQ : ''}${tab !== 'web' ? (q ? '&' : '') + 'tab=' + tab : ''}`
  : null);

$('logo').innerHTML = logoHtml();
$('links').innerHTML = topLinksHtml(game);
mountSearchBox(game, $('searchbox'), { value: q, tab, autofocus: !q });
$('foot').outerHTML = footerHtml();

const res = q ? search(q, { chapter: game.chapter.id, sites: game.sites }) : null;
if (q) addHistory(game, q);
if (res) for (const p of res.solve) game.solve(p);

// ── 탭 ────────────────────────────────────────────────────────
const counts = res
  ? { web: res.all.length + res.fillers.length + res.specials.length, news: res.news.length, image: res.images.length, dict: res.dict.length + res.specials.filter((s) => s.type === 'ganji').length }
  : {};
$('tabs').innerHTML = TABS.map((t) => {
  const href = q ? searchUrl(q, t.id) : `search.html${t.id !== 'web' ? '?tab=' + t.id : ''}`;
  const n = counts[t.id];
  return `<li><a href="${href}"${t.id === tab ? ' aria-current="page"' : ''}>${t.label}${n ? ` <small>${n}</small>` : ''}</a></li>`;
}).join('');

// ── 공용 조각 ─────────────────────────────────────────────────
const markRe = res?.marks?.length
  ? new RegExp('(' + res.marks.map((m) => esc(m).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'g')
  : null;
const hl = (text) => {
  const s = esc(text || '');
  return markRe ? s.replace(markRe, '<mark>$1</mark>') : s;
};

const FILLER_FAV = {
  'solgeul.net': { bg: '#3f7d5c', t: '솔' },
  'moimteo.net': { bg: '#6a5a9c', t: '모' },
  'www.seowol-gun.kr': { bg: '#2f6e8e', t: '군' },
  'www.nurisaem.kr': { bg: '#24408e', t: '샘' },
};
function fillerFav(url) {
  const host = String(url).replace(/^https?:\/\//, '').split('/')[0];
  const f = FILLER_FAV[host] || { bg: '#8a91a3', t: '•' };
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="${f.bg}"/><text x="16" y="21.5" font-size="15" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">${f.t}</text></svg>`;
}

function cardEl(c) {
  const art = document.createElement('article');
  const isFiller = c.type === 'filler';
  art.className = 'ns-r' + (isFiller ? ' ns-r--filler' : '');
  const external = !isFiller && c.site !== 'nurisaem';
  const linkAttrs = isFiller
    ? `href="cache.html?id=${encodeURIComponent(c.cache)}"`
    : `data-site="${esc(c.site)}" data-page="${esc(c.page)}" data-query="${esc(c.query || '')}"`;
  const fav = isFiller ? fillerFav(c.url) : siteIcon(game, c.site);
  const acts = [];
  if (external) acts.push(`<a class="ns-btn" ${linkAttrs}>${ICON.ext}새 탭으로 열기</a>`);
  if (c.cache) acts.push(`<a class="ns-btn ns-btn--saved" href="cache.html?id=${encodeURIComponent(c.cache)}">${ICON.saved}저장된 페이지</a>`);
  art.innerHTML = `
    <div class="ns-r__src"><span class="ns-r__fav">${fav}</span><span class="ns-r__site">${esc(c.source || '')}</span><span class="ns-r__url">${esc(c.url || '')}</span></div>
    <h3 class="ns-r__title"><a ${linkAttrs}>${hl(c.title)}</a></h3>
    <p class="ns-r__snip">${hl(c.snippet)}</p>
    <p class="ns-r__meta">${c.press ? `<span class="ns-r__press">${esc(c.press)}</span>` : ''}${c.date ? `<span>${esc(c.date)}</span>` : ''}</p>
    ${acts.length ? `<div class="ns-r__actions">${acts.join('')}</div>` : ''}`;
  return art;
}

function bandEl() {
  const p = document.createElement('p');
  p.className = 'ns-band';
  p.setAttribute('role', 'note');
  p.innerHTML = `${ICON.info}<span>서월일보 2000~2019 지면은 10월 3일 공개 예정입니다(누리샘 뉴스 제휴 안내)</span>`;
  return p;
}

function noticesInto(main) {
  if (res.band) main.append(bandEl());
  if (res.suggestion) {
    const p = document.createElement('p');
    p.className = 'ns-did';
    p.innerHTML = `혹시 <a href="${searchUrl(res.suggestion.text, tab)}">${esc(res.suggestion.text)}</a>${esc(res.suggestion.particle)} 찾으세요?`;
    main.append(p);
  }
  if (res.partial) {
    const p = document.createElement('p');
    p.className = 'ns-partial';
    p.innerHTML = `‘<b>${esc(res.partial.shown)}</b>’에 대한 결과만 표시합니다.`;
    main.append(p);
  }
}

function specialEl(s) {
  if (s.type === 'weather') return weatherCard(game);
  if (s.type === 'ganji') {
    return ganjiWidget(game, s.mode === 'year' ? { year: s.year } : s.mode === 'ganji' ? { ganji: s.ganji } : {});
  }
  const box = document.createElement('section');
  box.className = 'ns-special';
  if (s.type === 'map') {
    box.innerHTML = `<p class="ns-special__kind">누리샘 지도</p>
      <div class="ns-map">
        <svg viewBox="0 0 140 104" role="img" aria-label="${esc(s.title)} 위치 약도">
          <rect width="140" height="104" fill="#e8eef6"/><path d="M0 70 C30 60 60 76 90 58 S130 40 140 44" stroke="#f7d27a" stroke-width="9" fill="none"/>
          <path d="M0 70 C30 60 60 76 90 58 S130 40 140 44" stroke="#c9a24a" stroke-width="1" fill="none" stroke-dasharray="4 4"/>
          <path d="M20 0 L44 104" stroke="#fff" stroke-width="5"/><rect x="96" y="14" width="30" height="18" rx="3" fill="#cfe0c8"/>
          <path d="M84 52 c0-8 6-13 12-13s12 5 12 13c0 9-12 20-12 20s-12-11-12-20z" fill="#24408e"/><circle cx="96" cy="52" r="4.5" fill="#fff"/>
        </svg>
        <div><h3>${esc(s.title)}</h3><p>${esc(s.addr)}</p><p class="ns-map__note">${esc(s.note)}</p><p>${esc(s.info)}</p></div>
      </div>`;
  } else if (s.type === 'snippet') {
    box.innerHTML = `<p class="ns-special__kind">${esc(s.source || '정보')}</p><h3>${esc(s.title)}</h3><ul>${(s.lines || []).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`;
  } else if (s.type === 'savedinfo') {
    box.innerHTML = `<p class="ns-special__kind">누리샘 도움말</p><h3>저장된 페이지</h3>
      <p>누리샘은 사이트를 둘러볼 때 그 모습을 저장해 둡니다. 검색 결과 옆 <b>‘저장된 페이지’</b>를 누르면 저장한 그때의 모습을 볼 수 있어요.</p>
      <p>글이 나중에 고쳐졌다면 위쪽 회색 띠에 ‘수정됨’과 날짜가 함께 표시됩니다.</p>`;
  }
  return box;
}

const hasGanjiCard = !!res?.specials.some((s) => s.type === 'ganji');
function dictPreviewEl(d, more) {
  const el = dictItemEl(game, d, { data: DATA, widget: !hasGanjiCard });
  if (more) {
    const a = document.createElement('a');
    a.className = 'ns-btn';
    a.href = searchUrl(q, 'dict');
    a.innerHTML = `${ICON.book}사전 결과 더 보기`;
    el.append(a);
  }
  return el;
}

function relatedEl() {
  if (!res.related.length) return null;
  const sec = document.createElement('section');
  sec.className = 'ns-related';
  sec.setAttribute('aria-labelledby', 'rel-t');
  sec.innerHTML = `<h2 id="rel-t">함께 찾는 말</h2><ul>${res.related.map((r) => `<li><a class="ns-chip" href="${searchUrl(r)}">${esc(r)}</a></li>`).join('')}</ul>`;
  return sec;
}

function trendEl() {
  const sec = document.createElement('section');
  sec.className = 'ns-card';
  const list = trendingFor(game.chapter.id, DATA);
  sec.innerHTML = `<h2>지금 서월에서 많이 찾는 말</h2><ol class="ns-trend__list" style="flex-direction:column;gap:4px">${list.map((t, i) => `<li><a class="ns-chip" href="${searchUrl(t)}"><span class="ns-chip__n">${i + 1}</span>${esc(t)}</a></li>`).join('')}</ol>`;
  return sec;
}

function savedTipEl() {
  const sec = document.createElement('section');
  sec.className = 'ns-card';
  sec.innerHTML = `<h2>${ICON.saved.replace('<svg', '<svg style="width:18px;height:18px;color:var(--ns-indigo)"')}저장된 페이지</h2>
    <p style="font-size:14px;color:var(--ns-muted)">글이 고쳐졌어도 누리샘이 저장해 둔 옛 모습을 볼 수 있어요. 결과 옆 ‘저장된 페이지’를 눌러 보세요.</p>`;
  return sec;
}

function emptyEl(kind) {
  const div = document.createElement('div');
  div.className = 'ns-empty';
  const what = { web: '문서', news: '뉴스', image: '이미지', dict: '사전' }[kind];
  div.innerHTML = `<h2>‘${esc(q)}’ ${what} 검색 결과가 없습니다.</h2>
    <ul><li>낱말의 맞춤법을 확인해 보세요.</li><li>띄어쓰기를 바꾸거나 더 짧은 말로 찾아보세요.</li>${kind !== 'web' ? `<li><a href="${searchUrl(q)}">웹 결과</a>를 확인해 보세요.</li>` : ''}</ul>`;
  return div;
}

// ── 이미지 ────────────────────────────────────────────────────
const viewer = $('viewer');
let lastFocus = null;
function openViewer(img) {
  lastFocus = document.activeElement;
  $('viewer-t').textContent = img.title;
  const im = $('viewer-img');
  im.src = asset(img.src);
  im.alt = img.alt || img.title;
  $('viewer-meta').textContent = `${img.source} · ${img.url}`;
  const acts = $('viewer-acts');
  const linkAttrs = img.site === 'nurisaem' ? `href="cache.html?${esc(img.query)}"` : `data-site="${esc(img.site)}" data-page="${esc(img.page)}" data-query="${esc(img.query || '')}"`;
  acts.innerHTML = `<a class="ns-btn ns-btn--primary" ${linkAttrs}>${ICON.ext}${img.site === 'nurisaem' ? '저장된 페이지 보기' : '원본 페이지 새 탭으로 열기'}</a><button type="button" class="ns-btn" data-imgsearch="${esc(img.id)}">${ICON.search}이 이미지로 검색</button>`;
  game.hydrate(acts);
  $('viewer-msg').textContent = '';
  viewer.hidden = false;
  viewer.querySelector('.ns-viewer__close').focus();
}
function closeViewer() {
  viewer.hidden = true;
  lastFocus?.focus?.();
}
viewer.addEventListener('click', (e) => {
  if (e.target === viewer || e.target.closest('.ns-viewer__close')) closeViewer();
  const b = e.target.closest('[data-imgsearch]');
  if (b) {
    const r = imageSearch('img:' + b.dataset.imgsearch, { chapter: game.chapter.id, sites: game.sites });
    const msg = $('viewer-msg');
    if (r.found) {
      msg.innerHTML = '비슷한 이미지가 실린 문서: ' + r.dict.map((d) => `<a href="dict.html?q=${encodeURIComponent(d.term)}">${esc(d.term)}${d.hanja ? ' ' + esc(d.hanja) : ''} — 누리샘 사전</a>`).join(', ');
    } else msg.textContent = '비슷한 이미지를 찾지 못했습니다.';
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !viewer.hidden) closeViewer(); });

function imagesGrid(list, { row = false } = {}) {
  const ul = document.createElement('ul');
  ul.className = 'ns-imgs' + (row ? ' ns-imgs--row' : '');
  for (const img of list) {
    const li = document.createElement('li');
    li.innerHTML = `<figure class="ns-img"><button type="button" aria-label="${esc(img.title)} 크게 보기"><img src="${esc(asset(img.src))}" alt="${esc(img.alt || img.title)}" width="${img.w}" height="${img.h}" loading="lazy"></button><figcaption>${esc(img.title)}<small>${esc(img.source)}</small></figcaption></figure>`;
    li.querySelector('button').addEventListener('click', () => openViewer(img));
    ul.append(li);
  }
  return ul;
}

function imageSearchPanel() {
  const sec = document.createElement('section');
  sec.className = 'ns-imgsearch';
  sec.setAttribute('aria-labelledby', 'imgs-t');
  const cards = game.cards.viewed().filter((e) => e.card && DATA.imageCards.includes(e.id));
  sec.innerHTML = `<h3 id="imgs-t">이 이미지로 검색</h3>
    <p>${cards.length ? '수첩에 모인 사진 가운데 하나를 고르면, 비슷한 이미지와 문서를 찾아 드려요.' : '아직 수첩에 모인 사진이 없어요. 사이트에서 사진을 보면 수첩 열람 기록에 쌓이고, 여기서 고를 수 있습니다.'}</p>
    <ul class="ns-imgsearch__cards"></ul><div class="ns-imgsearch__out" role="status"></div>`;
  const ul = sec.querySelector('ul');
  const out = sec.querySelector('.ns-imgsearch__out');
  for (const e of cards) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ns-btn';
    b.textContent = e.card.title;
    b.addEventListener('click', () => {
      const r = imageSearch(e.id, { chapter: game.chapter.id, sites: game.sites });
      out.replaceChildren();
      if (r.found) {
        const p = document.createElement('p');
        p.className = 'ns-imgsearch__none';
        p.textContent = `고른 사진과 비슷한 이미지와 문서를 찾았습니다.`;
        out.append(p);
        for (const d of r.dict) out.append(dictPreviewEl(d, false));
        if (r.images.length) out.append(imagesGrid(r.images));
      } else {
        const p = document.createElement('p');
        p.className = 'ns-imgsearch__none';
        p.textContent = '비슷한 이미지를 찾지 못했습니다.';
        out.append(p);
        const others = ['seowol-mountain', 'reservoir', 'wolhadang-hall']
          .map((id) => imageCard(id, { chapter: game.chapter.id, sites: game.sites })).filter(Boolean);
        const h = document.createElement('p');
        h.className = 'ns-count';
        h.style.marginTop = '12px';
        h.textContent = '이런 이미지는 어떠세요?';
        out.append(h, imagesGrid(others));
      }
      game.hydrate(out);
    });
    li.append(b);
    ul.append(li);
  }
  return sec;
}

// ── 그리기 ────────────────────────────────────────────────────
const main = $('main');
const side = $('side');

if (!q) {
  if (tab === 'image') main.append(imageSearchPanel());
  const hist = getHistory(game).slice(0, 8);
  const div = document.createElement('div');
  div.className = 'ns-empty';
  div.innerHTML = `<h2>무엇을 찾아볼까요?</h2><p>검색어를 입력하면 웹 문서·뉴스·이미지·사전을 함께 찾아 드려요.</p>${hist.length ? `<h3 style="font-size:15px;margin:18px 0 8px">최근 검색어</h3><ul style="display:flex;flex-wrap:wrap;gap:8px;list-style:none;padding:0">${hist.map((h) => `<li><a class="ns-chip" href="${searchUrl(h.q)}">${esc(h.q)}</a></li>`).join('')}</ul>` : ''}`;
  main.append(div);
  side.append(trendEl());
} else if (tab === 'web') {
  noticesInto(main);
  const total = res.all.length + res.fillers.length;
  const count = document.createElement('p');
  count.className = 'ns-count';
  count.textContent = res.all.length ? `웹 문서 ${total}건` : '';
  for (const s of res.specials) main.append(specialEl(s));
  if (res.dict.length && !res.all.length) main.append(dictPreviewEl(res.dict[0], res.dict.length > 1));
  if (res.all.length) main.append(count);
  for (const c of res.all) main.append(cardEl(c));
  if (res.fillers.length) {
    const p = document.createElement('p');
    p.className = 'ns-partial';
    p.innerHTML = `‘<b>${esc(q)}</b>’${pp(q, '와/과')} 딱 맞는 문서를 찾지 못했어요. 새로 생긴 사이트는 아직 색인되지 않았을 수 있습니다. 대신 이런 글은 어떠세요?`;
    main.append(p);
    for (const c of res.fillers) main.append(cardEl(c));
  }
  if (res.images.length) {
    const h = document.createElement('h2');
    h.className = 'ns-group-title';
    h.textContent = '이미지';
    const more = document.createElement('a');
    more.className = 'ns-btn';
    more.href = searchUrl(q, 'image');
    more.textContent = '이미지 더 보기';
    main.append(h, imagesGrid(res.images.slice(0, 4), { row: true }), more);
  }
  const rel = relatedEl();
  if (rel) main.append(rel);
  if (res.dict.length && res.all.length) side.append(dictPreviewEl(res.dict[0], res.dict.length > 1));
  side.append(trendEl(), savedTipEl());
} else if (tab === 'news') {
  noticesInto(main);
  if (res.news.length) {
    const count = document.createElement('p');
    count.className = 'ns-count';
    count.textContent = `뉴스 ${res.news.length}건`;
    main.append(count);
    for (const c of res.news) main.append(cardEl(c));
  } else main.append(emptyEl('news'));
  side.append(trendEl());
} else if (tab === 'image') {
  if (res.band) main.append(bandEl());
  main.append(imageSearchPanel());
  if (res.images.length) main.append(imagesGrid(res.images));
  else main.append(emptyEl('image'));
  side.append(trendEl());
} else if (tab === 'dict') {
  noticesInto(main);
  const ganji = res.specials.find((s) => s.type === 'ganji');
  if (ganji) main.append(specialEl(ganji));
  if (res.dict.length) for (const d of res.dict) main.append(dictPreviewEl(d, false));
  if (!res.dict.length && !ganji) main.append(emptyEl('dict'));
  const a = document.createElement('p');
  a.innerHTML = `<a class="ns-btn" href="dict.html?q=${encodeURIComponent(q)}">${ICON.book}누리샘 사전에서 ‘${esc(q)}’ 찾기</a>`;
  main.append(a);
  side.append(trendEl());
}

game.hydrate(document.body);

// ── 으스스한 것들(설정 '깜짝 연출'을 따른다. 단서는 여기에만 두지 않는다) ──
if (res) {
  for (const s of res.scares) setTimeout(() => game.scare({ id: s.id, kind: s.kind, text: s.text }), s.delayMs || 1200);
  const me = game.profile?.name;
  if (me && compact(q) === compact(me)) {
    setTimeout(() => game.scare({ id: 'nurisaem-selfname', kind: 'whisper', text: '누가 {이름을} 찾고 있어.' }), 1600);
  }
}
