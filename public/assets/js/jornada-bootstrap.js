(function (global) {
  'use strict';

  if (global.__JornadaBootstrapReady) {
    console.log('[BOOT] Já carregado, ignorando');
    return;
  }
  global.__JornadaBootstrapReady = true;

  console.log('[BOOT] Iniciando micro-boot…');

  // ===== DEPENDÊNCIAS ASSÍNCRONAS (Mantidas) =====
  async function waitForConfig() {
    let tries = 0;
    while (!global.APP_CONFIG && tries < 30) {
      console.warn('[BOOT] APP_CONFIG não encontrado, aguardando…');
      await new Promise(resolve => setTimeout(resolve, 100));
      tries++;
    }
  }

  async function waitForI18n() {
    if (global.i18n) {
      try {
        // Usa a função global para aguardar o i18n
        await global.i18n.waitForReady(5000); 
        console.log('[BOOT] i18n pronto');
      } catch (e) {
        console.warn('[BOOT] i18n falhou ao ficar pronto');
      }
    } else {
      console.warn('[BOOT] i18n não encontrado, prosseguindo sem esperar');
    }
  }

  async function waitForJC() {
    let tries = 0;
    while (!(global.JC && typeof global.JC.init === 'function') && tries < 60) {
      await new Promise(resolve => setTimeout(resolve, 100));
      tries++;
    }
    if (global.JC && typeof global.JC.init === 'function') {
      console.log('[BOOT] JC disponível, iniciando...');
      try {
        // JC.init() DEVE ser o ponto de partida que chama startJourney()
        global.JC.init(); 
        document.dispatchEvent(new CustomEvent('bootstrapComplete'));
      } catch (e) {
        console.error('[BOOT] falha no JC.init()', e);
      }
    } else {
      console.error('[BOOT] Desisti: JC não disponível a tempo');
      window.toast?.('Falha ao iniciar a Jornada (JC não disponível).');
    }
  }
  
  // ===== FLUXO PRINCIPAL =====
  async function startBootstrap() {
    console.log('[BOOT] Iniciando sequência de inicialização...');
    try {
      await waitForConfig();
      await waitForI18n();
      await waitForJC();
    } catch (e) {
      console.error('[BOOT] Erro geral no bootstrap:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBootstrap, { once: true });
  } else {
    startBootstrap();
  }

  // CHAVE DA SINCRONIZAÇÃO: Chama o startJourney (que está no jornada-secoes.js)
  document.addEventListener('bootstrapComplete', () => {
    console.log('[BOOT] bootstrapComplete recebido. Chamando startJourney...');
    
    // Agora, confiamos que o JC.init() foi bem-sucedido e a função startJourney existe no global.JSecoes
    if (window.JSecoes?.startJourney) {
      // startJourney chama carregarEtapa('intro')
      window.JSecoes.startJourney(); 
    } else if (window.JC?.show) {
      // Fallback: se JSecoes ainda não carregou, tentamos carregar a intro diretamente
      window.JC.show('section-intro');
    } else {
      console.error('[BOOT] Não foi possível iniciar a Jornada (JSecoes ou JC.show indisponível).');
    }
  });
})(window);
