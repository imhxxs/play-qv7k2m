// 온라인 쌀점: 쌀 한 줌을 소반에 흩뿌리고, 떨어진 쌀알 수로 홀짝을 본다.
// - 상중 모드라 풀이는 언제나 '상문(喪門)'(소스 주석 참고, 이유는 나중 장에서 밝혀진다).
// - 쌀알이 소반 테두리에 걸치면 판정이 애매하므로 '틀렸다. 다시 집어라.'
// - 깜짝 연출(게임 전체에서 한 번): 이 페이지에서 연달아 네 번째 던질 때 쌀알이 모여 붉은 '喪門'이 되고
//   화면이 순간 어두워지며 붉게 번쩍(game.scare — 설정 '깜짝 연출'을 따른다). 그 뒤 '틀렸다. 다시 집어라.'
//   이 연출에는 단서가 없다(끈 사람도 놓치는 것이 없다).

import { start } from './wolhadang.js';

const game = start({ page: 'rice', title: '온라인 쌀점 — 월하당' });
const KEY = 'site.wolhadang';
const SCARE_ID = 'wolhadang-rice-4';

const canvas = document.getElementById('rice-canvas');
const ctx = canvas.getContext('2d');
const btn = document.getElementById('rice-throw');
const clearBtn = document.getElementById('rice-clear');
const resultEl = document.getElementById('rice-result');
const logEl = document.getElementById('rice-log');

let W = 640;
let H = 480;
let dpr = 1;
let trayCache = null;
let grains = [];
let glow = 0; // 喪門 뒤의 붉은 빛(0~1)
let throwsInRow = 0;
let busy = false;
let rimGrain = null;

const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const reduced = () => !!game.settings.reduceMotion || document.documentElement.classList.contains('md-reduce-motion');
const geo = () => {
  const R = Math.min(W, H) * 0.43;
  return { cx: W / 2, cy: H / 2 + H * 0.02, R };
};

// ── 그리기 ────────────────────────────────────────────────

function resize() {
  const r = canvas.getBoundingClientRect();
  const w = Math.max(240, Math.round(r.width || 640));
  const h = Math.round(w * 0.75);
  const nd = Math.min(2, window.devicePixelRatio || 1);
  if (w === W && nd === dpr && trayCache) return;
  dpr = nd;
  W = w;
  H = h;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  trayCache = null;
  draw();
}

function paintTray() {
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  // 한지 깔개
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#3a2516');
  bg.addColorStop(1, '#24160d');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#e9dcbc';
  g.globalAlpha = 0.92;
  g.fillRect(W * 0.04, H * 0.05, W * 0.92, H * 0.9);
  g.globalAlpha = 1;
  for (let i = 0; i < 260; i++) {
    g.strokeStyle = `rgba(140,110,60,${rand(0.03, 0.1)})`;
    g.lineWidth = rand(0.4, 1.1);
    const x = rand(W * 0.04, W * 0.96);
    const y = rand(H * 0.05, H * 0.95);
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + rand(-14, 14), y + rand(-4, 4), x + rand(-26, 26), y + rand(-6, 6));
    g.stroke();
  }
  const { cx, cy, R } = geo();
  // 그림자
  g.fillStyle = 'rgba(40,20,10,.35)';
  g.beginPath();
  g.ellipse(cx + R * 0.04, cy + R * 0.07, R * 1.04, R * 1.02, 0, 0, Math.PI * 2);
  g.fill();
  // 소반 테
  const rim = g.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.2, cx, cy, R * 1.05);
  rim.addColorStop(0, '#a8643a');
  rim.addColorStop(0.7, '#7a3c1c');
  rim.addColorStop(1, '#4a200c');
  g.fillStyle = rim;
  g.beginPath();
  g.arc(cx, cy, R * 1.04, 0, Math.PI * 2);
  g.fill();
  // 소반 바닥
  const top = g.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.05, cx, cy, R * 0.95);
  top.addColorStop(0, '#b97446');
  top.addColorStop(0.6, '#8f4c24');
  top.addColorStop(1, '#6a3214');
  g.fillStyle = top;
  g.beginPath();
  g.arc(cx, cy, R * 0.94, 0, Math.PI * 2);
  g.fill();
  // 나뭇결
  g.save();
  g.beginPath();
  g.arc(cx, cy, R * 0.94, 0, Math.PI * 2);
  g.clip();
  const gx = cx - R * 0.28;
  const gy = cy + R * 0.12;
  for (let i = 1; i <= 14; i++) {
    g.strokeStyle = `rgba(60,25,8,${0.05 + (i % 3) * 0.025})`;
    g.lineWidth = 0.8 + (i % 2) * 0.6;
    g.beginPath();
    g.ellipse(gx, gy, R * 0.11 * i, R * 0.07 * i, -0.18, 0, Math.PI * 2);
    g.stroke();
  }
  g.restore();
  // 테두리 턱(쌀알이 걸치는 곳)
  g.strokeStyle = 'rgba(255,220,170,.25)';
  g.lineWidth = Math.max(1, R * 0.012);
  g.beginPath();
  g.arc(cx, cy, R * 0.94, Math.PI * 1.05, Math.PI * 1.75);
  g.stroke();
  g.strokeStyle = 'rgba(30,10,0,.55)';
  g.lineWidth = Math.max(1.5, R * 0.02);
  g.beginPath();
  g.arc(cx, cy, R * 0.95, 0, Math.PI * 2);
  g.stroke();
  // 쌀 사발(장식)
  const bx = W * 0.88;
  const by = H * 0.16;
  const br = Math.min(W, H) * 0.075;
  g.fillStyle = '#5a3a24';
  g.beginPath();
  g.ellipse(bx, by + br * 0.35, br * 1.05, br * 0.75, 0, 0, Math.PI);
  g.fill();
  g.fillStyle = '#f6f0de';
  g.beginPath();
  g.ellipse(bx, by + br * 0.3, br, br * 0.42, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(180,160,120,.5)';
  for (let i = 0; i < 24; i++) {
    g.beginPath();
    g.ellipse(bx + rand(-br * 0.8, br * 0.8), by + br * 0.3 + rand(-br * 0.25, br * 0.25), 2, 1, rand(0, 3), 0, Math.PI * 2);
    g.fill();
  }
  return c;
}

