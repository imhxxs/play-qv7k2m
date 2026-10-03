// 오늘의 사주 + 지난 상담 다시 보기
//
// 오늘의 사주: 생년월일(+태어난 시)로 네 기둥(간지)과 오행을 계산하고 '오늘의 총평'을 보여 준다.
//   총평 문장은 무료 신점 답장('혜원 선생님' 대본)과 토씨 하나 다르지 않다(O2 비교 재료, §4.5).
//   → 문장 원본은 누리메일 담당의 src/data/mail/templates.js FORTUNE_SCRIPT 하나만 쓴다.
// 지난 상담 다시 보기(O7): 이름 + 생년월일.
//   '서다은 / 1999.03.14'만 다은의 기록(E57)이 열린다. 플레이어가 무료 신점에 적은 이름·생일이면 자기 기록이 나온다.

import { start, siteState, updateSite, parseBirth, normName, scriptText } from './site.js';
import { DAEUN_LOOKUP, DAEUN_RECORD } from './data.js';
import { FORTUNE_SCRIPT } from '../src/data/mail/templates.js';

const game = start({ page: 'saju', title: '오늘의 사주 | 선희당' });
const esc = game.esc;
const SCRIPT = scriptText(FORTUNE_SCRIPT);

// ── 간지 계산 ─────────────────────────────────────────────────

const STEMS = [
  ['甲', '갑', '목'], ['乙', '을', '목'], ['丙', '병', '화'], ['丁', '정', '화'], ['戊', '무', '토'],
  ['己', '기', '토'], ['庚', '경', '금'], ['辛', '신', '금'], ['壬', '임', '수'], ['癸', '계', '수'],
];
const BRANCHES = [
  ['子', '자', '수', '쥐'], ['丑', '축', '토', '소'], ['寅', '인', '목', '호랑이'], ['卯', '묘', '목', '토끼'],
  ['辰', '진', '토', '용'], ['巳', '사', '화', '뱀'], ['午', '오', '화', '말'], ['未', '미', '토', '양'],
  ['申', '신', '금', '원숭이'], ['酉', '유', '금', '닭'], ['戌', '술', '토', '개'], ['亥', '해', '수', '돼지'],
];
const ELEM = {
  목: { color: '#2f8f4e', name: '목(木)' }, 화: { color: '#c8323a', name: '화(火)' }, 토: { color: '#c99a2e', name: '토(土)' },
  금: { color: '#9aa0ab', name: '금(金)' }, 수: { color: '#2f5fb3', name: '수(水)' },
};
const DAY_MASTER = [
  '곧게 뻗은 큰 나무의 기운. 한번 정한 길은 끝까지 가는 분입니다.',
  '덩굴과 꽃의 기운. 부드럽지만 끈질기게 제자리를 지키십니다.',
  '한낮의 해. 곁에 있는 사람까지 환하게 만드는 기운입니다.',
  '등잔불·촛불의 기운. 조용히 오래 타며 남의 길을 밝혀 줍니다.',
  '큰 산의 기운. 묵직하고 믿음직해 사람들이 기대어 옵니다.',
  '논밭의 흙. 무엇이든 품어 기르는 따뜻한 기운입니다.',
  '단단한 쇠와 바위. 옳고 그름이 분명하고 결단이 빠르십니다.',
  '보석과 바늘. 섬세하고 깔끔하며 눈썰미가 좋으십니다.',
  '큰 강과 바다. 생각이 깊고 품이 넓으십니다.',
  '이슬과 빗물. 조용히 스며 사람의 마음을 적시는 기운입니다.',
];
// 절입일(대략). 양력 m월 이 날부터 그달의 지지(1월=丑 … 12월=子)
const JEOL = [0, 6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];

const mod = (n, m) => ((n % m) + m) % m;

function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function pillars({ y, m, d }, hour) {
  const sajuYear = m < 2 || (m === 2 && d < JEOL[2]) ? y - 1 : y;
  const ys = mod(sajuYear - 4, 10);
  const yb = mod(sajuYear - 4, 12);
  const mb = d >= JEOL[m] ? m % 12 : mod(m - 1, 12);
  const ms = mod(ys * 2 + 2 + mod(mb - 2, 12), 10);
  const idx = mod(jdn(y, m, d) + 49, 60);
  const ds = idx % 10;
  const db = idx % 12;
  const out = { year: [ys, yb], month: [ms, mb], day: [ds, db], hour: null, sajuYear };
  if (hour !== '' && hour != null) {
    const hb = Number(hour);
    out.hour = [mod(ds * 2 + hb, 10), hb];
  }
  return out;
}

