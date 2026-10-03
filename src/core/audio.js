// 효과음: 전부 Web Audio로 합성한다(외부 음원 파일 없음).
// 키: bell(방울) jing(징) rice(쌀알) ding(메일) paper(종이) drone(저음 앰비언트, 반복) sting(깜짝 연출)
//
// - 브라우저 자동재생 정책 때문에 탭마다 첫 클릭·키 입력 뒤에만 소리가 난다(그 전 호출은 조용히 무시).
// - 탭이 숨겨지면 오디오를 멈추고, 다시 보이면 이어 낸다.
// - 소리 끔·볼륨은 설정을 따른다. 모든 소리에는 화면 피드백을 함께 둔다(단서를 소리에만 두지 않는다).

let ctx = null;
let master = null;
let unlocked = false;
let settings = { sound: true, volume: 0.5 };
let noiseBuf = null;

export function initAudio(initialSettings) {
  if (initialSettings) settings = { ...settings, ...initialSettings };
  const unlock = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        ctx = new AC();
      } catch { return; }
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 6;
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(comp);
      comp.connect(ctx.destination);
      applyVolume(true);
    }
    if (ctx.state === 'suspended' && document.visibilityState === 'visible') ctx.resume().catch(() => {});
    unlocked = true;
  };
  for (const ev of ['pointerdown', 'keydown', 'touchend']) {
    window.addEventListener(ev, unlock, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (unlocked) ctx.resume().catch(() => {});
  });
}

export function setAudioSettings(s) {
  settings = { ...settings, ...s };
  applyVolume();
}

function applyVolume(immediate) {
  if (!ctx || !master) return;
  const v = settings.sound ? Math.max(0, Math.min(1, Number(settings.volume) || 0)) : 0;
  if (immediate) master.gain.value = v;
  else master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
}

export const audioReady = () => !!ctx && unlocked;

/** 효과음 재생. 반환: { stop(fadeSec) } 또는 null(소리를 낼 수 없을 때) */
export function sfx(key, opts = {}) {
  if (!ctx || !unlocked || !settings.sound) return null;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  const fn = SOUNDS[key];
  if (!fn) { console.warn(`[md] 알 수 없는 효과음: ${key}`); return null; }
  try {
    return fn(opts) || { stop() {} };
  } catch (e) {
    console.error('[md] 효과음 오류', e);
    return null;
  }
}

// ── 합성 도구 ───────────────────────────────────────────────

function osc(type, freq, t) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  return o;
}

function gain(v = 0) {
  const g = ctx.createGain();
  g.gain.value = v;
  return g;
}

