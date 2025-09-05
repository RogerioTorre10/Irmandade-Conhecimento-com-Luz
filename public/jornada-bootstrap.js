/* ============================================================================
   TÍTULO: JORNADA BOOTSTRAP (v2)
   SUBTÍTULO: Inicializa a jornada quando o renderer estiver pronto
   CAMINHO: /public/jornada-bootstrap.js
   DEPENDE DE: jornada-render.js (define window.JORNADA_RENDER)
               jornada-controller.js (define window.JC - opcional)
============================================================================ */
(function () {
  'use strict';

  const TAG = '[BOOT]';
  const log   = (...a) => console.log(TAG, ...a);
  const warn  = (...a) => console.warn(TAG, ...a);
  const error = (...a) => console.error(TAG, ...a);

  function routeFromHash() {
    return (location.hash || '#intro').slice(1);
  }

  function dumpScriptsOnce() {
    if (dumpScriptsOnce._done) return;
    dumpScriptsOnce._done = true;
    try {
      const items = Array.from(document.scripts || []).map(s => ({
        defer: !!s.defer,
        src: s.src || '(inline)',
      }));
      log('scripts carregados (ordem):');
      console.table(items);
    } catch {}
  }

  function setPaperByRoute(route) {
    const PAPER = window.JORNADA_PAPER;
    if (!PAPER || typeof PAPER.set !== 'function') return;
    const modo = (route === 'intro' || route === 'final') ? 'v' : 'h';
    try { PAPER.set(modo); } catch {}
  }

  function boot() {
    dumpScriptsOnce();
    const route = routeFromHash();
    log('tentando iniciar • rota:', route);

    if (typeof window.mount === 'function') {
      log('detectado window.mount → delegando para SPA');
      try {
        window.mount({ startAt: route });
        setPaperByRoute(route);
      } catch (e) { error('falha no mount()', e); }
      return true;
    }

    if (!window.JORNADA_RENDER) {
      warn('JORNADA_RENDER não disponível ainda. Aguardando…');
      return false;
    }

    try { document.body.classList.add('jornada-active'); } catch {}

    try {
      if (route === 'intro') {
        log('→ renderIntro()');
        window.JORNADA_RENDER.renderIntro();
      } else if (route === 'perguntas') {
        log('→ renderPerguntas(0)');
        window.JORNADA_RENDER.renderPerguntas(0);
      } else if (route === 'final') {
        log('→ renderFinal()');
        window.JORNADA_RENDER.renderFinal();
      } else {
        log('→ rota desconhecida, caindo na intro');
        window.JORNADA_RENDER.renderIntro();
      }
    } catch (e) {
      error('falha ao chamar renderer:', e);
      return false;
    }

    setPaperByRoute(route);
    setTimeout(() => {
      if (window.JC?.init) {
        try { 
          log('acionando JC.init() (reforço)');
          window.JC.init();
        } catch (e) {
          warn('falha ao acionar JC.init():', e);
        }
      }
    }, 0);
    log('inicialização concluída.');
    return true;
  }

  function startWhenReady() {
    let tries = 0;
    const maxTries = 60;
    const t = setInterval(() => {
      if (boot()) { clearInterval(t); return; }
      if (++tries > maxTries) {
        clearInterval(t);
        error('desisti de iniciar: JORNADA_RENDER não ficou disponível a tempo.');
      }
    }, 100);
  }

  window.addEventListener('hashchange', () => {
    const r = routeFromHash();
    log('hashchange →', r);
    setPaperByRoute(r);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWhenReady);
  } else {
    startWhenReady();
  }
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
