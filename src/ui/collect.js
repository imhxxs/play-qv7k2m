// <md-collect card="E07"></md-collect> — '수첩에 담기' 버튼(사용자 정의 요소).
// - 화면에 보이는 순간 그 카드를 열람 기록에 조용히 넣는다(noview 속성으로 끌 수 있다).
// - 누르면 증거함에 담는다. 이미 담았으면 누를 때 수첩 증거함을 연다.
// - 그림자 DOM이라 사이트 CSS가 섞이지 않는다. 모양을 바꾸려면 md-collect::part(button).
// 속성: card(필수) · label(담기 전 문구) · noview

const CSS = `
:host { display: inline-block; vertical-align: middle; }
:host([hidden]) { display: none; }
button {
  all: initial; box-sizing: border-box; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
  min-height: 44px; padding: 0 16px; border-radius: 999px;
  font: 600 14px/1.2 "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
  color: #ecebe6; background: #1d1f24; border: 1px solid rgba(201,164,92,.55);
  box-shadow: 0 1px 0 rgba(0,0,0,.25); letter-spacing: 0; white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
button:hover { background: #262930; }
button:focus-visible { outline: 2px solid #e6c98a; outline-offset: 2px; }
button[aria-pressed="true"] { color: #1a1408; background: #c9a45c; border-color: #c9a45c; }
.i { width: 16px; height: 16px; flex: none; }
`;

const PLUS = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const CHECK = '<svg class="i" viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function defineCollect(game) {
  if (customElements.get('md-collect')) return;

  class MdCollect extends HTMLElement {
    static get observedAttributes() { return ['card', 'label']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style><button type="button" part="button"></button>`;
      this._btn = root.querySelector('button');
      this._btn.addEventListener('click', () => this._click());
    }

    get card() { return this.getAttribute('card') || ''; }

    connectedCallback() {
      this._unsub = game.on('change:evidence', () => this._render());
      this._render();
      if (!this.hasAttribute('noview')) this._observe();
    }

    disconnectedCallback() {
      this._unsub?.();
      this._io?.disconnect();
    }

    attributeChangedCallback() { if (this.isConnected) this._render(); }

    _observe() {
      this._io?.disconnect();
      if (!('IntersectionObserver' in window)) { game.view(this.card); return; }
      this._io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          game.view(this.card);
          this._io.disconnect();
        }
      });
      this._io.observe(this);
    }

    _render() {
      const on = !!this.card && game.collected(this.card);
      const card = game.cards.get(this.card);
      this._btn.innerHTML = on ? `${CHECK}<span>수첩에 담음</span>` : `${PLUS}<span></span>`;
      if (!on) this._btn.querySelector('span').textContent = this.getAttribute('label') || '수첩에 담기';
      this._btn.setAttribute('aria-pressed', String(on));
      const name = card?.title ? ` — ${card.title}` : '';
      this._btn.setAttribute('aria-label', on ? `수첩에 담음${name} (누르면 증거함 열기)` : `수첩에 담기${name}`);
      this.toggleAttribute('collected', on);
    }

    _click() {
      if (!this.card) return;
      if (game.collected(this.card)) { game.notebook.open('evidence'); return; }
      game.collect(this.card);
      game.sfx('paper');
      game.toast('수첩 증거함에 담았습니다.', { kind: 'collect', durationMs: 2600 });
    }
  }

  customElements.define('md-collect', MdCollect);
}