function filter(type, freq, q = 0.7) {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

/** 짧은 타격형 엔벨로프 */
function env(g, t, attack, peak, decay) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function noise() {
  if (!noiseBuf) {
    const len = Math.floor(ctx.sampleRate * 2);
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  return s;
}

// ── 소리들 ──────────────────────────────────────────────────

const SOUNDS = {
  // 낮고 부드러운 메일 '띵'
  ding({ gain: lv = 1 } = {}) {
    const t = ctx.currentTime;
    for (const [f, p, dt] of [[660, 0.22, 0], [990, 0.07, 0], [1320, 0.035, 0.004]]) {
      const o = osc('sine', f, t);
      const g = gain();
      env(g, t + dt, 0.008, p * lv, 1.1);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 1.3);
    }
  },

  // 방울: 작은 방울 여러 개가 흔들리는 소리
  bell({ gain: lv = 1, strikes = 7 } = {}) {
    let t = ctx.currentTime;
    for (let i = 0; i < strikes; i++) {
      t += 0.035 + Math.random() * 0.07;
      const f0 = 2300 + Math.random() * 1400;
      const fade = 1 - i * 0.07;
      for (const [r, a] of [[1, 0.09], [2.76, 0.045], [5.4, 0.02]]) {
        const o = osc('sine', f0 * r * (1 + (Math.random() - 0.5) * 0.01), t);
        const g = gain();
        env(g, t, 0.002, a * lv * fade, 0.25 + Math.random() * 0.3);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + 0.75);
      }
      const n = noise();
      const g = gain();
      env(g, t, 0.001, 0.04 * lv * fade, 0.03);
      n.connect(filter('highpass', 6000)).connect(g).connect(master);
      n.start(t, Math.random());
      n.stop(t + 0.06);
    }
  },

  // 징: 낮게 울리며 맥놀이가 있는 긴 금속음
  jing({ gain: lv = 1, freq = 148 } = {}) {
    const t = ctx.currentTime;
    const dur = 6;
    const lp = filter('lowpass', 2400);
    lp.frequency.setValueAtTime(2400, t);
    lp.frequency.exponentialRampToValueAtTime(420, t + dur);
    const trem = gain(1);
    const lfo = osc('sine', 3.1, t);
    const lfoG = gain(0.16);
    lfo.connect(lfoG).connect(trem.gain);
    const out = gain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.55 * lv, t + 0.05);
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(trem).connect(out).connect(master);
    const partials = [[1, 1], [1.006, 0.6], [1.52, 0.42], [2.0, 0.3], [2.47, 0.2], [3.08, 0.11], [4.2, 0.05]];
    for (const [r, a] of partials) {
      const o = osc('sine', freq * r * 0.985, t);
      o.frequency.exponentialRampToValueAtTime(freq * r, t + 0.9);
      const pg = gain();
      pg.gain.setValueAtTime(a * 0.3, t);
      pg.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + (r - 1) * 0.8));
      o.connect(pg).connect(lp);
      o.start(t);
      o.stop(t + dur);
    }
    lfo.start(t);
    lfo.stop(t + dur);
    const n = noise();
    const ng = gain();
    env(ng, t, 0.003, 0.35 * lv, 0.12);
    n.connect(filter('lowpass', 320)).connect(ng).connect(master);
    n.start(t);
    n.stop(t + 0.2);
  },

  // 쌀알이 흩어지는 소리
  rice({ gain: lv = 1, grains = 34 } = {}) {
    const t0 = ctx.currentTime;
    for (let i = 0; i < grains; i++) {
      const t = t0 + Math.pow(Math.random(), 1.8) * 0.9;
      const n = noise();
      const g = gain();
      env(g, t, 0.001, (0.05 + Math.random() * 0.18) * lv, 0.006 + Math.random() * 0.02);
      n.connect(filter('bandpass', 2500 + Math.random() * 4500, 3)).connect(g).connect(master);
      n.start(t, Math.random() * 1.5);
      n.stop(t + 0.05);
    }
  },

  // 종이 넘기는 소리
  paper({ gain: lv = 1 } = {}) {
    const t = ctx.currentTime;
    const n = noise();
    const bp = filter('bandpass', 900, 0.9);
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(3800, t + 0.26);
    bp.frequency.exponentialRampToValueAtTime(1500, t + 0.45);
    const g = gain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * lv, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.12 * lv, t + 0.14);
    g.gain.exponentialRampToValueAtTime(0.28 * lv, t + 0.22);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    n.connect(filter('highpass', 300)).connect(bp).connect(g).connect(master);
    n.start(t, Math.random());
    n.stop(t + 0.55);
  },

  // 저음 앰비언트(반복). 반환한 handle.stop()으로 끈다.
  drone({ gain: lv = 1, fadeIn = 4 } = {}) {
    const t = ctx.currentTime;
    const out = gain(0.0001);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.16 * lv, t + fadeIn);
    out.connect(master);
    const lp = filter('lowpass', 190, 0.8);
    const lfo = osc('sine', 0.05, t);
    const lfoG = gain(70);
    lfo.connect(lfoG).connect(lp.frequency);
    lp.connect(out);
    const sources = [lfo];
    for (const [type, f, a] of [['sawtooth', 55, 0.5], ['sawtooth', 55.35, 0.5], ['triangle', 82.4, 0.35], ['sine', 41.2, 0.9]]) {
      const o = osc(type, f, t);
      const g = gain(a);
      o.connect(g).connect(lp);
      sources.push(o);
    }
    const wind = noise();
    wind.loop = true;
    const wg = gain(0.035);
    const wlfo = osc('sine', 0.11, t);
    const wlfoG = gain(0.025);
    wlfo.connect(wlfoG).connect(wg.gain);
    wind.connect(filter('bandpass', 480, 0.6)).connect(wg).connect(out);
    sources.push(wind, wlfo);
    for (const s of sources) s.start(t);
    let stopped = false;
    return {
      stop(fade = 2) {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        out.gain.cancelScheduledValues(now);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), now);
        out.gain.exponentialRampToValueAtTime(0.0001, now + fade);
        for (const s of sources) s.stop(now + fade + 0.1);
      },
    };
  },

  // 깜짝 연출: 낮은 충격음 + 날카로운 불협화음 + 잡음
  sting({ gain: lv = 1 } = {}) {
    const t = ctx.currentTime;
    const o = osc('sine', 110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.6);
    const g = gain();
    env(g, t, 0.004, 0.7 * lv, 0.9);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 1);

    const hp = filter('highpass', 700);
    const sg = gain();
    env(sg, t, 0.01, 0.15 * lv, 1.3);
    hp.connect(sg).connect(master);
    const vib = osc('sine', 7, t);
    const vibG = gain(18);
    vib.connect(vibG);
    for (const f of [1244, 1318, 1865, 2489]) {
      const so = osc('sawtooth', f, t);
      vibG.connect(so.frequency);
      so.frequency.exponentialRampToValueAtTime(f * 0.94, t + 1.2);
      so.connect(hp);
      so.start(t);
      so.stop(t + 1.4);
    }
    vib.start(t);
    vib.stop(t + 1.4);

    const n = noise();
    const ng = gain();
    env(ng, t, 0.002, 0.28 * lv, 0.25);
    n.connect(filter('highpass', 1800)).connect(ng).connect(master);
    n.start(t);
    n.stop(t + 0.35);
  },
};

export const SFX_KEYS = Object.keys(SOUNDS);
