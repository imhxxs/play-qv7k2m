// 첨부: 받은/보낸 메일의 첨부 타일, 첨부 미리보기(밝기·대비·색 반전·좌우 반전), 수첩에서 고르기(최대 5장).

import { h, icon } from './util.js';

// 카드에 image가 없을 때 누리메일이 대신 보여 줄 첨부 그림(웹 루트 기준)
const LOCAL_IMAGES = {
  'X-haewonbu': 'assets/nurimail/haewonbu.svg',
  E46: 'assets/nurimail/receipt-seowol.svg',
};
// 첨부 파일처럼 보일 이름·크기
const FILES = {
  'X-haewonbu': { name: '해원부.png', size: '212KB', type: 'PNG 이미지' },
  E46: { name: '영수증_0919.jpg', size: '148KB', type: 'JPG 이미지' },
};

export const MAX_ATTACH = 5;

export function cardImage(game, id) {
  const c = game.cards.get(id);
  const p = c?.image || LOCAL_IMAGES[id];
  if (!p) return null;
  if (/^(data:|https?:|blob:)/.test(p)) return p;
  try { return new URL(p, game.root).href; } catch { return null; }
}

export function fileInfo(game, id) {
  if (FILES[id]) return FILES[id];
  const c = game.cards.get(id);
  return { name: c?.title || id, size: '', type: '수첩 카드' };
}

/** 첨부 타일 묶음 */
export function attachmentTiles(app, ids, { title = '첨부' } = {}) {
  const { game } = app;
  if (!ids?.length) return null;
  const grid = h('div', { class: 'atts__grid' });
  for (const id of ids) {
    const info = fileInfo(game, id);
    const img = cardImage(game, id);
    const thumb = h('span', { class: 'att__thumb' });
    if (img) thumb.append(h('img', { src: img, alt: '', loading: 'lazy', decoding: 'async' }));
    else thumb.append(icon('doc', 'ico ico--lg'));
    const btn = h('button', { class: 'att', type: 'button', 'aria-label': `첨부 열기 — ${info.name}` },
      thumb,
      h('span', { class: 'att__name' }, info.name),
      h('span', { class: 'att__meta' }, [info.type, info.size].filter(Boolean).join(' · ')));
    btn.addEventListener('click', () => app.viewer.open(id));
    grid.append(btn);
  }
  return h('section', { class: 'atts', 'aria-label': title },
    h('p', { class: 'atts__head' }, icon('clip'), `${title} ${ids.length}개`), grid);
}

