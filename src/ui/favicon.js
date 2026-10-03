// 탭 제목과 파비콘(SVG data URL). 누리메일은 안 읽은 메일 수를 '(n)'과 배지로 보여 준다.

import { esc } from '../core/util.js';

export function faviconSvg(icon = {}, badge = 0) {
  const bg = icon.bg || '#333';
  const fg = icon.fg || '#fff';
  const inner = icon.svg
    ? icon.svg
    : `<text x="16" y="22.6" font-size="18" text-anchor="middle" fill="${fg}" font-family="serif" font-weight="700">${esc(icon.text || '?')}</text>`;
  const b = badge > 0
    ? `<circle cx="24.5" cy="7.5" r="7" fill="#e5383b" stroke="#fff" stroke-width="1.2"/><text x="24.5" y="11" font-size="9.5" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">${badge > 9 ? '9+' : badge}</text>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${bg}"/>${inner}${b}</svg>`;
}

export function setFavicon(hrefOrIcon, badge = 0) {
  const href = typeof hrefOrIcon === 'string'
    ? hrefOrIcon
    : 'data:image/svg+xml,' + encodeURIComponent(faviconSvg(hrefOrIcon, badge));
  let link = document.querySelector('link[rel~="icon"][data-md]');
  if (!link) {
    for (const old of document.querySelectorAll('link[rel~="icon"]')) old.remove();
    link = document.createElement('link');
    link.rel = 'icon';
    link.dataset.md = '';
    document.head.append(link);
  }
  if (typeof hrefOrIcon !== 'string') link.type = 'image/svg+xml';
  link.href = href;
}
