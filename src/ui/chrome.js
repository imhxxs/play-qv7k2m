// 게임 공용 UI의 뿌리. <html> 바로 아래에 그림자 DOM 호스트를 붙여서
// 사이트 CSS가 게임 UI에 새어 들어오지 않게 하고, body의 filter/transform에도 영향받지 않게 한다.
//
// 사이트에 남기는 흔적(라이트 DOM)
//   <html class="md-has-chrome [md-reduce-motion] [md-scares-off]">
//   html 인라인 스타일: padding-top: var(--md-chrome-h), scroll-padding-top, (선택) padding-bottom
//   --md-chrome-h  위쪽 고정 막대(주소창·시한 바·배너) 높이. 앱형 레이아웃은 calc(100dvh - var(--md-chrome-h))

import { h } from './dom.js';

export function mountChrome({ cssHref, reserveBottom = true }) {
  const docEl = document.documentElement;
  // 사용자 정의 태그 이름이라 사이트의 div·section 같은 선택자에 걸리지 않는다
  const host = h('md-chrome', { id: 'md-chrome', 'data-md': '' });
  host.style.display = 'contents';
  host.style.visibility = 'hidden';
  const root = host.attachShadow({ mode: 'open' });
  const link = h('link', { rel: 'stylesheet', href: cssHref });
  const wrap = h('div', { class: 'md-root', part: 'root' });
  const top = h('div', { class: 'md-top' });
  const toasts = h('div', { class: 'md-toasts', 'aria-live': 'polite', 'aria-relevant': 'additions' });
  const layer = h('div', { class: 'md-layer' });
  wrap.append(top, toasts, layer);
  root.append(link, wrap);

  const reveal = () => { host.style.visibility = ''; };
  link.addEventListener('load', reveal, { once: true });
  link.addEventListener('error', reveal, { once: true });
  setTimeout(reveal, 1500);

  docEl.classList.add('md-has-chrome');
  docEl.style.setProperty('--md-chrome-h', '0px');
  docEl.style.paddingTop = 'var(--md-chrome-h, 0px)';
  docEl.style.scrollPaddingTop = 'var(--md-chrome-h, 0px)';
  if (reserveBottom) docEl.style.paddingBottom = '72px';
  docEl.appendChild(host);

  const setH = () => {
    const hgt = Math.ceil(top.getBoundingClientRect().height);
    docEl.style.setProperty('--md-chrome-h', hgt + 'px');
    wrap.style.setProperty('--md-chrome-h', hgt + 'px');
  };
  if ('ResizeObserver' in window) new ResizeObserver(setH).observe(top);
  link.addEventListener('load', setH);
  setH();

  return { host, root, wrap, top, toasts, layer };
}

/** 모션 줄이기·깜짝 연출 꺼짐을 html 클래스로도 알려 사이트 CSS가 따를 수 있게 한다. */
export function applyHtmlFlags(wrap, settings) {
  const docEl = document.documentElement;
  docEl.classList.toggle('md-reduce-motion', !!settings.reduceMotion);
  docEl.classList.toggle('md-scares-off', !settings.scares);
  wrap.classList.toggle('md-rm', !!settings.reduceMotion);
}

let lockCount = 0;
let savedOverflow = '';
/** 수첩·전환 카드가 열려 있는 동안 뒤 페이지 스크롤을 막는다. */
export function lockScroll(on) {
  const docEl = document.documentElement;
  if (on) {
    if (lockCount++ === 0) {
      savedOverflow = docEl.style.overflow;
      docEl.style.overflow = 'hidden';
    }
  } else if (lockCount > 0 && --lockCount === 0) {
    docEl.style.overflow = savedOverflow;
  }
}
