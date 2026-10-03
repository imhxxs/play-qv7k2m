// 작은 DOM 도우미. h('div', { class: 'x', onClick: fn }, '내용', 자식요소…)

const PROPS = new Set(['value', 'checked', 'disabled', 'hidden', 'selected', 'readOnly', 'tabIndex']);

export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (PROPS.has(k)) el[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, kids);
  return el;
}

function append(el, kids) {
  for (const kid of kids) {
    if (kid == null || kid === false) continue;
    if (Array.isArray(kid)) append(el, kid);
    else el.append(kid instanceof Node ? kid : String(kid));
  }
}

/** 입력 중인지(단축키 무시용). 그림자 DOM 안의 입력칸도 본다. */
export function isTypingTarget(ev) {
  const path = ev.composedPath ? ev.composedPath() : [ev.target];
  for (const n of path) {
    if (!(n instanceof Element)) continue;
    const tag = n.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || n.isContentEditable) return true;
  }
  return false;
}
