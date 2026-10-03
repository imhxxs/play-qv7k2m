// 누리샘 사전: dict.html?q=…  — 용어 풀이 · 한자 음훈 · 같은 음의 한자 · 간지 ↔ 연도
import { boot } from '../src/game.js';
import DATA from '../src/data/search/index.js';
import { dictLookup } from '../src/data/search/engine.js';
import { mountSearchBox, logoHtml, topLinksHtml, footerHtml, ganjiWidget, dictItemEl, searchUrl, ICON } from './nurisaem.js';

const params = new URLSearchParams(location.search);
const q = (params.get('q') || '').trim().slice(0, 60);
const title = q ? `${q} — 누리샘 사전` : '누리샘 사전';
const game = boot({ siteId: 'nurisaem', page: 'dict', title });
const esc = game.esc;
const $ = (x) => document.getElementById(x);

if (q) game.setAddress(`https://www.nurisaem.kr/dict?q=${q.replace(/[&#?%]/g, (c) => encodeURIComponent(c))}`);
$('logo').innerHTML = logoHtml();
$('links').innerHTML = topLinksHtml(game);
mountSearchBox(game, $('searchbox'), { value: q });
$('foot').outerHTML = footerHtml();

const input = $('dict-q');
input.value = q;
input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.preventDefault(); });
$('dict-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = input.value.trim();
  if (!v) { input.focus(); return; }
  location.href = 'dict.html?q=' + encodeURIComponent(v);
});

const out = $('out');
const side = $('side');
const chapter = game.chapter.id;

function hanjaTable(r) {
  const sec = document.createElement('section');
  sec.className = 'ns-dict';
  sec.setAttribute('aria-labelledby', 'hj-t');
  sec.innerHTML = `
  <div class="ns-dict__head"><h3 class="ns-dict__term" id="hj-t">한자 찾기</h3><span class="ns-dict__hanja">${esc(r.hanja.map((h) => h.ch).join(''))}</span><span class="ns-dict__kind">음훈</span></div>
  <table class="ns-table"><caption class="ns-sr">한 글자씩 음과 뜻</caption>
    <thead><tr><th scope="col">글자</th><th scope="col">뜻과 음</th></tr></thead>
    <tbody>${r.hanja.map((h) => `<tr class="ns-hanja-row"><td>${esc(h.ch)}</td><td>${h.eum ? `<b>${esc(h.hun)} ${esc(h.eum)}</b>` : '누리샘 사전에 아직 없는 글자예요.'}</td></tr>`).join('')}</tbody>
  </table>
  ${r.reading ? `<p>읽기: <b>${esc(r.reading)}</b> <small style="color:var(--ns-faint)">(낱말 첫머리에는 두음법칙을 적용해 읽었어요)</small></p>` : ''}`;
  return sec;
}

function byEumEl(list, syl) {
  const sec = document.createElement('section');
  sec.className = 'ns-dict';
  sec.innerHTML = `<div class="ns-dict__head"><h3 class="ns-dict__term">‘${esc(syl)}’ 음의 한자</h3><span class="ns-dict__kind">${list.length}자</span></div>
  <ul class="ns-dict__see">${list.map((h) => `<li><a href="dict.html?q=${encodeURIComponent(h.ch)}" aria-label="${esc(h.ch)} ${esc(h.hun)} ${esc(h.eum)}"><span style="font-family:var(--ns-serif);font-size:20px;margin-right:6px">${esc(h.ch)}</span>${esc(h.hun)} ${esc(h.eum)}</a></li>`).join('')}</ul>`;
  return sec;
}

function indexEl() {
  const sec = document.createElement('section');
  sec.className = 'ns-index';
  const groups = new Map();
  for (const d of Object.values(DATA.dict)) {
    if ((d.chapter || 1) > chapter || d.kind === '인명') continue;
    const k = d.kind || '기타';
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(d);
  }
  const order = ['무속', '명리', '생활', '백과', '건강'];
  const rank = (k) => (order.includes(k) ? order.indexOf(k) : order.length);
  const keys = [...groups.keys()].sort((a, b) => rank(a) - rank(b));
  sec.innerHTML = keys.map((k) => `<h2>${esc(k)}</h2><ul>${groups.get(k).sort((a, b) => a.term.localeCompare(b.term, 'ko')).map((d) => `<li><a href="dict.html?q=${encodeURIComponent(d.term)}">${esc(d.term)}${d.hanja ? ` <small>${esc(d.hanja)}</small>` : ''}</a></li>`).join('')}</ul>`).join('');
  return sec;
}

if (q) {
  $('dict-h').textContent = `‘${q}’ 사전 검색`;
  const r = dictLookup(q, { chapter });
  let any = false;
  if (r.hanja) { out.append(hanjaTable(r)); any = true; }
  for (const d of r.terms) { out.append(dictItemEl(game, d, { data: DATA })); any = true; }
  if (r.byEum.length) { out.append(byEumEl(r.byEum, q)); any = true; }
  if (r.ganji) {
    out.append(ganjiWidget(game, r.ganji.mode === 'year' ? { year: r.ganji.year } : { ganji: r.ganji.ganji }));
    any = true;
  }
  if (!any) {
    const div = document.createElement('div');
    div.className = 'ns-empty';
    div.innerHTML = `<h2>‘${esc(q)}’${esc(game.josa(q, '은/는').slice(q.length))} 누리샘 사전에 없는 말이에요.</h2><p>맞춤법을 확인하거나, 한자라면 한 글자씩 넣어 보세요.</p>`;
    out.append(div);
  }
  const p = document.createElement('p');
  p.innerHTML = `<a class="ns-btn" href="${searchUrl(q)}">${ICON.search}웹에서 ‘${esc(q)}’ 찾기</a> <a class="ns-btn" href="dict.html">${ICON.book}사전 첫 화면</a>`;
  out.append(p);
} else {
  out.append(indexEl());
}

side.append(ganjiWidget(game, {}));
const tip = document.createElement('section');
tip.className = 'ns-card';
tip.innerHTML = `<h2>한자 찾기 도움말</h2><p>한자를 그대로 붙여 넣으면 한 글자씩 뜻과 음을 보여 드려요. 한글 한 글자(예: ‘연’)를 넣으면 그 음으로 읽는 한자를 모아 보여 줍니다.</p><p style="color:var(--ns-faint);font-size:13px">간지가 적힌 날짜는 ‘간지 ↔ 연도 바꾸기’로 해를 찾을 수 있어요. 음력 ↔ 양력은 준비 중입니다.</p>`;
side.append(tip);

game.hydrate(document.body);
