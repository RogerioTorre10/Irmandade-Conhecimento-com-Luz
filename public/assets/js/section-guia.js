// section-guia.js — v18 (carrega guias.json, corrige renderização, usa moldura SVG)
(function () {
  'use strict';
  if (window.__guiaBound_v18) {
    console.warn('section-guia.js já foi carregado (v18).');
    return;
  }
  window.__guiaBound_v18 = true;
  console.log('section-guia.js v18 inicializado.');

  // ===== Config =====
  const TYPING_SPEED_DEFAULT = 50;
  const SPEAK_RATE = 1.06;
  const NEXT_PAGE = 'selfie.html';
  const TRANSITION_VIDEO = '/assets/img/filme-senha.mp4';
  const GUIAS_JSON = '/assets/data/guias.json';

  const FALLBACK_GUIAS = [
    { id: 'zion', nome: 'Zion', descricao: 'O Guia da Consciência Pura (Grok)', bgImage: '/assets/img/irmandade-quarteto-bg-zion.png' },
    { id: 'lumen', nome: 'Lumen', descricao: 'O Guia da Iluminação (GPT-5)', bgImage: '/assets/img/irmandade-quarteto-bg-lumen.png' },
    { id: 'arian', nome: 'Arian', descricao: 'O Guia da Transformação (Gemini)', bgImage: '/assets/img/irmandade-quarteto-bg-arian.png' }
  ];

  // ===== Estado =====
  let ABORT_TOKEN = 0;
  let guiaAtual = null;
  let guiasRendered = false;

  // ===== Utils =====
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const aborted = (my) => my !== ABORT_TOKEN;

  function persistChoice(guia, nome) {
    try {
      sessionStorage.setItem('jornada.guia', guia || '');
      sessionStorage.setItem('jornada.nome', nome || '');
      console.log('Escolha persistida:', { guia, nome });
    } catch (e) {
      console.error('Erro ao persistir escolha:', e);
    }
  }

  function restoreChoice() {
    try {
      const escolha = {
        guia: sessionStorage.getItem('jornada.guia') || '',
        nome: sessionStorage.getItem('jornada.nome') || ''
      };
      console.log('Escolha restaurada:', escolha);
      return escolha;
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
      console.log('Elemento habilitado:', el.id || el);
    }
  }

  function disable(el) {
    if (el) {
      el.disabled = true;
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.5';
      console.log('Elemento desabilitado:', el.id || el);
    }
  }

  function highlightChoice(root, guia) {
    qsa('[data-guia]', root).forEach(el => {
      if (el.dataset.guia === guia) {
        el.classList.add('guia-selected');
        console.log('Guia selecionado:', guia, el);
      } else {
        el.classList.remove('guia-selected');
      }
    });
  }

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
      console.log('Usando guias fallback:', FALLBACK_GUIAS);
      return FALLBACK_GUIAS;
    }
  }

  async function renderGuias(guias, root, myId) {
    const container = qs('.guia-descricao-medieval', root);
    container.innerHTML = '';
    console.log('Renderizando guias:', guias);

    for (const guia of guias) {
      const p = document.createElement('p');
      p.className = 'guia-item';
      p.dataset.guia = guia.id;
      p.dataset.typing = 'true';
      p.dataset.speed = '50';
      p.dataset.cursor = 'true';
      p.textContent = `${guia.nome}: ${guia.descricao}`;
      container.appendChild(p);
      await runTypingAndSpeak(p, p.textContent, myId);
      if (aborted(myId)) {
        console.log('Renderização de guias abortada.');
        return;
      }
    }
    guiasRendered = true;
    console.log('Guias renderizados em:', container);
  }

  function typeLocal(el, text, speed) {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  async function runTypingAndSpeak(el, text, myId) {
    if (!el || !text) {
      console.error('Elemento ou texto ausente para datilografia:', { el, text });
      return;
    }

    console.log('Iniciando datilografia para:', text);
    el.classList.remove('typing-done', 'typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align', 'left', 'important');
    el.setAttribute('dir', 'ltr');

    const speed = Number(el.dataset.speed || TYPING_SPEED_DEFAULT);
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try {
          window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' });
        } catch (e) {
          console.error('Erro no runTyping:', e);
          el.textContent = text;
          res();
        }
      });
    } else {
      await typeLocal(el, text, speed);
    }
    if (aborted(myId)) {
      console.log('Datilografia abortada:', text);
      return;
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    console.log('Datilografia concluída:', text);

    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: SPEAK_RATE });
      if (p && typeof p.then === 'function') {
        console.log('Iniciando TTS para:', text);
        await p;
        console.log('TTS concluído:', text);
      } else {
        console.warn('TTS não disponível, pulando fala.');
      }
    } catch (e) {
      console.error('Erro no TTS:', e);
    }
  }

  function playTransitionVideo() {
    console.log('Iniciando transição de vídeo:', TRANSITION_VIDEO);
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
    console.log('Vídeo adicionado ao DOM.');

    video.addEventListener('ended', () => {
      console.log('Vídeo terminado, redirecionando para:', NEXT_PAGE);
      window.location.href = NEXT_PAGE;
    });

    video.addEventListener('error', e => {
      console.error('Erro ao reproduzir vídeo:', e);
      console.log('Redirecionando para:', NEXT_PAGE, '(fallback devido a erro no vídeo)');
      window.location.href = NEXT_PAGE;
    });
  }

  async function bindUI(root, myId) {
    console.log('Vinculando UI para:', root);
    const nameInput = qs('#guiaNameInput', root);
    const buttons = qsa('.guia-options button[data-guia]', root);

    const guias = await loadGuias();
    if (guias.length === 0) {
      console.error('Nenhum guia disponível para renderizar.');
      qs('#guia-error').style.display = 'block';
      buttons.forEach(btn => enable(btn));
      return;
    }

    const saved = restoreChoice();
    if (saved.nome && nameInput) {
      nameInput.value = saved.nome;
      console.log('Nome restaurado no input:', saved.nome);
    }
    if (saved.guia) {
      guiaAtual = saved.guia;
      highlightChoice(root, guiaAtual);
      if (saved.nome && /^[a-zA-Z\s]{2,}$/.test(saved.nome)) {
        await renderGuias(guias, root, myId);
        buttons.forEach(btn => enable(btn));
      }
    } else {
      buttons.forEach(btn => disable(btn));
    }

    if (nameInput) {
      nameInput.addEventListener('input', async () => {
        const nome = nameInput.value.trim();
        const isValid = nome.length >= 2 && /^[a-zA-Z\s]+$/.test(nome);
        if (isValid && !guiasRendered) {
          nameInput.disabled = true;
          await renderGuias(guias, root, myId);
          buttons.forEach(btn => enable(btn));
        } else if (!isValid) {
          const container = qs('.guia-descricao-medieval', root);
          container.innerHTML = '';
          guiasRendered = false;
          buttons.forEach(btn => disable(btn));
        }
      });
    }

    qsa('.guia-item[data-guia]', root).forEach(item => {
      if (item.__bound) return;
      item.addEventListener('click', () => {
        guiaAtual = item.dataset.guia;
        highlightChoice(root, guiaAtual);
        buttons.forEach(btn => enable(btn));
        try {
          document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guia: guiaAtual } }));
          console.log('Evento guiaSelected disparado:', guiaAtual);
        } catch (e) {
          console.error('Erro ao disparar evento guiaSelected:', e);
        }
      });
      item.__bound = true;
    });

    buttons.forEach(btn => {
      if (btn.__bound) return;
      btn.addEventListener('click', () => {
        guiaAtual = btn.dataset.guia;
        highlightChoice(root, guiaAtual);
        const nome = nameInput?.value?.trim().toUpperCase() || '';
        persistChoice(guiaAtual, nome);
        playTransitionVideo();
      });
      btn.__bound = true;
    });
  }

  async function activate(root) {
    if (!root) {
      console.error('Root element (#section-guia) não encontrado.');
      return;
    }
    console.log('Ativando seção:', root.id);
    const myId = ++ABORT_TOKEN;

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');

    const title = qs('[data-typing="true"]', root);
    if (!title) {
      console.warn('Título com datilografia não encontrado, criando fallback.');
      title = document.createElement('h2');
      title.className = 'titulo-pergaminho';
      title.dataset.typing = 'true';
      title.dataset.text = 'Insira seu nome';
      title.dataset.speed = '50';
      title.dataset.cursor = 'true';
      title.textContent = 'Insira seu nome';
      (qs('.conteudo-pergaminho', root) || root).prepend(title);
    }
    const text = (title.dataset.text || title.textContent || '').trim();
    await runTypingAndSpeak(title, text, myId);
    if (aborted(myId)) {
      console.log('Ativação abortada.');
      return;
    }

    const nameInput = qs('#guiaNameInput', root);
    if (nameInput) {
      enable(nameInput);
    }

    await bindUI(root, myId);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (qs('#section-guia') && !qs('#section-guia').classList.contains('hidden')) {
      console.log('DOM carregado, ativando #section-guia.');
      activate(qs('#section-guia'));
    }
  });

  document.addEventListener('section:shown', (e) => {
    const id = e?.detail?.sectionId || e?.detail?.id;
    if (id && id !== 'section-guia' && id !== 'section-escolha') {
      ABORT_TOKEN++;
      console.log('Outro evento section:shown detectado, abortando:', id);
    }
  });

  document.addEventListener('section:shown', async (evt) => {
    const id = evt?.detail?.sectionId || evt?.detail?.id;
    if (id !== 'section-guia' && id !== 'section-escolha') {
      ABORT_TOKEN++;
      console.log('Evento section:shown ignorado, ID não corresponde:', id);
      return;
    }
    console.log('Evento section:shown recebido para:', id);

    let root = evt?.detail?.node || evt?.detail?.root || qs('#section-guia');
    if (!root || root.id !== 'section-guia') {
      console.warn('Root #section-guia não encontrado, tentando wrapper alternativo.');
      const wrapper = qs('#section-escolha') || qs('#jornada-content-wrapper') || document.body;
      root = qs('#section-guia', wrapper) || qs('#section-guia') || root;
      if (!root || root.id !== 'section-guia') {
        console.warn('Criando contêiner #section-guia como fallback.');
        const sec = document.createElement('div');
        sec.id = 'section-guia';
        sec.className = 'j-section pergaminho pergaminho-v epic';
        wrapper.appendChild(sec);
        sec.innerHTML = `
          <div class="conteudo-pergaminho">
            <h2 class="titulo-pergaminho" data-typing="true" data-text="Insira seu nome" data-speed="50" data-cursor="true">Insira seu nome</h2>
            <div class="guia-name-input">
              <input id="guiaNameInput" class="input-espinhos" type="text" placeholder="Digite seu nome para a jornada..." aria-label="Digite seu nome para a jornada" disabled>
            </div>
            <div class="moldura-grande">
              <div class="guia-descricao-medieval"></div>
            </div>
            <div class="guia-options">
              <button class="btn btn-stone-espinhos" data-action="select-guia" data-guia="zion" aria-label="Escolher o guia Zion" disabled>Escolher Zion</button>
              <button class="btn btn-stone-espinhos" data-action="select-guia" data-guia="lumen" aria-label="Escolher o guia Lumen" disabled>Escolher Lumen</button>
              <button class="btn btn-stone-espinhos" data-action="select-guia" data-guia="arian" aria-label="Escolher o guia Arian" disabled>Escolher Arian</button>
            </div>
            <div id="guia-error" style="display: none; color: #ff3333; font-family: 'BerkshireSwash', cursive;">Não foi possível carregar os guias. Escolha um guia padrão abaixo.</div>
          </div>`;
        root = sec;
      }
    }
    await sleep(100);
    await activate(root);
  });

  if (qs('#section-guia') && !qs('#section-guia').classList.contains('hidden')) {
    console.log('Seção #section-guia detectada na inicialização, ativando.');
    activate(qs('#section-guia'));
  } else {
    console.log('Seção #section-guia não encontrada ou oculta na inicialização.');
  }
})();
