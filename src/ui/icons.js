// 인라인 SVG 아이콘(직접 그림). 모두 currentColor를 쓴다.

export const ICON = {
  lock: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/></svg>',
  warn: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 1.8 15 14H1z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="12" r="0.9" fill="currentColor"/></svg>',
  go: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3 8h9M8.5 4.2 12.3 8l-3.8 3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  book: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M4 3.5h9.5A2.5 2.5 0 0 1 16 6v10.5H6.5A2.5 2.5 0 0 1 4 14z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M4 14a2.5 2.5 0 0 1 2.5-2.5H16" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 6.5h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  back: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3.5 5.5 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mail: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="1.8" y="3.5" width="12.4" height="9" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m2.5 4.5 5.5 4 5.5-4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
};

/** 명두(놋거울) — 시작 화면·깜짝 연출에서 쓴다. idPrefix로 그라데이션 id 충돌을 피한다. */
export function mirrorSvg(idPrefix = 'mdm', { label = '명두 — 둥근 놋거울' } = {}) {
  const p = idPrefix;
  return `<svg viewBox="0 0 240 240" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="${p}-brass" cx="40%" cy="36%" r="72%">
      <stop offset="0" stop-color="#f6e2a4"/><stop offset=".34" stop-color="#c99f52"/>
      <stop offset=".74" stop-color="#7a5826"/><stop offset="1" stop-color="#36260f"/>
    </radialGradient>
    <radialGradient id="${p}-core" cx="48%" cy="44%" r="60%">
      <stop offset="0" stop-color="#b98f48"/><stop offset="1" stop-color="#6a4b1f"/>
    </radialGradient>
    <radialGradient id="${p}-glint" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="#fff8e0" stop-opacity=".85"/><stop offset="1" stop-color="#fff8e0" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path d="M120 6c-7 6-7 14 0 18 7-4 7-12 0-18z" fill="none" stroke="#8b1a1a" stroke-width="3"/>
  <circle cx="120" cy="128" r="110" fill="#1e1408"/>
  <circle cx="120" cy="128" r="105" fill="url(#${p}-brass)" stroke="#4d3614" stroke-width="3"/>
  <circle cx="120" cy="128" r="100" fill="none" stroke="#f1d796" stroke-opacity=".28"/>
  <circle cx="120" cy="128" r="43" fill="url(#${p}-core)" stroke="#4d3614" stroke-width="1.5"/>
  <circle cx="120" cy="128" r="39" fill="none" stroke="#e6c47e" stroke-opacity=".35" stroke-width=".8"/>
  <g font-family="'Nanum Myeongjo','Noto Serif KR',serif" font-size="15" text-anchor="middle">
    <text x="106.6" y="119.6" fill="#f0d495" fill-opacity=".45">日</text><text x="106" y="119" fill="#3d2a0e">日</text>
    <text x="134.6" y="119.6" fill="#f0d495" fill-opacity=".45">月</text><text x="134" y="119" fill="#3d2a0e">月</text>
  </g>
  <g fill="#3d2a0e" stroke="#3d2a0e">
    <path d="M100 146 108 141 115 140 122 142 140 141 138 152 124 151 122 142" fill="none" stroke-width=".9" stroke-opacity=".8"/>
    <circle cx="100" cy="146" r="2"/><circle cx="108" cy="141" r="2"/><circle cx="115" cy="140" r="2"/>
    <circle cx="122" cy="142" r="2"/><circle cx="140" cy="141" r="2.2"/><circle cx="138" cy="152" r="2"/><circle cx="124" cy="151" r="2"/>
  </g>
  <ellipse class="md-mirror-glint" cx="84" cy="84" rx="44" ry="20" fill="url(#${p}-glint)" transform="rotate(-32 84 84)"/>
</svg>`;
}
