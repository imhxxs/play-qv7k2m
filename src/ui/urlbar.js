// 가짜 브라우저 주소창. 편집할 수 있고, Enter(또는 → 버튼)로 리졸버를 거쳐 이동한다.

import { h } from './dom.js';
import { ICON } from './icons.js';

export function createUrlbar(container, { onNavigate, insecure = false }) {
  const lock = h('span', { class: 'md-urlbar__lock' + (insecure ? ' md-urlbar__lock--warn' : ''), html: insecure ? ICON.warn : ICON.lock, title: insecure ? '연결할 수 없음' : '보안 연결' });
  const input = h('input', {
    class: 'md-urlbar__input',
    id: 'md-url',
    type: 'text',
    inputmode: 'url',
    autocomplete: 'off',
    autocapitalize: 'off',
    autocorrect: 'off',
    spellcheck: 'false',
    enterkeyhint: 'go',
    'aria-label': '주소',
  });
  const display = h('span', { class: 'md-urlbar__display', 'aria-hidden': 'true' });
  const field = h('div', { class: 'md-urlbar__field' }, lock, input, display);
  const go = h('button', { class: 'md-urlbar__go', type: 'submit', 'aria-label': '이동', html: ICON.go });
  const form = h('form', { class: 'md-urlbar', role: 'navigation', 'aria-label': '주소 표시줄', autocomplete: 'off' }, field, go);
  container.append(form);

  let current = '';
  let composing = false;
  input.addEventListener('compositionstart', () => { composing = true; });
  input.addEventListener('compositionend', () => { composing = false; });
  input.addEventListener('focus', () => {
    requestAnimationFrame(() => { try { input.select(); } catch { /* ignore */ } });
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = current;
      input.blur();
    }
  });
  input.addEventListener('blur', () => {
    if (!input.value.trim()) input.value = current;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (composing) return;
    const v = input.value.trim();
    if (!v) { input.value = current; return; }
    onNavigate(v);
  });

  function setAddress(addr) {
    current = addr || '';
    if (document.activeElement !== input && input.getRootNode().activeElement !== input) input.value = current;
    display.replaceChildren(...formatDisplay(current));
  }

  return { setAddress, input, el: form };
}

function formatDisplay(addr) {
  const m = /^(https?:\/\/)([^/?#]+)(.*)$/.exec(addr);
  if (!m) return [h('span', { class: 'md-urlbar__host' }, addr)];
  return [
    h('span', { class: 'md-urlbar__scheme' }, m[1]),
    h('span', { class: 'md-urlbar__host' }, m[2]),
    h('span', { class: 'md-urlbar__path' }, m[3]),
  ];
}
