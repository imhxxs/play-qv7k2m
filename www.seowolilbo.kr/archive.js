// 서월일보 기사 아카이브(archive.html?q=&year=&sec=)
// 2020년 이후 기사만 검색된다. 2000~2019년 지면은 디지털화 작업 중(10월 3일 공개 예정, 제4장).
import { start, visibleArticles, itemHtml, esc, SECTIONS } from './ilbo.js';
import { ARCHIVE_YEARS, ARCHIVE_NOTICE, ARCHIVE_NOTICE_LONG } from './articles.js';

const params = new URLSearchParams(location.search);
const q = (params.get('q') || '').trim().slice(0, 40);
const yearRaw = params.get('year') || '';
const year = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;
const sec = SECTIONS.includes(params.get('sec')) ? params.get('sec') : '';

const game = start({ page: 'archive', title: q ? `‘${q}’ 검색 — 서월일보 아카이브` : '기사 아카이브 — 서월일보', section: '아카이브' });
const root = document.getElementById('sw-archive');

const { from, to } = ARCHIVE_YEARS.pending;
const pendingYear = year != null && year >= from && year <= to;
const tooOld = year != null && year < from;
const norm = (s) => String(s || '').normalize('NFC').toLowerCase().replace(/<[^>]+>/g, '').replace(/[\s.,·…“”‘’"'?!()[\]〈〉「」\-–—/]/g, '');

function search() {
  if (pendingYear || tooOld) return [];
  const nq = norm(q);
  return visibleArticles(game).filter((a) => {
    if (year && Number(a.date.slice(0, 4)) !== year) return false;
    if (sec && a.sec !== sec) return false;
    if (!nq) return true;
    return norm(`${a.title} ${a.sub || ''} ${a.body.join(' ')} ${a.by?.name || ''}`).includes(nq);
  });
}

const yearOpts = [
  `<option value="">전체(2020~2026)</option>`,
  ...ARCHIVE_YEARS.open.map((y) => `<option value="${y}"${y === year ? ' selected' : ''}>${y}년</option>`),
  `<optgroup label="2000~2019년 · 디지털화 작업 중">${Array.from({ length: to - from + 1 }, (_, i) => to - i).map((y) => `<option value="${y}"${y === year ? ' selected' : ''}>${y}년</option>`).join('')}</optgroup>`,
].join('');
const secOpts = [`<option value="">전체 섹션</option>`, ...SECTIONS.map((s) => `<option${s === sec ? ' selected' : ''}>${esc(s)}</option>`)].join('');

const chip = (y, label, cls = '') => {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (y) p.set('year', y);
  if (sec) p.set('sec', sec);
  const s = p.toString();
  const on = (y === '' && year == null) || String(year) === String(y);
  return `<li><a class="sw-chip ${cls}${on ? ' is-on' : ''}" href="archive.html${s ? '?' + s : ''}"${on ? ' aria-current="true"' : ''}>${label}</a></li>`;
};

const results = search();
let resultHtml;
if (pendingYear || tooOld) {
  resultHtml = `
<div class="sw-pending" role="status">
  <p class="sw-pending__icon" aria-hidden="true">
    <svg viewBox="0 0 48 48"><rect x="8" y="6" width="32" height="38" rx="2" fill="#efe6cf" stroke="#6a6355" stroke-width="2"/><path d="M14 14h20M14 20h20M14 26h14" stroke="#9b917c" stroke-width="2.4"/><circle cx="34" cy="34" r="9" fill="#8b1e1e"/><path d="M34 29v6l3 2" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>
  </p>
  <p class="sw-pending__h">${esc(ARCHIVE_NOTICE)}</p>
  <p>${esc(ARCHIVE_NOTICE_LONG)}</p>
  ${tooOld ? '<p class="sw-pending__s">2000년 이전 지면은 서월군립도서관 향토자료실에서 열람할 수 있습니다.</p>' : '<p class="sw-pending__s">옛 지면을 스캔하고 글자를 옮겨 적는 중입니다. 조금만 기다려 주세요.</p>'}
</div>`;
} else if (!results.length) {
  resultHtml = `
<div class="sw-noresult">
  <p class="sw-noresult__h">${q ? `‘${esc(q)}’에 대한 검색 결과가 없습니다.` : '조건에 맞는 기사가 없습니다.'}</p>
  <p>${esc(ARCHIVE_NOTICE_LONG)}</p>
  <p class="sw-noresult__s">띄어쓰기를 바꾸거나 다른 낱말로 찾아보세요.</p>
</div>`;
} else {
  resultHtml = `<p class="sw-count">${year ? `${year}년 ` : ''}${sec ? esc(sec) + ' ' : ''}${q ? `‘${esc(q)}’ ` : ''}기사 <b>${results.length}</b>건</p>
<ul class="sw-list sw-list--archive">${results.map((a) => itemHtml(a, { photo: true, leadMax: 100 })).join('')}</ul>`;
}

root.innerHTML = `
<section class="sw-archive" aria-labelledby="h-arc">
  <p class="sw-crumb"><a href="index.html">홈</a> › 아카이브</p>
  <h1 class="sw-sec__h sw-sec__h--big" id="h-arc">기사 아카이브</h1>
  <p class="sw-strip"><b>안내</b> ${esc(ARCHIVE_NOTICE_LONG)}</p>
  <form class="sw-arcform" action="archive.html" method="get" role="search">
    <div class="sw-field sw-field--q">
      <label for="arc-q">검색어</label>
      <input id="arc-q" name="q" type="search" value="${esc(q)}" placeholder="제목·본문에서 찾기" autocomplete="off" enterkeyhint="search">
    </div>
    <div class="sw-field">
      <label for="arc-year">연도</label>
      <select id="arc-year" name="year">${yearOpts}</select>
    </div>
    <div class="sw-field">
      <label for="arc-sec">섹션</label>
      <select id="arc-sec" name="sec">${secOpts}</select>
    </div>
    <button class="sw-btn" type="submit">검색</button>
  </form>
  <ul class="sw-chips" aria-label="연도 바로 가기">
    ${chip('', '전체')}
    ${ARCHIVE_YEARS.open.map((y) => chip(y, String(y))).join('')}
    ${chip(to, '2000~2019', 'sw-chip--pending')}
  </ul>
  <div class="sw-results" id="arc-results">${resultHtml}</div>
</section>`;
game.hydrate(root);