function grainColor(red) {
  const r = Math.round(251 + (196 - 251) * red);
  const gg = Math.round(247 + (26 - 247) * red);
  const b = Math.round(234 + (28 - 234) * red);
  return `rgb(${r},${gg},${b})`;
}

function draw() {
  if (!trayCache) trayCache = paintTray();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(trayCache, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { cx, cy, R } = geo();
  if (glow > 0) {
    const gr = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.1);
    gr.addColorStop(0, `rgba(120,0,0,${0.55 * glow})`);
    gr.addColorStop(1, 'rgba(60,0,0,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }
  const rx = R * 0.028;
  const ry = R * 0.013;
  for (const g of grains) {
    if (g.alpha === 0) continue;
    const x = cx + g.x * R;
    const y = cy + g.y * R;
    ctx.globalAlpha = g.alpha ?? 1;
    // 그림자
    ctx.fillStyle = 'rgba(30,12,4,.35)';
    ctx.beginPath();
    ctx.ellipse(x + rx * 0.25, y + ry * 0.9 + (g.h || 0) * R * 0.5, rx, ry, g.a, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = grainColor(g.red || 0);
    ctx.beginPath();
    ctx.ellipse(x, y - (g.h || 0) * R, rx, ry, g.a, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.red > 0.5 ? 'rgba(80,0,0,.5)' : 'rgba(130,110,70,.45)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (rimGrain) {
    const x = cx + rimGrain.x * R;
    const y = cy + rimGrain.y * R;
    ctx.strokeStyle = '#ffe27a';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(x, y, R * 0.075, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function tween(dur, step) {
  return new Promise((resolve) => {
    if (dur <= 0) { step(1); draw(); resolve(); return; }
    const t0 = performance.now();
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      step(p, now - t0);
      draw();
      if (p < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}

const easeOut = (p) => 1 - Math.pow(1 - p, 3);
const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 喪門 글자 획(100×100 칸, 막내가 붓 순서대로 찍은 점) ─────────

const SANG = [
  [[14, 12], [86, 12]],
  [[50, 2], [50, 52]],
  [[16, 20], [16, 40]], [[16, 20], [40, 20], [40, 40]], [[16, 40], [40, 40]],
  [[60, 20], [60, 40]], [[60, 20], [84, 20], [84, 40]], [[60, 40], [84, 40]],
  [[6, 52], [94, 52]],
  [[30, 60], [30, 82], [44, 76]],
  [[56, 58], [46, 72], [22, 94]],
  [[52, 66], [70, 80], [92, 94]],
  [[66, 58], [76, 66]],
];
const MUN = [
  [[12, 6], [12, 96]], [[12, 6], [40, 6], [40, 40]], [[12, 22], [40, 22]], [[12, 40], [40, 40]],
  [[60, 6], [60, 40]], [[60, 6], [88, 6], [88, 90], [80, 96]], [[60, 22], [88, 22]], [[60, 40], [88, 40]],
];

function glyphPoints(count) {
  const chars = [[SANG, -0.98], [MUN, 0.06]];
  const segs = [];
  for (const [strokes, ox] of chars) {
    for (const st of strokes) {
      for (let i = 1; i < st.length; i++) {
        const [x1, y1] = st[i - 1];
        const [x2, y2] = st[i];
        const len = Math.hypot(x2 - x1, y2 - y1);
        segs.push({ x1, y1, x2, y2, len, ox });
      }
    }
  }
  const total = segs.reduce((s, g) => s + g.len, 0);
  const pts = [];
  for (const s of segs) {
    const n = Math.max(2, Math.round((s.len / total) * count));
    const ang = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
    for (let k = 0; k < n; k++) {
      const t = (k + Math.random() * 0.8) / n;
      const px = s.x1 + (s.x2 - s.x1) * t + rand(-2.4, 2.4);
      const py = s.y1 + (s.y2 - s.y1) * t + rand(-2.4, 2.4);
      // 100칸 → 소반 좌표(글자 한 칸 = 0.92)
      pts.push({ x: s.ox + (px / 100) * 0.92, y: -0.46 + (py / 100) * 0.92, a: ang + rand(-0.5, 0.5) });
    }
  }
  return pts;
}

// ── 던지기 ────────────────────────────────────────────────

function canScare() {
  return !!game.settings.scares && !game.has('scare:' + SCARE_ID) && document.visibilityState === 'visible';
}

function landingSpot() {
  const r = Math.sqrt(Math.random()) * 0.8;
  const t = rand(0, Math.PI * 2);
  return { x: Math.cos(t) * r, y: Math.sin(t) * r * 0.96 };
}

async function throwRice() {
  if (busy) return;
  busy = true;
  btn.disabled = true;
  clearBtn.disabled = true;
  throwsInRow++;
  const k = throwsInRow;
  const n = randInt(9, 31);
  const scareNow = k === 4 && canScare();
  const ambiguous = !scareNow && k > 1 && Math.random() < 0.25;
  rimGrain = null;
  glow = 0;
  resultEl.classList.remove('is-wrong');
  resultEl.innerHTML = '<p class="n">쌀알이 떨어지는 중…</p><p class="gwae">…</p>';

  const targets = Array.from({ length: n }, landingSpot);
  let rimIdx = -1;
  if (ambiguous) {
    rimIdx = randInt(0, n - 1);
    const t = rand(0, Math.PI * 2);
    targets[rimIdx] = { x: Math.cos(t) * 0.955, y: Math.sin(t) * 0.955 };
  }
  const hx = rand(-0.15, 0.15);
  grains = targets.map((t) => ({
    sx: hx + rand(-0.08, 0.08), sy: -1.25 + rand(-0.05, 0.05),
    x: hx, y: -1.25, tx: t.x, ty: t.y,
    a: rand(0, Math.PI), a0: rand(0, Math.PI), spin: rand(-6, 6),
    delay: rand(0, 220), dur: rand(520, 860), h: 0, red: 0, alpha: 1,
  }));
  game.sfx('rice');
  const total = reduced() ? 0 : 1120;
  await tween(total, (p, ms) => {
    for (const g of grains) {
      const q = total ? Math.max(0, Math.min(1, (ms - g.delay) / g.dur)) : 1;
      const e = easeOut(q);
      g.x = g.sx + (g.tx - g.sx) * e;
      g.y = g.sy + (g.ty - g.sy) * e;
      g.h = Math.sin(Math.PI * q) * 0.18 * (1 - q);
      g.a = g.a0 + g.spin * (1 - e);
      g.alpha = q > 0 || !total ? 1 : 0;
    }
  });
  for (const g of grains) { g.x = g.tx; g.y = g.ty; g.h = 0; }
  draw();

  game.flag('wolhadang:rice-tried');
  game.update(KEY, (d) => { d.riceThrows = (d.riceThrows || 0) + 1; });

  if (scareNow) {
    await gatherScare(n);
    showWrong('쌀알이 흩어져 버렸습니다.');
    log(k, `${n}알 → 다시 집어라`);
  } else if (ambiguous) {
    rimGrain = grains[rimIdx];
    draw();
    game.sfx('bell', { gain: 0.5 });
    showWrong('쌀알 한 알이 소반 테두리에 걸쳤습니다.');
    log(k, `${n}알 · 테두리에 걸침 → 다시 집어라`);
  } else {
    showResult(n);
    log(k, `${n}알 ${n % 2 ? '홀' : '짝'} → 상문`);
  }
  canvas.setAttribute('aria-label', `쌀점 소반. 쌀알 ${n}개가 흩어져 있다.`);
  busy = false;
  btn.disabled = false;
  clearBtn.disabled = false;
  btn.textContent = '다시 집어 던지기';
}

async function gatherScare(n) {
  const pts = glyphPoints(380);
  pts.sort(() => Math.random() - 0.5);
  // 소반 밖에서 쌀알이 굴러 들어와 모자란 수를 채운다
  while (grains.length < pts.length) {
    const t = rand(0, Math.PI * 2);
    const r = rand(1.5, 2.3);
    grains.push({ x: Math.cos(t) * r, y: Math.sin(t) * r, a: rand(0, Math.PI), h: 0, red: 0, alpha: 1 });
  }
  grains.forEach((g, i) => {
    const p = pts[i];
    g.sx = g.x; g.sy = g.y; g.tx = p.x; g.ty = p.y; g.sa = g.a; g.ta = p.a;
    g.delay = rand(0, 260);
  });
  const fast = reduced();
  const dur = fast ? 320 : 1500;
  await tween(dur, (p, ms) => {
    for (const g of grains) {
      const q = fast ? p : Math.max(0, Math.min(1, (ms - g.delay) / (dur - 260)));
      const e = easeInOut(q);
      g.x = g.sx + (g.tx - g.sx) * e;
      g.y = g.sy + (g.ty - g.sy) * e;
      g.a = g.sa + (g.ta - g.sa) * e;
      g.red = Math.min(1, Math.max(0, (q - 0.25) / 0.6));
    }
    glow = easeInOut(p);
  });
  await wait(fast ? 150 : 380);
  await game.scare({ id: SCARE_ID, kind: 'flash', text: '喪門', sound: 'sting', durationMs: 1100 });
  game.flag('wolhadang:rice-scare');
  game.sfx('bell');
  // 글자가 무너져 흩어진다
  for (const g of grains) { g.sx = g.x; g.sy = g.y; const s = landingSpot(); g.tx = s.x; g.ty = s.y; }
  await tween(fast ? 0 : 700, (p) => {
    const e = easeOut(p);
    for (const g of grains) {
      g.x = g.sx + (g.tx - g.sx) * e;
      g.y = g.sy + (g.ty - g.sy) * e;
      g.red = 1 - e;
      g.alpha = 1 - e * 0.85;
    }
    glow = 1 - e;
  });
  grains = grains.slice(0, n).map((g) => ({ ...g, alpha: 1, red: 0 }));
  glow = 0;
  draw();
}

// ── 풀이 ──────────────────────────────────────────────────

const SANGMUN = [
  '상(喪)의 기운이 문 앞에 머문다는 풀이입니다. 궂은 자리는 피하시고 몸가짐을 삼가세요.',
  '집안 어른 가운데 마음 쓰이는 분이 있다는 풀이입니다. 오늘은 안부 전화 한 통 드리세요.',
  '문 앞에 슬픔이 머물러 있다는 풀이입니다. 오늘은 일찍 들어가 쉬세요.',
];
let sangIdx = 0;

function showResult(n) {
  resultEl.classList.remove('is-wrong');
  const line = SANGMUN[sangIdx++ % SANGMUN.length];
  resultEl.innerHTML = `
    <p class="n">쌀알 <b>${n}</b>알 · <b>${n % 2 ? '홀(奇)' : '짝(偶)'}</b></p>
    <p class="gwae"><span class="flag" aria-hidden="true"></span>상문(喪門)<small>녹(綠)</small></p>
    <p class="p">손님, 상문이 나왔습니다. ${line}</p>`;
}

function showWrong(why) {
  resultEl.classList.add('is-wrong');
  resultEl.innerHTML = `
    <p class="n">${why}</p>
    <p class="gwae">틀렸다.<br>다시 집어라.</p>`;
}

function log(k, text) {
  const li = document.createElement('li');
  li.innerHTML = `<b>${k}번째</b> · `;
  li.append(text);
  logEl.prepend(li);
  while (logEl.children.length > 8) logEl.lastElementChild.remove();
}

btn.addEventListener('click', throwRice);
clearBtn.addEventListener('click', () => {
  if (busy) return;
  grains = [];
  rimGrain = null;
  glow = 0;
  draw();
});

if ('ResizeObserver' in window) new ResizeObserver(() => resize()).observe(canvas);
window.addEventListener('resize', resize);
resize();
