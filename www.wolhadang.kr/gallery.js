// 신당 갤러리: 사진 목록 + 확대 보기(밝기·대비). gallery.html?photo=<id>로 바로 열 수 있다.
// 단서 사진: E08 장군님 상과 명두(9/6), E07 장구 40년 최경필 선생님.

import { start, esc } from './wolhadang.js';
import { openViewer } from './viewer.js';

const game = start({ page: 'gallery', title: '신당 갤러리 — 월하당' });
const IMG = '../assets/wolhadang/gallery/';

export const PHOTOS = [
  {
    id: 'myeongdu', card: 'E08', date: '2026.09.06', src: IMG + 'myeongdu.svg',
    title: '장군님 상과 명두',
    caption: '막내 내림굿 다음 날. 장군님 상 위 40cm쯤 되는 벽, 무신도 오른쪽에 막내의 명두를 모셨습니다. 명두 가운데에는 해와 달(日月), 북두칠성이 새겨져 있고 바깥 테두리는 민무늬라 거울처럼 반들거려요. 맨 위는 현판 \'月下堂\'.',
    alt: '신당 북쪽 벽. 맨 위에 月下堂 현판, 그 아래 왼쪽에 최영 장군 무신도, 오른쪽 벽에 둥근 놋거울 명두가 걸려 있다. 명두 가운데에는 日月과 북두칠성이 새겨져 있고 바깥 띠는 민무늬다. 아래에는 상보를 덮은 장군님 상과 상차림.',
  },
  {
    id: 'janggu', card: 'E07', date: '2025.10.18', src: IMG + 'janggu.svg',
    title: '장구 40년, 최경필 선생님',
    caption: '스무 해 넘게 우리 집 장구를 쳐 주신 선생님. 왼손 궁채가 북편을 울리면 신당 마루가 같이 웁니다. (2025 가을 진적굿)',
    alt: '회색 누빔 생활한복을 입은 사람이 장구를 치는 모습. 얼굴은 화면 밖. 오른쪽 앞, 궁채를 쥔 왼손이 크게 보인다. 궁채 자루 위에 올린 검지는 끝마디가 없다. 왼손목에는 술 달린 오색실을 감았다.',
  },
  {
    id: 'daegam', date: '2025.10.18', src: IMG + 'daegam.svg',
    title: '대감거리 — 대감님 복 받으세요',
    caption: '2025 가을 진적굿. 대감거리는 굿판에서 제일 흥겨운 거리예요. 손님들 복 많이 받아 가셨습니다.',
    alt: '굿판 뒷모습. 쾌자를 입은 만신이 부채를 펼쳐 들고, 앉은 손님들의 뒷머리 너머로 지화가 보인다.',
  },
  {
    id: 'spring', date: '2026.04.05', src: IMG + 'spring.svg',
    title: '봄맞이 신당 단장 — 지화 새로 접기',
    caption: '봄맞이로 지화를 새로 접었어요. 빨강·분홍·노랑 꽃은 시렁에, 흰 꽃은 장군님 상 옆에 올립니다.',
    alt: '상 위에 색종이와 가위, 다 접은 종이꽃(지화) 여러 송이가 놓여 있다.',
  },
  {
    id: 'rice-share', date: '2026.03.03', src: IMG + 'rice-share.svg',
    title: '정월 대보름 쌀 한 말 나눔',
    caption: '"굿값 없다고 못 오는 사람 없게 해라." 올해도 쌀 한 말씩 나눴습니다.',
    alt: '마당에 쌀 포대가 쌓여 있고 나무 됫박에 쌀이 소복하다.',
  },
  {
    id: 'mugu', date: '2026.01.15', src: IMG + 'mugu.svg',
    title: '만신님 방울과 부채',
    caption: '만신님 무구. 방울과 부채는 굿 날 아침에 청수로 닦아 올립니다.',
    alt: '붉은 천 위에 펼친 부채와 오색 천을 단 방울 한 묶음.',
  },
  {
    id: 'persimmon', date: '2025.11.08', src: IMG + 'persimmon.svg',
    title: '마당 감나무 — 까치밥',
    caption: '감을 따고 꼭대기 몇 개는 까치밥으로 남겨 둡니다. 어머니가 꼭 그렇게 하라셨어요.',
    alt: '가을 하늘 아래 감나무 가지 끝에 주홍 감 몇 개가 남아 있고 까치 한 마리가 앉아 있다.',
  },
  {
    id: 'hall', date: '2025.10.14', src: IMG + 'hall.svg',
    title: '서월산 아래 월하당',
    caption: '홈페이지 연 날 찍은 신당 전경. 달 아래 집, 월하당(月下堂).',
    alt: '해 질 녘 서월산 아래 기와지붕 신당. 마당에 감나무가 있고 하늘에 초승달이 떠 있다.',
  },
];

const list = document.getElementById('gallery');
list.innerHTML = PHOTOS.map((p, i) => `
  <li>
    <figure${p.card ? ` data-view="${p.card}"` : ''}>
      <button type="button" class="thumb" data-i="${i}" aria-label="크게 보기 — ${esc(p.title)}">
        <img src="${p.src}" width="800" height="600" alt="${esc(p.alt)}" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async">
      </button>
      <figcaption><b>${esc(p.title)}</b><span class="d">${esc(p.date)}</span></figcaption>
      ${p.card ? `<div class="wh-collect"><md-collect card="${p.card}"></md-collect></div>` : ''}
    </figure>
  </li>`).join('');
game.hydrate(list);

let viewer = null;
function open(i) {
  viewer?.close();
  viewer = openViewer(game, {
    items: PHOTOS.map((p) => ({ ...p, caption: `<b>${esc(p.title)}</b> — ${esc(p.caption)}` })),
    index: i,
    onClose: () => {
      viewer = null;
      if (new URLSearchParams(location.search).has('photo')) {
        history.replaceState(null, '', 'gallery.html');
        game.setAddress(null);
      }
    },
  });
}

list.addEventListener('click', (e) => {
  const b = e.target.closest('button.thumb');
  if (b) open(Number(b.dataset.i));
});

const want = new URLSearchParams(location.search).get('photo');
if (want) {
  const i = PHOTOS.findIndex((p) => p.id === want);
  if (i >= 0) open(i);
}
