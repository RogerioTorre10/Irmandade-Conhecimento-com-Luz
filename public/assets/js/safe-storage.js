(function () {
  'use strict';

  // 1) Armazenamento a prova de iframe -------------------------------------
  function makeMemoryStorage() {
    var data = Object.create(null);
    return {
      get length() { return Object.keys(data).length; },
      key: function (i) { var k = Object.keys(data); return i in k ? k[i] : null; },
      getItem: function (k) { k = String(k); return k in data ? data[k] : null; },
      setItem: function (k, v) { data[String(k)] = String(v); },
      removeItem: function (k) { delete data[String(k)]; },
      clear: function () { data = Object.create(null); }
    };
  }

  function isUsable(store) {
    try {
      var probe = '__probe__' + Math.random();
      store.setItem(probe, '1');
      store.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  }

  function patch(name) {
    var native = null;
    try { native = window[name]; } catch (e) { native = null; }

    if (native && isUsable(native)) return;

    var fallback = makeMemoryStorage();
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: function () { return fallback; }
      });
    } catch (e) {
      try { window[name] = fallback; } catch (e2) {}
    }
    try { console.warn('[safe-storage] ' + name + ' bloqueado; usando memoria.'); } catch (e) {}
  }

  patch('localStorage');
  patch('sessionStorage');

  // 2) Saida para nova aba quando estiver dentro de um iframe ---------------
  var inIframe = false;
  try { inIframe = window.top !== window.self; } catch (e) { inIframe = true; }
  if (!inIframe) return;

  try {
    if (document.documentElement) {
      document.documentElement.setAttribute('data-in-iframe', 'true');
    }
  } catch (e) {}

  function mountBanner() {
    if (document.getElementById('iframe-escape-bar')) return;

    var bar = document.createElement('div');
    bar.id = 'iframe-escape-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Abrir jornada em tela cheia');
    bar.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483647',
      'display:flex', 'flex-wrap:wrap', 'gap:10px',
      'align-items:center', 'justify-content:center',
      'padding:12px 16px', 'box-sizing:border-box',
      'background:rgba(18,12,4,.94)', 'color:#f4e6c8',
      'font:500 15px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      'text-align:center', 'box-shadow:0 -6px 24px rgba(0,0,0,.45)'
    ].join(';');

    var text = document.createElement('span');
    text.textContent = 'Para a experiencia completa (camera, selfie e codigo por e-mail):';

    var link = document.createElement('a');
    link.href = window.location.href;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Abrir jornada em tela cheia';
    link.style.cssText = [
      'display:inline-block', 'padding:10px 18px', 'border-radius:999px',
      'background:#d9a441', 'color:#1a1204', 'font-weight:700',
      'text-decoration:none', 'white-space:nowrap'
    ].join(';');

    bar.appendChild(text);
    bar.appendChild(link);
    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBanner);
  } else {
    mountBanner();
  }
})();
