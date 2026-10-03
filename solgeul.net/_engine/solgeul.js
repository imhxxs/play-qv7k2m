// 솔글(solgeul.net) 블로그 엔진 — 모든 솔글 블로그가 함께 쓴다.
//
// 블로그 폴더 하나 = 블로그 하나: solgeul.net/<이름>/{index,post}.html + posts.js(데이터) + skin.css(스킨)
// 페이지는 이렇게만 쓴다.
//
//   <div id="sg-root" class="sg"></div>
//   <script type="module">
//     import { startBlog } from '../_engine/solgeul.js';
//     import blog from './posts.js';
//     startBlog({ blog, page: 'post', widgets: { obang: renderObangLock } });
//   </script>
//
// 엔진이 하는 일: boot(방문 플래그·주소창·수첩) · 글 목록(카테고리 걸러 보기) · 글 상세 · 사진 확대 ·
// 댓글(플레이어 닉네임, md1:site.<siteId>에 저장, 다른 탭과 동기화) · 글벗 목록 · 프로필 · 글벗 맺기.
// 비밀글(post.secret)은 본문 대신 widgets[post.lock](el, ctx)를 부른다(잠금 위젯은 블로그마다 다르다).
//
// 데이터 형식은 solgeul.net/myeongwol/posts.js 머리말을 본다.

import { boot } from '../../src/game.js';

const SERVICE = '솔글';

export function startBlog({ blog, page = 'index', widgets = {} }) {
  const params = new URLSearchParams(location.search);
  const posts = [...blog.posts].sort((a, b) => stamp(b).localeCompare(stamp(a)));
  const post = page === 'post' ? blog.posts.find((p) => String(p.id) === String(params.get('id') || '').trim()) || null : null;
  const cat = page === 'index' ? blog.categories.find((c) => c.id === params.get('cat')) || null : null;

  const title = page === 'post'
    ? (post ? `${post.title} · ${blog.title}` : `글을 찾을 수 없습니다 · ${blog.title}`)
    : (cat ? `${cat.name} · ${blog.title}` : `${blog.title} · ${SERVICE}`);

  const game = boot({ siteId: blog.siteId, page, title });
  const key = 'site.' + blog.siteId;
  const ctx = { game, blog, posts, post, cat, page, key, widgets, root: document.getElementById('sg-root') };
  if (!ctx.root) { console.warn('[솔글] #sg-root가 없습니다'); return game; }

  ctx.asset = (p) => (/^(data:|https?:)/.test(p) ? p : game.root + p);
  ctx.state = () => game.get(key, {}) || {};

  render(ctx);
  // 다른 탭에서 댓글·글벗 상태가 바뀌면 다시 그린다(입력 중인 댓글은 지키기 위해 부분만)
  game.on('change:' + key, (e) => { if (e.source === 'remote') refreshDynamic(ctx); });
  game.on('profile', () => refreshDynamic(ctx));
  return game;
}

// ── 그리기 ────────────────────────────────────────────────────

function render(ctx) {
  const { root, blog, page, post } = ctx;
  root.innerHTML = '';
  root.dataset.blog = blog.handle.replace(/^@/, '');
  root.append(serviceBar(ctx));

  const shell = el('div', 'sg-shell');
  shell.append(blogHead(ctx));
  const layout = el('div', 'sg-layout');
  const main = el('main', 'sg-main');
  main.id = 'sg-main';
  if (page === 'post') {
    if (post) main.append(postView(ctx));
    else main.append(notFound(ctx));
  } else {
    main.append(listView(ctx));
  }
  layout.append(main, aside(ctx));
  shell.append(layout);
  root.append(shell, footer(ctx));
  ctx.game.hydrate(root);
  wireLightbox(ctx, main);
}

function refreshDynamic(ctx) {
  const box = ctx.root.querySelector('.sg-comments');
  if (box && ctx.post) renderComments(ctx, box, { keepDraft: true });
  const counts = ctx.root.querySelectorAll('[data-ccount]');
  for (const n of counts) n.textContent = String(commentCount(ctx, Number(n.dataset.ccount)));
  const fb = ctx.root.querySelector('.sg-follow');
  if (fb) paintFollow(ctx, fb);
}

