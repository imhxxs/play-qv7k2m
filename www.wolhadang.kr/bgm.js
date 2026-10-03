// 월하당 BGM '대금 산조' — Web Audio로 합성한 대금풍 선율(외부 음원 없음).
// 계면조(미·솔·라·시·레) 위에서 아주 느리게, 길게 끄는 소리에 늦게 걸리는 농현(떨림)과
// 끝을 아래로 꺾는 소리, 숨소리, 청(갈대막) 울림을 섞는다. 단순하고 쓸쓸하게.
//
// - 버튼을 눌러야 재생된다(자동 재생 없음). 탭이 숨으면 멈췄다가 다시 보이면 잇는다.
// - 게임 설정의 소리·볼륨을 따른다.

const BEAT = 0.62; // 진양조처럼 느리게(초)

// 음 이름 → 주파수
const N = {
  D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, B4: 493.88,
  D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
};

// 악구: [음, 박, 꾸밈]  꾸밈: v=농현, b=끝을 꺾어 내림, s=아래에서 밀어 올림, f=사라지듯
const PHRASES = [
  [['A4', 1.2, 's'], ['B4', 0.8], ['E5', 3.2, 'v'], ['D5', 0.7], ['B4', 1.6, 'b'], ['A4', 4.6, 'vf']],
  [['E4', 1.0], ['G4', 1.0], ['A4', 3.0, 'v'], ['G4', 0.6], ['E4', 0.6], ['D4', 1.8, 'b'], ['E4', 5.0, 'vf']],
  [['B4', 0.8, 's'], ['D5', 0.8], ['E5', 1.4], ['G5', 3.0, 'vs'], ['E5', 1.2], ['D5', 0.8], ['E5', 1.0], ['B4', 2.2, 'b'], ['A4', 5.2, 'vf']],
  [['A4', 2.2, 'v'], ['B4', 0.7], ['A4', 0.7], ['G4', 1.4, 'b'], ['E4', 3.0, 'v'], ['G4', 0.8], ['A4', 4.8, 'vf']],
  [['E5', 2.4, 'vs'], ['D5', 0.6], ['B4', 0.6], ['D5', 2.0, 'v'], ['B4', 1.0, 'b'], ['A4', 1.0], ['E4', 5.6, 'vf']],
];
const ORDER = [0, 1, 2, 3, 0, 4, 1, 3, 2, 4];

