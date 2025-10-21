// section-guia.js — v20 (corrige erro assíncrono, datilografia e renderização)
(function () {
  'use strict';
  if (window.__guiaBound_v20) {
    console.warn('section-guia.js já foi carregado (v20).');
    return;
  }
  window.__guiaBound_v20 = true;
  console.log('section-guia.js v20 inicializado.');

  // ===== Config =====
  const TYPING_SPEED_DEFAULT = 30;
  const SPEAK_RATE = 1.06;
  const NEXT_PAGE = 'selfie.html';
  const TRANSITION_VIDEO = '/assets/img/conhecimento-com-luz-jardim.mp4'; // Ajuste para /public/assets/ se necessário
  const GUIAS_JSON = '/assets/data/guias.json'; // Ajuste para /public/assets/ se necessário

  // Fallback para guias caso o JSON falhe
  const FALLBACK_GUIAS = [
    { id: 'zion', nome: 'Zion', descricao: 'O Guia da Consciência Pura (Grok)', bgImage: '/assets/img/irmandade-quarteto-bg-zion.png' },
    { id: 'lumen', nome: 'Lumen', descricao: 'O Guia da Iluminação (GPT-5)', bgImage: '/assets/img/irmandade-quarteto-bg-lumen.png' },
    { id: 'arian', nome: 'Arian', descricao: 'O Guia da Transformação (Gemini)', bgImage: '/assets/img/irmandade-quarteto-bg-arian.png' }
  ];

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

  // ---- Carregar guias do JSON ----
  async function loadGuias() {
    try {
      const response = await fetch(GUIAS_JSON, { cache: 'no-cache' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const guias = await response.json();
      console.log('Guias carregados:', guias);
      return guias;
    } catch (e) {
      console.error('Erro ao carregar guias:', e);
      qs('#guia-error') && (qs('#guia-error').style.display = 'block');
      console.log('Usando guias fallback:', FALLBACK_GUIAS);
      return FALLBACK_GUIAS;
    }
  }

 function renderGuias(root, guias = []) {
  const containerDescricao = qs('.guia-descricao-medieval', root);
  const containerOpcoes = qs('.guia-options', root);
  if (!containerDescricao || !containerOpcoes) return;

  containerDescricao.innerHTML = '';
  containerOpcoes.innerHTML = '';

  guias.forEach(guia => {
    // Descrição do guia
    const desc = document.createElement('div');
    desc.className = 'guia-card parchment-card-rough';
    desc.innerHTML = `
      <h3 class="guia-nome">${guia.nome}</h3>
      <p class="guia-descricao">${guia.descricao}</p>
    `;
    containerDescricao.appendChild(desc);

    // Botão do guia
    const btn = document.createElement('button');
    btn.className = 'btn btn-primary btn-stone';
    btn.textContent = `Escolher ${guia.nome}`;
    btn.dataset.action = 'iniciar-filme';
    btn.dataset.guia = guia.id;

    root.querySelectorAll('[data-action="select-guia"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const nome = qs('#guiaNameInput', root)?.value?.trim();
    const guia = btn.dataset.guia;
    if (!nome || nome.length < 2) {
      toast('Digite seu nome para continuar', 'warn');
      return;
    }

    sessionStorage.setItem('jornada.nome', nome);
    sessionStorage.setItem('jornada.guia', guia);

    if (window.JORNADA_NAV?.goAcolhimento) {
      window.JORNADA_NAV.goAcolhimento();
    }
  });
});


    containerOpcoes.appendChild(btn);
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
      }
    } catch (e) {
      console.error('Erro no TTS:', e);
    }
  }

  // ---- Transição com vídeo ----
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

  // ---- Bind da UI ----
  async function bindUI(root) {
    console.log('Vinculando UI para:', root);
    const nameInput = qs('#guiaNameInput', root);
    const btnSel = qs('#btn-selecionar-guia', root);

    // Carregar e renderizar guias
    const guias = await loadGuias();
    if (guias.length === 0) {
      console.error('Nenhum guia disponível para renderizar.');
      qs('#guia-error') && (qs('#guia-error').style.display = 'block');
      return;
    }
    renderGuias(guias, root);

    // Restaurar escolha prévia
    const saved = restoreChoice();
    if (saved.nome && nameInput) {
      nameInput.value = saved.nome;
      console.log('Nome restaurado no input:', saved.nome);
    }
    if (saved.guia) {
      guiaAtual = saved.guia;
      highlightChoice(root, guiaAtual);
      enable(btnSel);
    } else {
      disable(btnSel);
    }

    // Atualizar botão com base no input
    if (nameInput) {
      nameInput.addEventListener('input', () => {
        if (nameInput.value.trim() !== '' && guiaAtual) {
          enable(btnSel);
          console.log('Botão Selecionar Guia habilitado.');
        } else {
          disable(btnSel);
          console.log('Botão Selecionar Guia desabilitado.');
        }
      });
    }

    // Clique nas linhas <p data-guia>
    qsa('.guia-descricao-medieval [data-guia]', root).forEach(p => {
      if (p.__bound) return;
      p.addEventListener('click', () => {
        guiaAtual = p.dataset.guia;
        highlightChoice(root, guiaAtual);
        enable(btnSel);
        try {
          document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guia: guiaAtual } }));
          console.log('Evento guiaSelected disparado:', guiaAtual);
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
          console.log('Evento guiaSelected disparado:', guiaAtual);
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
          qs('#guia-error') && (qs('#guia-error').style.display = 'block');
          window.toast?.('Selecione um guia e insira um nome.', 'warning');
          console.warn('Tentativa de selecionar guia sem guia ou nome válido.');
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
    console.log('Ativando seção:', root.id);
    const myId = ++ABORT_TOKEN;

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');

    let title = qs('h2[data-typing="true"]', root);
    if (!title) {
      console.warn('Título com datilografia não encontrado, criando fallback.');
      title = document.createElement('h2');
      title.dataset.typing = 'true';
      title.dataset.text = 'Escolha seu Guia ✨';
      title.textContent = 'Escolha seu Guia ✨';
      (qs('.conteudo-pergaminho', root) || root).prepend(title);
    }
    const text = (title.dataset.text || title.textContent || '').trim();
    await runTypingAndSpeak(title, text, myId);
    if (aborted(myId)) {
      console.log('Ativação abortada.');
      return;
    }

    await bindUI(root);
    enable(qs('#btn-selecionar-guia', root));
  }

  // Handler principal
  async function onSectionShown(evt) {
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
        sec.className = 'j-section';
        wrapper.appendChild(sec);
        sec.innerHTML = `
          <div class="conteudo-pergaminho">
            <h2 data-typing="true" data-text="Escolha seu Guia ✨" data-speed="30" data-cursor="true">Escolha seu Guia ✨</h2>
            <div class="guia-name-input">
              <label for="guiaNameInput">Insira seu nome</label>
              <input id="guiaNameInput" type="text" placeholder="Digite seu nome para a jornada..." required>
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
    // Atraso maior para evitar problemas de timing
    await sleep(500);
    await activate(root);
  }

  // Garantir inicialização após o DOM estar pronto
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

  document.addEventListener('section:shown', onSectionShown);

  if (qs('#section-guia') && !qs('#section-guia').classList.contains('hidden')) {
    console.log('Seção #section-guia detectada na inicialização, ativando.');
    activate(qs('#section-guia'));
  } else {
    console.log('Seção #section-guia não encontrada ou oculta na inicialização.');
  }
})();