function serviceBar(ctx) {
  const bar = el('header', 'sg-service');
  bar.innerHTML = `
    <a class="sg-service__logo" href="index.html" aria-label="${SERVICE} — ${esc(ctx.blog.title)} 첫 화면">
      ${LOGO}<span class="sg-service__word">${SERVICE}</span>
    </a>
    <span class="sg-service__crumb" aria-hidden="true">${esc(ctx.blog.handle)}</span>`;
  return bar;
}

function blogHead(ctx) {
  const { blog, cat, page } = ctx;
  const head = el('header', 'sg-head');
  const counts = Object.fromEntries(blog.categories.map((c) => [c.id, blog.posts.filter((p) => p.cat === c.id).length]));
  const cur = page === 'index' ? (cat ? cat.id : 'all') : (ctx.post?.cat || '');
  head.innerHTML = `
    <div class="sg-head__mark" aria-hidden="true">${avatar(blog.profile.avatar)}</div>
    <p class="sg-head__handle">${esc(blog.handle)}</p>
    <${page === 'index' ? 'h1' : 'p'} class="sg-head__title"><a href="index.html">${esc(blog.title)}</a></${page === 'index' ? 'h1' : 'p'}>
    <p class="sg-head__sub">${esc(blog.subtitle)}</p>
    <nav class="sg-cats" aria-label="카테고리">
      <a href="index.html"${cur === 'all' ? ' aria-current="page"' : ''}>전체 <span>${blog.posts.length}</span></a>
      ${blog.categories.map((c) => `<a href="index.html?cat=${c.id}"${cur === c.id ? ' aria-current="page"' : ''}>${esc(c.name)} <span>${counts[c.id]}</span></a>`).join('')}
    </nav>`;
  return head;
}

function listView(ctx) {
  const { posts, cat } = ctx;
  const wrap = el('section', 'sg-list');
  wrap.setAttribute('aria-label', cat ? `${cat.name} 글 목록` : '글 목록');
  const items = posts.filter((p) => !cat || p.cat === cat.id);
  if (cat) {
    const h = el('h2', 'sg-list__title');
    h.textContent = `${cat.name} · ${items.length}개의 글`;
    wrap.append(h);
  } else {
    const h = el('h2', 'sg-sr');
    h.textContent = '글 목록';
    wrap.append(h);
  }
  const ol = el('ol', 'sg-items');
  items.forEach((p, i) => ol.append(listItem(ctx, p, !cat && i === 0)));
  wrap.append(ol);
  if (!items.length) wrap.append(Object.assign(el('p', 'sg-empty'), { textContent: '아직 글이 없습니다.' }));
  return wrap;
}

function listItem(ctx, p, feature) {
  const li = el('li', 'sg-item' + (feature ? ' sg-item--feature' : '') + (p.secret ? ' sg-item--secret' : ''));
  const catName = ctx.blog.categories.find((c) => c.id === p.cat)?.name || '';
  const thumb = !p.secret && firstPhoto(ctx, p);
  const ex = p.secret ? '비밀글입니다.' : excerpt(ctx, p);
  const n = commentCount(ctx, p.id);
  li.innerHTML = `
    <a class="sg-item__link" href="post.html?id=${p.id}">
      <span class="sg-item__text">
        <span class="sg-item__meta"><span class="sg-item__cat">${esc(catName)}</span><time datetime="${isoDate(p.date)}">${esc(p.date)}</time></span>
        <span class="sg-item__title">${p.secret ? LOCK_ICON : ''}${esc(p.title)}</span>
        <span class="sg-item__ex">${esc(ex)}</span>
        ${p.secret ? '' : `<span class="sg-item__c">댓글 <span data-ccount="${p.id}">${n}</span></span>`}
      </span>
      ${thumb ? `<span class="sg-item__thumb ${thumb.kind === 'film' ? 'is-film' : 'is-screen'}" style="--r:${thumb.ratio}"><img src="${esc(ctx.asset(thumb.src))}" alt="" loading="lazy" decoding="async"></span>` : ''}
    </a>`;
  return li;
}

