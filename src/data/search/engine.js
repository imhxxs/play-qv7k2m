// 누리샘 검색 엔진 — 순수 함수만(DOM 없음). Node 테스트에서 바로 import 한다.
//
// 처리 순서(기획서 §7.1, 빌드 없는 런타임 매칭으로 구현)
//   1) NFC → 소문자 → 시각 정규화(23시 19분 → 2319) → 한자를 한글 음으로(범용 표 + 두음법칙)
//   2) 공백·문장부호 제거(compact)
//   3) 모든 동의어를 compact 문자열에 부분 일치로 찾고, '덮은 글자 수가 가장 많고 조각이 가장 적은'
//      겹치지 않는 조합을 고른다(구간 DP). 조사·군말은 남은 조각에서 무시한다.
//   4) 매칭이 없으면 자모 편집거리 1 이하(3음절 이상)로 '혹시 ○○을(를) 찾으세요?'
//   5) 게이트: 장(chapter)과 '있는 사이트·페이지'로 거른다. 아직 없는 사이트의 결과는 빠진다(색인되지 않음).
//   6) 그래도 없으면 검색어를 시드로 고정한 필러 결과.
//
// 주 함수
//   search(q, { chapter, sites })        → 결과 묶음(웹·뉴스·이미지·사전·특수 카드·필러)
//   autocomplete(input, { chapter, history }) → 자동완성 문자열 목록(최대 6)
//   dictLookup(q, { chapter })           → 사전 페이지용 조회(용어·한자 음훈·간지)
//   imageSearch(cardId, { chapter })     → '이 이미지로 검색'
//   compact / toHangul / jamo / jamoDistance / yearToGanji / ganjiToYears / parseGanji

import { josa } from '../../core/josa.js';
import { fakeAddress } from '../../core/sites.js';
import { SITES as DEFAULT_SITES } from '../sites.js';
import { HANJA, isHanja, hanjaInfo, hanjaByEum } from './hanja.js';
import DATA from './index.js';

// ── 한글 도우미 ───────────────────────────────────────────────

const SBASE = 0xac00;
const SLAST = 0xd7a3;
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';

const isSyllable = (ch) => {
  const c = ch.charCodeAt(0);
  return c >= SBASE && c <= SLAST;
};

/** 음절 → [초, 중, 종(0=없음)] 인덱스 */
function split(ch) {
  const c = ch.charCodeAt(0) - SBASE;
  return [Math.floor(c / 588), Math.floor((c % 588) / 28), c % 28];
}
const join = (cho, jung, jong) => String.fromCharCode(SBASE + cho * 588 + jung * 28 + jong);

/** 낱말 첫머리 두음법칙: 리→이, 류→유, 로→노, 녀→여 … */
export function dueum(syl) {
  if (!syl || !isSyllable(syl)) return syl;
  const [cho, jung, jong] = split(syl);
  const IY = new Set([2, 6, 7, 12, 17, 20]); // ㅑ ㅕ ㅖ ㅛ ㅠ ㅣ
  if (cho === 5) return join(IY.has(jung) ? 11 : 2, jung, jong); // ㄹ → ㅇ 또는 ㄴ
  if (cho === 2 && IY.has(jung)) return join(11, jung, jong); // ㄴ → ㅇ
  return syl;
}

/** 한자를 한글 음으로. 낱말 첫머리(앞이 한자·한글이 아닌 곳)에는 두음법칙을 적용한다. */
export function toHangul(s) {
  const chars = [...String(s ?? '').normalize('NFC')];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!isHanja(ch)) { out += ch; continue; }
    const info = HANJA.get(ch);
    if (!info) { out += ch; continue; }
    const prev = i > 0 ? chars[i - 1] : '';
    const initial = !prev || !(isHanja(prev) || isSyllable(prev));
    out += initial ? dueum(info.eum) : info.eum;
  }
  return out;
}

/** 검색용 압축 문자열: NFC → 소문자 → 시각 정규화 → 한자 음 → 공백·문장부호 제거 */
export function compact(s) {
  let t = String(s ?? '').normalize('NFC').toLowerCase();
  t = t.replace(/(\d{1,2})\s*시\s*(\d{1,2})\s*분/g, (_, h, m) => h.padStart(2, '0') + m.padStart(2, '0'));
  t = toHangul(t);
  return t.replace(/[\s\p{P}\p{S}]+/gu, '');
}

