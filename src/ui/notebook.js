// 수첩: 오른쪽 아래 버튼(단축키 N) + 서랍 패널. 모바일에서는 전체 화면 시트.
// 탭: 증거함 · 열람 기록 · 힌트 · 설정

import { h, isTypingTarget } from './dom.js';
import { ICON } from './icons.js';
import { lockScroll } from './chrome.js';
import { HINT_COOLDOWN_MS } from '../data/hints.js';

const TABS = [
  ['evidence', '증거함'],
  ['viewed', '열람 기록'],
  ['hints', '힌트'],
  ['settings', '설정'],
];

export function createNotebook(layer, api) {
  // api: game 객체 + 내부 도우미(openPuzzles, hintState, revealHint, setSetting, exportCode, importCode, reset, deadlineText)
  const g = api;
  let open = false;
  let tab = 'evidence';
  let hintSel = null;
  let lastFocus = null;
  let tick = null;
  let pendingRender = false;
  let importDraft = '';
  let codeShown = '';
  let resetArmed = 0;

  // ── 버튼 ──
  const dot = h('span', { class: 'md-nbbtn__dot', hidden: true });
  const btn = h('button', { class: 'md-nbbtn', type: 'button', 'aria-label': '수첩 열기 (단축키 N)', title: '수첩 (N)', 'aria-haspopup': 'dialog' },
    h('span', { class: 'md-nbbtn__icon', html: ICON.book }), h('span', { class: 'md-nbbtn__label' }, '수첩'), dot);
  btn.addEventListener('click', () => toggle());

  // ── 패널 ──
  const title = h('h2', { class: 'md-nb__title', id: 'md-nb-title' }, '수첩');
  const sub = h('p', { class: 'md-nb__sub' });
  const close = h('button', { class: 'md-iconbtn md-nb__close', type: 'button', 'aria-label': '수첩 닫기', html: ICON.close });
  close.addEventListener('click', () => hide());
  const tablist = h('div', { class: 'md-nb__tabs', role: 'tablist', 'aria-label': '수첩 탭' });
  const tabBtns = {};
  for (const [id, label] of TABS) {
    const b = h('button', { class: 'md-tab', type: 'button', role: 'tab', id: `md-tab-${id}`, 'aria-controls': 'md-nb-body', dataset: { tab: id, fk: `tab-${id}` } },
      h('span', { class: 'md-tab__label' }, label), h('span', { class: 'md-tab__count' }));
    b.addEventListener('click', () => { tab = id; hintSel = null; render(); });
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = TABS.findIndex(([t]) => t === tab);
      const n = (i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length;
      tab = TABS[n][0];
      hintSel = null;
      render();
      tabBtns[tab].focus();
    });
    tabBtns[id] = b;
    tablist.append(b);
  }
  const body = h('div', { class: 'md-nb__body', id: 'md-nb-body', role: 'tabpanel', tabindex: '-1' });
  const panel = h('section', { class: 'md-nb__panel' },
    h('header', { class: 'md-nb__head' }, h('div', { class: 'md-nb__heading' }, title, sub), close),
    tablist, body);
  const backdrop = h('div', { class: 'md-nb__backdrop' });
  backdrop.addEventListener('click', () => hide());
  const dlg = h('div', { class: 'md-nb', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'md-nb-title', hidden: true }, backdrop, panel);
  layer.append(dlg, btn);

  // 단축키 N, Esc
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (open && e.key === 'Escape') { e.preventDefault(); hide(); return; }
    if ((e.key === 'n' || e.key === 'N' || e.key === 'ㅜ') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing && !isTypingTarget(e)) {
      e.preventDefault();
      toggle();
    }
  });
  // 포커스 가두기(간단)
  dlg.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const items = [...panel.querySelectorAll('button:not([disabled]), a[href], input, textarea, [tabindex="0"]')].filter((x) => !x.closest('[hidden]'));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = panel.getRootNode().activeElement;
    if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  });
  dlg.addEventListener('focusout', () => {
    if (!pendingRender) return;
    setTimeout(() => { if (pendingRender && !typingInPanel()) render(); }, 0);
  });

  function typingInPanel() {
    const a = panel.getRootNode().activeElement;
    return !!a && panel.contains(a) && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT');
  }

  function show(which) {
    if (which && TABS.some(([t]) => t === which)) { tab = which; hintSel = null; }
    if (!open) {
      open = true;
      lastFocus = document.activeElement;
      dlg.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      lockScroll(true);
      requestAnimationFrame(() => dlg.classList.add('md-nb--open'));
    }
    dot.hidden = true;
    g._markNotebookSeen?.();
    render();
    setTimeout(() => tabBtns[tab]?.focus(), 30);
  }

  function hide() {
    if (!open) return;
    open = false;
    dlg.classList.remove('md-nb--open');
    dlg.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    lockScroll(false);
    clearInterval(tick);
    tick = null;
    resetArmed = 0;
    const back = btn.hidden ? lastFocus : btn;
    try { back?.focus?.(); } catch { /* ignore */ }
  }

  function toggle(which) {
    if (open && (!which || which === tab)) hide();
    else show(which);
  }

  // ── 렌더링 ──
  function render() {
    if (!open) return;
    if (typingInPanel()) { pendingRender = true; return; }
    pendingRender = false;
    const fk = panel.getRootNode().activeElement?.dataset?.fk;
    const scroll = body.scrollTop;

    const ch = g.chapter;
    const dl = g._deadlineText?.();
    sub.textContent = `제${ch.id}장 ${ch.title} · ${ch.dateLabel}${dl ? ' · ' + dl : ''}`;

    const ev = g.cards.collected();
    const vw = g.cards.viewed();
    setCount('evidence', ev.length);
    setCount('viewed', vw.length);
    setCount('hints', 0);
    for (const [id] of TABS) {
      tabBtns[id].setAttribute('aria-selected', String(id === tab));
      tabBtns[id].tabIndex = id === tab ? 0 : -1;
    }
    body.setAttribute('aria-labelledby', `md-tab-${tab}`);

    const view = tab === 'evidence' ? renderEvidence(ev)
      : tab === 'viewed' ? renderViewed(vw)
        : tab === 'hints' ? renderHints()
          : renderSettings();
    body.replaceChildren(view);
    body.scrollTop = scroll;
    if (fk) {
      const target = panel.querySelector(`[data-fk="${CSS.escape(fk)}"]`);
      if (target && !target.disabled) target.focus();
      else body.focus({ preventScroll: true });
    }
  }

  function setCount(id, n) {
    const c = tabBtns[id].querySelector('.md-tab__count');
    c.textContent = n ? String(n) : '';
  }

  function siteName(siteId) {
    return g.sites[siteId]?.name || siteId || '';
  }

  function cardEl(entry, { collected }) {
    const c = entry.card;
    const showKey = c?.key && g._hintsUsedMax?.() >= 2;
    const head = h('div', { class: 'md-card__meta' },
      h('span', { class: 'md-card__site' }, siteName(c?.site)),
      showKey ? h('span', { class: 'md-card__key' }, '핵심') : null,
      collected ? h('span', { class: 'md-card__state' }, '담음') : h('span', { class: 'md-card__state md-card__state--seen' }, '열람'));
    const actions = h('div', { class: 'md-card__actions' });
    if (c?.ref && c.site && g.sites[c.site]) {
      try {
        const a = g.link(c.site, c.ref.page || 'index', c.ref.query, { text: '원문 보기', className: 'md-btn md-btn--ghost md-btn--sm' });
        actions.append(a);
      } catch { /* ignore */ }
    }
    if (collected) {
      const b = h('button', { class: 'md-btn md-btn--ghost md-btn--sm', type: 'button', dataset: { fk: `un-${entry.id}` } }, '증거함에서 빼기');
      b.addEventListener('click', () => g.uncollect(entry.id));
      actions.append(b);
    } else {
      const b = h('button', { class: 'md-btn md-btn--sm', type: 'button', dataset: { fk: `col-${entry.id}` } }, '수첩에 담기');
      b.addEventListener('click', () => g.collect(entry.id));
      actions.append(b);
    }
    return h('article', { class: 'md-card' + (collected ? ' md-card--pinned' : ' md-card--seen') },
      head,
      h('h3', { class: 'md-card__title' }, c?.title || entry.id),
      c?.desc ? h('p', { class: 'md-card__desc' }, c.desc) : null,
      actions);
  }

  function renderEvidence(list) {
    if (!list.length) {
      return h('div', { class: 'md-empty' },
        h('p', null, '아직 담은 단서가 없습니다.'),
        h('p', { class: 'md-muted' }, "사이트에서 '수첩에 담기'를 누르면 여기에 모입니다. 본 것은 모두 '열람 기록'에 조용히 쌓이니, 담기를 잊어도 괜찮아요."));
    }
    return h('div', { class: 'md-cards' }, list.map((e) => cardEl(e, { collected: true })));
  }

  function renderViewed(list) {
    if (!list.length) {
      return h('div', { class: 'md-empty' }, h('p', null, '아직 열람한 것이 없습니다.'), h('p', { class: 'md-muted' }, '메일과 사이트를 둘러보면 본 글과 사진이 여기에 쌓입니다.'));
    }
    return h('div', { class: 'md-cards' },
      h('p', { class: 'md-muted md-note' }, '열어 본 글·사진·메일이 모두 여기에 쌓입니다.'),
      list.map((e) => cardEl(e, { collected: e.collected })));
  }

  function renderHints() {
    const ch = g.chapter;
    if (ch.comingSoon) {
      return h('div', { class: 'md-empty' }, h('p', null, `제${ch.id}장 ${ch.title}은(는) 제작 중입니다.`), h('p', { class: 'md-muted' }, '다음 장이 열리면 여기에서 힌트를 볼 수 있어요.'));
    }
    const list = g._openPuzzles();
    if (hintSel && !list.some((p) => p.id === hintSel)) hintSel = null;
    if (!hintSel) {
      clearInterval(tick);
      tick = null;
      if (!list.length) return h('div', { class: 'md-empty' }, h('p', null, '지금은 볼 힌트가 없습니다.'));
      return h('div', { class: 'md-hints' },
        h('p', { class: 'md-muted md-note' }, '막힌 목표를 고르세요. 힌트는 한 단계씩 열립니다.'),
        h('ul', { class: 'md-goals' }, list.map((p) => {
          const solved = g.solved(p.id);
          const lv = g._hintState(p.id).level || 0;
          const b = h('button', { class: 'md-goal' + (solved ? ' md-goal--done' : ''), type: 'button', dataset: { fk: `goal-${p.id}` } },
            h('span', { class: 'md-goal__name' }, p.goal),
            h('span', { class: 'md-goal__meta' }, solved ? h('span', { class: 'md-goal__done', html: ICON.check + '<span>해결</span>' }) : lv ? `힌트 ${lv}/3` : ''));
          b.addEventListener('click', () => { hintSel = p.id; render(); setTimeout(() => panel.querySelector('[data-fk="hint-next"]')?.focus() || panel.querySelector('[data-fk="hint-back"]')?.focus(), 20); });
          return h('li', null, b);
        })));
    }
    const p = list.find((x) => x.id === hintSel);
    const st = g._hintState(p.id);
    const level = st.level || 0;
    const back = h('button', { class: 'md-btn md-btn--ghost md-btn--sm', type: 'button', dataset: { fk: 'hint-back' } }, h('span', { class: 'md-ico', html: ICON.back }), '목표 목록');
    back.addEventListener('click', () => { hintSel = null; render(); });
    const items = h('ol', { class: 'md-hintlist' }, p.hints.slice(0, level).map((t, i) => h('li', { class: 'md-hint' }, h('span', { class: 'md-hint__n' }, `힌트 ${i + 1}`), h('span', { class: 'md-hint__t' }, t))));
    const wrap = h('div', { class: 'md-hintview' }, back, h('h3', { class: 'md-hintview__goal' }, p.goal), g.solved(p.id) ? h('p', { class: 'md-muted' }, '이 목표는 이미 풀었어요.') : null, items);
    if (level < p.hints.length) {
      const next = level + 1;
      let wait = 0;
      if (next === 3 && st.t2) wait = Math.max(0, HINT_COOLDOWN_MS - (Date.now() - st.t2));
      const label = wait > 0 ? `힌트 3 보기 (${Math.ceil(wait / 1000)}초 뒤)` : `힌트 ${next} 보기`;
      const nb = h('button', { class: 'md-btn md-btn--primary', type: 'button', disabled: wait > 0, dataset: { fk: 'hint-next' } }, label);
      nb.addEventListener('click', () => g._revealHint(p.id, next));
      wrap.append(nb);
      if (wait > 0) {
        wrap.append(h('p', { class: 'md-muted md-note' }, '마지막 힌트는 정답에 가까워요. 조금만 더 생각해 보세요.'));
        if (!tick) tick = setInterval(() => render(), 1000);
      } else if (tick) { clearInterval(tick); tick = null; }
    } else if (tick) { clearInterval(tick); tick = null; }
    return wrap;
  }

  function sw(key, label, desc) {
    const on = !!g.settings[key];
    const b = h('button', { class: 'md-switch', type: 'button', role: 'switch', 'aria-checked': String(on), dataset: { fk: `set-${key}` } },
      h('span', { class: 'md-switch__text' }, h('span', { class: 'md-switch__label' }, label), desc ? h('span', { class: 'md-switch__desc' }, desc) : null),
      h('span', { class: 'md-switch__track', 'aria-hidden': 'true' }));
    b.addEventListener('click', () => g.setSetting(key, !g.settings[key]));
    return b;
  }

  function renderSettings() {
    const s = g.settings;
    const vol = h('input', { type: 'range', min: '0', max: '100', step: '5', value: String(Math.round((s.volume ?? 0.5) * 100)), class: 'md-range', id: 'md-vol', dataset: { fk: 'set-volume' }, 'aria-label': '볼륨' });
    vol.addEventListener('input', () => g.setSetting('volume', Number(vol.value) / 100));
    vol.addEventListener('change', () => g.sfx('ding'));

    // 진행 코드
    const codeBox = h('textarea', { class: 'md-textarea', readonly: true, rows: '3', 'aria-label': '내 진행 코드', hidden: !codeShown }, codeShown);
    const copy = h('button', { class: 'md-btn', type: 'button', dataset: { fk: 'code-copy' } }, '진행 코드 복사');
    copy.addEventListener('click', async () => {
      codeShown = g.progressCode.export();
      codeBox.value = codeShown;
      codeBox.hidden = false;
      const ok = await copyText(codeShown);
      g.toast(ok ? '진행 코드를 복사했습니다.' : '복사하지 못했어요. 아래 칸의 코드를 직접 복사해 주세요.', { kind: ok ? 'info' : 'warn' });
      if (!ok) { codeBox.focus(); codeBox.select(); }
    });
    const imp = h('textarea', { class: 'md-textarea', rows: '3', placeholder: 'MD1-로 시작하는 진행 코드를 붙여 넣으세요', 'aria-label': '불러올 진행 코드', dataset: { fk: 'code-import' } }, importDraft);
    imp.addEventListener('input', () => { importDraft = imp.value; });
    const impMsg = h('p', { class: 'md-note md-err', role: 'alert' });
    const impBtn = h('button', { class: 'md-btn', type: 'button', dataset: { fk: 'code-load' } }, '불러오기');
    impBtn.addEventListener('click', () => {
      try {
        g.progressCode.import(imp.value);
        importDraft = '';
        g.toast('진행 코드를 불러왔습니다. 새로고침합니다.');
        setTimeout(() => location.reload(), 600);
      } catch (e) {
        impMsg.textContent = e.message;
      }
    });

    // 처음부터
    const resetBtn = h('button', { class: 'md-btn md-btn--danger', type: 'button', dataset: { fk: 'reset' } }, resetArmed > Date.now() ? '한 번 더 누르면 모두 지워집니다' : '처음부터 다시 하기');
    resetBtn.addEventListener('click', () => {
      if (resetArmed > Date.now()) {
        g.reset();
        location.href = g.url('start', 'index');
        return;
      }
      resetArmed = Date.now() + 4000;
      render();
      setTimeout(() => { if (resetArmed && resetArmed <= Date.now()) { resetArmed = 0; render(); } }, 4100);
    });

    return h('div', { class: 'md-settings' },
      h('section', { class: 'md-sec' },
        h('h3', { class: 'md-sec__title' }, '소리와 화면'),
        sw('sound', '소리', '방울·징·메일 알림 같은 효과음'),
        h('label', { class: 'md-field', for: 'md-vol' }, h('span', { class: 'md-field__label' }, '볼륨'), vol),
        sw('scares', '깜짝 연출', '가끔 화면이 번쩍이거나 큰 소리가 나는 연출. 꺼도 진행에 필요한 단서는 모두 볼 수 있어요.'),
        sw('reduceMotion', '모션 줄이기', '흔들림·깜빡임·움직이는 효과를 줄입니다.')),
      h('section', { class: 'md-sec' },
        h('h3', { class: 'md-sec__title' }, '메일'),
        sw('fastMail', '빨리 받기', '답장이 5초 안에 도착합니다.')),
      h('section', { class: 'md-sec' },
        h('h3', { class: 'md-sec__title' }, '진행 코드'),
        h('p', { class: 'md-muted md-note' }, '진행은 이 브라우저에만 저장됩니다. 코드를 복사해 두면 다른 기기나 브라우저에서 이어 할 수 있어요.'),
        h('div', { class: 'md-row' }, copy), codeBox,
        imp, h('div', { class: 'md-row' }, impBtn), impMsg),
      h('section', { class: 'md-sec' },
        h('h3', { class: 'md-sec__title' }, '처음부터'),
        h('p', { class: 'md-muted md-note' }, '이 브라우저에 저장된 진행(메일·수첩·힌트)을 모두 지웁니다. 설정은 남습니다.'),
        h('div', { class: 'md-row' }, resetBtn)),
      h('section', { class: 'md-sec md-help' },
        h('h3', { class: 'md-sec__title' }, '도움 받을 곳'),
        h('p', { class: 'md-note' }, '게임 속 이야기가 힘들게 느껴지면 잠시 멈추고 쉬어 가세요. 마음이 많이 힘들 때는 혼자 견디지 말고 이야기해 주세요. 아래는 게임 밖의 실제 공공 상담 창구입니다.'),
        h('ul', { class: 'md-helplist' },
          h('li', null, h('b', null, '자살예방상담전화 109'), ' — 24시간'),
          h('li', null, h('b', null, '정신건강위기상담전화 1577-0199'), ' — 24시간'),
          h('li', null, h('b', null, '청소년상담 1388'), ' — 24시간'),
          h('li', null, h('b', null, '긴급한 위험 119 · 112'))),
        h('p', { class: 'md-muted md-note' }, '※ 번호는 출시 전 재확인 예정입니다.')),
      h('p', { class: 'md-muted md-note md-foot' }, '게임 속 주소와 메일은 게임 안에서만 동작합니다. 서버로 보내는 정보는 없습니다.'));
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  return {
    open: show,
    close: hide,
    toggle,
    render,
    isOpen: () => open,
    setButtonVisible(v) { btn.hidden = !v; },
    setDot(v) { if (!open) dot.hidden = !v; },
    button: btn,
  };
}