function postView(ctx) {
  const { post, blog, game } = ctx;
  const art = el('article', 'sg-post' + (post.secret ? ' sg-post--secret' : ''));
  const catName = blog.categories.find((c) => c.id === post.cat)?.name || '';
  const headEl = el('header', 'sg-post__head');
  headEl.innerHTML = `
    <a class="sg-post__cat" href="index.html?cat=${post.cat}">${esc(catName)}</a>
    <h1 class="sg-post__title">${post.secret ? LOCK_ICON : ''}${esc(post.title)}</h1>
    <p class="sg-post__meta"><time datetime="${isoDate(post.date)}T${post.time || '00:00'}">${esc(post.date)} ${esc(post.time || '')}</time><span aria-hidden="true">·</span><span>${esc(blog.profile.name)}</span>${post.secret ? '<span aria-hidden="true">·</span><span>비밀글</span>' : ''}</p>`;
  art.append(headEl);

  const body = el('div', 'sg-post__body');
  if (post.secret) {
    const w = ctx.widgets[post.lock];
    const note = el('p', 'sg-secret__note');
    note.textContent = '비밀글입니다. 글쓴이가 정한 방법으로만 열 수 있어요.';
    body.append(note);
    const slot = el('div', 'sg-secret');
    body.append(slot);
    if (typeof w === 'function') {
      try { w(slot, { game, blog, post, key: ctx.key, asset: ctx.asset }); } catch (e) { console.error('[솔글] 잠금 위젯 오류', e); }
    } else slot.textContent = '이 비밀글은 지금 열 수 없습니다.';
  } else {
    body.setAttribute('data-fill', '');
    if (post.view) body.dataset.view = post.view;
    for (const b of post.body) body.append(block(ctx, b));
  }
  art.append(body);

  if (!post.secret) {
    const end = el('div', 'sg-post__end');
    end.innerHTML = `<span class="sg-post__endmark" aria-hidden="true">${END_MARK}</span>`;
    if (post.card) {
      const c = document.createElement('md-collect');
      c.setAttribute('card', post.card);
      end.append(c);
    }
    art.append(end);
  }

  art.append(postNav(ctx));
  if (!post.secret) {
    const box = el('section', 'sg-comments' + (post.waiting ? ' sg-comments--waiting' : ''));
    box.setAttribute('aria-labelledby', 'sg-ctitle');
    renderComments(ctx, box);
    art.append(box);
  }
  return art;
}

function block(ctx, b) {
  if (typeof b === 'string') {
    const p = el('p');
    p.innerHTML = b;
    return p;
  }
  if (b.photo || b.photos) {
    const keys = b.photos || [b.photo];
    const fig = el('figure', 'sg-fig' + (keys.length > 1 ? ' sg-fig--pair' : ''));
    const row = el('div', 'sg-fig__row');
    for (const k of keys) row.append(photoEl(ctx, k));
    fig.append(row);
    if (b.caption) {
      const cap = el('figcaption', 'sg-fig__cap');
      cap.textContent = b.caption;
      fig.append(cap);
    }
    return fig;
  }
  if (b.link) {
    const L = b.link;
    const a = ctx.game.link(L.site, L.page || 'index', L.query, { className: 'sg-linkcard' });
    a.innerHTML = `<span class="sg-linkcard__t">${esc(L.title)}</span><span class="sg-linkcard__d">${esc(L.desc || '')}</span><span class="sg-linkcard__go" aria-hidden="true">새 탭 ↗</span>`;
    const wrap = el('p', 'sg-linkwrap');
    wrap.append(a);
    return wrap;
  }
  if (b.note) {
    const p = el('p', 'sg-note');
    p.innerHTML = b.note;
    return p;
  }
  return document.createTextNode('');
}

