// 누리샘 페이지 공용 모듈(이 사이트 안에서만 쓴다).
//   mountSearchBox  둥근 검색창 + 자동완성(한글 조합이 끝난 뒤 갱신) + 최근 검색어
//   history         md1:search 에 검색 기록 저장
//   weatherCard / ganjiWidget / dictItemEl / headerHtml / footerHtml / siteIcon

import { autocomplete, yearToGanji, ganjiToYears, parseGanji } from '../src/data/search/engine.js';

// ── 아이콘·로고 ───────────────────────────────────────────────

export const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m15.5 15.5 5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  clear: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v4.5l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  ext: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 3h4v4M13 3 7.5 8.5M12 9.5V13H3V4h3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  saved: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h8v11L8 10.5l-4 3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  info: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9v5M10 6.2v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  book: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 3.5c2-.8 3.8-.6 5.5.6 1.7-1.2 3.5-1.4 5.5-.6v9c-2-.8-3.8-.6-5.5.6-1.7-1.2-3.5-1.4-5.5-.6z M8 4.1v9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
};

export const DROP = `<svg class="ns-logo__drop" viewBox="0 0 64 64" aria-hidden="true">
  <defs><linearGradient id="nsdrop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d5bb0"/><stop offset="1" stop-color="#1a2f6b"/></linearGradient></defs>
  <path d="M32 5C41 17 50 27 50 39a18 18 0 0 1-36 0C14 27 23 17 32 5z" fill="url(#nsdrop)"/>
  <path d="M23.5 40.5a8.7 8.7 0 0 0 7.8 8.4" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/>
  <path d="M18 57c4 2.2 9 3 14 3s10-.8 14-3" fill="none" stroke="#3d5bb0" stroke-width="2.2" stroke-linecap="round" opacity=".55"/>
</svg>`;

export function logoHtml({ big = false, href = 'index.html' } = {}) {
  return `<a class="ns-logo${big ? ' ns-logo--big' : ''}" href="${href}" aria-label="누리샘 첫 화면">${DROP}<span class="ns-logo__word">누리샘</span></a>`;
}

/** 사이트 파비콘 정의(sites.js icon)로 작은 SVG */
export function siteIcon(game, siteId) {
  const icon = game.sites[siteId]?.icon || { bg: '#8a91a3', fg: '#fff', text: '•' };
  const inner = icon.svg
    ? icon.svg
    : `<text x="16" y="22.6" font-size="18" text-anchor="middle" fill="${icon.fg || '#fff'}" font-family="serif" font-weight="700">${game.esc(icon.text || '?')}</text>`;
  return `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="${icon.bg || '#333'}"/>${inner}</svg>`;
}

