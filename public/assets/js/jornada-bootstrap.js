<script>
(function (global) {
  'use strict';

  if (global.__JornadaBootstrapReady) {
    console.log('[BOOT] Já carregado, ignorando');
    return;
  }
  global.__JornadaBootstrapRead<script>
(function (global) {
  'use strict';

  if (global.__JornadaBootstrapReady) {
    console.log('[BOOT] Já carregado, ignorando');
    return;
  }
  global.__JornadaBootstrapReady = true;

  console.log('[BOOT] Iniciando micro-boot…');

  async function fire() {
    try {
      if (!global.APP_CONFIG) {
        console.warn('[BOOT] APP_CONFIG não encontrado, aguardando…');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (global.i18n) {
        await global.i18n.waitForReady(5000);
        console.log('[BOOT] i18n pronto, disparando bootstrapComplete');
      } else {
        console.warn('[BOOT] i18n não encontrado, prosseguindo sem esperar');
      }
      document.dispatchEvent(new CustomEvent('bootstrapComplete'));
      console.log('[BOOT] Evento bootstrapComplete disparado');
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
</script>y = true;

  console.log('[BOOT] Iniciando micro-boot…');

  async function fire() {
    try {
      if (global.i18n) {
        await global.i18n.waitForReady(5000);
        console.log('[BOOT] i18n pronto, disparando bootstrapComplete');
      } else {
        console.warn('[BOOT] i18n não encontrado, prosseguindo sem esperar');
      }
      document.dispatchEvent(new CustomEvent('bootstrapComplete'));
      console.log('[BOOT] Evento bootstrapComplete disparado');
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
</script>
