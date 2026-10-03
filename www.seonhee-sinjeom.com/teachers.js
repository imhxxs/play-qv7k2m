// 상담사 카드와 '상담하기' 창(홈·상담사 30인 공용)

import { COUNSELORS, STOCK } from './data.js';
import { ASSET } from './site.js';

const BADGE = {
  best: '<span class="sh-badge sh-badge--best">BEST</span>',
  hot: '<span class="sh-badge sh-badge--hot">HOT</span>',
  new: '<span class="sh-badge sh-badge--new">NEW</span>',
};
const LAMP = {
  on: '<span class="sh-lamp sh-lamp--on">상담 중</span>',
  free: '<span class="sh-lamp sh-lamp--free">상담 가능</span>',
  off: '<span class="sh-lamp">부재 중</span>',
};

const stars = (r) => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
export const photoOf = (t) => ASSET + STOCK[t.photo];

export function teacherCardHtml(t) {
  return `
<article class="sh-tcard" data-no="${t.no}" data-tags="${t.tags.join(' ')}" data-status="${t.status}">
  <div class="sh-tcard__img"><img src="${photoOf(t)}" alt="${t.name} ${t.title} 프로필 사진" width="240" height="240" loading="lazy"><span class="sh-tcard__badge">${t.badge ? BADGE[t.badge] : ''}</span></div>
  <div class="sh-tcard__body">
    <p class="sh-tcard__name">${t.name} <small>${t.title} · ${String(t.ext)}</small></p>
    <ul class="sh-tcard__tags">${t.tags.map((x) => `<li>${x}</li>`).join('')}</ul>
    <p class="sh-tcard__meta"><span class="sh-stars" aria-label="별점 ${t.rating}">${stars(t.rating)}</span> ${t.rating.toFixed(1)} · 후기 ${t.reviews.toLocaleString('ko-KR')}</p>
    <p class="sh-tcard__meta">경력 ${t.years}년 · ${LAMP[t.status]}</p>
    <button type="button" class="sh-btn sh-btn--sm sh-btn--block" data-call="${t.no}">상담하기</button>
  </div>
</article>`;
}

let dialog = null;

function ensureDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'sh-dialog';
  dialog.setAttribute('aria-labelledby', 'sh-dlg-h');
  dialog.innerHTML = `
<div class="sh-dialog__top"><img alt="" width="88" height="88"><div><h2 id="sh-dlg-h"></h2><p></p></div><button type="button" class="sh-dialog__x" aria-label="닫기">×</button></div>
<div class="sh-dialog__body">
  <p class="sh-dlg-intro"></p>
  <div class="sh-dialog__tel"><small>전화 연결 후 내선 번호를 눌러 주세요</small><b>060-XXXX-XXXX</b><small class="sh-dlg-ext"></small></div>
  <p class="sh-fine">30초당 1,300원(부가세 포함) · 만 19세 미만 이용 불가 · 상담 내용은 참고용이며 결과를 보장하지 않습니다.</p>
  <div class="sh-actions" style="margin-top:12px">
    <a class="sh-btn sh-btn--gold" href="fortune.html">무료 신점부터 받아 보기</a>
    <button type="button" class="sh-btn sh-btn--ghost" data-close>닫기</button>
  </div>
</div>`;
  document.body.append(dialog);
  const close = () => dialog.close();
  dialog.querySelector('.sh-dialog__x').addEventListener('click', close);
  dialog.querySelector('[data-close]').addEventListener('click', close);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  return dialog;
}

export function openTeacher(no) {
  const t = COUNSELORS.find((x) => x.no === Number(no));
  if (!t) return;
  const d = ensureDialog();
  d.querySelector('img').src = photoOf(t);
  d.querySelector('h2').textContent = `${t.name} ${t.title}`;
  d.querySelector('.sh-dialog__top p').textContent = `${t.tags.join(' · ')} · 경력 ${t.years}년`;
  d.querySelector('.sh-dlg-intro').textContent = `“${t.intro}”`;
  d.querySelector('.sh-dlg-ext').textContent = `${t.name} ${t.title} 내선 ${t.ext}`;
  if (typeof d.showModal === 'function') d.showModal();
  else d.setAttribute('open', '');
}

/** root 안의 [data-call] 버튼에 '상담하기' 창을 연결 */
export function wireCalls(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-call]');
    if (b) openTeacher(b.dataset.call);
  });
}
