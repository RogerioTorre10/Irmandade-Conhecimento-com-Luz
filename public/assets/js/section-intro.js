(function () {
  'use strict';

  console.log('[section-intro.js] Script carregado');

  // Função para obter texto do elemento
  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  // Função principal para aplicar datilografia e TTS
  async function runTypingChain(root, btn) {
    console.log('[section-intro.js] Iniciando runTypingChain');
    const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
    console.log('[section-intro.js] Elementos com data-typing:', typingElements.length);

    if (typingElements.length === 0 || typeof window.runTyping !== 'function') {
      console.warn('[section-intro.js] Nenhum elemento com data-typing ou runTyping não disponível');
      typingElements.forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
      });
      btn.disabled = false;
      return;
    }

    // Desativa qualquer animação em andamento para evitar conflitos
    if (window.__typingLock && typeof window.EffectCoordinator?.stopAll === 'function') {
      console.log('[section-intro.js] Desativando typingLock para evitar conflitos');
      window.EffectCoordinator.stopAll();
    }

    try {
      for (const el of typingElements) {
        if (el.classList.contains('typing-done')) {
          console.log('[section-intro.js] Ignorando elemento já processado:', el.id);
          continue;
        }
        const text = getText(el);
        console.log('[section-intro.js] Aplicando datilografia para:', el.id, 'texto:', text);
        el.textContent = '';
        el.classList.add('typing-active');
        await new Promise((resolve) => {
          window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 36),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          });
        });
        el.classList.add('typing-done');
        console.log('[section-intro.js] Datilografia concluída para:', el.id);
      }

      // Aplica TTS após a datilografia
      if (typeof window.EffectCoordinator?.speak === 'function') {
        const fullText = Array.from(typingElements).map(el => getText(el)).join(' ');
        window.EffectCoordinator.speak(fullText, { rate: 1.03, pitch: 1.0 });
        console.log('[section-intro.js] TTS ativado para:', fullText.substring(0, 50) + '...');
      }
    } catch (err) {
      console.error('[section-intro.js] Erro ao aplicar datilografia:', err);
      typingElements.forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
      });
    }

    btn.disabled = false;
    console.log('[section-intro.js] Habilitando botão "Avançar"');
  }

  // Função principal de inicialização
  async function init() {
    console.log('[section-intro.js] Iniciando inicialização');

    // Busca a seção #section-intro
    let root = document.getElementById('section-intro');
    if (!root) {
      console.error('[section-intro.js] Erro: Seção #section-intro não encontrada');
      window.toast?.('Erro: Seção section-intro não carregada.', 'error');
      return;
    }
    console.log('[section-intro.js] Seção #section-intro encontrada');

    // Busca os elementos
    let el1 = root.querySelector('#intro-p1');
    let el2 = root.querySelector('#intro-p2');
    let btn = root.querySelector('#btn-avancar');
    console.log('[section-intro.js] Elementos encontrados:', { el1: !!el1, el2: !!el2, btn: !!btn });

    // Cria elementos de fallback, se necessário
    if (!el1 || !el2 || !btn) {
      console.warn('[section-intro.js] Criando elementos de fallback');
      const wrapper = root.querySelector('#jornada-content-wrapper') || root.appendChild(document.createElement('div'));
      wrapper.id = 'jornada-content-wrapper';
      wrapper.className = 'intro-wrap';
      el1 = el1 || wrapper.appendChild(Object.assign(document.createElement('div'), {
        id: 'intro-p1',
        className: 'intro-paragraph',
        textContent: 'Bem-vindo à Jornada Conhecimento com Luz.',
        dataset: { typing: 'true', speed: '36', cursor: 'true' }
      }));
      el2 = el2 || wrapper.appendChild(Object.assign(document.createElement('div'), {
        id: 'intro-p2',
        className: 'intro-paragraph',
        textContent: 'Respire fundo. Vamos caminhar juntos com fé, coragem e propósito.',
        dataset: { typing: 'true', speed: '36', cursor: 'true' }
      }));
      btn = btn || wrapper.appendChild(Object.assign(document.createElement('button'), {
        id: 'btn-avancar',
        className: 'btn btn-primary btn-stone',
        textContent: 'Iniciar',
        dataset: { action: 'avancar' },
        disabled: true
      }));
      console.log('[section-intro.js] Elementos de fallback criados:', { el1: !!el1, el2: !!el2, btn: !!btn });
    }

    // Aplica estilos ao botão
    btn.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(to bottom, #a0a0a0, #808080), url('/assets/img/textura-de-pedra.jpg') center/cover;
      background-blend-mode: overlay;
      color: #fff;
      border-radius: 8px;
      font-size: 18px;
      border: 3px solid #4a4a4a;
      box-shadow: inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6);
      text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
      opacity: 1;
      visibility: visible;
      display: inline-block;
      cursor: pointer;
    `;

    // Aplica efeito de vela, se disponível
    if (typeof window.setupCandleFlame === 'function') {
      window.setupCandleFlame('media', 'flame-bottom-right');
      console.log('[section-intro.js] Efeito de vela aplicado');
    }

    // Exibe a seção
    root.classList.remove('hidden');
    root.style.display = 'block';
    console.log('[section-intro.js] Exibindo section-intro');

    // Vincula o evento de clique ao botão
    btn.addEventListener('click', () => {
      console.log('[section-intro.js] Botão Avançar clicado');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        window.location.href = '/termos';
      }
    });

    // Executa a cadeia de datilografia
    try {
      await runTypingChain(root, btn);
      console.log('[section-intro.js] Intro preparada com sucesso');
    } catch (err) {
      console.error('[section-intro.js] Erro ao preparar intro:', err);
      btn.disabled = false;
    }
  }

  // Executa a inicialização imediatamente
  console.log('[section-intro.js] Estado do DOM:', document.readyState);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[section-intro.js] DOMContentLoaded disparado');
      init();
    }, { once: true });
  } else {
    console.log('[section-intro.js] DOM já carregado, iniciando diretamente');
    init();
  }

  // Força a inicialização após um pequeno atraso
  setTimeout(() => {
    console.log('[section-intro.js] Forçando inicialização tardia');
    init();
  }, 100);
})();
