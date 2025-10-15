(function () {
  'use strict';

  if (window.__senhaBound) return;
  window.__senhaBound = true;

  let SENHA_READY = false;

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
          return reject(new Error(`timeout waiting ${selector}`));
        }
        setTimeout(tick, step);
      };
      tick();
    });
  };

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
    if (sectionId !== 'section-senha') return;

    let root = node || document.getElementById('section-senha');
    if (!root) {
      try {
        root = await waitForElement('#section-senha', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 10000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-senha não carregada.', 'error');
        console.error('[section-senha] Section not found:', e);
        return;
      }
    }

    let title, p1, input, eye, avancarBtn;
    try {
      title = await waitForElement('.title-senha', { within: root, timeout: 10000 });
      p1 = await waitForElement('.senha-wrap p', { within: root, timeout: 10000 });
      input = await waitForElement('#senha-input', { within: root, timeout: 10000 });
      eye = await waitForElement('.btn-toggle-senha', { within: root, timeout: 10000 });
      avancarBtn = await waitForElement('#btn-senha-avancar', { within: root, timeout: 10000 });
    } catch (e) {
      console.error('[section-senha] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Senha.', 'error');

      title = title || root.querySelector('.title-senha') || document.createElement('h2');
      p1 = p1 || root.querySelector('.senha-wrap p') || document.createElement('p');
      input = input || root.querySelector('#senha-input') || document.createElement('input');
      eye = eye || root.querySelector('.btn-toggle-senha') || document.createElement('button');
      avancarBtn = avancarBtn || root.querySelector('#btn-senha-avancar') || document.createElement('button');

      if (!title.classList.contains('title-senha')) {
        title.classList.add('title-senha');
        title.dataset.typing = 'true';
        title.textContent = 'Insira sua Palavra-Chave Sagrada.';
        root.appendChild(title);
      }
      if (!p1.textContent) {
        p1.textContent = 'A Palavra-Chave garante que apenas você acesse seu progresso.';
        p1.dataset.typing = 'true';
        root.appendChild(p1);
      }
      if (!input.id) {
        input.id = 'senha-input';
        input.type = 'password';
        input.classList.add('input');
        input.placeholder = 'Digite a Palavra-Chave';
        root.appendChild(input);
      }
      if (!eye.classList.contains('btn-toggle-senha')) {
        eye.classList.add('btn-toggle-senha');
        eye.textContent = '👁️';
        root.appendChild(eye);
      }
      if (!avancarBtn.id) {
        avancarBtn.id = 'btn-senha-avancar';
        avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
        avancarBtn.dataset.action = 'avancar';
        avancarBtn.textContent = 'Acessar Jornada';
        root.appendChild(avancarBtn);
      }
    }

    [title, p1].forEach(el => {
      if (el) {
        el.style.color = '#fff !important';
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
        console.log('[section-senha] Texto inicializado:', el.tagName, el.textContent?.substring(0, 50));
      }
    });

    root.style.cssText = `
      background: transparent !important;
      padding: 30px !important;
      border-radius: 12px !important;
      max-width: 600px !important;
      text-align: center !important;
      box-shadow: none !important;
      border: none !important;
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: relative !important;
      z-index: 2 !important;
      overflow: hidden !important;
      max-height: 80vh !important;
    `;

    [avancarBtn, eye].forEach(btn => {
      if (btn) {
        btn.classList.add('btn', 'btn-primary', 'btn-stone');
        btn.disabled = false;
        btn.style.opacity = '1 !important';
        btn.style.cursor = 'pointer !important';
        console.log('[section-senha] Botão habilitado:', btn.className, btn.textContent);
      }
    });

    once(eye, 'click', () => {
      if (input.type === 'password') {
        input.type = 'text';
        console.log('[section-senha] Senha visível');
      } else {
        input.type = 'password';
        console.log('[section-senha] Senha oculta');
      }
    });

    once(avancarBtn, 'click', () => {
      console.log('[section-senha] Avançando para section-filme');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-filme');
      } else {
        window.location.href = '/filme';
        console.warn('[section-senha] Fallback navigation to /filme');
      }
    });

    const runTypingChain = async () => {
      console.log('[section-senha] Iniciando datilografia...');
      const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
      
      for (let el of typingElements) {
        const text = getText(el);
        console.log('[section-senha] Datilografando:', el.tagName, text.substring(0, 50));
        
        if (typeof window.runTyping === 'function') {
          el.textContent = '';
          el.classList.add('typing-active');
          el.style.color = '#fff !important';
          await new Promise(resolve => window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 40),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          }));
        } else {
          el.textContent = text;
        }
        
        el.classList.add('typing-done');
        el.style.opacity = '1 !important';
        el.style.color = '#fff !important';
        
        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.03, pitch: 1.0 });
          console.log('[section-senha] TTS ativado para:', el.tagName);
          await new Promise(resolve => setTimeout(resolve, text.length * 50));
        }
      }
      
      console.log('[section-senha] Datilografia concluída');
      [avancarBtn].forEach(btn => {
        if (btn) btn.disabled = false;
      });
    };

    if (!SENHA_READY) {
      try {
        await runTypingChain();
        SENHA_READY = true;
      } catch (err) {
        console.error('[section-senha] Erro na datilografia:', err);
        root.querySelectorAll('[data-typing="true"]').forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
          el.style.opacity = '1 !important';
          el.style.color = '#fff !important';
        });
        [avancarBtn].forEach(btn => {
          if (btn) btn.disabled = false;
        });
      }
    } else {
      [avancarBtn].forEach(btn => {
        if (btn) btn.disabled = false;
      });
    }

    console.log('[section-senha] Elementos encontrados:', {
      title: !!title, titleClass: title?.className,
      p1: !!p1, p1Text: p1?.textContent?.substring(0, 50),
      input: !!input, inputId: input?.id,
      eye: !!eye, eyeClass: eye?.className,
      avancarBtn: !!avancarBtn, avancarId: avancarBtn?.id
    });
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });

    setTimeout(() => {
      const visibleSenha = document.querySelector('#section-senha:not(.hidden)');
      if (visibleSenha) {
        handler({ detail: { sectionId: 'section-senha', node: visibleSenha } });
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