/** 문자열 → 0~1 고정 난수(시드) */
function seeded(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
}

// ── 오늘의 사주 ───────────────────────────────────────────────

const form = document.getElementById('saju-form');
const err = document.getElementById('s-err');
const out = document.getElementById('saju-result');
const lunarNote = document.getElementById('s-lunar-note');

const [gy, gm, gdd] = game.gameDate.split('-').map(Number);
const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
const todayLabel = `${gy}년 ${gm}월 ${gdd}일(${WEEK[new Date(gy, gm - 1, gdd).getDay()]})`;
document.getElementById('today-label').textContent = `${todayLabel} · 생년월일만 넣으면 끝!`;

for (const r of form.querySelectorAll('input[name="cal"]')) {
  r.addEventListener('change', () => { lunarNote.hidden = form.cal.value !== 'lunar'; });
}

const saved = siteState(game).saju;
if (saved?.birth) form.birth.value = saved.birth;
if (saved?.hour != null) form.hour.value = saved.hour;

const pillarHtml = (label, p) => {
  if (!p) return `<div class="sh-pillar is-unknown"><small>${label}</small><b>？？</b><span>모름</span></div>`;
  const [s, b] = p;
  return `<div class="sh-pillar"><small>${label}</small><b>${STEMS[s][0]}${BRANCHES[b][0]}</b><span>${STEMS[s][1]}${BRANCHES[b][1]}</span></div>`;
};

function renderSaju(birth, hour, lunar) {
  const P = pillars(birth, hour);
  const chars = [P.year, P.month, P.day, P.hour].filter(Boolean);
  const count = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const [s, b] of chars) { count[STEMS[s][2]]++; count[BRANCHES[b][2]]++; }
  const total = chars.length * 2;
  const rnd = seeded(`${birth.key}|${game.gameDate}|${hour}`);
  const score = 62 + Math.floor(rnd() * 35);
  const COLORS = ['보라', '금색', '연분홍', '하늘색', '초록', '흰색', '자주'];
  const DIRS = ['동쪽', '서쪽', '남쪽', '북쪽', '동남쪽', '서북쪽'];
  const ddi = BRANCHES[P.year[1]][3];
  const ys = STEMS[P.year[0]];
  const yb = BRANCHES[P.year[1]];

  out.innerHTML = `
<section class="sh-card sh-reveal sh-sec" aria-labelledby="res-h">
  <h2 class="sh-sec__h" id="res-h">${esc(birth.label)}생 손님의 오늘</h2>
  <p class="sh-hint">${P.sajuYear}년 ${ys[1]}${yb[1]}년(${ys[0]}${yb[0]}) · ${ddi}띠${lunar ? ' · (음력 날짜를 양력처럼 계산했습니다)' : ''}</p>
  <div class="sh-pillars">${pillarHtml('시주', P.hour)}${pillarHtml('일주', P.day)}${pillarHtml('월주', P.month)}${pillarHtml('년주', P.year)}</div>
  <p><b>일간 ${STEMS[P.day[0]][0]}(${STEMS[P.day[0]][1]}${STEMS[P.day[0]][2]})</b> — ${DAY_MASTER[P.day[0]]}</p>
  <ul class="sh-ohaeng" aria-label="오행 분포">
    ${Object.entries(count).map(([k, v]) => `<li><span>${ELEM[k].name}</span><span class="sh-bar"><i style="width:${Math.round((v / total) * 100)}%;background:${ELEM[k].color}"></i></span><span>${v}</span></li>`).join('')}
  </ul>
  <div class="sh-score" style="margin-top:14px"><span class="sh-score__l">${esc(todayLabel)} 오늘의 운세</span><b>${score}</b><span>점</span></div>
  <ul class="sh-lucky">
    <li>행운의 색<b>${COLORS[Math.floor(rnd() * COLORS.length)]}</b></li>
    <li>행운의 숫자<b>${1 + Math.floor(rnd() * 9)}</b></li>
    <li>좋은 방향<b>${DIRS[Math.floor(rnd() * DIRS.length)]}</b></li>
  </ul>
  <div class="sh-verdict" data-view="X-seonhee-saju">
    <h3>✦ 오늘의 총평</h3>
    <p id="saju-verdict">${esc(SCRIPT)}</p>
  </div>
  <p class="sh-fine">※ 오늘의 사주는 생년월일로 자동 계산되는 풀이입니다. 상담 내용은 참고용이며 결과를 보장하지 않습니다.</p>
  <div class="sh-actions">
    <md-collect card="X-seonhee-saju"></md-collect>
    <a class="sh-btn sh-btn--gold sh-btn--sm" href="fortune.html">더 깊은 풀이는 무료 신점으로</a>
  </div>
</section>`;
  game.hydrate(out);
  game.flag('seonhee:saju-seen');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const birth = parseBirth(form.birth.value);
  if (!birth) {
    err.textContent = '생년월일을 다시 확인해 주세요. 예) 1995.05.05';
    form.birth.focus();
    return;
  }
  err.textContent = '';
  const hour = form.hour.value;
  updateSite(game, (d) => { d.saju = { birth: birth.label, hour }; });
  renderSaju(birth, hour, form.cal.value === 'lunar');
  out.querySelector('section')?.scrollIntoView({ block: 'start', behavior: document.documentElement.classList.contains('md-reduce-motion') ? 'auto' : 'smooth' });
});

