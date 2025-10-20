// section-guia.js — v16 (carrega guias.json, corrige efeitos e textura)
(function () {
  'use strict';
  if (window.__guiaBound_v16) return;
  window.__guiaBound_v16 = true;

  // ===== Config =====
  const TYPING_SPEED_DEFAULT = 30;
  const SPEAK_RATE = 1.06;
  const NEXT_PAGE = 'selfie.html';
  const TRANSITION_VIDEO = '/assets/img/conhecimento-com-luz-jardim.mp4';
  const GUIAS_JSON = '/assets/data/guias.json';

  // ===== Estado =====
  let ABORT_TOKEN = 0;
  let guiaAtual = null;

  // ===== Utils =====
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const aborted = (my) => my !== ABORT_TOKEN;

  function persistChoice(guia, nome) {
    try {
      sessionStorage.setItem('jornada.guia', guia || '');
      sessionStorage.setItem('jornada.nome', nome || '');
    } catch (e) {
      console.error('Erro ao persistir escolha:', e);
    }
  }

  function restoreChoice() {
    try {
      return {
        guia: sessionStorage.getItem('jornada.guia') || '',
        nome: sessionStorage.getItem('jornada.nome') || ''
      };
    } catch (e) {
      console.error('Erro ao restaurar escolha:', e);
      return { guia: '', nome: '' };
    }
  }

  function enable(el) {
    if (el) {
      el.disabled = false;
      el.style.pointerEvents = '';
      el.style.opacity = '';
    }
  }

  function disable(el) {
    if (el) {
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
    }
  }

  function highlightChoice(root, guia) {
    qsa('[data-guia]', root).forEach(el => {
      if (el.dataset.guia === guia) el.classList.add('guia-selected');
      else el.classList.remove('guia-selected');
    });
  }

  // ---- Carregar guias do JSON ----
  async function loadGuias() {
    try {
      const response = await fetch(GUIAS_JSON);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const guias = await response.json();
      console.log('Guias carregados:', guias);
      return guias;
    } catch (e) {
      console.error('Erro ao carregar guias:', e);
      qs('#guia-error').style.display = 'block';
      return [];
    }
  }

  function renderGuias(guias, root) {
    const descContainer = qs('.guia-descricao-medieval', root);
    const btnContainer = qs('.guia-options', root);
    descContainer.innerHTML = '';
    btnContainer.innerHTML = '';

    guias.forEach(guia => {
      // Adicionar descrição
      const p = document.createElement('p');
      p.dataset.guia = guia.id;
      p.textContent = `${guia.nome}: ${guia.descricao}`;
      descContainer.appendChild(p);

      // Adicionar botão
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.dataset.action = 'select-guia';
      btn.dataset.guia = guia.id;
      btn.textContent = `Escolher ${guia.nome}`;
      btnContainer.appendChild(btn);
    });
  }

  // ---- Efeito datilografia + leitura ----
  function typeLocal(el, text, speed) {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else resolve();
      };
      tick();
    });
  }

  async function runTypingAndSpeak(el, text, myId) {
    if (!el || !text) return;

    el.classList.remove('typing-done', 'typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align', 'left', 'important');
    el.setAttribute('dir', 'ltr');

    const speed = Number(el.dataset.speed || TYPING_SPEED_DEFAULT);
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try {
          window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' });
        } catch {
          el.textContent = text;
          res();
        }
      });
    } else {
      await typeLocal(el, text, speed);
    }
    if (aborted(myId)) return;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: SPEAK_RATE });
      if (p && typeof p.then === 'function') await p;
    } catch (e) {
      console.error('Erro no TTS:', e);
    }
  }

  // ---- Transição com vídeo ----
  function playTransitionVideo() {
    const video = document.createElement('video');
    video.src = TRANSITION_VIDEO;
    video.autoplay = true;
    video.muted = true;
    video.controls = false;
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.zIndex = '9999';
    video.style.backgroundColor = '#000';

    document.body.innerHTML = '';
    document.body.appendChild(video);

    video.addEventListener('ended', () => {
      window.location.href = NEXT_PAGE;
    });

    video.addEventListener('error', e => {
      console.error('Erro ao reproduzir vídeo:', e);
      window.location.href = NEXT_PAGE; // Fallback para redirecionar mesmo se o vídeo falhar
    });
  }

  // ---- Bind da UI ----
  async function bindUI(root) {
    const nameInput = qs('#guiaNameInput', root);
    const btnSel = qs('#btn-selecionar-guia', root);

    // Carregar e renderizar guias
    const guias = await loadGuias();
    if (guias.length === 0) {
      qs('#guia-error').style.display = 'block';
      return;
    }
    renderGuias(guias, root);

    // Restaurar escolha prévia
    const saved = restoreChoice();
    if (saved.nome && nameInput) nameInput.value = saved.nome;
    if (saved.guia) {
      guiaAtual = saved.guia;
      highlightChoice(root, guiaAtual);
      enable(btnSel);
    } else {
      disable(btnSel);
    }

    // Atualizar botão com base no input
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim() !== '' && guiaAtual) {
        enable(btnSel);
      } else {
        disable(btnSel);
      }
    });

    // Clique nas linhas <p data-guia>
    qsa('.guia-descricao-medieval [data-guia]', root).forEach(p => {
      if (p.__bound) return;
      p.addEventListener('click', () => {
        guiaAtual = p.dataset.guia;
        highlightChoice(root, guiaAtual);
        enable(btnSel);
        try {
          document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guia: guiaAtual } }));
        } catch (e) {
          console.error('Erro ao disparar evento guiaSelected:', e);
        }
      });
      p.__bound = true;
    });

    // Botões “Escolher X”
    qsa('[data-action="select-guia"][data-guia]', root).forEach(btn => {
      if (btn.__bound) return;
      btn.addEventListener('click', () => {
        guiaAtual = btn.dataset.guia;
        highlightChoice(root, guiaAtual);
        enable(btnSel);
        try {
          document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guia: guiaAtual } }));
        } catch (e) {
          console.error('Erro ao disparar evento guiaSelected:', e);
        }
      });
      btn.__bound = true;
    });

    // Selecionar Guia
    if (btnSel && !btnSel.__bound) {
      btnSel.addEventListener('click', () => {
        if (!guiaAtual || nameInput.value.trim() === '') {
          qs('#guia-error').style.display = 'block';
          window.toast?.('Selecione um guia e insira um nome.', 'warning');
          return;
        }
        persistChoice(guiaAtual, nameInput.value.trim());
        playTransitionVideo();
      });
      btnSel.__bound = true;
    }
  }

  async function activate(root) {
    if (!root) {
      console.error('Root element (#section-guia) não encontrado.');
      return;
    }
    const myId = ++ABORT_TOKEN;

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');

    let title = qs('h2[data-typing="true"]', root);
    if (!title) {
      title = document.createElement('h2');
      title.dataset.typing = 'true';
      title.dataset.text = 'Escolha seu Guia ✨';
      title.textContent = 'Escolha seu Guia ✨';
      (qs('.conteudo-pergaminho', root) || root).prepend(title);
    }
    const text = (title.dataset.text || title.textContent || '').trim();
    await runTypingAndSpeak(title, text, myId);
    if (aborted(myId)) return;

    await bindUI(root);
    enable(qs('#btn-selecionar-guia', root));
  }

  // Handler principal
  async function onSectionShown(evt) {
    const id = evt?.detail?.sectionId || evt?.detail?.id;
    if (id !== 'section-guia' && id !== 'section-escolha') {
      ABORT_TOKEN++;
      return;
    }

    let root = evt?.detail?.node || evt?.detail?.root || qs('#section-guia');
    if (!root || root.id !== 'section-guia') {
      const wrapper = qs('#section-escolha') || qs('#jornada-content-wrapper') || document.body;
      root = qs('#section-guia', wrapper) || qs('#section-guia') || root;
      if (!root || root.id !== 'section-guia') {
        const sec = document.createElement('div');
        sec.id = 'section-guia';
        sec.className = 'j-section';
        wrapper.appendChild(sec);
        sec.innerHTML = `
          <div class="conteudo-pergaminho">
            <h2 data-typing="true" data-text="Escolha seu Guia ✨" data-speed="30" data-cursor="true">Escolha seu Guia ✨</h2>
            <div class="guia-name-input">
              <label for="guiaNameInput">Insira seu nome</label>
              <input id="guiaNameInput" type="text" placeholder="Digite seu nome para a jornada...">
            </div>
            <div class="guia-descricao-medieval"></div>
            <div class="guia-options"></div>
            <div class="guia-actions">
              <button id="btn-selecionar-guia" class="btn btn-primary" data-action="selecionar-guia" disabled>Selecionar Guia</button>
            </div>
            <div id="guia-error" style="display: none; color: red;">Erro ao carregar guias.</div>
          </div>`;
        root = sec;
      }
    }
    await activate(root);
  }

  document.addEventListener('section:shown', (e) => {
    const id = e?.detail?.sectionId || e?.detail?.id;
    if (id && id !== 'section-guia' && id !== 'section-escolha') ABORT_TOKEN++;
  });

  document.addEventListener('section:shown', onSectionShown);

  if (qs('#section-guia') && !qs('#section-guia').classList.contains('hidden')) {
    activate(qs('#section-guia'));
  }
})();
