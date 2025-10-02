/* jornada-bootstrap.js — micro-boot global */
(function (global) {
  'use strict';

  if (global.__JornadaBootstrapReady) {
    console.log('[BOOT] Já carregado, ignorando');
    return;
  }
  global.__JornadaBootstrapReady = true;

  console.log('[BOOT] Iniciando micro-boot…');

  function fire() {
    try {
      document.dispatchEvent(new CustomEvent('bootstrapComplete'));
      console.log('[BOOT] Evento bootstrapComplete disparado');
      // ❌ Removido: showSectionByIndex(0)
      // ✅ Agora o controller decide qual seção exibir
    } catch (e) {
      console.error('[BOOT] Erro ao disparar bootstrapComplete:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fire, { once: true });
  } else {
    setTimeout(fire, 0);
  }

})(window);
