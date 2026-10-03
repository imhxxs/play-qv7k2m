// 오방기 점 체험
// - 말아 쥔 깃발 다섯 중 하나를 뽑으면 펼쳐지며 해설이 나온다.
// - 첫 뽑기 뒤에는 다섯 색 해설표가 페이지에 펼쳐지고, 다음에 와도 펼쳐져 있다(site.seonhee.flagsDrawn).
// - 제4장부터는 무엇을 뽑아도 녹기 + '추모 기간 상문 풀이 무료'(§4.5, 운영 대행 업체의 판촉 조작).

import { start, siteState, updateSite } from './site.js';
import { FLAGS, SANGMUN_PROMO } from './data.js';

const game = start({ page: 'flags', title: '오방기 점 체험 | 선희당' });
const rigged = () => game.state().chapter >= 4;

const ul = document.getElementById('flags');
const result = document.getElementById('result');
const tableSec = document.getElementById('table-sec');
const hint = document.getElementById('altar-hint');
const ORD = ['첫째', '둘째', '셋째', '넷째', '다섯째'];

const rolledSvg = (i) => `
<svg viewBox="0 0 60 170" aria-hidden="true">
  <rect x="27" y="10" width="6" height="158" rx="3" fill="#8a5a33"/>
  <rect x="28.4" y="10" width="1.6" height="158" fill="#c58f55" opacity=".6"/>
  <circle cx="30" cy="9" r="6.5" fill="#f1cf6b" stroke="#b8862a" stroke-width="1.2"/>
  <rect x="17" y="22" width="26" height="86" rx="12" fill="#f3ecdc" stroke="#cdbf9f" stroke-width="1.2"/>
  <path d="M19 30c7 3 15 3 22 0M19 104c7-3 15-3 22 0" stroke="#d9cdb2" stroke-width="1.2" fill="none"/>
  <g stroke="#b93b70" stroke-width="2.4" stroke-linecap="round">
    <path d="M17 44h26"/><path d="M17 66h26"/><path d="M17 88h26"/>
  </g>
  <path d="M30 108v18" stroke="#b93b70" stroke-width="1.6"/>
  <path d="M26 126c1 6 2 10 4 14 2-4 3-8 4-14z" fill="#d2588a"/>
  <text x="30" y="160" text-anchor="middle" font-size="11" fill="#e8d9f5" font-family="serif" opacity=".8">${i + 1}</text>
</svg>`;

const openSvg = (f) => `
<svg viewBox="0 0 180 170" aria-hidden="true">
  <rect x="14" y="10" width="6" height="158" rx="3" fill="#8a5a33"/>
  <circle cx="17" cy="9" r="6.5" fill="#f1cf6b" stroke="#b8862a" stroke-width="1.2"/>
  <g class="sh-cloth"><g class="sh-wave">
    <path d="M20 18C52 8 86 30 120 18C140 11 156 14 172 22L168 112C152 104 138 102 120 108C86 120 52 98 20 110Z" fill="${f.fill}" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/>
    <path d="M20 18C52 8 86 30 120 18" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>
    <text x="94" y="78" text-anchor="middle" font-size="42" fill="${f.ink}" opacity=".9" font-family="'Song Myung','Nanum Myeongjo',serif">${f.hanja}</text>
  </g></g>
</svg>`;

let drawing = false;

function renderRolled() {
  ul.innerHTML = FLAGS.map((_, i) => `<li><button type="button" class="sh-flag" data-i="${i}" aria-label="${ORD[i]} 깃발 뽑기">${rolledSvg(i)}</button></li>`).join('');
  hint.textContent = '깃발을 누르면 펼쳐집니다';
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderTable() {
  tableSec.hidden = false;
  tableSec.querySelector('tbody').innerHTML = FLAGS.map((f) => `
<tr>
  <td><span class="sh-chip"><i style="background:${f.fill}"></i>${f.name}<span>${f.hanja}</span></span></td>
  <td><b>${f.mean}</b></td>
  <td>${f.text}</td>
</tr>`).join('');
}

function renderPromo() {
  const slot = document.getElementById('promo-slot');
  slot.innerHTML = rigged()
    ? `<div class="sh-warn" style="margin-bottom:14px"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 22 20H2z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M12 9.5v5M12 17.2v.1" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><p><b>[이벤트]</b> 故 송만신 어머니 추모 기간 — 상문 풀이 무료! <a href="notice.html?id=sangmun-free">자세히 보기 ›</a></p></div>`
    : '';
}

function pick(i, btn) {
  if (drawing) return;
  drawing = true;
  const f = rigged() ? FLAGS.find((x) => x.key === 'nok') : shuffle(FLAGS)[i];
  const t = Date.now();
  for (const b of ul.querySelectorAll('.sh-flag')) {
    b.disabled = true;
    if (b !== btn) b.classList.add('is-dim');
  }
  btn.classList.add('is-picked');
  btn.innerHTML = openSvg(f);
  btn.setAttribute('aria-label', `${ORD[i]} 깃발 — ${f.name}(${f.hanja})`);
  hint.textContent = `${f.name}(${f.hanja})가 나왔습니다`;
  game.sfx('paper');

  const promo = rigged()
    ? `<div class="sh-sangmun" style="grid-column:1/-1"><p>${SANGMUN_PROMO}</p><small>추모 기간 이벤트 · 지금 무료 신점을 신청하시면 상문 풀이를 함께 봐 드립니다.</small></div>`
    : '';
  result.innerHTML = `
<article class="sh-result sh-reveal">
  <div class="sh-result__sw" style="background:${f.fill};color:${f.ink}">${f.hanja}</div>
  <div>
    <h2>${f.name} — ${f.mean}</h2>
    <p>${f.text}</p>
    <p class="sh-fine" style="margin:0">선희당의 해석입니다.</p>
  </div>
  ${promo}
  <div class="sh-actions">
    <button type="button" class="sh-btn sh-btn--ghost" data-again>다시 뽑기</button>
    <a class="sh-btn sh-btn--gold" href="fortune.html">${rigged() ? '상문 풀이 무료 신청' : '깊은 풀이는 무료 신점으로'}</a>
  </div>
</article>`;
  result.querySelector('[data-again]').addEventListener('click', () => {
    drawing = false;
    result.innerHTML = '';
    renderRolled();
    ul.querySelector('.sh-flag')?.focus();
  });

  const first = !siteState(game).flagsDrawn;
  updateSite(game, (d) => {
    d.flagsDrawn = d.flagsDrawn || t;
    d.flagDraws = (d.flagDraws || 0) + 1;
    d.lastFlag = f.key;
  });
  game.flag('seonhee:flags-drawn');
  if (first) {
    renderTable();
    game.toast('아래에 다섯 빛깔 해설표가 펼쳐졌어요.', { id: 'seonhee-flags-table', durationMs: 4000 });
  }
}

ul.addEventListener('click', (e) => {
  const b = e.target.closest('.sh-flag');
  if (b && !b.disabled) pick(Number(b.dataset.i), b);
});

renderPromo();
renderRolled();
if (siteState(game).flagsDrawn) renderTable();
game.on('chapter', renderPromo);
game.on('change:site.seonhee', () => { if (siteState(game).flagsDrawn && tableSec.hidden) renderTable(); });
