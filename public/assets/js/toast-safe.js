/* /assets/js/toast-safe.js
   Garante window.toast idempotente e disponível cedo.
*/
(function () {
  'use strict';
  if (window.toast && typeof window.toast === 'function') return;

  // estilo mínimo só se não existir (não conflita com o seu CSS)
  if (!document.getElementById('toast-safe-style')) {
    const st = document.createElement('style');
    st.id = 'toast-safe-style';
    st.textContent = `
      #toast{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);
        background:#111; color:#fff; padding:10px 14px; border-radius:10px;
        box-shadow:0 6px 18px rgba(0,0,0,.35); font-size:16px; z-index:4000;
        opacity:0; pointer-events:none; transition:opacity .25s ease}
      #toast.show{opacity:1}
    `;
    document.head.appendChild(st);
  }

  // cria/recicla o contêiner
  function ensureEl() {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    return t;
  }

  // define toast global
  window.toast = function (msg) {
    try {
      const t = ensureEl();
      t.textContent = String(msg ?? '');
      t.classList.add('show');
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
    } catch {}
  };
})();
// toast-safe.js  (idempotente)
(function(){
  if (typeof window.toast === 'function') return;
  window.toast = function(msg){
    try {
      console.log('[TOAST]', msg);
      // Se você já tem componente visual, pode chamar aqui.
    } catch(e) { /* no-op */ }
  };
})();

