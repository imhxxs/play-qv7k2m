// 매칭용 문자열 정규화: NFC → 소문자 → 공백·문장부호·기호 제거.
// 메일 개념 매칭과 (원하면) 검색에서 같이 쓴다.

export function normalize(s) {
  return String(s ?? '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, '');
}

/** 개념(동의어 배열 또는 문자열 하나)이 정규화된 text에 들어 있는가 */
export function conceptHit(concept, normText) {
  const words = Array.isArray(concept) ? concept : [concept];
  return words.some((w) => {
    const n = normalize(w);
    return n.length > 0 && normText.includes(n);
  });
}

/** 메일 주소 정규화: '이름 <a@b.c>' → 'a@b.c', 소문자, 앞뒤 공백 제거 */
export function normalizeAddr(addr) {
  let s = String(addr ?? '').trim();
  const m = s.match(/<([^>]+)>/);
  if (m) s = m[1];
  return s.trim().toLowerCase();
}