/** 웹 루트 기준 경로 → 이 페이지(www.nurisaem.kr/*.html) 기준 상대 경로 */
export const asset = (p) => '../' + String(p).replace(/^\.?\//, '');

export function searchUrl(q, tab) {
  const t = tab && tab !== 'web' ? '&tab=' + encodeURIComponent(tab) : '';
  return 'search.html?q=' + encodeURIComponent(q) + t;
}

// ── 검색 기록(md1:search) ─────────────────────────────────────

const HISTORY_MAX = 20;

export function getHistory(game) {
  const v = game.get('search', { history: [] });
  return Array.isArray(v?.history) ? v.history : [];
}

export function addHistory(game, q) {
  const s = String(q || '').trim();
  if (!s) return Promise.resolve();
  const t = Date.now();
  return game.update('search', (d) => {
    const prev = Array.isArray(d.history) ? d.history : [];
    d.history = [{ q: s, t }, ...prev.filter((h) => h && h.q !== s)].slice(0, HISTORY_MAX);
  }, { history: [] });
}

export function removeHistory(game, q) {
  return game.update('search', (d) => {
    d.history = (Array.isArray(d.history) ? d.history : []).filter((h) => h && h.q !== q);
  }, { history: [] });
}

export function clearHistory(game) {
  return game.update('search', (d) => { d.history = []; }, { history: [] });
}

// ── 검색창 + 자동완성 ─────────────────────────────────────────

let boxSeq = 0;

/**
 * host 안에 검색창을 그린다.
 * - 제출은 form submit으로만. 한글 조합 중(isComposing)의 Enter는 무시한다.
 * - 자동완성은 compositionend 뒤(또는 조합이 아닌 input)에만 갱신한다.
 * - 빈 칸에 포커스하면 최근 검색어.
 */
export function mountSearchBox(game, host, { value = '', tab = '', big = false, autofocus = false, label = '누리샘 검색' } = {}) {
  const id = 'nsq' + ++boxSeq;
  host.innerHTML = `
<form class="ns-search${big ? ' ns-search--big' : ''}" role="search" action="search.html" method="get" autocomplete="off">
  <label class="ns-sr" for="${id}">${label}</label>
  <div class="ns-search__box">
    <input id="${id}" class="ns-search__input" type="search" name="q" enterkeyhint="search" spellcheck="false"
      autocapitalize="off" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false"
      aria-controls="${id}-list" placeholder="검색어를 입력하세요">
    ${tab && tab !== 'web' ? `<input type="hidden" name="tab" value="${game.esc(tab)}">` : ''}
    <button type="button" class="ns-search__clear" aria-label="검색어 지우기" hidden>${ICON.clear}</button>
    <button type="submit" class="ns-search__go" aria-label="검색">${ICON.search}</button>
  </div>
  <div class="ns-ac" id="${id}-wrap" hidden>
    <div class="ns-ac__head" hidden><span>최근 검색어</span><button type="button" data-ac="clear">전체 삭제</button></div>
    <ul id="${id}-list" role="listbox" aria-label="검색어 추천" style="margin:0;padding:0;list-style:none"></ul>
  </div>
</form>`;
  const form = host.querySelector('form');
  const input = form.querySelector('input[type="search"]');
  const clearBtn = form.querySelector('.ns-search__clear');
  const wrap = form.querySelector('.ns-ac');
  const head = form.querySelector('.ns-ac__head');
  const list = form.querySelector('ul');
  input.value = value;
  clearBtn.hidden = !value;

  let items = [];
  let active = -1;
  let mode = 'suggest';

  const close = () => {
    wrap.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };

  const render = () => {
    list.replaceChildren();
    head.hidden = mode !== 'history';
    if (!items.length) { close(); return; }
    const typed = input.value.trim();
    items.forEach((text, i) => {
      const li = document.createElement('li');
      li.className = 'ns-ac__item';
      li.id = `${id}-o${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      li.dataset.value = text;
      let label = game.esc(text);
      if (mode === 'suggest' && typed && text.startsWith(typed)) label = `<b>${game.esc(typed)}</b>${game.esc(text.slice(typed.length))}`;
      li.innerHTML = `${mode === 'history' ? ICON.clock : ICON.search}<span class="ns-ac__text">${label}</span>`;
      if (mode === 'history') {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'ns-ac__del';
        del.tabIndex = -1;
        del.dataset.del = text;
        del.setAttribute('aria-label', `‘${text}’ 검색 기록 지우기`);
        del.innerHTML = '×';
        li.append(del);
      }
      list.append(li);
    });
    wrap.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (active >= 0) input.setAttribute('aria-activedescendant', `${id}-o${active}`);
    else input.removeAttribute('aria-activedescendant');
  };

  const refresh = () => {
    const v = input.value;
    active = -1;
    if (!v.trim()) {
      mode = 'history';
      items = getHistory(game).slice(0, 6).map((h) => h.q);
    } else {
      mode = 'suggest';
      items = autocomplete(v, { chapter: game.chapter.id });
    }
    render();
  };

  const submit = () => {
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  };

  const choose = (text) => {
    input.value = text;
    clearBtn.hidden = !text;
    close();
    submit();
  };

  input.addEventListener('input', (e) => {
    clearBtn.hidden = !input.value;
    if (e.isComposing) return; // 조합이 끝나면 compositionend에서 갱신
    refresh();
  });
  input.addEventListener('compositionend', () => refresh());
  let quietFocus = false; // 페이지를 열 때의 자동 포커스에는 목록을 띄우지 않는다
  input.addEventListener('focus', () => { if (quietFocus) { quietFocus = false; return; } refresh(); });
  input.addEventListener('click', () => { if (wrap.hidden) refresh(); });
  input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== input) close(); }, 150));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) {
      e.preventDefault(); // 조합 중 Enter는 무시(조합만 끝낸다)
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (wrap.hidden) { refresh(); if (!items.length) return; }
      e.preventDefault();
      const n = items.length;
      active = e.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n;
      render();
      return;
    }
    if (e.key === 'Enter' && active >= 0 && !wrap.hidden) {
      e.preventDefault();
      choose(items[active]);
      return;
    }
    if (e.key === 'Escape' && !wrap.hidden) {
      e.preventDefault();
      close();
    }
  });
  wrap.addEventListener('pointerdown', (e) => e.preventDefault()); // 누르는 동안 입력칸 포커스 유지
  wrap.addEventListener('click', (e) => {
    const del = e.target.closest('[data-del]');
    if (del) {
      e.stopPropagation();
      removeHistory(game, del.dataset.del).then(refresh);
      return;
    }
    if (e.target.closest('[data-ac="clear"]')) {
      clearHistory(game).then(refresh);
      return;
    }
    const li = e.target.closest('.ns-ac__item');
    if (li) choose(li.dataset.value);
  });
  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.hidden = true;
    input.focus();
    refresh();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) { input.focus(); return; }
    close();
    location.href = searchUrl(q, tab);
  });
  document.addEventListener('pointerdown', (e) => { if (!form.contains(e.target)) close(); });
  if (autofocus && matchMedia('(pointer: fine)').matches) {
    setTimeout(() => { quietFocus = true; input.focus({ preventScroll: true }); quietFocus = false; }, 60);
  }
  return { form, input, close, refresh };
}

// ── 머리·바닥 ─────────────────────────────────────────────────

export function topLinksHtml(game) {
  const p = game.profile;
  const me = p
    ? `<span class="ns-me"><span class="ns-me__dot" aria-hidden="true">${game.esc([...p.name][0] || '나')}</span><span class="ns-me__addr">${game.esc(game.email)}</span></span>`
    : '';
  return `<a data-site="nurimail" data-page="index" data-query="#inbox">누리메일</a><a href="dict.html">사전</a>${me}`;
}

export function footerHtml() {
  return `<footer class="ns-foot"><div class="ns-wrap ns-foot__row">
  <p><b>누리샘</b> · 검색 · 메일 · 사전</p>
  <p><a href="cache.html">도움말</a> · 이용약관 · 개인정보 처리방침 · 검색 결과 신고</p>
  <p>누리샘은 게임 속 가상 서비스입니다. 실제 개인정보를 입력하지 마세요.</p>
</div></footer>`;
}

// ── 날씨 ──────────────────────────────────────────────────────

const WICON = {
  sun: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="9" fill="currentColor" opacity=".9"/><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2"/></g></svg>',
  cloud: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 36h22a8 8 0 0 0 0-16 11 11 0 0 0-21-2 8 8 0 0 0-1 18z" fill="currentColor" opacity=".85"/></svg>',
  rain: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M14 30h22a8 8 0 0 0 0-16 11 11 0 0 0-21-2 8 8 0 0 0-1 18z" fill="currentColor" opacity=".85"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round" opacity=".7"><path d="M17 35l-2 6M25 35l-2 6M33 35l-2 6"/></g></svg>',
  fog: '<svg viewBox="0 0 48 48" aria-hidden="true"><g stroke="currentColor" stroke-width="3.2" stroke-linecap="round" opacity=".8"><path d="M8 16h26M12 24h30M6 32h28M14 40h20"/></g></svg>',
};

const WEATHER = {
  '2026-09-27': {
    sky: '흐리고 오후 한때 비', icon: 'rain', now: 16, lo: 11, hi: 19, dust: '좋음',
    note: '서월산 일대 아침 짙은 안개. 산길 운전 조심하세요.',
    hours: [['06시', '안개', 12, 'fog'], ['09시', '흐림', 14, 'cloud'], ['12시', '흐림', 18, 'cloud'], ['15시', '비', 17, 'rain'], ['18시', '비', 15, 'rain'], ['21시', '흐림', 13, 'cloud']],
  },
  '2026-09-28': {
    sky: '맑음, 일교차 큼', icon: 'sun', now: 13, lo: 8, hi: 21, dust: '좋음',
    note: '아침 기온이 한 자릿수로 떨어집니다. 겉옷을 챙기세요.',
    hours: [['06시', '안개', 8, 'fog'], ['09시', '맑음', 13, 'sun'], ['12시', '맑음', 19, 'sun'], ['15시', '맑음', 21, 'sun'], ['18시', '구름', 16, 'cloud'], ['21시', '맑음', 11, 'sun']],
  },
};

export function weatherCard(game) {
  const ch = game.chapter;
  const w = WEATHER[game.gameDate] || WEATHER['2026-09-27'];
  const h = new Date().getHours();
  const night = h >= 0 && h < 5;
  const note = night ? '지금 서월산에 안개가 아주 짙습니다. 밤 산길에는 들어가지 마세요.' : w.note;
  const el = document.createElement('section');
  el.className = 'ns-card ns-weather';
  el.setAttribute('aria-label', '서월 날씨');
  el.innerHTML = `
  <h2>서월 날씨 <small>서월군 서월읍 · ${game.esc(ch.dateLabel || '')}</small></h2>
  <div class="ns-weather__now">
    <span class="ns-weather__icon">${WICON[w.icon]}</span>
    <div><div class="ns-weather__deg">${w.now}°</div><div class="ns-weather__sky">${game.esc(w.sky)} · 최저 ${w.lo}° / 최고 ${w.hi}° · 미세먼지 ${w.dust}</div></div>
  </div>
  <ul class="ns-weather__hours">${w.hours.map(([t, s, d]) => `<li>${t}<b>${d}°</b>${s}</li>`).join('')}</ul>
  <p class="ns-weather__note${night ? ' is-night' : ''}">${game.esc(note)}</p>`;
  return el;
}

// ── 간지 위젯(연도 ↔ 간지) ────────────────────────────────────

let ganjiSeq = 0;

export function ganjiWidget(game, { year = null, ganji = null, title = '간지 ↔ 연도 바꾸기' } = {}) {
  const n = ++ganjiSeq;
  const el = document.createElement('section');
  el.className = 'ns-ganji';
  el.setAttribute('aria-labelledby', `gj${n}-t`);
  el.innerHTML = `
  <h3 id="gj${n}-t">${title}</h3>
  <p class="ns-ganji__help">연도를 넣으면 그해의 간지를, 간지(한글이나 한자)를 넣으면 그 간지인 해를 찾아 드려요.</p>
  <form class="ns-ganji__row" data-g="year" style="align-items:end">
    <div><label for="gj${n}-y">연도</label><input id="gj${n}-y" class="ns-field" inputmode="numeric" autocomplete="off" placeholder="예: 2026"></div>
    <button class="ns-btn ns-btn--primary" type="submit">간지로</button>
  </form>
  <div class="ns-ganji__out" role="status" data-out="year"></div>
  <form class="ns-ganji__row" data-g="ganji" style="align-items:end">
    <div><label for="gj${n}-g">간지</label><input id="gj${n}-g" class="ns-field" autocomplete="off" placeholder="예: 갑자, 丙午"></div>
    <button class="ns-btn ns-btn--primary" type="submit">연도로</button>
  </form>
  <div class="ns-ganji__out" role="status" data-out="ganji"></div>
  <p class="ns-ganji__soon">음력 ↔ 양력 바꾸기는 준비 중입니다. 누리샘 만세력 업데이트 때 함께 열릴 예정이에요.</p>`;
  const yIn = el.querySelector(`#gj${n}-y`);
  const gIn = el.querySelector(`#gj${n}-g`);
  const yOut = el.querySelector('[data-out="year"]');
  const gOut = el.querySelector('[data-out="ganji"]');

  const showYear = (v) => {
    const s = String(v ?? '').replace(/[^\d]/g, '');
    if (!s) { yOut.textContent = '연도를 숫자로 적어 주세요. 예: 1999'; return; }
    const y = Number(s);
    if (y < 1 || y > 2999) { yOut.textContent = '1년부터 2999년까지 바꿀 수 있어요.'; return; }
    const g = yearToGanji(y);
    yOut.innerHTML = `<span class="ns-ganji__big">${g.hanja}</span><b>${y}년은 ${g.hangul}년</b> · ${g.color} ${g.animal}의 해<br><small>간지 해는 음력 설(또는 입춘) 무렵 바뀝니다. 1~2월생은 앞 해 간지일 수 있어요.</small>`;
  };
  const showGanji = (v) => {
    const g = parseGanji(String(v ?? '').replace(/\s+/g, ''));
    if (!g) { gOut.textContent = '육십갑자에 없는 간지예요. 두 글자로 적어 주세요. 예: 갑자, 을축, 丙午'; return; }
    const years = ganjiToYears(g);
    gOut.innerHTML = `<span class="ns-ganji__big">${g.hanja}</span><b>${g.hangul}년</b>에 해당하는 해(1900~2060)<ul class="ns-ganji__years">${years.map((y) => `<li>${y}년</li>`).join('')}</ul>`;
  };
  for (const input of [yIn, gIn]) {
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.isComposing || e.keyCode === 229)) e.preventDefault(); });
  }
  el.querySelector('[data-g="year"]').addEventListener('submit', (e) => { e.preventDefault(); showYear(yIn.value); });
  el.querySelector('[data-g="ganji"]').addEventListener('submit', (e) => { e.preventDefault(); showGanji(gIn.value); });
  if (year) { yIn.value = year; showYear(year); }
  if (ganji) { gIn.value = ganji; showGanji(ganji); }
  return el;
}

