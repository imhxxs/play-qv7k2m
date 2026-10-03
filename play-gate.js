// 플레이용 배포본 전용 비밀번호 화면. tools/build-play.mjs 가 모든 HTML <head> 맨 앞에 넣는다.
// 정적 호스팅이라 진짜 보안은 아니다(소스를 읽으면 우회 가능). 주소를 알게 된 사람이 우연히 플레이하는 것만 막는다.
(function () {
  var HASH = '4a920e158c4be45f6bed17af072dd32d1e567b02d08ce4fc6947d0b026b104ee';
  var KEY = 'md-play-ok';
  try { if (localStorage.getItem(KEY) === HASH) return; } catch (e) { /* 저장소가 막혀 있으면 매번 묻는다 */ }
  var root = document.documentElement;
  root.classList.add('md-play-locked');
  var css = document.createElement('style');
  css.textContent =
    'html.md-play-locked body>*:not(#md-play-gate){display:none!important}' +
    '#md-play-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px 16px;background:#0f0d10;color:#e9e2d6;font:16px/1.6 "Noto Sans KR",system-ui,sans-serif}' +
    '#md-play-gate form{width:100%;max-width:340px;display:grid;gap:12px;text-align:center}' +
    '#md-play-gate h1{margin:0;font:700 28px "Noto Serif KR",serif;letter-spacing:4px}' +
    '#md-play-gate p{margin:0;color:#a69e93;font-size:14px}' +
    '#md-play-gate input{font-size:16px;padding:12px 14px;border-radius:10px;border:1px solid #4a4150;background:#1c181f;color:inherit;text-align:center;letter-spacing:2px}' +
    '#md-play-gate button{font-size:16px;min-height:46px;border-radius:10px;border:0;background:#d1ab62;color:#231808;font-weight:700;cursor:pointer}' +
    '#md-play-gate .err{color:#ff9d92;min-height:1.4em}';
  document.head.appendChild(css);
  function mount() {
    var g = document.createElement('div');
    g.id = 'md-play-gate';
    g.innerHTML = '<form autocomplete="off"><h1>明斗</h1><p>테스트 플레이용 비공개 빌드입니다.</p>' +
      '<input id="md-play-pw" type="password" placeholder="비밀번호" aria-label="비밀번호" autofocus>' +
      '<button type="submit">들어가기</button><p class="err" id="md-play-err" role="alert"></p></form>';
    document.body.appendChild(g);
    g.querySelector('form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var pw = document.getElementById('md-play-pw').value.trim();
      var err = document.getElementById('md-play-err');
      if (!window.crypto || !crypto.subtle) { err.textContent = 'https 주소로 열어 주세요.'; return; }
      crypto.subtle.digest('SHA-256', new TextEncoder().encode('md-play:' + pw)).then(function (buf) {
        var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
        if (hex !== HASH) { err.textContent = '비밀번호가 맞지 않습니다.'; return; }
        try { localStorage.setItem(KEY, HASH); } catch (e) { /* 저장 불가: 이번 페이지만 연다 */ }
        location.reload();
      });
    });
  }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
