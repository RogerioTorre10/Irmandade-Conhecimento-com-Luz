(function () {
  'use strict';

  if (window.__termosBound) return;
  window.__termosBound = true;

  let TERMOS_READY = false;

  const once = (el, ev, fn) => {
    if (!el) {
      console.warn('[section-termos.js] Elemento para evento não encontrado:', ev);
      return;
    }
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  function waitForElement(selector, { within = document, timeout = 5000 } = {}) {
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

      observer.observe(within, {
        childList: true,
        subtree: true,
        attributes: false
      });

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
    const name = detail.name || null;
    return { sectionId, node, name };
  }

  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    console.log('[section-termos.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-termos') return;

    console.log('[section-termos.js] Ativando termos');

    let root = node || document.getElementById('section-termos');
    if (!root) {
      try {
        root = await waitForElement('#section-termos', { within: document.getElementById('jornada-content-wrapper') || document, timeout: 10000 });
        console.log('[section-termos.js] Root encontrado:', root.outerHTML.slice(0, 200) + '...');
      } catch (e) {
        console.error('[section-termos.js] Root da termos não encontrado:', e);
        window.toast?.('Erro: Seção section-termos não carregada.', 'error');
        return;
      }
    }

    let pg1, pg2, nextBtn, prevBtn, avancarBtn;
    try {
      pg1 = await waitForElement('#termos-pg1', { within: root, timeout: 5000 });
      pg2 = await waitForElement('#termos-pg2', { within: root, timeout: 5000 });
      nextBtn = await waitForElement('[data-action="termos-next"]', { within: root, timeout: 5000 });
      prevBtn = await waitForElement('[data-action="termos-prev"]', { within: root, timeout: 5000 });
      avancarBtn = await waitForElement('[data-action="avancar"]', { within: root, timeout: 5000 });
    } catch (e) {
      console.error('[section-termos.js] Falha ao esperar pelos elementos essenciais:', e);
      window.toast?.('Falha ao carregar a seção Termos. Verifique o HTML.', 'error');
      return;
    }

    console.log('[section-termos.js] Elementos encontrados:', { pg1: !!pg1, pg2: !!pg2, nextBtn: !!nextBtn, prevBtn: !!prevBtn, avancarBtn: !!avancarBtn });

    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else if (typeof window.showSection === 'function') {
        window.showSection('section-termos');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'flex';
      }
    } catch (err) {
      console.warn('[section-termos.js] Falha ao exibir seção:', err);
      root.classList.remove('hidden');
      root.style.display = 'flex';
    }

    const runTypingChain = async () => {
      console.log('[section-termos.js] Iniciando runTypingChain');
      const typingElements = root.querySelectorAll('[data-typing="true"]');
      if (typeof window.runTyping === 'function') {
        try {
          for (const el of typingElements) {
            const text = getText(el);
            el.textContent = '';
            el.classList.add('typing-active');
            await new Promise((resolve) => {
              window.runTyping(el, text, resolve, { speed: Number(el.dataset.speed || 40), cursor: String(el.dataset.cursor || 'true') === 'true' });
            });
            el.classList.add('typing-done');
            console.log(`[section-termos.js] Typing concluído para ${el.tagName}${el.id ? '#' + el.id : ''}`);
          }
        } catch (err) {
          console.warn('[section-termos.js] Erro no runTyping:', err);
          typingElements.forEach(el => {
            el.textContent = getText(el);
            el.classList.add('typing-done');
          });
        }
      } else {
        console.log('[section-termos.js] Fallback: sem efeitos');
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
        });
      }
      nextBtn.disabled = false;
      prevBtn.disabled = false;
      avancarBtn.disabled = false;
    };

    try {
      await runTypingChain();
      TERMOS_READY = true;
    } catch (err) {
      console.warn('[section-termos.js] Typing chain falhou', err);
      nextBtn.disabled = false;
      prevBtn.disabled = false;
      avancarBtn.disabled = false;
    }

    const showPage = (page) => {
      pg1.classList.toggle('hidden', page === 2);
      pg2.classList.toggle('hidden', page === 1);
      console.log(`[section-termos.js] Mostrando página ${page}`);
    };

    once(nextBtn, 'click', () => {
      showPage(2);
    });

    once(prevBtn, 'click', () => {
      showPage(1);
    });

    once(avancarBtn, 'click', () => {
      console.log('[section-termos.js] Botão "Aceito" clicado, navegando para próxima seção');
      if (typeof window.__canNavigate === 'function' && !window.__canNavigate()) {
        console.log('[section-termos.js] Navegação bloqueada por __canNavigate');
        return;
      }

      const nextSection = 'section-senha';
      try {
        if (window.JC?.goNext) {
          window.JC.goNext(nextSection);
        } else if (typeof window.showSection === 'function') {
          window.showSection(nextSection);
        } else {
          console.warn('[section-termos.js] Nenhuma função de navegação disponível');
        }
      } catch (err) {
        console.error('[section-termos.js] Erro ao avançar:', err);
      }
    });
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });
    console.log('[section-termos.js] Handler ligado');

    const visibleTermos = document.querySelector('#section-termos:not(.hidden)');
    if (visibleTermos) {
      handler({ detail: { sectionId: 'section-termos', node: visibleTermos } });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
