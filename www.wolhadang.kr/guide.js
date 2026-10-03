// 처음 오시는 분: 신당 평면도(E06). 평면도 원본은 assets/wolhadang/plan.svg 하나.
// 글자가 사이트 글꼴로 보이도록 SVG를 불러와 페이지 안에 그대로 넣는다. '크게 보기'는 확대 보기 창.

import { start } from './wolhadang.js';
import { openViewer } from './viewer.js';

const game = start({ page: 'guide', title: '처음 오시는 분 — 월하당' });
const box = document.getElementById('plan');
const zoomBtn = document.getElementById('plan-zoom');
const SRC = '../assets/wolhadang/plan.svg';
let svg = null;

async function load() {
  try {
    const res = await fetch(SRC);
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    svg = document.importNode(doc.documentElement, true);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-labelledby', 'plan-svg-t');
    box.replaceChildren(svg);
  } catch {
    // 불러오지 못하면 그림 파일로라도 보여 준다
    const img = new Image();
    img.src = SRC;
    img.alt = '월하당 신당 평면도';
    img.width = 640;
    img.height = 520;
    box.replaceChildren(img);
  }
  box.removeAttribute('aria-busy');
}

zoomBtn.addEventListener('click', () => {
  const item = svg
    ? { title: '신당 평면도', date: '처음 오시는 분', node: svg, card: 'E06', caption: '<b>신당 평면도</b> — 위쪽이 북쪽. 안방에서 뒤꼍으로 나가는 문은 없고, 뒤꼍은 옆 골목으로 마당과 이어집니다.' }
    : { title: '신당 평면도', date: '처음 오시는 분', src: SRC, card: 'E06', caption: '' };
  openViewer(game, { items: [item], filters: false });
});

load();