function photoEl(ctx, k) {
  const ph = ctx.blog.photos[k];
  if (!ph) { console.warn('[솔글] 없는 사진', k); return document.createTextNode(''); }
  const btn = el('button', `sg-photo ${ph.kind === 'screen' ? 'is-screen' : 'is-film'}${ph.leak ? ' is-leak' : ''}`);
  btn.type = 'button';
  btn.dataset.photo = k;
  btn.style.setProperty('--r', String(ph.ratio || 1.5));
  btn.setAttribute('aria-label', `사진 크게 보기: ${ph.alt}`);
  btn.innerHTML = `<img src="${esc(ctx.asset(ph.src))}" alt="${esc(ph.alt)}" loading="lazy" decoding="async">${ph.stamp ? `<span class="sg-stamp" aria-hidden="true">${esc(ph.stamp)}</span>` : ''}<span class="sg-photo__zoom" aria-hidden="true">${ZOOM_ICON}</span>`;
  return btn;
}

function postNav(ctx) {
  const { posts, post } = ctx;
  const i = posts.findIndex((p) => p.id === post.id);
  const newer = posts[i - 1];
  const older = posts[i + 1];
  const nav = el('nav', 'sg-pnav');
  nav.setAttribute('aria-label', '이전 글, 다음 글');
  const link = (p, label, cls) => (p
    ? `<a class="sg-pnav__a ${cls}" href="post.html?id=${p.id}"><span class="sg-pnav__l">${label}</span><span class="sg-pnav__t">${p.secret ? LOCK_ICON : ''}${esc(p.title)}</span></a>`
    : `<span class="sg-pnav__a ${cls} is-none"><span class="sg-pnav__l">${label}</span><span class="sg-pnav__t">${label === '이전 글' ? '첫 글입니다' : '마지막 글입니다'}</span></span>`);
  nav.innerHTML = `${link(older, '이전 글', 'is-older')}<a class="sg-pnav__list" href="index.html">목록</a>${link(newer, '다음 글', 'is-newer')}`;
  return nav;
}

function notFound(ctx) {
  const s = el('section', 'sg-404');
  s.innerHTML = `<h1 class="sg-404__t">글을 찾을 수 없습니다</h1><p>지워졌거나 주소가 바뀐 글이에요.</p><p><a class="sg-btn" href="index.html">${esc(ctx.blog.title)} 글 목록</a></p>`;
  return s;
}

// ── 사이드바(프로필·카테고리·글벗·방문자) ───────────────────────

function aside(ctx) {
  const { blog, game } = ctx;
  const a = el('aside', 'sg-aside');
  a.setAttribute('aria-label', '블로그 정보');
  const prof = el('section', 'sg-box sg-profile');
  prof.innerHTML = `
    <h2 class="sg-box__t">프로필</h2>
    <div class="sg-profile__top">
      <span class="sg-profile__av" aria-hidden="true">${avatar(blog.profile.avatar)}</span>
      <span class="sg-profile__who"><b>${esc(blog.profile.name)}</b><span>${esc(blog.handle)}</span></span>
    </div>
    <p class="sg-profile__bio">${esc(blog.profile.bio)}</p>
    ${blog.profile.about ? `<p class="sg-profile__about">${esc(blog.profile.about)}</p>` : ''}
    <p class="sg-profile__stat">글 ${blog.posts.length} · 글벗 ${blog.friends.length} · 최근 글 ${esc(blog.profile.lastPost || '')}</p>`;
  const fb = el('button', 'sg-follow');
  fb.type = 'button';
  fb.addEventListener('click', () => {
    const on = !ctx.state().friend;
    game.update(ctx.key, (d) => { d.friend = on; });
    paintFollow(ctx, fb, on);
    game.toast(on ? `${blog.profile.name}님과 글벗이 되었어요.` : '글벗을 끊었어요.');
  });
  paintFollow(ctx, fb);
  prof.append(fb);
  a.append(prof);

  const fr = el('section', 'sg-box sg-friends');
  fr.innerHTML = `<h2 class="sg-box__t">글벗 <span>${blog.friends.length}</span></h2>`;
  const ul = el('ul', 'sg-friends__list');
  blog.friends.forEach((f, fi) => {
    const li = el('li');
    if (f.siteId && game.sites[f.siteId]) {
      const link = game.link(f.siteId, 'index', '', { className: 'sg-friend' });
      link.innerHTML = friendInner(f);
      li.append(link);
    } else {
      const b = el('button', 'sg-friend is-off');
      b.type = 'button';
      b.setAttribute('aria-describedby', 'sg-fnote-' + fi);
      b.innerHTML = friendInner(f) + '<span class="sg-friend__badge">준비 중</span>';
      const note = el('p', 'sg-friend__note');
      note.id = 'sg-fnote-' + fi;
      note.setAttribute('role', 'status');
      b.addEventListener('click', () => { note.textContent = '이 블로그는 준비 중입니다.'; });
      li.append(b, note);
    }
    ul.append(li);
  });
  fr.append(ul);
  a.append(fr);

  const cnt = el('section', 'sg-box sg-counter');
  cnt.innerHTML = `<h2 class="sg-sr">방문자</h2><p>오늘 <b>${fmt(blog.counter.today)}</b><span aria-hidden="true"> · </span>전체 <b>${fmt(blog.counter.total)}</b></p>`;
  a.append(cnt);
  return a;
}

