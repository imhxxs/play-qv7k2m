// 메일 쓰기: 받는 사람 자동완성(알게 된 주소만) · 자동 임시 저장 · 수첩에서 첨부(최대 5장)
// · §8.5 '빠른 답장'(같은 사람에게 세 번 엇나가면) · 하단 고정 안내문.

import { h, icon, isEmail, hhmm, plainOf } from './util.js';
import { contactsOf } from './book.js';
import { fileInfo, MAX_ATTACH } from './attach.js';
import { extrasOf } from './views.js';
import { quotableBody } from './m01.js';

const SAVE_DELAY = 500;

function newId() {
  return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/** 라우트(#compose, #compose/<draftId>, #compose?re=|fw=|to=) → 쓰기 화면 */
export function renderCompose(app, { draftId, query }) {
  const { game } = app;
  let draft = draftId ? app.drafts().find((d) => d.id === draftId) : null;
  let mode = 'new';
  let source = null;

  if (draft) {
    mode = draft.mode || 'new';
    if (draft.replyTo) source = game.mail.get(draft.replyTo);
  } else {
    draft = { id: newId(), to: '', subject: '', body: '', attachments: [], t: 0 };
    const re = query.get('re');
    const fw = query.get('fw');
    const to = query.get('to');
    if (re && (source = game.mail.get(re))) {
      mode = 'reply';
      draft.to = source.from?.addr || '';
      draft.subject = /^re:/i.test(source.subject || '') ? source.subject : `Re: ${source.subject || ''}`;
      draft.replyTo = source.id;
    } else if (fw && (source = game.mail.get(fw))) {
      mode = 'forward';
      draft.subject = /^fwd?:/i.test(source.subject || '') ? source.subject : `Fwd: ${source.subject || ''}`;
      draft.body = `\n\n---------- 전달된 메일 ----------\n보낸 사람: ${source.from?.name || ''} <${source.from?.addr || ''}>\n날짜: ${source.dateLabel}\n제목: ${source.subject || ''}\n\n${plainOf(quotableBody(game, source))}`;
      draft.attachments = extrasOf(game, source).atts.slice(0, MAX_ATTACH);
      source = null; // 전달은 원문을 본문에 이미 넣었다
    } else if (to) {
      draft.to = to;
    }
    draft.mode = mode;
  }

  let saved = !!draftId && draft.t > 0;
  let timer = null;
  let sending = false;

  // ── 요소 ──
  const title = { new: '메일 쓰기', reply: '답장 쓰기', forward: '전달하기' }[mode] || '메일 쓰기';
  const savedMsg = h('span', { class: 'compose__saved', 'aria-live': 'polite' }, saved ? `임시 저장됨 ${hhmm(draft.t)}` : '');
  const sendBtn = h('button', { class: 'tbtn tbtn--primary', type: 'submit' }, icon('send'), h('span', null, '보내기'));
  const delBtn = h('button', { class: 'tbtn tbtn--icon', type: 'button', 'aria-label': '이 메일 지우기', hidden: !saved }, icon('trash'));
  const closeHref = mode === 'reply' && draft.replyTo ? '#read/' + encodeURIComponent(draft.replyTo) : '#' + (app.state.folder || 'inbox');
  const bar = h('div', { class: 'rbar rbar--compose' },
    h('a', { class: 'tbtn tbtn--back', href: closeHref, 'aria-label': '쓰기 닫기' }, icon('back'), h('span', { class: 'tbtn__t' }, '닫기')),
    h('h1', { class: 'rbar__title' }, title),
    savedMsg, delBtn, sendBtn);

  const toIn = h('input', {
    id: 'c-to', class: 'field__input', type: 'text', inputmode: 'email', autocomplete: 'off', autocapitalize: 'off',
    spellcheck: 'false', value: draft.to, 'aria-autocomplete': 'list', 'aria-controls': 'c-suggest', 'aria-expanded': 'false',
    placeholder: '주소록의 주소나 메일 주소',
  });
  const suggest = h('div', { class: 'suggest', id: 'c-suggest', role: 'listbox', 'aria-label': '알게 된 주소', hidden: true });
  const subIn = h('input', { id: 'c-subject', class: 'field__input', type: 'text', autocomplete: 'off', value: draft.subject });
  const bodyIn = h('textarea', { id: 'c-body', class: 'compose__body', rows: '12', 'aria-label': '본문', placeholder: '내용을 적어 주세요.' });
  bodyIn.value = draft.body || '';

  const quickBox = h('div', { class: 'quick', hidden: true });
  const attRow = h('div', { class: 'attrow' });
  const err = h('p', { class: 'compose__err', role: 'alert' });

  const origin = source
    ? h('details', { class: 'orig' },
      h('summary', null, `받은 메일 — ${source.from?.name || source.from?.addr || ''}`),
      h('div', { class: 'orig__body' }, plainOf(quotableBody(game, source))))
    : null;

  const form = h('form', { class: 'compose', novalidate: true, 'aria-label': title },
    bar,
    h('div', { class: 'compose__scroll' },
      h('div', { class: 'field field--to' }, h('label', { class: 'field__label', for: 'c-to' }, '받는 사람'), h('div', { class: 'field__wrap' }, toIn, suggest)),
      h('div', { class: 'field' }, h('label', { class: 'field__label', for: 'c-subject' }, '제목'), subIn),
      quickBox,
      attRow,
      bodyIn,
      err,
      origin),
    h('p', { class: 'compose__notice' }, '게임 속 주소입니다. 실제 메일 앱으로 보내지 마세요.'));

  // ── 첨부 ──
  const renderAtts = () => {
    const chips = (draft.attachments || []).map((id) => {
      const info = fileInfo(game, id);
      const x = h('button', { class: 'achip__x', type: 'button', 'aria-label': `첨부 빼기 — ${info.name}` }, icon('close'));
      x.addEventListener('click', () => {
        draft.attachments = draft.attachments.filter((a) => a !== id);
        renderAtts();
        changed();
      });
      const name = h('button', { class: 'achip__name', type: 'button', 'aria-label': `첨부 미리보기 — ${info.name}` }, icon('clip'), h('span', null, info.name));
      name.addEventListener('click', () => app.viewer.open(id));
      return h('span', { class: 'achip' }, name, x);
    });
    const add = h('button', { class: 'tbtn tbtn--soft', type: 'button' }, icon('book'), h('span', null, `수첩에서 첨부 (${(draft.attachments || []).length}/${MAX_ATTACH})`));
    add.addEventListener('click', async () => {
      const picked = await app.picker.open(draft.attachments || []);
      if (!picked) return;
      draft.attachments = picked.slice(0, MAX_ATTACH);
      renderAtts();
      changed();
    });
    attRow.replaceChildren(add, ...chips);
  };
  renderAtts();

  // ── 빠른 답장(§8.5: 같은 사람에게 세 번 엇나가면) ──
  const renderQuick = () => {
    const npc = game.mail.findNpc(toIn.value);
    const miss = (game.get('mail', {})?.miss || {})[npc?.addr] || 0;
    if (!npc?.quick?.length || miss < 3) { quickBox.hidden = true; quickBox.replaceChildren(); return; }
    quickBox.hidden = false;
    quickBox.replaceChildren(
      h('p', { class: 'quick__label' }, `빠른 답장 — ${npc.name}에게 이렇게 물어볼 수 있어요`),
      ...npc.quick.map((q) => {
        const b = h('button', { class: 'chip', type: 'button' }, q.label);
        b.addEventListener('click', () => {
          bodyIn.value = q.body;
          if (!subIn.value.trim()) subIn.value = q.label;
          changed();
          sendBtn.focus();
        });
        return b;
      }));
  };
  renderQuick();

  // ── 받는 사람 자동완성 ──
  let sugItems = [];
  let sugIdx = -1;
  const closeSuggest = () => { suggest.hidden = true; toIn.setAttribute('aria-expanded', 'false'); sugIdx = -1; };
  const pickSuggest = (addr) => {
    toIn.value = addr;
    closeSuggest();
    changed();
    renderQuick();
    subIn.focus();
  };
  const renderSuggest = () => {
    const v = toIn.value.trim().toLowerCase();
    const all = contactsOf(game);
    sugItems = all.filter((c) => c.addr !== v && (!v || c.addr.includes(v) || c.name.toLowerCase().includes(v))).slice(0, 6);
    if (!sugItems.length) { closeSuggest(); return; }
    suggest.replaceChildren(...sugItems.map((c, i) => {
      const b = h('button', { class: 'suggest__item', type: 'button', role: 'option', id: `c-sug-${i}`, 'aria-selected': String(i === sugIdx) },
        h('span', { class: 'suggest__name' }, c.name), h('span', { class: 'suggest__addr addr' }, c.addr));
      b.addEventListener('pointerdown', (e) => e.preventDefault()); // 입력칸 포커스 유지
      b.addEventListener('click', () => pickSuggest(c.addr));
      return b;
    }));
    suggest.hidden = false;
    toIn.setAttribute('aria-expanded', 'true');
  };
  toIn.addEventListener('focus', renderSuggest);
  toIn.addEventListener('input', () => { sugIdx = -1; renderSuggest(); renderQuick(); });
  toIn.addEventListener('blur', () => setTimeout(closeSuggest, 120));
  toIn.addEventListener('keydown', (e) => {
    if (suggest.hidden || !sugItems.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sugIdx = (sugIdx + (e.key === 'ArrowDown' ? 1 : sugItems.length - 1)) % sugItems.length;
      renderSuggest();
      toIn.setAttribute('aria-activedescendant', `c-sug-${sugIdx}`);
    } else if (e.key === 'Enter' && sugIdx >= 0) {
      e.preventDefault();
      pickSuggest(sugItems[sugIdx].addr);
    } else if (e.key === 'Escape') {
      closeSuggest();
    }
  });

  // ── 자동 임시 저장 ──
  const isEmpty = () => !toIn.value.trim() && !subIn.value.trim() && !bodyIn.value.trim() && !(draft.attachments || []).length;
  const sig = () => JSON.stringify([toIn.value.trim(), subIn.value, bodyIn.value, draft.attachments || []]);
  let lastSig = saved ? sig() : '';
  function changed() {
    err.textContent = '';
    clearTimeout(timer);
    timer = setTimeout(save, SAVE_DELAY);
  }
  function save() {
    clearTimeout(timer);
    timer = null;
    if (sending) return;
    if (isEmpty()) {
      if (saved) { app.deleteDraft(draft.id); saved = false; delBtn.hidden = true; savedMsg.textContent = ''; lastSig = ''; }
      return;
    }
    const s = sig();
    if (saved && s === lastSig) return;
    const t = Date.now();
    const rec = {
      id: draft.id, mode, replyTo: draft.replyTo || null,
      to: toIn.value.trim(), subject: subIn.value, body: bodyIn.value, attachments: [...(draft.attachments || [])], t,
    };
    Object.assign(draft, rec);
    app.saveDraft(rec);
    lastSig = s;
    if (!saved) {
      saved = true;
      delBtn.hidden = false;
      // 새로고침해도 이어 쓰게 주소를 바꾼다(hashchange 없이)
      try { history.replaceState(null, '', '#compose/' + encodeURIComponent(draft.id)); game.setAddress(null); } catch { /* ignore */ }
      app.state.route = { name: 'compose', id: draft.id, query: new URLSearchParams() };
    }
    savedMsg.textContent = `임시 저장됨 ${hhmm(t)}`;
  }
  for (const el of [toIn, subIn, bodyIn]) el.addEventListener('input', changed);

  delBtn.addEventListener('click', () => {
    clearTimeout(timer);
    sending = true;
    app.deleteDraft(draft.id);
    game.toast('쓰던 메일을 지웠습니다.');
    location.hash = '#drafts';
  });

  // ── 보내기 ──
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (sending) return;
    const raw = toIn.value.trim();
    const m = /<([^>]+)>/.exec(raw);
    const to = (m ? m[1] : raw).trim();
    if (!to) return fail('받는 사람을 적어 주세요.', toIn);
    if (/[,;]/.test(to) || to.split('@').length > 2) return fail('이 메일함에서는 한 번에 한 사람에게만 보낼 수 있어요.', toIn);
    if (!isEmail(to)) return fail('메일 주소 형식이 아니에요. 예: name@nurisaem.kr', toIn);
    if (!subIn.value.trim() && !bodyIn.value.trim()) return fail('제목이나 내용을 적어 주세요.', bodyIn);
    sending = true;
    clearTimeout(timer);
    const r = game.mail.send({ to, subject: subIn.value.trim(), body: bodyIn.value, attachments: draft.attachments || [] });
    app.deleteDraft(draft.id);
    game.toast('메일을 보냈습니다.', { kind: 'info', durationMs: 3200 });
    location.hash = '#sent/' + encodeURIComponent(r.id);
  });

  function fail(msg, focusEl) {
    err.textContent = msg;
    focusEl?.focus();
  }

  form._leave = () => { if (timer) save(); };
  form._focus = () => {
    const target = !toIn.value ? toIn : !subIn.value ? subIn : bodyIn;
    target.focus({ preventScroll: true });
    if (target === bodyIn && mode !== 'forward') { try { bodyIn.setSelectionRange(bodyIn.value.length, bodyIn.value.length); } catch { /* ignore */ } }
    if (target === bodyIn && mode === 'forward') { try { bodyIn.setSelectionRange(0, 0); } catch { /* ignore */ } }
  };
  form._refresh = () => renderQuick();
  return form;
}