/** 자모 배열(음절은 초·중·종으로 쪼갠다. 그 밖의 글자는 그대로) */
export function jamo(s) {
  const out = [];
  for (const ch of String(s ?? '')) {
    if (isSyllable(ch)) {
      const [a, b, c] = split(ch);
      out.push(CHO[a], JUNG[b]);
      if (c) out.push(JONG[c]);
    } else out.push(ch);
  }
  return out;
}

/** 자모 단위 편집거리(max를 넘으면 max+1을 돌려 빨리 끝낸다) */
export function jamoDistance(a, b, max = 3) {
  const x = Array.isArray(a) ? a : jamo(a);
  const y = Array.isArray(b) ? b : jamo(b);
  if (Math.abs(x.length - y.length) > max) return max + 1;
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= y.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
      cur.push(v);
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[y.length];
}

const syllables = (s) => [...String(s ?? '')].length;

// ── 간지(干支) ────────────────────────────────────────────────

export const STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const STEMS_H = [...'甲乙丙丁戊己庚辛壬癸'];
export const BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const BRANCHES_H = [...'子丑寅卯辰巳午未申酉戌亥'];
export const ANIMALS = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
const STEM_COLOR = ['푸른', '푸른', '붉은', '붉은', '누런', '누런', '흰', '흰', '검은', '검은'];

const mod = (n, m) => ((n % m) + m) % m;

/** 연도 → 간지 { year, hangul:'기미', hanja:'己未', animal:'양', color:'누런', stem, branch } */
export function yearToGanji(year) {
  const y = Number(year);
  if (!Number.isInteger(y)) return null;
  const s = mod(y - 4, 10);
  const b = mod(y - 4, 12);
  return { year: y, stem: s, branch: b, hangul: STEMS[s] + BRANCHES[b], hanja: STEMS_H[s] + BRANCHES_H[b], animal: ANIMALS[b], color: STEM_COLOR[s] };
}

/** '기미', '己未', '기미년', '己未年' → { stem, branch } (짝이 맞지 않으면 null) */
export function parseGanji(s) {
  const t = String(s ?? '').normalize('NFC').replace(/[\s년年생]+$/u, '').trim();
  const chars = [...t];
  if (chars.length !== 2) return null;
  let st = STEMS_H.indexOf(chars[0]);
  if (st < 0) st = STEMS.indexOf(chars[0]);
  let br = BRANCHES_H.indexOf(chars[1]);
  if (br < 0) br = BRANCHES.indexOf(chars[1]);
  if (st < 0 || br < 0) return null;
  if ((st - br) % 2 !== 0) return null; // 육십갑자에 없는 짝
  return { stem: st, branch: br, hangul: STEMS[st] + BRANCHES[br], hanja: STEMS_H[st] + BRANCHES_H[br] };
}

/** 간지 → 그 간지인 연도들(기본 1900~2060) */
export function ganjiToYears(s, { from = 1900, to = 2060 } = {}) {
  const g = typeof s === 'object' && s ? s : parseGanji(s);
  if (!g) return [];
  const out = [];
  for (let y = from; y <= to; y++) {
    if (mod(y - 4, 10) === g.stem && mod(y - 4, 12) === g.branch) out.push(y);
  }
  return out;
}

// ── 데이터 준비(엔트리·동의어 컴파일, 데이터 객체마다 한 번) ─────────────

const compiled = new WeakMap();

function prepare(data) {
  if (compiled.has(data)) return compiled.get(data);
  const entries = [];
  const covered = new Set(); // 명시 엔트리가 이미 쓰는 동의어(compact)
  data.entries.forEach((e, i) => {
    entries.push({ ...e, order: i });
    for (const w of [e.headword, ...(e.synonyms || [])]) covered.add(compact(w));
  });
  // 사전 항목의 표제어·별칭 중 아직 어느 엔트리에도 없는 말은 '사전만 나오는' 엔트리로 자동 등록
  let n = entries.length;
  for (const d of Object.values(data.dict)) {
    if (d.search === false) continue;
    const words = [d.term, ...(d.aliases || [])].filter((w) => !covered.has(compact(w)));
    if (!words.length) continue;
    words.forEach((w) => covered.add(compact(w)));
    entries.push({
      id: 'dict:' + d.id,
      headword: d.term,
      synonyms: words,
      dict: [d.id],
      chapter: d.chapter || 1,
      auto: true,
      order: n++,
    });
  }
  const syns = [];
  for (const e of entries) {
    const words = new Set([e.headword, ...(e.synonyms || []), ...(e.typos || [])]);
    for (const w of words) {
      const c = compact(w);
      if (c) syns.push({ c, e, j: jamo(c), len: syllables(c), typo: (e.typos || []).includes(w) });
    }
  }
  const out = { entries, syns };
  compiled.set(data, out);
  return out;
}