function friendInner(f) {
  return `<span class="sg-friend__av" aria-hidden="true">${esc([...f.name][0])}</span><span class="sg-friend__txt"><b>${esc(f.title)}</b><span>${esc(f.address.replace(/^solgeul\.net\//, ''))} · ${esc(f.name)}</span></span>`;
}

function paintFollow(ctx, btn, forced) {
  const on = forced ?? !!ctx.state().friend;
  btn.setAttribute('aria-pressed', String(on));
  btn.textContent = on ? '글벗 맺음' : '글벗 맺기';
}

function footer(ctx) {
  const f = el('footer', 'sg-foot');
  f.innerHTML = `
    <p class="sg-foot__brand">${LOGO}<span>${SERVICE}</span> — 솔잎처럼 가늘고 오래 쓰는 글</p>
    <p class="sg-foot__fine">${esc(ctx.blog.title)}의 글과 사진은 글쓴이에게 있습니다 · © 2026 ${SERVICE}</p>
    <p class="sg-foot__fine">게임 속 가상 블로그 서비스입니다. 댓글은 이 브라우저에만 남습니다.</p>`;
  return f;
}

// ── 댓글 ───────────────────────────────────────────────────────

function playerComments(ctx, postId) {
  const all = ctx.state().comments || {};
  return Array.isArray(all[postId]) ? all[postId] : [];
}

function commentCount(ctx, postId) {
  const p = ctx.blog.posts.find((x) => x.id === postId);
  const own = (p?.comments || []).reduce((n, c) => n + 1 + (c.replies?.length || 0), 0);
  return own + playerComments(ctx, postId).length;
}

