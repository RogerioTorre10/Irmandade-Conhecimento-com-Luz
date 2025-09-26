/* /public/assets/js/jornada-bootstrap.js */
(function () {
  'use strict';
  const log = (...args) => console.log('[BOOT]', ...args);
  let retryCount = 0;
  const MAX_RETRIES = 50;
  
  // jornada-bootstrap.js
async function bootstrap() {
  try {
    await i18n.init('pt');
    console.log('[BOOT] i18n inicializado');
    await loadDynamicBlocks();
  } catch (error) {
    console.error('[BOOT] Falha no bootstrap:', error);
  }
}
  // --- [BOOT v6-fix] Dependency gate + diagnostics -----------------------------
(function () {
  const REQUIRED = [
    'CONFIG', 'JUtils', 'JCore', 'JAuth', 'JChama', 
    'JController', 'I18N', 'API'
  ];

  // Marca módulos prontos (chame em cada módulo quando terminar)
  window.__markReady = function (name) {
    window.__readySet = window.__readySet || new Set();
    window.__readySet.add(name);
    document.dispatchEvent(new Event('jc:module-ready'));
  };

  function missingDeps() {
    const g = window;
    return REQUIRED.filter((key) => typeof g[key] === 'undefined');
  }

  async function waitDom() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') return;
    await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
  }

  let attempts = 0;
  const MAX = 80;      // ~8s se interval = 100ms
  const INTERVAL = 100;

  async function startWhenReady(route = 'intro') {
    console.log(`[BOOT] Tentativa ${attempts + 1} de ${MAX} • rota: ${route}`);
    if (attempts === 0) await waitDom();

    const missing = missingDeps();
    if (missing.length === 0) {
      console.log('[BOOT] Dependências prontas ✅');
      try {
        // Preferência: inicializador central se existir
        if (window.JBootstrap?.init) {
          await window.JBootstrap.init({ route });
        } else if (window.JC?.init) {
          await window.JC.init({ route });
        } else if (typeof window.initJornada === 'function') {
          await window.initJornada({ route });
        } else {
          console.warn('[BOOT] Nenhum init central encontrado. Prosseguindo mesmo assim.');
        }
        console.log('[BOOT] Jornada iniciada 🚀');
        document.dispatchEvent(new Event('jc:ready'));
      } catch (err) {
        console.error('[BOOT] Erro na inicialização (init):', err);
      }
      return;
    }

    attempts++;
    if (attempts >= MAX) {
      console.error('[BOOT] Máximo de tentativas excedido. Inicialização falhou.');
      console.warn('[BOOT] Faltando:', missing);
      throw new Error('Inicialização falhou: máximo de tentativas excedido');
    }

    console.log('[BOOT] Dependências não prontas, retry em 100ms', { faltando: missing });
    await new Promise((r) => setTimeout(r, INTERVAL));
    startWhenReady(route);
  }

  // expõe para ser chamado no final do HTML ou por outros scripts
  window.startWhenReady = startWhenReady;

  // também tenta iniciar automaticamente após carregamento
  window.addEventListener('load', () => {
    // só dispara se ninguém chamou manualmente até agora
    if (!window.__autoBootDone) {
      window.__autoBootDone = true;
      startWhenReady('intro').catch((e) => {
        console.error('[BOOT] Erro na inicialização:', e.message || e);
      });
    }
  });
})();

  function startWhenReady(route = 'intro') {
    retryCount++;
    log(`Tentativa ${retryCount} de ${MAX_RETRIES} • rota: ${route}`);
    if (retryCount > MAX_RETRIES) {
      console.error('[BOOT] Máximo de tentativas excedido. Inicialização falhou.');
      return Promise.reject('Inicialização falhou: máximo de tentativas excedido');
    }

    // Verificar dependências
    const dependencies = {
      i18n: !!(window.i18n && window.i18n.ready),
      JC: !!(window.JC && window.JC.init),
      JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
      JORNADA_VIDEOS: !!window.JORNADA_VIDEOS,
      showSection: !!window.showSection,
      runTyping: !!window.runTyping,
      playTransition: !!window.playTransition
    };
    log('Dependências:', dependencies);

    if (dependencies.i18n && dependencies.JC && dependencies.JORNADA_BLOCKS && dependencies.JORNADA_VIDEOS && dependencies.showSection && dependencies.runTyping && dependencies.playTransition) {
      window.JC.init(route);
      log('Inicialização concluída com sucesso');
      return Promise.resolve();
    } else {
      // Fallback temporário se JC não estiver definido
      if (!window.JC) {
        log('JC não definido, inicializando fallback');
        window.JC = {
          nextSection: null,
          currentBloco: 0,
          goNext: () => {
            log('goNext (fallback) chamado');
            const sections = ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-selfie', 'section-perguntas', 'section-final'];
            const current = window.__currentSectionId || 'section-intro';
            const idx = sections.indexOf(current);
            const next = window.JC.nextSection || sections[idx + 1];
            if (next) {
              window.JC.nextSection = null;
              window.showSection && window.showSection(next);
              log(`Navegando de ${current} para ${next}`);
            }
          },
          init: (route) => {
            log('Inicializando JC fallback');
            window.__currentSectionId = route === 'intro' ? 'section-intro' : route;
            window.showSection && window.showSection(window.__currentSectionId);
            log('Seção inicial:', window.__currentSectionId);
          }
        };
        window.JC.init(route);
        log('Inicialização concluída com fallback');
        return Promise.resolve();
      }
      log('Dependências não prontas, retry em 100ms');
      return new Promise((resolve, reject) => {
        setTimeout(() => startWhenReady(route).then(resolve).catch(reject), 100);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    log('Iniciando bootstrap');
    startWhenReady('intro').catch(err => console.error('[BOOT] Erro na inicialização:', err));
  });
})();
