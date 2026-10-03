// 누리샘 검색 데이터(기획서 §7). game.js는 이 파일을 불러오지 않는다 — 누리샘 페이지와 engine.js만 쓴다.
//
//   entries   검색 엔트리(표제어·동의어·결과)            → entries.js
//   links     결과가 가리키는 다른 사이트 페이지 표      → entries.js LINKS (다른 담당이 id를 정하면 여기만 고친다)
//   trending  '지금 서월에서 많이 찾는 말'(장별)          → entries.js TRENDING
//   dict      사전 항목                                 → dict.js
//   fillers   사전에 없는 검색어용 필러 결과 풀(시드 고정) → fillers.js
//   cache     저장된 페이지                             → cache.js
//   images    이미지 탭 결과                            → images.js
//   imageQuery / imageCards  '이 이미지로 검색' 매핑    → entries.js
//
// 순수 함수(검색·자동완성·사전·간지)는 engine.js. 아직 없는 사이트(제2장 이후)의 결과는 넣지 않는다 —
// 넣더라도 엔진이 sites.js에 없는 사이트·페이지는 '색인되지 않음'으로 빼 버린다.

import entries, { LINKS, TRENDING, IMAGE_QUERY, IMAGE_CARDS } from './entries.js';
import dict from './dict.js';
import fillers from './fillers.js';
import cache from './cache.js';
import images from './images.js';

export default {
  entries,
  links: LINKS,
  trending: TRENDING,
  dict,
  fillers,
  cache,
  images,
  imageQuery: IMAGE_QUERY,
  imageCards: IMAGE_CARDS,
};