function renderComments(ctx, box, { keepDraft = false } = {}) {
  const { post, game } = ctx;
  const prevText = keepDraft ? box.querySelector('textarea')?.value || '' : '';
  const hadFocus = keepDraft && box.contains(document.activeElement) && document.activeElement?.tagName === 'TEXTAREA';
  const mine = playerComments(ctx, post.id);
  const list = [
    ...(post.comments || []).map((c) => ({ ...c, kind: 'npc' })),
    ...mine.map((c) => ({ name: c.name, date: c.date, text: c.text, id: c.id, kind: 'me' })),
  ].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const n = commentCount(ctx, post.id);

  box.innerHTML = `<h2 class="sg-comments__t" id="sg-ctitle">댓글 <span>${n}</span></h2>`;
  const ol = el('ol', 'sg-clist');
  for (const c of list) ol.append(commentEl(ctx, c));
  if (!list.length) {
    const li = el('li', 'sg-clist__empty');
    li.textContent = '아직 댓글이 없습니다.';
    ol.append(li);
  }
  box.append(ol);

  const name = game.profile?.name || '';
  const form = el('form', 'sg-cform');
  form.noValidate = true;
  const waiting = !!post.waiting;
  form.innerHTML = `
    <label class="sg-cform__who" for="sg-ctext">${name ? `<b>${esc(name)}</b>${esc(game.josa(name, '으로/로').slice(name.length))} 남깁니다` : '댓글 남기기'}</label>
    <div class="sg-cbox">
      <textarea id="sg-ctext" name="text" rows="3" maxlength="300" placeholder="${waiting ? ' ' : '따뜻한 말을 남겨 주세요.'}" aria-describedby="sg-cnote"></textarea>
      ${waiting ? '<span class="sg-caret" aria-hidden="true"></span>' : ''}
    </div>
    <div class="sg-cform__foot">
      <span class="sg-cform__count" aria-live="off"><span class="sg-cform__n">0</span>/300</span>
      <button type="submit" class="sg-btn sg-btn--ink">댓글 남기기</button>
    </div>
    <p class="sg-cform__note" id="sg-cnote">게임 속 블로그예요. 실제 개인정보는 적지 마세요.</p>
    <p class="sg-cform__msg" role="status"></p>`;
  const ta = form.querySelector('textarea');
  const counter = form.querySelector('.sg-cform__n');
  const msg = form.querySelector('.sg-cform__msg');
  ta.value = prevText;
  counter.textContent = String([...ta.value].length);
  ta.addEventListener('input', () => { counter.textContent = String([...ta.value].length); msg.textContent = ''; });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = ta.value.replace(/\r\n?/g, '\n').trim();
    if (!text) { msg.textContent = '댓글 내용을 적어 주세요.'; ta.focus(); return; }
    const t = Date.now();
    const id = 'c' + t.toString(36) + Math.random().toString(36).slice(2, 6);
    const item = { id, name: game.profile?.name || '지나가는 사람', text: text.slice(0, 300), date: commentDate(game, t), t };
    const pid = String(post.id);
    game.update(ctx.key, (d) => {
      d.comments ||= {};
      const arr = Array.isArray(d.comments[pid]) ? d.comments[pid] : (d.comments[pid] = []);
      if (!arr.some((x) => x.id === id)) arr.push(item);
    });
    ta.value = '';
    renderComments(ctx, box);
    box.querySelector('.sg-cform__msg').textContent = '댓글을 남겼어요.';
    refreshCounts(ctx);
  });
  box.append(form);
  if (hadFocus) ta.focus();
}

function refreshCounts(ctx) {
  for (const n of ctx.root.querySelectorAll('[data-ccount]')) n.textContent = String(commentCount(ctx, Number(n.dataset.ccount)));
}

function commentEl(ctx, c) {
  const li = el('li', 'sg-c' + (c.kind === 'me' ? ' sg-c--me' : '') + (c.author ? ' sg-c--author' : ''));
  li.innerHTML = commentInner(ctx, c);
  if (c.replies?.length) {
    const rl = el('ol', 'sg-creplies');
    for (const r of c.replies) {
      const ri = el('li', 'sg-c sg-c--reply' + (r.author ? ' sg-c--author' : ''));
      ri.innerHTML = commentInner(ctx, r);
      rl.append(ri);
    }
    li.querySelector('.sg-c__b').append(rl);
  }
  if (c.kind === 'me') {
    const del = el('button', 'sg-c__del');
    del.type = 'button';
    del.textContent = '지우기';
    del.setAttribute('aria-label', '내 댓글 지우기');
    del.addEventListener('click', () => {
      const pid = String(ctx.post.id);
      ctx.game.update(ctx.key, (d) => {
        if (Array.isArray(d.comments?.[pid])) d.comments[pid] = d.comments[pid].filter((x) => x.id !== c.id);
      });
      const box = ctx.root.querySelector('.sg-comments');
      renderComments(ctx, box, { keepDraft: true });
      refreshCounts(ctx);
    });
    li.querySelector('.sg-c__h').append(del);
  }
  return li;
}

function commentInner(ctx, c) {
  const isAuthor = !!c.author;
  const av = isAuthor ? avatar(ctx.blog.profile.avatar) : esc([...String(c.name || '?')][0] || '?');
  return `<span class="sg-c__av${isAuthor ? ' is-author' : ''}" aria-hidden="true">${av}</span>
    <div class="sg-c__b">
      <div class="sg-c__h"><b class="sg-c__n">${esc(c.name)}</b>${isAuthor ? '<span class="sg-c__badge">글쓴이</span>' : ''}${c.kind === 'me' ? '<span class="sg-c__badge is-me">나</span>' : ''}<time class="sg-c__d">${esc(c.date)}</time></div>
      <p class="sg-c__x">${esc(c.text).replace(/\n/g, '<br>')}</p>
    </div>`;
}