const activeFor = (chapter) => (x) => (x.chapter || 1) <= chapter;

// 남은 조각에서 무시하는 말(조사·군말)
const STOP = [
  '은', '는', '이', '가', '을', '를', '의', '에', '에서', '에게', '께', '께서', '와', '과', '랑', '이랑', '하고', '도', '만', '로', '으로',
  '부터', '까지', '이란', '란', '이야', '야', '요', '좀', '뜻', '의미', '검색', '찾기', '정보', '관련', '사이트', '홈페이지', '홈피', '홈',
  '기사', '뉴스', '사진', '이미지', '글', '알려줘', '알려주세요', '뭐야', '뭔가요', '뭐예요', '무엇', '어디', '누구', '위치', '주소', '설명',
  '사전', '은요', '는요', '이요', '이에요', '예요', '입니다', '인가요', '나요', '가요', '해줘', '보기', '바로가기', '공식', '공지', '소식',
];
const STOP_SET = new Set(STOP.map((w) => compact(w)));
const MAX_STOP = Math.max(...[...STOP_SET].map((w) => w.length));

/** 문자열이 무시하는 말들로만 이루어졌는가(분절 DP) */
function ignorable(seg) {
  const n = seg.length;
  const ok = Array(n + 1).fill(false);
  ok[0] = true;
  for (let i = 1; i <= n; i++) {
    for (let k = 1; k <= Math.min(MAX_STOP, i); k++) {
      if (ok[i - k] && STOP_SET.has(seg.slice(i - k, i))) { ok[i] = true; break; }
    }
  }
  return ok[n];
}

/** 끝에 붙은 조사 하나를 뗀다(편집거리 제안용) */
function stripParticle(q) {
  for (const p of ['에서', '으로', '이랑', '에게', '은', '는', '이', '가', '을', '를', '의', '에', '와', '과', '로', '도']) {
    if (q.length > p.length + 1 && q.endsWith(p)) return q.slice(0, -p.length);
  }
  return q;
}

/** 겹치지 않는 매칭 조합 중 덮은 글자 수 최대 → 조각 수 최소 */
function bestCover(Q, syns) {
  const L = Q.length;
  const byEnd = Array.from({ length: L + 1 }, () => []);
  const seen = new Set();
  for (const s of syns) {
    if (s.typo) continue;
    let i = Q.indexOf(s.c);
    while (i >= 0) {
      const key = i + ':' + s.c.length;
      if (!seen.has(key)) { // 같은 구간은 엔트리 순서가 앞선 것 하나만
        seen.add(key);
        byEnd[i + s.c.length].push({ start: i, end: i + s.c.length, e: s.e });
      } else {
        const prev = byEnd[i + s.c.length].find((x) => x.start === i);
        if (prev && s.e.order < prev.e.order) prev.e = s.e;
      }
      i = Q.indexOf(s.c, i + 1);
    }
  }
  const best = Array(L + 1);
  best[0] = { cov: 0, cnt: 0, from: -1, iv: null };
  for (let p = 1; p <= L; p++) {
    let cur = { cov: best[p - 1].cov, cnt: best[p - 1].cnt, from: p - 1, iv: null };
    for (const iv of byEnd[p]) {
      const b = best[iv.start];
      const cand = { cov: b.cov + (iv.end - iv.start), cnt: b.cnt + 1, from: iv.start, iv };
      if (cand.cov > cur.cov || (cand.cov === cur.cov && cand.cnt < cur.cnt)) cur = cand;
    }
    best[p] = cur;
  }
  const picks = [];
  for (let p = L; p > 0;) {
    const b = best[p];
    if (b.iv) picks.push(b.iv);
    p = b.from;
  }
  return picks.reverse();
}

