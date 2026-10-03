// 누리샘 첫 화면: 로고 · 둥근 검색창 · '지금 서월에서 많이 찾는 말' · 서월 날씨 · 소식
import { boot } from '../src/game.js';
import DATA from '../src/data/search/index.js';
import { trendingFor } from '../src/data/search/engine.js';
import { mountSearchBox, logoHtml, topLinksHtml, footerHtml, weatherCard, searchUrl } from './nurisaem.js';

const game = boot({ siteId: 'nurisaem', page: 'index', title: '누리샘' });
const $ = (id) => document.getElementById(id);

$('topnav').innerHTML = topLinksHtml(game);
$('logo').innerHTML = logoHtml({ big: true });
mountSearchBox(game, $('searchbox'), { big: true, autofocus: true });

const trend = trendingFor(game.chapter.id, DATA);
$('trend').innerHTML = trend
  .map((t, i) => `<li><a class="ns-chip" href="${searchUrl(t)}"><span class="ns-chip__n">${i + 1}</span>${game.esc(t)}</a></li>`)
  .join('');

$('weather-slot').replaceWith(weatherCard(game));

const LOCAL = ['f-festival', 'f-wildfire', 'f-library', 'f-market'];
$('local').innerHTML = LOCAL
  .map((id) => DATA.fillers.find((f) => f.id === id))
  .filter(Boolean)
  .map((f) => `<li><a href="cache.html?id=${encodeURIComponent(f.id)}"><span class="ns-news__tag">${f.source.includes('군') ? '서월군' : '이웃'}</span><span>${game.esc(f.title)}</span></a></li>`)
  .join('');

$('foot').outerHTML = footerHtml();
game.hydrate(document.body);
