(function () {
  'use strict';

  if (window.__guiaBound) {
    window.__guiaKick?.(/*force*/true);
    return;
  }
  window.__guiaBound = true;

  let GUIA_READY = false;
  let guiaSelecionado = false;
  let selectedGuia = null;

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

  function waitForElement(selector, { within = document, timeout = 2000 } = {}) {
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
        const fallbackEl = document.querySelector(selector);
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

  const enableSelectButton = (btn) => {
    btn.disabled = false;
    btn.classList.remove('disabled-temp');
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
  };

  async function typeOnce(el, speed = 30) {
    if (!el) return;
    const text = getText(el);
    if (!text) return;

    console.log('[section-guia.js] Iniciando datilografia para:', text);
    el.textContent = '';
    el.classList.add('typing-active');
    for (let i = 0; i < text.length; i++) {
      el.textContent += text.charAt(i);
      await new Promise(r => setTimeout(r, speed));
    }
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    console.log('[section-guia.js] Datilografia concluída para:', text);
  }

  async function loadAndSetupGuia(root, btn) {
    const guiaContainer = root.querySelector('.guia-container');
    const guiaError = root.querySelector('#guia-error');
    const guiaOptions = root.querySelectorAll('.guia-options button[data-guia]');
    const guiaNameInput = root.querySelector('#guiaNameInput');

    if (!guiaSelecionado) {
      btn.disabled = true;
      btn.classList.add('disabled-temp');
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    }

    const guias = Array.from(root.querySelectorAll('.guia-container p[data-guia]')).map(p => ({
      id: p.dataset.guia,
      description: getText(p)
    }));

    if (guias.length > 0) {
      console.log('[section-guia.js] Guias encontrados no HTML:', guias);
      for (const p of root.querySelectorAll('.guia-container p[data-guia]')) {
        await typeOnce(p, 30);
        if (window.EffectCoordinator?.speak) {
          console.log('[section-guia.js] Iniciando TTS para:', getText(p));
          await window.EffectCoordinator.speak(getText(p), { rate: 1.06 });
          console.log('[section-guia.js] TTS concluído para:', getText(p));
        }
        await new Promise(r => setTimeout(r, 50));
      }

      guiaOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          selectedGuia = btn.dataset.guia;
          guiaSelecionado = true;
          console.log('[section-guia.js] Guia selecionado:', selectedGuia);
          enableSelectButton(root.querySelector('#btn-selecionar-guia'));
          document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guia: selectedGuia } }));
        }, { once: true });
      });
    } else {
      console.warn('[section-guia.js] Nenhum guia encontrado no HTML. Avance sem seleção.');
      guiaError && (guiaError.style.display = 'block');
      window.toast?.('Nenhum guia disponível. Use o botão Pular.', 'error');
      guiaSelecionado = true;
      enableSelectButton(btn);
    }

    if (guiaNameInput) {
      guiaNameInput.addEventListener('input', () => {
        const nameValid = guiaNameInput.value.trim().length >= 2;
        if (nameValid && selectedGuia) {
          enableSelectButton(root.querySelector('#btn-selecionar-guia'));
        } else {
          btn.disabled = true;
          btn.classList.add('disabled-temp');
          btn.style.opacity = '0.5';
          btn.style.cursor = 'not-allowed';
        }
      });
    }
  }

  async function handler(evt) {
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId !== 'section-guia') return;

    console.log('[section-guia.js] Ativando guia');
    let root = node || document.getElementById('section-guia') || document.getElementById('jornada-content-wrapper');
    if (!root) {
      try {
        root = await waitForElement('#section-guia:not(.hidden), #jornada-content-wrapper:not(.hidden)', { timeout: 3000 });
        console.log('[section-guia.js] Root encontrado:', root.outerHTML.slice(0, 200) + '...');
      } catch {
        console.error('[section-guia.js] Root da guia não encontrado');
        window.toast?.('Guia ainda não montou no DOM.', 'error');
        return;
      }
    }

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

    let title, btnSelecionar, btnSkip;
    try {
      title = await waitForElement('h2[data-typing="true"]', { within: root, timeout: 1500 });
      btnSelecionar = await waitForElement('#btn-selecionar-guia', { within: root, timeout: 1500 });
      btnSkip = await waitForElement('#btn-skip-guia', { within: root, timeout: 1500 });
    } catch (e) {
      console.error('[section-guia.js] Falha ao esperar pelos elementos essenciais:', e);
      window.toast?.('Falha ao carregar a seção Guia. Usando fallback.', 'error');
      title = root.querySelector('h2[data-typing="true"]') || root.appendChild(Object.assign(document.createElement('h2'), { textContent: 'Escolha seu Guia ✨', dataset: { typing: 'true' } }));
      btnSelecionar = root.querySelector('#btn-selecionar-guia') || root.appendChild(Object.assign(document.createElement('button'), { id: 'btn-selecionar-guia', textContent: 'Selecionar Guia', className: 'btn btn-primary' }));
      btnSkip = root.querySelector('#btn-skip-guia') || root.appendChild(Object.assign(document.createElement('button'), { id: 'btn-skip-guia', textContent: 'Pular e Continuar', className: 'btn btn-secondary' }));
    }

    console.log('[section-guia.js] Elementos encontrados:', { title: !!title, btnSelecionar: !!btnSelecionar, btnSkip: !!btnSkip });

    btnSelecionar.classList.add('hidden');
    btnSkip.classList.add('hidden');
    const showBtn = () => {
      console.log('[section-guia.js] Mostrando botões');
      btnSelecionar.classList.remove('hidden');
      btnSelecionar.style.display = 'inline-block';
      btnSkip.classList.remove('hidden');
      btnSkip.style.display = 'inline-block';
    };

    const speed = Number(title.dataset.speed || 30);
    const text = getText(title) || title.dataset.text;
    const cursor = String(title.dataset.cursor || 'true') === 'true';

    if (GUIA_READY) {
      console.log('[section-guia.js] Guia já preparado');
      showBtn();
      loadAndSetupGuia(root, btnSelecionar);
      return;
    }

    window.EffectCoordinator?.stopAll?.();

    const runTypingChain = async () => {
      console.log('[section-guia.js] Iniciando runTypingChain com texto:', text);
      title.textContent = '';
      if (typeof window.runTyping === 'function') {
        try {
          await new Promise((resolve) => {
            window.runTyping(title, text, resolve, { speed, cursor });
          });
          console.log('[section-guia.js] Typing concluído para título');
          if (window.EffectCoordinator?.speak) {
            console.log('[section-guia.js] Iniciando TTS para título:', text);
            await window.EffectCoordinator.speak(text, { rate: 1.06 });
            console.log('[section-guia.js] TTS concluído para título');
          }
        } catch (err) {
          console.warn('[section-guia.js] Erro no runTyping:', err);
          title.textContent = text;
        }
      } else {
        console.log('[section-guia.js] Fallback: sem efeitos para título');
        await typeOnce(title, speed);
        if (window.EffectCoordinator?.speak) {
          console.log('[section-guia.js] Iniciando TTS para título:', text);
          await window.EffectCoordinator.speak(text, { rate: 1.06 });
          console.log('[section-guia.js] TTS concluído para título');
        }
      }
      showBtn();
    };

    try {
      await runTypingChain();
      GUIA_READY = true;
      await loadAndSetupGuia(root, btnSelecionar);
    } catch (err) {
      console.warn('[section-guia.js] Typing chain falhou', err);
      title.textContent = text;
      showBtn();
      GUIA_READY = true;
      await loadAndSetupGuia(root, btnSelecionar);
    }

    const goNext = (e) => {
      const nameInput = root.querySelector('#guiaNameInput');
      const name = nameInput ? nameInput.value.trim() : '';
      if (e.currentTarget.id === 'btn-selecionar-guia' && (!guiaSelecionado || name.length < 2)) {
        console.warn('[section-guia.js] Tentativa de avançar sem guia selecionado ou nome válido.');
        window.toast?.('Por favor, selecione um guia e digite um nome com pelo menos 2 caracteres.', 'warn');
        return;
      }

      console.log(`[section-guia.js] Botão ${e.currentTarget.id} clicado, avançando...`);
      const nextSection = 'section-selfie';
      try {
        if (window.JC?.goNext) {
          window.JC.goNext(nextSection, { guia: selectedGuia, name });
        } else if (typeof window.showSection === 'function') {
          window.showSection(nextSection);
        } else {
          console.warn('[section-guia.js] Nenhum método de navegação encontrado.');
        }
      } catch (err) {
        console.error('[section-guia.js] Erro ao avançar:', err);
      }
    };

    const freshBtnSelecionar = btnSelecionar.cloneNode(true);
    btnSelecionar.replaceWith(freshBtnSelecionar);
    once(freshBtnSelecionar, 'click', goNext);

    const freshBtnSkip = btnSkip.cloneNode(true);
    btnSkip.replaceWith(freshBtnSkip);
    once(freshBtnSkip, 'click', goNext);
  }

  function armObserver(root) {
    try {
      if (window.__guiaObserver) window.__guiaObserver.disconnect();
      const obs = new MutationObserver((mutations) => {
        if (!GUIA_READY && mutations.some(m => m.target === root || m.addedNodes.length > 0)) {
          handler({ detail: { sectionId: 'section-guia', node: root } });
        }
      });
      obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
      window.__guiaObserver = obs;
    } catch {}
  }

  function tryKick(force = false) {
    let root = document.getElementById('section-guia') || document.getElementById('jornada-content-wrapper');
    if (!root) {
      console.error('[section-guia.js] Root não encontrado');
      return false;
    }

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');

    armObserver(root);
    handler({ detail: { sectionId: 'section-guia', node: root } });
    return true;
  }

  window.__guiaKick = tryKick;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryKick, { once: true });
  } else {
    tryKick();
  }

  document.addEventListener('section:shown', (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId === 'section-guia') {
      GUIA_READY = false;
      tryKick(true);
    }
  }, { passive: true });
})();
