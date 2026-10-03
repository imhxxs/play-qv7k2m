// 위쪽 막대들: 시한 바, 안내 배너, '다른 창에서 진행이 바뀜' 덮개.

import { h } from './dom.js';
import { ICON } from './icons.js';

/** 시한 바. update({ visible, dday, label }) */
export function createDeadline(container) {
  const d = h('span', { class: 'md-deadline__d' });
  const label = h('span', { class: 'md-deadline__label' });
  const el = h('div', { class: 'md-deadline', role: 'status', hidden: true }, d, h('span', { class: 'md-deadline__sep', 'aria-hidden': 'true' }, '·'), label);
  container.append(el);
  let first = true;
  let wasVisible = false;
  return {
    el,
    /** animate: 이 탭에서 보는 중에 새로 켜졌을 때만 번쩍인다(페이지를 열 때는 조용히) */
    update({ visible, dday, text }) {
      el.hidden = !visible;
      d.textContent = `D-${dday}`;
      label.textContent = text;
      el.setAttribute('aria-label', `D-${dday}, ${text}`);
      if (visible && !wasVisible && !first) {
        el.classList.add('md-deadline--new');
        setTimeout(() => el.classList.remove('md-deadline--new'), 2600);
      }
      wasVisible = visible;
      first = false;
    },
  };
}

/** 안내 배너(위쪽 막대 아래). show(id, { text, action: {label, href, target}, dismissable }) */
export function createBanners(container) {
  const map = new Map();
  return {
    show(id, { text, action, kind = 'info', dismissable = true }) {
      if (map.has(id)) return;
      const el = h('div', { class: `md-banner md-banner--${kind}`, role: kind === 'warn' ? 'alert' : 'status' });
      el.append(h('span', { class: 'md-banner__text' }, text));
      if (action) el.append(h('a', { class: 'md-banner__action', href: action.href, target: action.target || null }, action.label));
      if (dismissable) {
        const x = h('button', { class: 'md-banner__close', type: 'button', 'aria-label': '안내 닫기', html: ICON.close });
        x.addEventListener('click', () => this.hide(id));
        el.append(x);
      }
      container.append(el);
      map.set(id, el);
    },
    hide(id) {
      map.get(id)?.remove();
      map.delete(id);
    },
  };
}

/** 다른 창에서 진행이 바뀌었을 때(처음부터·진행 코드 불러오기) 덮개 */
export function showStaleOverlay(layer) {
  if (layer.querySelector('.md-stale')) return;
  const btn = h('button', { class: 'md-btn md-btn--primary', type: 'button' }, '새로고침');
  btn.addEventListener('click', () => location.reload());
  const el = h('div', { class: 'md-stale', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'md-stale-t' },
    h('div', { class: 'md-stale__box' },
      h('p', { class: 'md-stale__title', id: 'md-stale-t' }, '다른 창에서 진행이 바뀌었습니다'),
      h('p', { class: 'md-stale__text' }, '처음부터 다시 시작했거나 진행 코드를 불러온 것 같아요. 이 창을 새로고침하면 바뀐 진행으로 이어집니다.'),
      btn));
  layer.append(el);
  setTimeout(() => btn.focus(), 50);
}
