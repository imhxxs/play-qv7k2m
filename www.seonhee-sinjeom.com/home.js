// 선희당 홈: 배너 슬라이더, 실시간 상담 현황, 공지 미리보기, 인기 선생님, 후기, 상담 말풍선

import { start, siteState, updateSite, maskName, ASSET } from './site.js';
import { COUNSELORS, REVIEWS, LIVE, visibleNotices } from './data.js';
import { teacherCardHtml, wireCalls } from './teachers.js';

const game = start({ page: 'index', title: '선희당 — 선희보살 신점·사주·궁합 봐드립니다' });
const reduce = () => document.documentElement.classList.contains('md-reduce-motion');

// ── 배너 슬라이더 ─────────────────────────────────────────────
{
  const track = document.getElementById('hero-track');
  const slides = [...track.children];
  const dots = [...document.querySelectorAll('.sh-hero__dot')];
  let i = 0;
  let timer = null;
  let touched = false;
  const go = (n) => {
    i = (n + slides.length) % slides.length;
    track.style.transform = `translateX(${-100 * i}%)`;
    slides.forEach((s, k) => {
      s.setAttribute('aria-hidden', String(k !== i));
      s.querySelectorAll('a').forEach((a) => (k === i ? a.removeAttribute('tabindex') : a.setAttribute('tabindex', '-1')));
    });
    dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
  };
  const tick = () => { if (!touched && !reduce() && document.visibilityState === 'visible') go(i + 1); };
  const startTimer = () => { clearInterval(timer); timer = setInterval(tick, 6000); };
  document.querySelector('.sh-hero__ctrl').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    touched = true;
    if (b.dataset.go != null) go(Number(b.dataset.go));
    else go(i + Number(b.dataset.dir));
  });
  // 손가락으로 넘기기
  let x0 = null;
  track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 40) { touched = true; go(i + (dx < 0 ? 1 : -1)); }
  });
  go(0);
  startTimer();
}

// ── 실시간 상담 현황 ──────────────────────────────────────────
function renderLive() {
  const list = document.getElementById('live-list');
  const mine = (siteState(game).fortunes || []).slice(-2).reverse()
    .map((f) => [maskName(f.name), '혜원', '무료 신점 배정', 'on', '방금']);
  const rows = [...mine, ...LIVE].slice(0, 10);
  const li = rows.map(([who, t, what, st, when]) =>
    `<li><span><b>${game.esc(who)}</b> 님 · ${t} 선생님</span><em class="${st === 'done' ? 'is-done' : ''}">${what}</em><time>${when}</time></li>`).join('');
  // 끊김 없이 돌도록 두 번 이어 붙인다(화면 읽기 프로그램에는 한 벌만)
  list.innerHTML = li + li.replace(/<li>/g, '<li aria-hidden="true">');
  document.getElementById('live-count').textContent = String(COUNSELORS.filter((c) => c.status === 'on').length + 13);
}
renderLive();
game.on('change:' + 'site.seonhee', renderLive);

// ── 공지 미리보기 ─────────────────────────────────────────────
function renderNotices() {
  const ch = game.state().chapter;
  const items = visibleNotices(ch).slice(0, 5);
  document.getElementById('notice-list').innerHTML = items.map((n) => {
    const badge = n.hot ? '<span class="sh-badge sh-badge--hot">HOT</span>' : n.pin ? '<span class="sh-badge">공지</span>' : '';
    const edited = n.edited ? ` <span class="sh-edited">(수정됨 ${n.edited})</span>` : '';
    return `<li><a href="notice.html?id=${encodeURIComponent(n.id)}"><span class="sh-nlist__t">${badge}${n.title}${edited}</span><time>${n.date.slice(5)}</time></a></li>`;
  }).join('');
}
renderNotices();
game.on('chapter', renderNotices);

// ── 인기 선생님 ───────────────────────────────────────────────
{
  const grid = document.getElementById('best-grid');
  const best = [1, 2, 3, 7, 4, 22].map((no) => COUNSELORS.find((c) => c.no === no));
  grid.innerHTML = best.map(teacherCardHtml).join('');
  wireCalls(grid);
}

// ── 후기 ──────────────────────────────────────────────────────
document.getElementById('reviews').innerHTML = REVIEWS.map((r) => `
<li class="sh-review">
  <span class="sh-stars" aria-label="별점 ${r.stars}점">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
  <p>${r.text}</p>
  <footer><b>${r.t}</b> · ${r.who} · ${r.date}</footer>
</li>`).join('');

// ── 상담 말풍선(잠시 뒤 슬며시) ───────────────────────────────
// 깜짝 연출이 아니다: 소리 없음, 모션 줄이기면 그냥 나타난다. 한 번 닫으면 다시 안 뜬다.
{
  const BUBBLE_MS = 22000;
  const show = () => {
    if (siteState(game).bubbleClosed || document.querySelector('.sh-bubble')) return;
    const el = document.createElement('aside');
    el.className = 'sh-bubble';
    el.setAttribute('aria-label', '상담 안내');
    el.innerHTML = `
<img src="${ASSET}stock-a.svg" alt="" width="52" height="52">
<div>
  <p class="sh-bubble__who">혜원 선생님 <span class="sh-lamp sh-lamp--free">지금 상담 가능</span></p>
  <p class="sh-bubble__msg">손님, 요즘 마음에 걸린 일이 하나 있으시죠? 첫 신점은 무료예요^^</p>
</div>
<div class="sh-bubble__acts"><a class="sh-btn sh-btn--gold sh-btn--sm" href="fortune.html">무료 신점 신청</a><button type="button" class="sh-btn sh-btn--ghost sh-btn--sm" data-x>괜찮아요</button></div>`;
    el.querySelector('[data-x]').addEventListener('click', () => {
      el.remove();
      updateSite(game, (d) => { d.bubbleClosed = true; });
    });
    document.body.append(el);
  };
  let left = BUBBLE_MS;
  let last = Date.now();
  const iv = setInterval(() => {
    const now = Date.now();
    if (document.visibilityState === 'visible') left -= now - last;
    last = now;
    if (left <= 0) { clearInterval(iv); show(); }
  }, 1000);
}