function fnv(s) {
  let h = 0x811c9dc5;
  for (const ch of String(s)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 검색어 시드로 고정된 필러 n개(같은 검색어 → 같은 필러) */
export function pickFillers(q, n = 6, data = DATA) {
  const pool = data.fillers.filter((f) => f.pool !== false);
  const r = rng(fnv(compact(q) || q || 'nurisaem'));
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map((i) => fillerCard(pool[i]));
}

// ── 결과 카드 ─────────────────────────────────────────────────

function resolveLink(r, data) {
  if (r.link) {
    const t = data.links[r.link];
    if (!t) return null;
    return { site: t.site, page: t.page || 'index', query: t.query || '' };
  }
  if (r.site) return { site: r.site, page: r.page || 'index', query: r.query || '' };
  return null;
}

function siteOk(sites, site, page) {
  const s = sites[site];
  return !!s && (!page || s.pages.includes(page));
}

function displayAddress(site, page, query) {
  const q = query ? '?' + String(query).replace(/^\?/, '') : '';
  return fakeAddress(site, page, q) || '';
}

function fillerCard(f) {
  return {
    key: 'cache:' + f.id,
    type: 'filler',
    kind: f.kind || 'web',
    site: 'nurisaem',
    page: 'cache',
    query: 'id=' + f.id,
    cache: f.id,
    title: f.title,
    url: f.url,
    source: f.source,
    snippet: f.snippet,
    date: f.date,
  };
}

function buildCard(r, data, sites) {
  if (r.type === 'snippet' || r.type === 'map' || r.type === 'weather' || r.type === 'ganji' || r.type === 'savedinfo') {
    return { key: 'special:' + (r.id || r.type), ...r };
  }
  if (r.filler) {
    const f = data.fillers.find((x) => x.id === r.filler);
    return f ? fillerCard(f) : null;
  }
  const t = resolveLink(r, data);
  if (!t || !siteOk(sites, t.site, t.page)) return null; // 아직 없는 사이트·페이지 = 색인되지 않음
  if (r.cache && !data.cache[r.cache]) return null;
  return {
    key: `${t.site}/${t.page}?${t.query}`,
    type: 'link',
    kind: r.kind || (r.press ? 'news' : 'web'),
    site: t.site,
    page: t.page,
    query: t.query,
    title: r.title,
    url: displayAddress(t.site, t.page, t.query),
    source: r.source || sites[t.site]?.name || '',
    press: r.press || '',
    snippet: r.snippet || '',
    date: r.date || '',
    cache: r.cache || null,
  };
}

// ── search ────────────────────────────────────────────────────

/**
 * 검색.
 * 반환 {
 *   q, compact, chapter,
 *   matched: [{ id, headword }]   매칭된 표제어(순서대로)
 *   partial: { shown: '월하당', left } | null   매칭되지 않은 말이 남았을 때('○○에 대한 결과만 표시합니다')
 *   suggestion: { text, particle, label } | null '혹시 ○○을(를) 찾으세요?'(label에 조사까지 붙어 있다)
 *   band: boolean                           서월일보 아카이브 공지 띠
 *   all      웹 탭(통합) 결과 카드 순서대로 — 뉴스 포함 / web 뉴스 아닌 것만 / news 뉴스만
 *   images, dict, specials(weather·map·ganji·snippet·savedinfo), fillers(매칭 없을 때)
 *   related(함께 찾는 말), solve(풀리는 퍼즐), scares(깜짝 연출), marks(굵게 칠할 말)
 * }
 */
export function search(q, { chapter = 1, sites = DEFAULT_SITES, data = DATA } = {}) {
  const raw = String(q ?? '').trim();
  const Q = compact(raw);
  const { entries, syns } = prepare(data);
  const active = activeFor(chapter);
  const liveSyns = syns.filter((s) => active(s.e));
  const res = {
    q: raw, compact: Q, chapter,
    matched: [], partial: null, suggestion: null, band: false,
    web: [], news: [], images: [], dict: [], specials: [], fillers: [], related: [], solve: [], scares: [], all: [], marks: [],
  };
  if (!Q) return res;

  // 1) 다중 매칭
  const picks = bestCover(Q, liveSyns);
  const covered = Array(Q.length).fill(false);
  for (const p of picks) for (let i = p.start; i < p.end; i++) covered[i] = true;
  const leftovers = [];
  let seg = '';
  let segStart = 0;
  for (let i = 0; i <= Q.length; i++) {
    if (i < Q.length && !covered[i]) {
      if (!seg) segStart = i;
      seg += Q[i];
    } else if (seg) {
      leftovers.push({ text: seg, start: segStart });
      seg = '';
    }
  }
  const realLeft = leftovers.filter((l) => !ignorable(l.text));

  // 매칭된 엔트리(위치 순, 중복 제거)
  const matchedEntries = [];
  for (const p of picks) if (!matchedEntries.includes(p.e)) matchedEntries.push(p.e);

  // 2) 동적 간지·연도 감지(예: '병오년', '1979년 간지')
  const ganji = detectGanji(Q);
  if (ganji) res.specials.push({ key: 'special:ganji', type: 'ganji', ...ganji });

  // 3) 결과 모으기
  const seen = new Set();
  const push = (list, card) => {
    if (!card || seen.has(card.key)) return;
    seen.add(card.key);
    list.push(card);
  };
  for (const e of matchedEntries) {
    res.matched.push({ id: e.id, headword: e.headword });
    for (const r of e.results || []) {
      const c = buildCard(r, data, sites);
      if (!c || (r.chapter || 1) > chapter) continue;
      if (c.key.startsWith('special:')) {
        if (!res.specials.some((s) => s.type === c.type && (c.type !== 'snippet' || s.id === c.id))) res.specials.push(c);
        continue;
      }
      push(c.kind === 'news' ? res.news : res.web, c);
    }
    for (const id of e.images || []) {
      if (res.images.some((x) => x.id === id)) continue;
      const img = imageCard(id, { chapter, sites, data });
      if (img) res.images.push(img);
    }
    for (const d of e.dict || []) {
      const item = data.dict[d];
      if (item && (item.chapter || 1) <= chapter && !res.dict.some((x) => x.id === d)) res.dict.push(item);
    }
    if (e.solve) res.solve.push(...[].concat(e.solve));
    if (e.scare) res.scares.push(e.scare);
    for (const rq of e.related || []) if (!res.related.includes(rq) && compact(rq) !== Q) res.related.push(rq);
    if (e.band) res.band = true;
  }
  res.related = res.related.slice(0, 6);
  // 결과 글에서 굵게 칠할 말(매칭된 표제어·동의어 중 한글 두 글자 이상, 긴 것부터)
  const marks = new Set();
  for (const e of matchedEntries) {
    for (const w of [e.headword, ...(e.synonyms || [])]) {
      const t = String(w).trim();
      if (/^[가-힣0-9 ]{2,}$/.test(t)) marks.add(t);
    }
  }
  res.marks = [...marks].sort((a, b) => b.length - a.length);
  // 간지 카드: 검색어 안의 연도·간지로 미리 채운다(예: '을유년' → 乙酉)
  for (const sp of res.specials) {
    if (sp.type === 'ganji' && !sp.mode) Object.assign(sp, findGanjiIn(Q) || { mode: 'year', year: null });
  }
  // 뉴스는 웹 목록에도 순서대로 끼워 둔다(웹 탭 = 통합)
  res.all = [];
  for (const e of matchedEntries) {
    for (const r of e.results || []) {
      const c = buildCard(r, data, sites);
      if (!c || c.key.startsWith('special:') || (r.chapter || 1) > chapter) continue;
      if (!res.all.some((x) => x.key === c.key)) res.all.push(c);
    }
  }

  // 4) 서월 띠(막힌 결과가 있는지 드러나지 않도록 '서월'이 든 모든 검색에도)
  if (chapter < 4 && (Q.includes('서월') || res.band)) res.band = true;
  else if (chapter >= 4) res.band = false;

  // 5) 남은 말 / 오타 제안
  if (matchedEntries.length && realLeft.length) {
    res.partial = { shown: matchedEntries.map((e) => e.headword).join(', '), left: realLeft.map((l) => l.text) };
  }
  if (!matchedEntries.length) {
    const sug = fuzzy(Q, liveSyns);
    if (sug) res.suggestion = suggestionOf(sug.e.headword);
  } else if (realLeft.length) {
    // 검색어 전체가 한 낱말의 오타인 경우(예: '선희담' → '선희'만 맞고 '담'이 남음)
    const whole = fuzzy(Q, liveSyns);
    if (whole) {
      res.suggestion = suggestionOf(whole.e.headword);
    } else {
      // 여러 낱말 중 하나가 오타인 경우: 남은 조각을 하나씩 대 본다
      const parts = picks.map((p) => ({ start: p.start, text: p.e.headword }));
      let fixed = false;
      for (const l of realLeft) {
        const sug = fuzzy(l.text, liveSyns);
        if (sug) { parts.push({ start: l.start, text: sug.e.headword }); fixed = true; }
      }
      if (fixed) {
        const text = parts.sort((a, b) => a.start - b.start).map((p) => p.text).filter((t, i, a) => a.indexOf(t) === i).join(' ');
        res.suggestion = suggestionOf(text);
      }
    }
  }

  // 6) 아무것도 없으면 필러(검색어 시드 고정)
  const nothing = !res.all.length && !res.dict.length && !res.specials.length && !res.images.length;
  if (nothing) res.fillers = pickFillers(Q, 6, data);
  res.solve = [...new Set(res.solve)];
  return res;
}

function suggestionOf(text) {
  const withJosa = josa(text, '을/를');
  return { text, particle: withJosa.slice(text.length), label: `혹시 ${withJosa} 찾으세요?` };
}

function fuzzy(Q, syns) {
  if (syllables(Q) < 3) return null;
  const tries = [...new Set([Q, stripParticle(Q)])].filter((t) => syllables(t) >= 3 || t === Q);
  let best = null;
  for (const t of tries) {
    const tj = jamo(t);
    for (const s of syns) {
      if (s.len < 2 || Math.abs(s.len - syllables(t)) > 1) continue;
      const d = jamoDistance(tj, s.j, 1);
      if (d === 0 && !s.typo) continue; // 정확히 같으면 이미 매칭됐어야 한다
      if (d <= 1 && (!best || d < best.d || (d === best.d && s.e.order < best.e.order))) best = { d, e: s.e };
    }
  }
  return best;
}

/** 검색어 안에서 연도(4자리) 또는 간지 두 글자를 찾는다 */
export function findGanjiIn(Q) {
  const ym = Q.match(/(1[89]\d\d|20\d\d)/);
  if (ym) return { mode: 'year', year: Number(ym[1]) };
  const chars = [...Q];
  for (let i = 0; i + 1 < chars.length; i++) {
    const pair = chars[i] + chars[i + 1];
    const g = parseGanji(pair);
    if (!g) continue;
    if (chars.length === 2 || chars[i + 2] === '년' || pair === '을유' || pair === '기미') return { mode: 'ganji', ganji: g.hangul };
  }
  return null;
}

function detectGanji(Q) {
  const ym = Q.match(/^(1[89]\d\d|20\d\d)(년|년생)?(간지|띠|육십갑자|은무슨해|는무슨해)?$/);
  if (ym) return { mode: 'year', year: Number(ym[1]) };
  const gm = Q.match(/^(.{2})(년|년생)?(간지|띠)?$/u);
  if (gm && (gm[2] || gm[3])) {
    const g = parseGanji(gm[1]);
    if (g) return { mode: 'ganji', ganji: g.hangul };
  }
  return null;
}

// ── 자동완성 ──────────────────────────────────────────────────

/** 접두어가 맞는 표제어·추천어 최대 limit개(게이트로 거른다). 오타·독초 관련 등 noSuggest는 빼고. */
export function autocomplete(input, { chapter = 1, data = DATA, limit = 6 } = {}) {
  const q = compact(input);
  if (!q) return [];
  const qj = jamo(q).join('');
  const { entries } = prepare(data);
  const out = [];
  const seen = new Set();
  for (const e of entries) {
    if (!activeFor(chapter)(e) || e.noSuggest) continue;
    if (e.suggestMin && syllables(q) < e.suggestMin) continue;
    const words = [e.headword, ...(e.suggest || []), ...(e.synonyms || []).filter((w) => /^[가-힣 ]+$/.test(w))];
    for (const w of words) {
      const c = compact(w);
      if (!c || seen.has(c)) continue;
      let score = -1;
      if (c === q) score = 0;
      else if (c.startsWith(q)) score = 1;
      else if (jamo(c).join('').startsWith(qj)) score = 2;
      if (score < 0) continue;
      seen.add(c);
      out.push({ w, score, primary: w === e.headword ? 0 : (e.suggest || []).includes(w) ? 1 : 2, len: c.length, order: e.order });
    }
  }
  out.sort((a, b) => a.score - b.score || a.primary - b.primary || a.order - b.order || a.len - b.len);
  return out.slice(0, limit).map((x) => x.w);
}

// ── 사전 ──────────────────────────────────────────────────────

/**
 * 사전 페이지 조회.
 * 반환 { q, terms: [사전 항목], hanja: [{ ch, hun, eum }] | null, byEum: [...], ganji: {...} | null, unknownHanja: [] }
 */
export function dictLookup(q, { chapter = 1, data = DATA } = {}) {
  const raw = String(q ?? '').trim().normalize('NFC');
  const Q = compact(raw);
  const out = { q: raw, terms: [], hanja: null, byEum: [], ganji: null, unknownHanja: [] };
  if (!Q) return out;
  const items = Object.values(data.dict).filter((d) => (d.chapter || 1) <= chapter);
  // 용어: 표제어·별칭이 정확히 같거나, 검색어 안에 들어 있으면
  const exact = [];
  const inside = [];
  for (const d of items) {
    const keys = [d.term, ...(d.aliases || []), d.hanja || ''].map(compact).filter(Boolean);
    if (keys.includes(Q)) exact.push(d);
    else if (keys.some((k) => k.length >= 2 && Q.includes(k))) inside.push(d);
  }
  out.terms = [...exact, ...inside];
  // 한자 음훈
  const hanChars = [...raw].filter(isHanja);
  if (hanChars.length) {
    out.hanja = hanChars.map((ch) => {
      const info = hanjaInfo(ch);
      if (!info) out.unknownHanja.push(ch);
      return { ch, hun: info?.hun || '', eum: info?.eum || '' };
    });
    out.reading = toHangul(hanChars.join(''));
  }
  // 한 음절이면 같은 음의 한자 목록
  if (syllables(Q) === 1 && isSyllable(Q)) {
    const variants = [];
    const [cho, jung, jong] = split(Q);
    if (cho === 11) variants.push(join(5, jung, jong), join(2, jung, jong)); // 이 → 리, 니
    if (cho === 2) variants.push(join(5, jung, jong)); // 노 → 로
    out.byEum = hanjaByEum(Q, variants);
  }
  // 간지·연도
  const g = parseGanji(raw.replace(/\s+/g, ''));
  const ym = Q.match(/^(1[89]\d\d|20\d\d)(년|년생)?$/);
  if (g) out.ganji = { mode: 'ganji', ganji: g.hangul };
  else if (ym) out.ganji = { mode: 'year', year: Number(ym[1]) };
  return out;
}

// ── 이미지로 검색 ─────────────────────────────────────────────

/** 이미지 결과 하나를 링크까지 풀어서(없는 사이트·장이면 null) */
export function imageCard(id, { chapter = 1, sites = DEFAULT_SITES, data = DATA } = {}) {
  const img = data.images[id];
  if (!img || (img.chapter || 1) > chapter) return null;
  const t = img.filler ? { site: 'nurisaem', page: 'cache', query: 'id=' + img.filler } : resolveLink(img, data);
  if (!t || !siteOk(sites, t.site, t.page)) return null;
  const url = img.filler ? (data.fillers.find((f) => f.id === img.filler)?.url || '') : displayAddress(t.site, t.page, t.query);
  return { ...img, site: t.site, page: t.page, query: t.query, url };
}

/** 수첩 카드 이미지로 검색. 반환 { found, dict: [...], images: [...] } */
export function imageSearch(cardId, { chapter = 1, sites = DEFAULT_SITES, data = DATA } = {}) {
  const map = data.imageQuery[cardId];
  const out = { found: false, dict: [], images: [], fillers: [] };
  if (map && (map.chapter || 1) <= chapter) {
    for (const d of map.dict || []) if (data.dict[d]) out.dict.push(data.dict[d]);
    for (const id of map.images || []) {
      const img = imageCard(id, { chapter, sites, data });
      if (img) out.images.push(img);
    }
    out.found = !!(out.dict.length || out.images.length);
  }
  return out;
}

/** 지금 장의 '지금 서월에서 많이 찾는 말' */
export function trendingFor(chapter = 1, data = DATA) {
  const keys = Object.keys(data.trending).map(Number).filter((k) => k <= chapter).sort((a, b) => b - a);
  return keys.length ? data.trending[keys[0]] : [];
}

export { hanjaInfo, isHanja };