/** 첨부 미리보기 창 */
export function createViewer(app) {
  const { game } = app;
  const dlg = document.getElementById('dlg-viewer');
  let current = null;

  function open(id) {
    current = id;
    const card = game.cards.get(id);
    const info = fileInfo(game, id);
    const img = cardImage(game, id);
    game.view(id);

    const close = h('button', { class: 'icobtn', type: 'submit', value: 'close', 'aria-label': '닫기' }, icon('close'));
    const head = h('header', { class: 'dlg__head' }, h('h2', { class: 'dlg__title', id: 'dlg-viewer-title' }, info.name), close);
    const body = h('div', { class: 'dlg__body' });

    if (img) {
      const pic = h('img', { class: 'viewer__img', src: img, alt: card?.title || info.name });
      const stage = h('div', { class: 'viewer__stage' }, pic);
      const st = { b: 100, c: 100, inv: false, flip: false };
      const apply = () => {
        pic.style.filter = `brightness(${st.b}%) contrast(${st.c}%) invert(${st.inv ? 1 : 0})`;
        pic.style.transform = st.flip ? 'scaleX(-1)' : '';
        bOut.textContent = `${st.b}%`;
        cOut.textContent = `${st.c}%`;
        invBtn.setAttribute('aria-pressed', String(st.inv));
        flipBtn.setAttribute('aria-pressed', String(st.flip));
        bIn.value = String(st.b);
        cIn.value = String(st.c);
      };
      const bIn = h('input', { type: 'range', min: '20', max: '200', step: '5', value: '100', id: 'v-b' });
      const cIn = h('input', { type: 'range', min: '50', max: '1000', step: '10', value: '100', id: 'v-c' });
      const bOut = h('output', { for: 'v-b' });
      const cOut = h('output', { for: 'v-c' });
      bIn.addEventListener('input', () => { st.b = Number(bIn.value); apply(); });
      cIn.addEventListener('input', () => { st.c = Number(cIn.value); apply(); });
      const invBtn = h('button', { class: 'tbtn tbtn--toggle', type: 'button', 'aria-pressed': 'false' }, '색 반전');
      const flipBtn = h('button', { class: 'tbtn tbtn--toggle', type: 'button', 'aria-pressed': 'false' }, '좌우 반전');
      const resetBtn = h('button', { class: 'tbtn', type: 'button' }, '처음대로');
      invBtn.addEventListener('click', () => { st.inv = !st.inv; apply(); });
      flipBtn.addEventListener('click', () => { st.flip = !st.flip; apply(); });
      resetBtn.addEventListener('click', () => { Object.assign(st, { b: 100, c: 100, inv: false, flip: false }); apply(); });
      const ctrl = h('div', { class: 'viewer__ctrl' },
        h('label', { class: 'slider', for: 'v-b' }, h('span', null, '밝기'), bIn, bOut),
        h('label', { class: 'slider', for: 'v-c' }, h('span', null, '대비'), cIn, cOut),
        h('div', { class: 'viewer__toggles' }, invBtn, flipBtn, resetBtn));
      apply();
      body.append(stage, ctrl);
    } else {
      body.append(h('div', { class: 'viewer__doc' }, icon('book', 'ico ico--lg'), h('p', null, '수첩 카드를 첨부한 것입니다.')));
    }

    const cardBox = h('div', { class: 'viewer__card' });
    if (card) {
      cardBox.append(h('p', { class: 'viewer__ctitle' }, card.title || id));
      if (card.desc) cardBox.append(h('p', { class: 'viewer__cdesc' }, card.desc));
      const row = h('div', { class: 'viewer__actions' });
      game.collectButton(row, id);
      cardBox.append(row);
    }
    body.append(cardBox);

    const form = h('form', { method: 'dialog', class: 'dlg__inner' }, head, body);
    dlg.replaceChildren(form);
    try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); }
    setTimeout(() => close.focus(), 30);
  }

  dlg.addEventListener('close', () => { current = null; dlg.replaceChildren(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  return { open, get current() { return current; } };
}

/** 수첩에서 첨부 고르기. open(선택된 id 배열) → Promise<id 배열 | null(취소)> */
export function createPicker(app) {
  const { game } = app;
  const dlg = document.getElementById('dlg-pick');
  let resolveFn = null;

  function open(selected = []) {
    const sel = new Set(selected);
    const collected = game.cards.collected();
    const viewed = game.cards.viewed().filter((e) => !e.collected);
    const count = h('b', { class: 'pick__count', 'aria-live': 'polite' });
    const limitNote = h('p', { class: 'pick__limit', hidden: true }, `최대 ${MAX_ATTACH}장까지 첨부할 수 있어요.`);
    const boxes = [];

    const sync = () => {
      count.textContent = `${sel.size}/${MAX_ATTACH}`;
      const full = sel.size >= MAX_ATTACH;
      for (const b of boxes) b.disabled = full && !b.checked;
      limitNote.hidden = !full;
    };

    const row = (e) => {
      const c = e.card;
      const cb = h('input', { type: 'checkbox', class: 'pick__cb', value: e.id, checked: sel.has(e.id) });
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (sel.size >= MAX_ATTACH) { cb.checked = false; return; }
          sel.add(e.id);
        } else sel.delete(e.id);
        sync();
      });
      boxes.push(cb);
      const site = game.sites[c?.site]?.name || '';
      const img = cardImage(game, e.id);
      return h('label', { class: 'pick' }, h('span', { class: 'pick__box' }, cb),
        h('span', { class: 'pick__text' },
          h('span', { class: 'pick__title' }, c?.title || e.id),
          h('span', { class: 'pick__meta' }, [site, e.collected ? '증거함' : '열람 기록'].filter(Boolean).join(' · ')),
          c?.desc ? h('span', { class: 'pick__desc' }, c.desc) : null),
        img ? h('img', { class: 'pick__thumb', src: img, alt: '', loading: 'lazy' }) : null);
    };

    const body = h('div', { class: 'dlg__body' });
    if (!collected.length && !viewed.length) {
      body.append(h('div', { class: 'pick__empty' },
        h('p', null, '아직 수첩에 아무것도 없어요.'),
        h('p', { class: 'muted' }, '메일과 사이트를 둘러보면 본 글과 사진이 열람 기록에 쌓이고, 여기에서 첨부할 수 있습니다.')));
    } else {
      if (collected.length) body.append(h('h3', { class: 'pick__sec' }, `증거함 ${collected.length}`), h('div', { class: 'pick__list' }, collected.map(row)));
      if (viewed.length) body.append(h('h3', { class: 'pick__sec' }, `열람 기록 ${viewed.length}`), h('div', { class: 'pick__list' }, viewed.map(row)));
    }

    const head = h('header', { class: 'dlg__head' },
      h('h2', { class: 'dlg__title', id: 'dlg-pick-title' }, '수첩에서 첨부하기'),
      h('button', { class: 'icobtn', type: 'submit', value: 'cancel', 'aria-label': '닫기' }, icon('close')));
    const note = h('p', { class: 'dlg__note' }, '증거함과 열람 기록에서 고르세요. 고른 카드 ', count);
    const foot = h('footer', { class: 'dlg__foot' },
      h('button', { class: 'tbtn', type: 'submit', value: 'cancel' }, '취소'),
      h('button', { class: 'tbtn tbtn--primary', type: 'submit', value: 'ok', id: 'pick-ok' }, '첨부하기'));
    const form = h('form', { method: 'dialog', class: 'dlg__inner' }, head, note, limitNote, body, foot);
    dlg.replaceChildren(form);
    sync();
    dlg.returnValue = '';
    try { dlg.showModal(); } catch { dlg.setAttribute('open', ''); }
    return new Promise((resolve) => {
      resolveFn = () => resolve(dlg.returnValue === 'ok' ? [...sel] : null);
    });
  }

  dlg.addEventListener('close', () => {
    const r = resolveFn;
    resolveFn = null;
    r?.();
    dlg.replaceChildren();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close('cancel'); });

  return { open };
}
