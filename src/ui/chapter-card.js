// 장 전환 카드. 끝난 장의 종료 문구 → 다음 장 제목·날짜·D-n(제작 중이면 안내).

import { h } from './dom.js';
import { lockScroll } from './chrome.js';

/**
 * opts: { from: 장 정의, to: 장 정의|null, reduceMotion, onCopyCode }
 * 반환: 닫히면 resolve 되는 Promise
 */
export function showChapterCard(layer, { from, to, reduceMotion, onCopyCode }) {
  return new Promise((resolve) => {
    const textEl = h('p', { class: 'md-ccard__text', id: 'md-ccard-t' });
    const line = from.endCard?.text || '';
    if (reduceMotion) textEl.textContent = line;
    else {
      [...line].forEach((ch, i) => {
        textEl.append(h('span', { class: 'md-ccard__ch', style: { animationDelay: `${0.35 + i * 0.07}s` } }, ch));
      });
    }

    const next = h('div', { class: 'md-ccard__next' });
    if (to) {
      next.append(
        h('p', { class: 'md-ccard__nexthead' }, `제${to.id}장 ${to.title}`),
        h('p', { class: 'md-ccard__nextdate' }, `${to.dateLabel} · D-${to.dday}`),
      );
      if (to.comingSoon) {
        next.append(
          h('p', { class: 'md-ccard__soon' }, to.comingSoonText || '제작 중입니다'),
          h('p', { class: 'md-ccard__note' }, '지금까지의 진행은 이 브라우저에 저장되어 있습니다. 다음 장이 열리면 그대로 이어서 할 수 있어요. 다른 기기에서 이어 하려면 진행 코드를 복사해 두세요.'),
        );
      }
    }
    const closeBtn = h('button', { class: 'md-btn md-btn--primary', type: 'button' }, to?.comingSoon ? '닫기' : '계속');
    const actions = h('div', { class: 'md-ccard__actions' });
    if (to?.comingSoon && onCopyCode) {
      const copy = h('button', { class: 'md-btn', type: 'button' }, '진행 코드 복사');
      copy.addEventListener('click', onCopyCode);
      actions.append(copy);
    }
    actions.append(closeBtn);
    next.append(actions);

    const delayMs = reduceMotion ? 0 : Math.min(4200, 700 + line.length * 70);
    next.style.setProperty('--md-next-delay', `${delayMs}ms`);

    const el = h('div', { class: 'md-ccard' + (reduceMotion ? ' md-ccard--calm' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'md-ccard-k', 'aria-describedby': 'md-ccard-t' },
      h('div', { class: 'md-ccard__inner' },
        h('p', { class: 'md-ccard__kicker', id: 'md-ccard-k' }, `제${from.id}장 ${from.title} · 끝`),
        textEl,
        h('div', { class: 'md-ccard__rule', 'aria-hidden': 'true' }),
        next));
    layer.append(el);
    lockScroll(true);
    requestAnimationFrame(() => el.classList.add('md-ccard--in'));
    setTimeout(() => closeBtn.focus({ preventScroll: true }), delayMs + 50);

    let closed = false;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); finish(); } };
    document.addEventListener('keydown', onKey, true);
    closeBtn.addEventListener('click', finish);
    function finish() {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKey, true);
      el.classList.add('md-ccard--out');
      lockScroll(false);
      setTimeout(() => { el.remove(); resolve(); }, reduceMotion ? 0 : 400);
    }
  });
}