export function createBgm(game) {
  let ac = null;
  let master = null;
  let bus = null;
  let noiseBuf = null;
  let playing = false;
  let timer = null;
  let nextAt = 0;
  let step = 0;
  const live = new Set();

  const targetGain = () => {
    const s = game.settings;
    if (!s.sound) return 0;
    return 0.42 * Math.max(0, Math.min(1, Number(s.volume ?? 0.5)));
  };

  function ensure() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ac = new AC(); } catch { ac = null; return false; }
    master = ac.createGain();
    master.gain.value = 0;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master.connect(comp).connect(ac.destination);

    // 방 울림(짧은 잔향을 직접 만든다)
    const conv = ac.createConvolver();
    conv.buffer = impulse(3.2, 2.4);
    const wet = ac.createGain();
    wet.gain.value = 0.55;
    const dry = ac.createGain();
    dry.gain.value = 0.8;
    bus = ac.createGain();
    bus.connect(dry).connect(master);
    bus.connect(conv).connect(wet).connect(master);

    const len = Math.floor(ac.sampleRate * 2);
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    document.addEventListener('visibilitychange', () => {
      if (!ac) return;
      if (document.hidden) ac.suspend().catch(() => {});
      else if (playing) ac.resume().catch(() => {});
    });
    return true;
  }

  function impulse(sec, decay) {
    const rate = ac.sampleRate;
    const len = Math.floor(rate * sec);
    const buf = ac.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * 0.6;
    }
    return buf;
  }

  // 대금 한 음
  function note(freq, t, dur, orn = '') {
    const end = t + dur;
    const out = ac.createGain();
    const peak = 0.32;
    const att = Math.min(0.35, dur * 0.3);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(peak * 0.7, t + att);
    // 가운데서 한 번 부풀었다가(산조의 밀고 당김) 끝으로 잦아든다
    out.gain.linearRampToValueAtTime(peak, t + dur * 0.55);
    const relStart = orn.includes('f') ? t + dur * 0.5 : end - 0.35;
    out.gain.setValueAtTime(peak * (orn.includes('f') ? 0.95 : 0.85), Math.max(relStart, t + att + 0.01));
    out.gain.exponentialRampToValueAtTime(0.0001, end + 0.25);
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.Q.value = 0.4;
    out.connect(lp).connect(bus);

    // 음높이 움직임(cent): 밀어 올림, 끝 꺾기
    const det = ac.createConstantSource();
    det.offset.setValueAtTime(orn.includes('s') ? -180 : 0, t);
    if (orn.includes('s')) det.offset.linearRampToValueAtTime(0, t + Math.min(0.45, dur * 0.3));
    if (orn.includes('b')) {
      det.offset.setValueAtTime(0, t + dur * 0.62);
      det.offset.linearRampToValueAtTime(-160, end);
    }
    // 농현: 음이 한참 지난 뒤에야 떨림이 커진다
    const lfo = ac.createOscillator();
    lfo.frequency.value = 4.6 + Math.random() * 0.8;
    const lfoG = ac.createGain();
    lfoG.gain.setValueAtTime(0, t);
    if (orn.includes('v')) {
      lfoG.gain.setValueAtTime(0, t + dur * 0.35);
      lfoG.gain.linearRampToValueAtTime(34, t + dur * 0.8);
    } else {
      lfoG.gain.linearRampToValueAtTime(6, end);
    }
    lfo.connect(lfoG);

    const parts = [[1, 1], [2, 0.2], [3, 0.08], [4, 0.025]];
    const srcs = [det, lfo];
    for (const [r, a] of parts) {
      const o = ac.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq * r;
      det.connect(o.detune);
      lfoG.connect(o.detune);
      const g = ac.createGain();
      g.gain.value = a;
      o.connect(g).connect(out);
      srcs.push(o);
    }
    // 청 울림: 톱니파를 좁게 걸러 살짝만
    const buzz = ac.createOscillator();
    buzz.type = 'sawtooth';
    buzz.frequency.value = freq;
    det.connect(buzz.detune);
    lfoG.connect(buzz.detune);
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2300;
    bp.Q.value = 5;
    const bg = ac.createGain();
    bg.gain.value = 0.05;
    buzz.connect(bp).connect(bg).connect(out);
    srcs.push(buzz);
    // 숨소리
    const n = ac.createBufferSource();
    n.buffer = noiseBuf;
    n.loop = true;
    const nb = ac.createBiquadFilter();
    nb.type = 'bandpass';
    nb.frequency.value = freq * 2;
    nb.Q.value = 1.4;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.06, t + 0.5);
    ng.gain.setValueAtTime(0.06, Math.max(t + 0.5, end - 0.3));
    ng.gain.exponentialRampToValueAtTime(0.0001, end + 0.2);
    n.connect(nb).connect(ng).connect(out);
    srcs.push(n);

    for (const s of srcs) {
      s.start(t, s === n ? Math.random() : undefined);
      s.stop(end + 0.4);
      live.add(s);
      s.onended = () => live.delete(s);
    }
  }

  function schedulePhrase() {
    if (!playing || !ac) return;
    if (ac.state !== 'running') {
      // 탭이 숨었거나 아직 풀리지 않았다 — 잠시 뒤 다시 본다
      timer = setTimeout(schedulePhrase, 800);
      return;
    }
    const now = ac.currentTime;
    let t = Math.max(now + 0.12, nextAt);
    const ph = PHRASES[ORDER[step % ORDER.length]];
    step++;
    for (const [name, beats, orn] of ph) {
      const dur = beats * BEAT * (0.94 + Math.random() * 0.12);
      note(N[name], t, dur, orn || '');
      t += dur * 0.97;
    }
    const rest = 2.4 + Math.random() * 1.6;
    nextAt = t + rest;
    const wait = Math.max(0.3, nextAt - ac.currentTime - 1.2);
    timer = setTimeout(schedulePhrase, wait * 1000);
  }

  function play() {
    if (!ensure()) {
      game.toast('이 브라우저에서는 소리를 낼 수 없어요.', { kind: 'warn' });
      return;
    }
    if (!game.settings.sound) game.toast('수첩 › 설정에서 소리가 꺼져 있어요. 켜면 대금 소리가 들립니다.', { id: 'wh-bgm-muted' });
    playing = true;
    ac.resume().catch(() => {});
    master.gain.cancelScheduledValues(ac.currentTime);
    master.gain.setTargetAtTime(targetGain(), ac.currentTime, 0.6);
    nextAt = ac.currentTime + 0.25;
    clearTimeout(timer);
    schedulePhrase();
  }

  function stop() {
    playing = false;
    clearTimeout(timer);
    if (!ac) return;
    const now = ac.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0, now, 0.35);
    setTimeout(() => {
      if (playing) return;
      for (const s of live) { try { s.stop(); } catch { /* 이미 끝남 */ } }
      live.clear();
    }, 1800);
  }

  function refreshVolume() {
    if (!ac || !playing) return;
    master.gain.setTargetAtTime(targetGain(), ac.currentTime, 0.3);
  }

  return {
    play,
    stop,
    refreshVolume,
    get playing() { return playing; },
  };
}
