(function () {
  'use strict';

  if (window.__guiaBound) return;
  window.__guiaBound = true;

  let GUIA_READY = false;
  // Estado que será TRUE se um guia for selecionado OU se houver falha de carregamento (para permitir avanço)
  let guiaSelecionado = false; 

  const once = (el, ev, fn) => {
    if (!el) {
      console.warn('[section-guia.js] Elemento para evento não encontrado:', ev);
      return;
    }
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  function waitForElement(selector, { within = document, timeout = 5000 } = {}) {
    // ... (Mantida a função waitForElement, está correta)
    return new Promise((resolve, reject) => {
      let el = within.querySelector(selector);
      if (el) {
        console.log(`[waitForElement] Elemento ${selector} encontrado imediatamente`);
        return resolve(el);
      }

      const observer = new MutationObserver((mutations, obs) => {
        el = within.querySelector(selector);
        if (el) {
          console.log(`[waitForElement] Elemento ${selector} encontrado após mutação`);
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(within, { childList: true, subtree: true });

      setTimeout(() => {
        observer.disconnect();
        const fallbackEl = document.querySelector(`#jornada-content-wrapper ${selector}`);
        if (fallbackEl) {
          console.log(`[waitForElement] Elemento ${selector} encontrado via fallback global`);
          resolve(fallbackEl);
        } else {
          console.error(`[waitForElement] Timeout após ${timeout}ms para ${selector}`);
          reject(new Error(`timeout waiting ${selector}`));
        }
      }, timeout);
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

  // Função central para habilitar o botão
  const enableSelectButton = (btn) => {
      btn.disabled = false;
      btn.classList.remove('disabled-temp');
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
  };

  // Função de setup do Guia, carregando dados e configurando a seleção
  async function loadAndSetupGuia(root, btn) {
    // Seletor da área onde os guias serão renderizados. Usando '#guia-selector' como no seu código.
    const guiaSelector = root.querySelector('#guia-selector'); 
    const guiaError = root.querySelector('#guia-error');

    // Inicialmente desabilita o botão Selecionar se o guia não tiver sido selecionado
    if (!guiaSelecionado) {
        btn.disabled = true;
        btn.classList.add('disabled-temp');
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
    }

    try {
      console.log('[section-guia.js] Iniciando fetch para dados dos guias...');
      const response = await fetch('/assets/data/guias.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - Verifique o caminho '/assets/data/guias.json'`);
      }
      const guias = await response.json();
      console.log('[section-guia.js] Dados dos guias carregados com sucesso:', guias.length);

      if (guiaSelector && guias.length > 0) {
        if (typeof window.JornadaGuiaSelfie?.renderSelector === 'function') {
          window.JornadaGuiaSelfie.renderSelector(guiaSelector, guias);
          
          // Ouve o evento de seleção do guia para habilitar o botão de avanço
          document.addEventListener('guiaSelected', (e) => {
            console.log('[section-guia.js] Guia selecionado. Ativando botão.');
            guiaSelecionado = true;
            enableSelectButton(btn);
          }, { once: true });
          
          guiaSelecionado = false; // Garante que começa desativado até a seleção

        } else {
          console.warn('[section-guia.js] Função de renderização do guia não encontrada. Avance sem seleção.');
          guiaSelecionado = true; // Permite avanço se a renderização falhar
          enableSelectButton(btn);
        }
      } else {
        console.warn('[section-guia.js] Nenhum guia disponível ou seletor não encontrado. Avance sem seleção.');
        guiaSelecionado = true; // Permite avanço se não houver dados/seletor
        enableSelectButton(btn);
      }
    } catch (err) {
      console.error('[section-guia.js] Falha crítica ao carregar guias:', err);
      // Exibe erro e permite avanço para não travar
      guiaError && (guiaError.style.display = 'block');
      window.toast?.('Falha ao carregar dados dos guias. Tente recarregar a página.', 'error');
      guiaSelecionado = true; 
      enableSelectButton(btn);
    }
  }

  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    console.log('[section-guia.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-guia') return;

    console.log('[section-guia.js] Ativando guia');

    // Tenta encontrar o root da seção guia
    let root = node || document.getElementById('section-guia') || document.getElementById('jornada-content-wrapper');
    if (!root || !node) { // Adiciona um fallback mais robusto
      try {
        // Tenta encontrar a seção real, se não foi injetada via evento 'sectionLoaded'
        root = await waitForElement('#section-guia:not(.hidden), #jornada-content-wrapper', { timeout: 10000 });
        console.log('[section-guia.js] Root encontrado:', root.outerHTML.slice(0, 200) + '...');
      } catch {
        console.error('[section-guia.js] Root da guia não encontrado');
        window.toast?.('Guia ainda não montou no DOM.', 'error');
        return;
      }
    }

    let title, btnSelecionar, btnSkip;
    try {
      title = await waitForElement('h2[data-typing="true"]', { within: root, timeout: 5000 });
      // IDs de botão devem ser consistentes
      btnSelecionar = await waitForElement('#btn-selecionar-guia', { within: root, timeout: 5000 }); 
      btnSkip = await waitForElement('#btn-skip-guia', { within: root, timeout: 5000 });
    } catch (e) {
      console.error('[section-guia.js] Falha ao esperar pelos elementos essenciais:', e);
      window.toast?.('Falha ao carregar a seção Guia. Usando fallback.', 'error');
      // Fallback: cria elementos básicos para evitar crash
      title = title || root.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Escolha seu Guia para a Jornada', dataset: { typing: 'true' } }));
      btnSelecionar = btnSelecionar || root.appendChild(Object.assign(document.createElement('button'), { id: 'btn-selecionar-guia', textContent: 'Selecionar Guia', className: 'btn btn-primary' }));
      btnSkip = btnSkip || root.appendChild(Object.assign(document.createElement('button'), { id: 'btn-skip-guia', textContent: 'Pular e Continuar', className: 'btn btn-secondary' }));
    }

    console.log('[section-guia.js] Elementos encontrados:', { title: !!title, btnSelecionar: !!btnSelecionar, btnSkip: !!btnSkip });

    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-guia');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'block';
      }
    } catch (err) {
      console.warn('[section-guia.js] Falha ao exibir seção:', err);
      root.classList.remove('hidden');
      root.style.display = 'block';
    }

    // Garante que o botão de seleção comece desativado (será reativado no loadAndSetupGuia)
    btnSelecionar.classList.add('hidden');
    // btnSelecionar.disabled = true; // Será desativado/ativado em loadAndSetupGuia

    const showBtn = () => {
      console.log('[section-guia.js] Mostrando botões');
      btnSelecionar.classList.remove('hidden');
      btnSelecionar.style.display = 'inline-block';
      btnSkip.classList.remove('hidden');
      btnSkip.style.display = 'inline-block';
    };

    const speed = Number(title.dataset.speed || 40);
    const text = getText(title);
    const cursor = String(title.dataset.cursor || 'true') === 'true';

    if (GUIA_READY) {
      console.log('[section-guia.js] Guia já preparado');
      showBtn();
      loadAndSetupGuia(root, btnSelecionar);
      return;
    }

    window.EffectCoordinator?.stopAll?.();

    const runTypingChain = async () => {
      console.log('[section-guia.js] Iniciando runTypingChain');
      if (typeof window.runTyping === 'function') {
        try {
          await new Promise((resolve) => {
            window.runTyping(title, text, resolve, { speed, cursor });
          });
          console.log('[section-guia.js] Typing concluído para título');
          window.EffectCoordinator?.speak?.(text, { rate: 1.06 });
        } catch (err) {
          console.warn('[section-guia.js] Erro no runTyping:', err);
          title.textContent = text;
        }
      } else {
        console.log('[section-guia.js] Fallback: sem efeitos');
        title.textContent = text;
      }
      showBtn();
    };

    try {
      await runTypingChain();
      GUIA_READY = true;
      // Inicia o carregamento do guia e a configuração do botão
      await loadAndSetupGuia(root, btnSelecionar); 
    } catch (err) {
      console.warn('[section-guia.js] Typing chain falhou', err);
      title.textContent = text;
      showBtn();
      GUIA_READY = true;
      // Mesmo se o typing falhar, tentamos carregar os guias para não travar
      await loadAndSetupGuia(root, btnSelecionar); 
    }

    const goNext = (e) => {
      // Verifica se o botão principal foi clicado sem a seleção
      if (e.currentTarget.id === 'btn-selecionar-guia' && !guiaSelecionado) {
          console.warn('[section-guia.js] Tentativa de avançar sem guia selecionado.');
          window.toast?.('Por favor, selecione um guia ou use o botão Pular.', 'warn');
          return;
      }
      
      console.log(`[section-guia.js] Botão ${e.currentTarget.id} clicado, avançando...`);
      const nextSection = 'section-selfie';
      
      try {
        if (window.JC?.goNext) {
          window.JC.goNext(nextSection); // O JC deve gerenciar qual é a próxima seção
        } else if (typeof window.showSection === 'function') {
          window.showSection(nextSection);
        }
      } catch (err) {
        console.error('[section-guia.js] Erro ao avançar:', err);
      }
    };

    console.log('[section-guia.js] Configurando eventos de clique');
    // Recria e substitui os botões para garantir que listeners antigos sejam removidos
    const freshBtnSelecionar = btnSelecionar.cloneNode(true);
    btnSelecionar.replaceWith(freshBtnSelecionar);
    once(freshBtnSelecionar, 'click', goNext);

    const freshBtnSkip = btnSkip.cloneNode(true);
    btnSkip.replaceWith(freshBtnSkip);
    once(freshBtnSkip, 'click', goNext);
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });
    console.log('[section-guia.js] Handler ligado');
    // Dispara o handler caso a seção já esteja visível no DOM
    const visibleGuia = document.querySelector('#section-guia:not(.hidden)');
    if (visibleGuia) {
      handler({ detail: { sectionId: 'section-guia', node: visibleGuia } });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
