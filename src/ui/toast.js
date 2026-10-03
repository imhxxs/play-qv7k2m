// 토스트. 같은 id(eventId)는 탭마다 한 번만 뜬다.

import { h } from './dom.js';
import { ICON } from './icons.js';

const MAX = 3;

export function createToaster(container) {
  const seen = new Set();

  /**
   * toast(msg, { id, kind: 'info'|'mail'|'warn'|'collect', action: { label, href, target, onClick }, durationMs, sticky })
   * 반환: { close } 또는 null(이미 뜬 id)
   */
  function toast(msg, opts = {}) {
    const { id, kind = 'info', action, durationMs = 6000, sticky = false } = opts;
    if (id) {
      if (seen.has(id)) return null;
      seen.add(id);
    }
    const body = h('div', { class: 'md-toast__msg' });
    if (msg instanceof Node) body.append(msg);
    else body.textContent = String(msg ?? '');
    const el = h('div', { class: `md-toast md-toast--${kind}`, role: kind === 'warn' ? 'alert' : 'status' });
    if (kind === 'mail') el.append(h('span', { class: 'md-toast__icon', html: ICON.mail }));
    el.append(body);
    if (action) {
      const a = action.href
        ? h('a', { class: 'md-toast__action', href: action.href, target: action.target || null }, action.label)
        : h('button', { class: 'md-toast__action', type: 'button' }, action.label);
      a.addEventListener('click', (ev) => {
        if (action.onClick) action.onClick(ev);
        close();
      });
      el.append(a);
    }
    const x = h('button', { class: 'md-toast__close', type: 'button', 'aria-label': '알림 닫기', html: ICON.close });
    x.addEventListener('click', () => close());
    el.append(x);
    container.prepend(el);
    while (container.children.length > MAX) container.lastElementChild.remove();
    requestAnimationFrame(() => el.classList.add('md-toast--in'));

    let timer = null;
    const arm = () => { if (!sticky) timer = setTimeout(close, durationMs); };
    const disarm = () => { clearTimeout(timer); };
    el.addEventListener('pointerenter', disarm);
    el.addEventListener('pointerleave', arm);
    el.addEventListener('focusin', disarm);
    el.addEventListener('focusout', arm);
    arm();

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      disarm();
      el.classList.remove('md-toast--in');
      el.classList.add('md-toast--out');
      setTimeout(() => el.remove(), 220);
    }
    return { close };
  }

  return toast;
}
