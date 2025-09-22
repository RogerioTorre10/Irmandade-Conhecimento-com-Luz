/* =========================================================
   jornada-bootstrap.js
   Inicialização da jornada com tolerância a erros e espera por dependências
   ========================================================= */
(function () {
  'use strict';
  console.log('[BOOT] Iniciando micro-boot v5.4...');

  // Sondagem de módulos
  const must = ['CONFIG', 'JUtils', 'JCore', 'JAuth', 'JChama', 'JPaperQA', 'JTyping', 'JController', 'JRender', 'JBootstrap', 'JMicro', 'I18N', 'API'];
  const missing = must.filter(k => !(k in window));
  if (missing.length) {
    console.warn('[BOOT] Módulos ausentes:', missing);
    window.toast && window.toast('Alguns módulos não foram carregados. Tente recarregar.');
  }

  // Definição segura de API_BASE
  const PRIMARY_DEFAULT = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'https://lumen-backend-api.onrender.com/api';
  const API = window.API || {};
  const API_PRIMARY = API.API_PRIMARY || PRIMARY_DEFAULT;
  const API_FALLBACK = API.API_FALLBACK || 'https://conhecimento-com-luz-api.onrender.com';

  async function chooseBase() {
    if (typeof window.API?.health === 'function') {
      try {
        const ok = await window.API.health();
        window.API_BASE = ok ? API_PRIMARY : API_FALLBACK;
      } catch {
        console.warn('[BOOT] Health falhou, usando FALLBACK:', API_FALLBACK);
        window.API_BASE = API_FALLBACK;
      }
    } else {
      console.warn('[BOOT] API.health não definido, usando PRIMARY:', API_PRIMARY);
      window.API_BASE = API_PRIMARY;
    }
    console.log('[BOOT] API_BASE =', window.API_BASE);
  }

  // Função de inicialização
  async function boot() {
    if (window.__BOOT_COMPLETED) {
      console.log('[BOOT] Inicialização já concluída, ignorando');
      return;
    }
    window.__BOOT_COMPLETED = true;
    console.log('[BOOT] Tentando iniciar • rota:', location.hash || 'intro');
    const route = (location.hash || '#intro').slice(1);
    try {
      if (window.JORNADA_RENDER) {
        if (route === 'intro') {
          window.JORNADA_RENDER.renderIntro && window.JORNADA_RENDER.renderIntro();
        } else {
          window.JORNADA_RENDER.render && window.JORNADA_RENDER.render(route);
        }
      } else {
        console.warn('[BOOT] JORNADA_RENDER não disponível, pulando renderização');
      }
      if (window.JC && typeof window.JC.init === 'function') {
        await window.JC.init();
        console.log('[BOOT] JC.init concluído');
      } else {
        console.warn('[BOOT] JC.init não disponível, usando fallback');
        window.JC = window.JC || {};
        window.JC.state = window.JC.state || { route: 'intro', booted: true };
        window.JC.init = function() {
          window.JC.state.booted = true;
          window.JC.ready = true;
          console.warn('[BOOT] JC.init (fallback) aplicado');
        };
        await window.JC.init();
      }
      console.log('[BOOT] Inicialização concluída com sucesso');
    } catch (e) {
      console.error('[BOOT] Erro ao iniciar:', e);
      window.toast && window.toast('Erro ao iniciar a jornada.');
    }
  }

  // Espera dependências
  function startWhenReady() {
    if (window.__BOOT_STARTED) {
      console.log('[BOOT] startWhenReady já iniciado, ignorando');
      return;
    }
    window.__BOOT_STARTED = true;
    let tries = 0;
    const maxTries = 100;
    const interval = setInterval(async () => {
      tries++;
      console.log('[BOOT] Tentativa', tries, 'de', maxTries);
      if (window.JC && typeof window.JC.init === 'function') {
        clearInterval(interval);
        await boot();
        console.log('[BOOT] startWhenReady concluído');
      } else if (tries >= maxTries) {
        clearInterval(interval);
        console.error('[BOOT] JC não disponível após', maxTries, 'tentativas');
        window.JC = window.JC || {};
        window.JC.state = window.JC.state || { route: 'intro', booted: true };
        window.JC.init = function() {
          window.JC.state.booted = true;
          window.JC.ready = true;
          console.warn('[BOOT] JC.init (fallback) aplicado');
        };
        await boot();
        console.log('[BOOT] startWhenReady concluído com fallback');
      }
    }, 100);
    // Timeout de segurança
    setTimeout(() => {
      if (tries < maxTries) {
        clearInterval(interval);
        console.warn('[BOOT] Timeout de segurança atingido, forçando inicialização');
        boot();
      }
    }, 10000);
  }

  // Iniciar após escolher API_BASE
  chooseBase().finally(() => {
    console.log('[BOOT] API_BASE escolhido, iniciando startWhenReady...');
    startWhenReady();
  });
})();
