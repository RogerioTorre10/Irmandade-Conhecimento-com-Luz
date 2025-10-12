(function () {
  'use strict';

  if (window.__introBound) {
    console.log('[section-intro.js] Já vinculado, ignorando.');
    return;
  }
  window.__introBound = true;

  let INTRO_READY = false;

  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 10000, step = 50 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) {
          return reject(new Error(`Timeout esperando ${selector}`));
        }
        setTimeout(tick, step);
      };
      tick();
    });
  }

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  function fromDetail(detail = {}) {
    const sectionId = detail.sectionId || detail.id || window.__currentSectionId;
    const node = detail.node || detail.root || null;
    return { sectionId, node };
  }

  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId !== 'section-intro') {
      console.log('[section-intro.js] Ignorando evento para seção:', sectionId);
      return;
    }

    console.log('[section-intro.js] Iniciando handler para section-intro');

    let root = node || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForElement('#section-intro', { within: document.getElementById('jornada-content-wrapper') || document, timeout: 10000 });
        console.log('[section-intro.js] Seção #section-intro encontrada via waitForElement');
      } catch (e) {
        console.error('[section-intro.js] Erro: Seção #section-intro não encontrada:', e);
        window.toast?.('Erro: Seção section-intro não carregada.', 'error');
        return;
      }
    }

    let el1, el2, btn;
    try {
      el1 = await waitForElement('#intro-p1', { within: root, timeout: 5000 });
      el2 = await waitForElement('#intro-p2', { within: root, timeout: 5000 });
      btn = await waitForElement('#btn-avancar', { within: root, timeout: 5000 });
      console.log('[section-intro.js] Elementos encontrados:', { el1: !!el1, el2: !!el2, btn: !!btn });
    } catch (e) {
      console.error('[section-intro.js] Falha ao carregar elementos:', e);
      window.toast?.('Falha ao carregar elementos da seção Intro.', 'error');
      // Cria elementos de fallback
      const wrapper = root.querySelector('#jornada-content-wrapper') || root.appendChild(document.createElement('div'));
      wrapper.id = 'jornada-content-wrapper';
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
        className: 'btn btn-primary',
        textContent: 'Iniciar',
        dataset: { action: 'avancar' },
        disabled: true
      }));
      console.log('[section-intro.js] Elementos de fallback criados:', { el1: !!el1, el2: !!el2, btn: !!btn });
    }

    // Aplica estilos ao botão
    btn.classList.add('btn-stone');
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
    `;

    // Aplica efeito de vela, se disponível
    if (typeof window.setupCandleFlame === 'function') {
      window.setupCandleFlame('media', 'flame-bottom-right');
      console.log('[section-intro.js] Efeito de vela aplicado');
    }

    // Exibe a seção
    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-intro', { force: true });
        console.log('[section-intro.js] Chamado JC.show para section-intro');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'flex';
        console.log('[section-intro.js] Exibindo section-intro diretamente');
      }
    } catch (err) {
      console.error('[section-intro.js] Erro ao exibir seção:', err);
      root.classList.remove('hidden');
      root.style.display = 'flex';
    }

    // Função para aplicar datilografia e TTS
    const runTypingChain = async () => {
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

      // Desativa o lock para evitar conflitos com jC
      if (window.__typingLock) {
        console.log('[section-intro.js] Desativando typingLock para evitar conflitos');
        window.EffectCoordinator?.stopAll?.();
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
      console.log('[section-intro.js] Mostrando botão "Avançar"');
    };

    // Vincula o evento de clique ao botão
    once(btn, 'click', () => {
      console.log('[section-intro.js] Botão Avançar clicado');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        window.location.href = '/termos';
      }
    });

    // Executa a cadeia de datilografia, se não estiver pronta
    if (!INTRO_READY) {
      try {
        await runTypingChain();
        INTRO_READY = true;
        console.log('[section-intro.js] Intro preparada com sucesso');
      } catch (err) {
        console.error('[section-intro.js] Erro ao preparar intro:', err);
        btn.disabled = false;
      }
    } else {
      console.log('[section-intro.js] Intro já preparada, habilitando botão');
      btn.disabled = false;
    }
  };

  const bind = () => {
    console.log('[section-intro.js] Vinculando eventos');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });

    setTimeout(() => {
      const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
      if (visibleIntro) {
        console.log('[section-intro.js] Seção #section-intro visível, chamando handler');
        handler({ detail: { sectionId: 'section-intro', node: visibleIntro } });
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    console.log('[section-intro.js] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[section-intro.js] DOM já carregado, vinculando diretamente');
    bind();
  }
})();
