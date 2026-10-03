// 진행 코드: 'MD1-' + base64url(UTF-8 JSON) + '-' + 체크섬(FNV-1a 8자리).
// 설정(settings)과 epoch은 넣지 않는다(기기마다 다를 수 있으므로).

import * as state from './state.js';

const VERSION = 1;

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64) {
  const s = b64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '==='.slice((s.length + 3) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function checksum(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function exportCode() {
  const data = state.dumpAll({ exclude: ['epoch', 'settings'] });
  const json = JSON.stringify({ v: VERSION, t: Date.now(), d: data });
  const body = toBase64Url(json);
  return `MD1-${body}-${checksum(body)}`;
}

/** 코드를 검사해 내용 객체를 돌려준다(쓰지는 않는다). 틀리면 Error */
export function parseCode(code) {
  const clean = String(code ?? '').replace(/\s+/g, '');
  const m = /^MD1-([A-Za-z0-9_-]+)-([0-9a-f]{8})$/.exec(clean);
  if (!m) throw new Error('진행 코드 형식이 맞지 않습니다. MD1-로 시작하는 코드를 통째로 붙여 넣어 주세요.');
  if (checksum(m[1]) !== m[2]) throw new Error('진행 코드가 중간에 잘렸거나 바뀌었습니다.');
  let obj;
  try { obj = JSON.parse(fromBase64Url(m[1])); } catch { throw new Error('진행 코드를 읽을 수 없습니다.'); }
  if (!obj || obj.v !== VERSION || typeof obj.d !== 'object') throw new Error('이 버전에서 읽을 수 없는 진행 코드입니다.');
  return obj.d;
}

/** 코드를 불러와 현재 진행을 바꾼다(새 epoch). */
export function importCode(code) {
  const data = parseCode(code);
  state.wipe({ keep: ['settings'] });
  delete data.settings;
  delete data.epoch;
  state.writeAll(data);
  return data;
}
