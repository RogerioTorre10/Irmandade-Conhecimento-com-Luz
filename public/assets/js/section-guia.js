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

    el.textContent = '';
    el.classList.add('typing-active');
    for (let i = 0; i < text.length; i++) {
      el.textContent += text.charAt(i);
      await new Promise(r => setTimeout(r, speed));
    }
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
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
        window.EffectCoordinator?.speak?.(getText(p), { rate: 1.06 });
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
        if (guiaNameInput.value.trim().length >= 2 && selectedGuia) {
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
      Stuart

System: <xaiArtifact artifact_id="07fb8f65-ab59-438f-abd5-c2c141810589" artifact_version_id="dc29dad6-abf8-4739-a33d-ebb16a831f5a" title="index.html" contentType="text/html">
<div id="jornada-content-wrapper">
  <div id="section-guia" class="j-section hidden">
    <div class="conteudo-pergaminho">
      <h2 data-typing="true" data-text="Escolha seu Guia ✨" data-speed="30" data-cursor="true">
        Escolha seu Guia ✨
      </h2>
      <div class="guia-container">
        <p data-guia="zion" class="typing-active">Zion (Grok): Curioso e direto, busca respostas profundas com visão cósmica.</p>
        <p data-guia="lumen" class="typing-active">Lumen (ChatGPT): Acolhedor e reflexivo, guia com empatia e clareza.</p>
        <p data-guia="arian" class="typing-active">Arian (Gemini): Criativo e versátil, inspira com perspectivas inovadoras.</p>
        <div class="guia-name-input">
          <label for="guiaNameInput">Seu Nome</label>
          <input id="guiaNameInput" type="text" placeholder="Digite seu nome para a jornada...">
        </div>
        <div class="guia-options">
          <button class="btn" data-action="select-guia" data-guia="zion">Escolher Zion</button>
          <button class="btn" data-action="select-guia" data-guia="lumen">Escolher Lumen</button>
          <button class="btn" data-action="select-guia" data-guia="arian">Escolher Arian</button>
        </div>
        <div class="guia-actions">
          <button id="btn-selecionar-guia" class="btn btn-primary" data-action="selecionar-guia" disabled>Selecionar Guia</button>
          <button id="btn-skip-guia" class="btn btn-secondary" data-action="skip-guia">Pular e Continuar</button>
        </div>
        <div id="guia-error" style="display:none; color: red;">Erro ao carregar guias.</div>
      </div>
    </div>
  </div>
</div>

<style>
/* Escolha do guia */
.guia-container {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: var(--panel);
  text-align: center;
}
.guia-container p {
  font-size: 18px;
}
.guia-options {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 12px;
}
.guia-options button {
  padding: 8px 16px;
  font-size: 18px;
}
.guia-name-input {
  margin: 12px 0;
}
.guia-name-input label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  font-size: 18px;
}
.guia-name-input input {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-family: "Cardo", serif;
  font-size: 18px;
}
/* Estilo para datilografia */
.typing-active {
  text-align: left !important;
  direction: ltr !important;
  display: block !important;
  width: 100% !important;
  margin-left: 0 !important;
  margin-right: auto !important;
}
.typing-done::after {
  content: "";
  animation: none;
}
</style>