// ── 지난 상담 다시 보기 ───────────────────────────────────────

const hForm = document.getElementById('hist-form');
const hErr = document.getElementById('h-err');
const hOut = document.getElementById('hist-result');

function scriptBlock(teacher, script = SCRIPT) {
  return `<div class="sh-record__a"><p style="margin:0 0 4px"><b>${esc(teacher)} 선생님의 풀이</b></p><p style="margin:0 0 4px">${esc(script)}</p><p class="sh-hint" style="text-align:right">— ${esc(teacher)} 드림</p></div>`;
}

function renderDaeun() {
  const r = DAEUN_RECORD;
  const items = r.entries.map((e) => {
    if (e.kind === 'fortune') {
      return `
<article class="sh-record">
  <p class="sh-record__h"><span class="sh-record__tag">답변 완료</span><b>무료 신점</b><time>${e.at}</time><span>담당 ${e.teacher} 선생님</span></p>
  <p class="sh-record__q">${esc(e.concern)}</p>
  ${scriptBlock(e.teacher)}
</article>`;
    }
    return `
<article class="sh-record">
  <p class="sh-record__h"><b>상담 메모</b><time>${e.at}</time></p>
  <p class="sh-record__memo">${esc(e.text)}</p>
</article>`;
  }).join('');
  return `
<div class="sh-reveal" data-view="E57">
  <p class="sh-record__h"><b>${r.name} 님</b><span>${r.birthLabel}</span><span>상담 ${r.entries.length}건</span></p>
  ${items}
  <div class="sh-post__tools"><md-collect card="E57"></md-collect></div>
</div>`;
}

function renderMine(list) {
  const pending = new Set(game.mail.pending().map((p) => p.id));
  return `
<div class="sh-reveal">
  <p class="sh-record__h"><b>${esc(list[0].name)} 님</b><span>${esc(list[0].birthLabel)}</span><span>상담 ${list.length}건</span></p>
  ${list.slice().reverse().map((f) => {
    const wait = f.mailId && pending.has(f.mailId);
    const when = new Date(f.at);
    const at = `${game.gameDate.replace(/-/g, '.')} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;
    return `
<article class="sh-record">
  <p class="sh-record__h"><span class="sh-record__tag${wait ? ' is-wait' : ''}">${wait ? '선생님 배정 중' : '답변 완료'}</span><b>무료 신점</b><time>${at}</time><span>담당 혜원 선생님</span></p>
  <p class="sh-record__q">${esc(f.concern)}</p>
  ${wait ? '<p class="sh-hint">배정이 끝나면 풀이를 누리메일로 보내 드립니다.</p>' : scriptBlock('혜원')}
</article>`;
  }).join('')}
</div>`;
}

hForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = normName(hForm.person.value);
  const birth = parseBirth(hForm.birth.value);
  if (!name || !birth) {
    hErr.textContent = !name ? '이름을 적어 주세요.' : '생년월일을 다시 확인해 주세요. 예) 1995.05.05';
    (!name ? hForm.person : hForm.birth).focus();
    return;
  }
  hErr.textContent = '';
  const parts = [];
  if (name === DAEUN_LOOKUP.name && birth.key === DAEUN_LOOKUP.birth) {
    parts.push(renderDaeun());
    game.solve('O7');
  }
  const mine = (siteState(game).fortunes || []).filter((f) => normName(f.name) === name && f.birthKey === birth.key);
  if (mine.length) parts.push(renderMine(mine));
  hOut.innerHTML = parts.length
    ? parts.join('')
    : '<p class="sh-empty">조회된 상담 내역이 없습니다.<br>이름과 생년월일을 신청하실 때와 똑같이 적어 주세요.</p>';
  game.hydrate(hOut);
});

if (location.hash === '#history') document.getElementById('history').focus({ preventScroll: false });