// ── 사전 항목 ─────────────────────────────────────────────────

export function dictItemEl(game, d, { link = true, data, widget = true } = {}) {
  const el = document.createElement('article');
  el.className = 'ns-dict';
  el.id = 'd-' + d.id;
  const term = link ? `<a href="dict.html?q=${encodeURIComponent(d.term)}">${game.esc(d.term)}</a>` : game.esc(d.term);
  const table = d.table
    ? `<table class="ns-table"><caption class="ns-sr">${game.esc(d.term)} 풀이 예</caption><tbody>${d.table.map(([a, b]) => `<tr><th scope="row">${game.esc(a)}</th><td>${game.esc(b)}</td></tr>`).join('')}</tbody></table>`
    : '';
  const see = (d.see || []).map((id) => data?.dict?.[id]).filter(Boolean);
  el.innerHTML = `
  <div class="ns-dict__head"><h3 class="ns-dict__term">${term}</h3>${d.hanja ? `<span class="ns-dict__hanja">${game.esc(d.hanja)}</span>` : ''}<span class="ns-dict__kind">${game.esc(d.kind || '사전')}</span></div>
  ${(d.body || []).map((p) => `<p>${game.esc(p)}</p>`).join('')}
  ${table}
  ${d.note ? `<p class="ns-dict__note">${game.esc(d.note)}</p>` : ''}
  ${see.length ? `<ul class="ns-dict__see" aria-label="함께 볼 말">${see.map((s) => `<li><a href="dict.html?q=${encodeURIComponent(s.term)}">${game.esc(s.term)}</a></li>`).join('')}</ul>` : ''}`;
  if (!widget) return el;
  if (d.widget === 'ganji') el.append(ganjiWidget(game, {}));
  if (d.widget === 'lunar') {
    const p = document.createElement('p');
    p.className = 'ns-ganji__soon';
    p.textContent = '음력 ↔ 양력 바꾸기는 준비 중입니다. 간지와 연도는 아래 ‘간지 ↔ 연도 바꾸기’에서 볼 수 있어요.';
    el.append(p, ganjiWidget(game, {}));
  }
  return el;
}
