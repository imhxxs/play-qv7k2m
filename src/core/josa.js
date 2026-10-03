// 한국어 조사 처리와 원고 템플릿 채우기.
//
// josa('민준', '아/야') → '민준아'   josa('지수', '이/가') → '지수가'
// josa('서울', '으로/로') → '서울로'  (ㄹ 받침 예외)
// fill('{이름아}. {호칭이} 기다려', profile) → '민준아. 언니가 기다려'
//
// 템플릿 토큰: {이름} {호칭} {아이디} {메일} 뒤에 조사를 붙인다.
//   {이름아} {이름이} {이름은} {이름을} {이름과} {이름으로} {이름이랑} {이름이나} {이름이에요} …
//   쌍의 어느 쪽을 써도 같다({이름이} = {이름가}).

const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JONG_RIEUL = 8;

// 숫자를 한국어로 읽을 때의 받침(영 일 이 삼 사 오 육 칠 팔 구)
const DIGIT_JONG = { 0: 21, 1: 8, 2: 0, 3: 16, 4: 0, 5: 0, 6: 1, 7: 8, 8: 8, 9: 0 };
// 영문 끝 글자의 대략적인 받침 추정(완벽하지 않다)
const LATIN_JONG = { b: 17, c: 1, d: 7, g: 1, k: 1, l: 8, m: 16, n: 4, p: 17, q: 1, t: 19 };

/** 마지막 글자의 받침 인덱스. 0 = 받침 없음, 8 = ㄹ, null = 판단 불가 */
export function finalConsonant(word) {
  const s = String(word ?? '').trim().replace(/[\s)\]}"'’”.,!?~…·]+$/u, '');
  if (!s) return null;
  const ch = s[s.length - 1];
  const code = ch.charCodeAt(0);
  if (code >= HANGUL_FIRST && code <= HANGUL_LAST) return (code - HANGUL_FIRST) % 28;
  if (ch >= '0' && ch <= '9') return DIGIT_JONG[ch];
  if (code >= 0x3131 && code <= 0x314e) return 1; // 낱자음(ㅋ, ㄱ…)은 받침 있는 것으로
  const lower = ch.toLowerCase();
  if (lower >= 'a' && lower <= 'z') return LATIN_JONG[lower] ?? 0;
  return null;
}

// [받침 있을 때, 받침 없을 때]
const PAIRS = [
  ['으로', '로'],
  ['이에요', '예요'],
  ['이랑', '랑'],
  ['이나', '나'],
  ['이여', '여'],
  ['이', '가'],
  ['은', '는'],
  ['을', '를'],
  ['과', '와'],
  ['아', '야'],
];

function findPair(p) {
  const key = String(p).replace(/[()\s]/g, '');
  for (const pair of PAIRS) {
    const [a, b] = pair;
    if (key === a || key === b || key === `${a}/${b}` || key === `${b}/${a}`) return pair;
  }
  return null;
}

/** 단어 + 알맞은 조사. pair는 '이/가', '이', '가' 어느 형태든 된다. */
export function josa(word, pair) {
  const w = String(word ?? '');
  const found = findPair(pair);
  if (!found) return w + pair;
  const [withB, noB] = found;
  const j = finalConsonant(w);
  if (j === null) {
    if (withB === '으로') return w + '(으)로';
    return `${w}${withB}(${noB})`;
  }
  if (withB === '으로') return w + (j === 0 || j === JONG_RIEUL ? '로' : '으로');
  return w + (j === 0 ? noB : withB);
}

export const DEFAULT_PROFILE = Object.freeze({ name: '동생', id: 'guest', honorific: '언니' });

const TOKEN = /\{(이름|호칭|아이디|메일)(으로|이에요|예요|이랑|이나|이여|이|가|은|는|을|를|과|와|아|야|로|랑|나|여)?\}/g;

/** 원고 템플릿의 {이름아} 같은 토큰을 프로필로 채운다. */
export function fill(text, profile) {
  const p = profile || DEFAULT_PROFILE;
  return String(text ?? '').replace(TOKEN, (_, what, particle) => {
    let word;
    if (what === '이름') word = p.name;
    else if (what === '호칭') word = p.honorific;
    else if (what === '아이디') word = p.id;
    else word = `${p.id}@nurisaem.kr`;
    return particle ? josa(word, particle) : word;
  });
}