function commentDate(game, t) {
  const d = new Date(t);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${String(game.gameDate || '2026-09-27').replace(/-/g, '.')} ${hh}:${mm}`;
}

// ── 사진 확대 ──────────────────────────────────────────────────

function wireLightbox(ctx, scope) {
  const buttons = [...scope.querySelectorAll('.sg-photo')];
  if (!buttons.length) return;
  buttons.forEach((b, i) => b.addEventListener('click', () => openLightbox(ctx, buttons, i)));
}

let lb = null;
function openLightbox(ctx, buttons, index) {
  const items = buttons.map((b) => ({ key: b.dataset.photo, ph: ctx.blog.photos[b.dataset.photo], btn: b }));
  if (!lb) lb = buildLightbox();
  let i = index;
  let zoomed = false;
  const opener = document.activeElement;
  const show = () => {
    const it = items[i];
    const cap = it.btn.closest('figure')?.querySelector('figcaption')?.textContent || '';
    lb.frame.className = `sg-lb__frame ${it.ph.kind === 'screen' ? 'is-screen' : 'is-film'}${it.ph.leak ? ' is-leak' : ''}`;
    lb.img.src = ctx.asset(it.ph.src);
    lb.img.alt = it.ph.alt;
    lb.frame.style.setProperty('--r', String(it.ph.ratio || 1.5));
    lb.stamp.textContent = it.ph.stamp || '';
    lb.stamp.hidden = !it.ph.stamp;
    lb.cap.textContent = cap;
    lb.alt.textContent = it.ph.alt;
    lb.count.textContent = `${i + 1} / ${items.length}`;
    lb.prev.disabled = i === 0;
    lb.next.disabled = i === items.length - 1;
    lb.prev.hidden = lb.next.hidden = lb.count.hidden = items.length < 2;
    setZoom(false);
  };
  const setZoom = (on) => {
    zoomed = on;
    lb.el.classList.toggle('is-zoom', on);
    lb.zoom.setAttribute('aria-pressed', String(on));
    lb.zoom.textContent = on ? '원래 크기' : '크게 보기';
    if (on) requestAnimationFrame(() => {
      const s = lb.stage;
      s.scrollLeft = (s.scrollWidth - s.clientWidth) / 2;
      s.scrollTop = (s.scrollHeight - s.clientHeight) / 2;
    });
  };
  const close = () => {
    lb.el.hidden = true;
    document.documentElement.classList.remove('sg-lb-open');
    document.removeEventListener('keydown', onKey, true);
    lb.handlers.forEach(([n, ev, fn]) => n.removeEventListener(ev, fn));
    lb.handlers = [];
    opener?.focus?.();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'ArrowLeft' && i > 0) { i--; show(); }
    else if (e.key === 'ArrowRight' && i < items.length - 1) { i++; show(); }
    else if (e.key === 'Tab') trapTab(e, lb.el);
  };
  const on = (n, ev, fn) => { n.addEventListener(ev, fn); lb.handlers.push([n, ev, fn]); };
  on(lb.closeBtn, 'click', close);
  on(lb.prev, 'click', () => { if (i > 0) { i--; show(); } });
  on(lb.next, 'click', () => { if (i < items.length - 1) { i++; show(); } });
  on(lb.zoom, 'click', () => setZoom(!zoomed));
  on(lb.img, 'click', () => setZoom(!zoomed));
  on(lb.el, 'click', (e) => { if (e.target === lb.el || e.target === lb.stage) close(); });
  document.addEventListener('keydown', onKey, true);
  show();
  lb.el.hidden = false;
  document.documentElement.classList.add('sg-lb-open');
  lb.closeBtn.focus();
  ctx.game.sfx('paper', { gain: 0.5 });
}

function buildLightbox() {
  const wrap = el('div', 'sg-lb');
  wrap.hidden = true;
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', '사진 크게 보기');
  wrap.innerHTML = `
    <div class="sg-lb__bar">
      <span class="sg-lb__count"></span>
      <button type="button" class="sg-lb__btn sg-lb__zoom" aria-pressed="false">크게 보기</button>
      <button type="button" class="sg-lb__btn sg-lb__close" aria-label="닫기">${CLOSE_ICON}<span>닫기</span></button>
    </div>
    <div class="sg-lb__stage">
      <div class="sg-lb__frame"><img alt=""><span class="sg-stamp" aria-hidden="true"></span></div>
    </div>
    <div class="sg-lb__foot">
      <button type="button" class="sg-lb__btn sg-lb__prev" aria-label="이전 사진">‹ 이전</button>
      <div class="sg-lb__text"><p class="sg-lb__cap"></p><p class="sg-lb__alt"></p></div>
      <button type="button" class="sg-lb__btn sg-lb__next" aria-label="다음 사진">다음 ›</button>
    </div>`;
  document.body.append(wrap);
  const q = (s) => wrap.querySelector(s);
  return {
    el: wrap, stage: q('.sg-lb__stage'), frame: q('.sg-lb__frame'), img: q('.sg-lb__frame img'), stamp: q('.sg-lb__frame .sg-stamp'),
    cap: q('.sg-lb__cap'), alt: q('.sg-lb__alt'), count: q('.sg-lb__count'),
    prev: q('.sg-lb__prev'), next: q('.sg-lb__next'), zoom: q('.sg-lb__zoom'), closeBtn: q('.sg-lb__close'),
    handlers: [],
  };
}

function trapTab(e, root) {
  const f = [...root.querySelectorAll('button:not([disabled]):not([hidden])')];
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ── 작은 도우미 ────────────────────────────────────────────────

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

const stamp = (p) => `${p.date} ${p.time || '00:00'}`;
const isoDate = (d) => String(d).replace(/\./g, '-');
const fmt = (n) => Number(n || 0).toLocaleString('ko-KR');

function firstPhoto(ctx, p) {
  for (const b of p.body || []) {
    if (b && typeof b === 'object' && (b.photo || b.photos)) return ctx.blog.photos[b.photo || b.photos[0]] || null;
  }
  return null;
}

function excerpt(ctx, p) {
  const first = (p.body || []).filter((b) => typeof b === 'string').slice(0, 2).join(' ');
  const text = ctx.game.fill(first.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
  return text.length > 86 ? text.slice(0, 84).trimEnd() + '…' : text;
}

function avatar(kind) {
  if (kind === 'moon') return MOON;
  return '';
}

const LOGO = '<svg class="sg-logo" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M12 9 7 4M12 9l5-5M12 13 6.5 8.5M12 13l5.5-4.5M12 17l-6-4M12 17l6-4" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="12" cy="3.4" r="1.1" fill="currentColor"/></svg>';
const MOON = '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#2c2924"/><circle cx="24" cy="22" r="13.5" fill="#efe3c8" opacity=".18"/><circle cx="24" cy="22" r="12.5" fill="#efe4cc"/><circle cx="21.5" cy="20" r="9" fill="#f8f2e4"/><circle cx="20" cy="19" r="2" fill="#e2d4b5" opacity=".8"/><circle cx="28" cy="25" r="1.4" fill="#e2d4b5" opacity=".7"/><path d="M7 33c6-2 10 1 16-.5s9-2.5 18 .5" fill="none" stroke="#8d8576" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><path d="M11 37c5-1 9 .5 14-.4s8-1.6 13 0" fill="none" stroke="#8d8576" stroke-width="1" stroke-linecap="round" opacity=".45"/></svg>';
const LOCK_ICON = '<svg class="sg-lock" viewBox="0 0 16 16" aria-label="비밀글" role="img"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M5.2 7V5.2a2.8 2.8 0 0 1 5.6 0V7" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const ZOOM_ICON = '<svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m12.4 12.4 4.4 4.4M8.5 6v5M6 8.5h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const CLOSE_ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const END_MARK = '<svg viewBox="0 0 40 12"><path d="M2 6h12M26 6h12" stroke="currentColor" stroke-width=".8"/><path d="M23 6a3.2 3.2 0 1 1-2.2-3.05A2.6 2.6 0 0 0 23 6z" fill="currentColor"/></svg>';
