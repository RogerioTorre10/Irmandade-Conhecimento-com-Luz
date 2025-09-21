/* =========================================================
   jornada-controller.js
   Controla a navegação e estado da jornada
   ========================================================= */
(function () {
  'use strict';
  console.log('[JORNADA_CONTROLLER] ```javascript
/* =========================================================
   jornada-controller.js
   Controla a navegação e estado da jornada
   ========================================================= */
(function () {
  'use strict';
  console.log('[JORNADA_CONTROLLER] Script iniciado');

  // Evita múltiplas inicializações
  if (window.__JC_INIT_DONE) {
    console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
    return;
  }
  window.__JC_INIT_DONE = true;

  // Define namespace JC
  const JC = (window.JC = window.JC || {});
  JC.state = JC.state || { route: 'intro', booted: false, blocoIndex: 0, perguntaIndex: 0 };
  console.log('[JORNADA_CONTROLLER] JC.state definido:', JC.state);

  // Define JC.init imediatamente
  if (typeof JC.init !== 'function') {
    JC.init = function initJornada() {
      if (JC.state.booted) {
        console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
        return;
      }
      JC.state.booted = true;
      JC.state.route = 'intro';
      JC.ready = true;
      console.log('[JORNADA_CONTROLLER] JC.init executado');

      try {
        if (window.JORNADA_RENDER && window.JORNADA_RENDER.updateCanvasBackground) {
          window.JORNADA_RENDER.updateCanvasBackground('section-intro');
          console.log('[JORNADA_CONTROLLER] updateCanvasBackground chamado');
        }
        if (window.JORNADA_CHAMA && window.JORNADA_CHAMA.ensureHeroFlame) {
          window.JORNADA_CHAMA.ensureHeroFlame('section-intro');
          console.log('[JORNADA_CONTROLLER] ensureHeroFlame chamado');
        }
        const section = document.getElementById('section-intro');
        if (section && window.showSection) {
          window.showSection('section-intro');
          console.log('[JORNADA_CONTROLLER] showSection chamado para section-intro');
        } else {
          console.error('[JORNADA_CONTROLLER] section-intro não encontrada ou showSection ausente');
          window.toast && window.toast('Seção de introdução não encontrada.');
        }
        const startBtn = document.querySelector('#iniciar, [data-action="start"], [data-action="iniciar"], .btn-iniciar');
        if (startBtn) {
          startBtn.removeEventListener('click', window.__JC_startJourney);
          window.__JC_startJourney = () => {
            console.log('[JORNADA_CONTROLLER] Botão Iniciar clicado');
            startJourney();
          };
          startBtn.addEventListener('click', window.__JC_startJourney, { once: true });
          console.log('[JORNADA_CONTROLLER] Evento de clique adicionado ao botão Iniciar');
        }
        loadDynamicBlocks();
        if (JC._onReady && Array.isArray(JC._onReady)) {
          JC._onReady.forEach(fn => { try { fn(); } catch (e) {} });
          JC._onReady = [];
          console.log('[JORNADA_CONTROLLER] Callbacks onReady executados');
        }
      } catch (e) {
        console.error('[JORNADA_CONTROLLER] Erro em initJornada:', e);
        window.toast && window.toast('Erro ao inicializar a jornada.');
      }
    };
    console.log('[JORNADA_CONTROLLER] JC.init definido');
  }

  // Seletores e utilitários
  const S = {
    blocos() {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        window.toast && window.toast('Seção de perguntas não encontrada.');
        return [];
      }
      return Array.from(section.querySelectorAll('.j-bloco,[data-bloco]'));
    },
    perguntasDo(bloco) {
      if (!bloco || !(bloco instanceof Element)) {
        console.error('[JORNADA_CONTROLLER] Bloco inválido em perguntasDo:', bloco);
        return [];
      }
      return Array.from(bloco.querySelectorAll('.j-pergunta,[data-pergunta]'));
    },
    perguntaAtual() {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        return null;
      }
      return section.querySelector('.j-pergunta.active,[data-pergunta].active');
    }
  };

  // Carrega blocos dinâmicos
  window.loadDynamicBlocks = function() {
  const content = document.getElementById('perguntas-container');
  if (!content) {
    console.log('[loadDynamicBlocks] Container de perguntas não encontrado');
    window.toast && window.toast('Erro ao carregar perguntas.');
    return;
  }

  const blocks = window.JORNADA_BLOCKS || [];
  if (!blocks.length) {
    console.error('[loadDynamicBlocks] JORNADA_BLOCKS não definido ou vazio');
    window.toast && window.toast('Nenhum bloco de perguntas encontrado.');
    return;
  }

  content.innerHTML = '';
  blocks.forEach((block, bIdx) => {
    const bloco = document.createElement('section');
    bloco.className = 'j-bloco';
    bloco.dataset.bloco = bIdx;
    bloco.dataset.video = block.video_after || '';

    (block.questions || []).forEach((q, qIdx) => {
      const label = typeof q === 'string' ? q : (q.label || q.text || '');
      const div = document.createElement('div');
      div.className = 'j-pergunta';
      div.dataset.pergunta = qIdx;

      div.innerHTML = `
        <label class="pergunta-enunciado text" 
               data-typing="true" 
               data-text="Pergunta ${qIdx + 1}: ${label}" 
               data-speed="36" 
               data-cursor="true"></label>
        <textarea rows="4" class="input" placeholder="Digite sua resposta..."></textarea>
        <div class="accessibility-controls">
          <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
          <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
          <button class="btn-avancar" data-action="avancar">Avançar</button>
        </div>
      `;
      bloco.appendChild(div);
    });

    content.appendChild(bloco);
  });

  const firstBloco = content.querySelector('.j-bloco');
  if (firstBloco) {
    firstBloco.style.display = 'block';
    const first = firstBloco.querySelector('.j-pergunta');
    if (first) {
      first.classList.add('active');
      setTimeout(() => window.runTyping && window.runTyping(first), 100);
    }
  } else {
    console.error('[loadDynamicBlocks] Nenhum bloco criado');
    window.toast && window.toast('Erro ao criar blocos de perguntas.');
  }

  if (window.loadAnswers) window.loadAnswers();
  const firstTa = document.querySelector('.j-bloco .j-pergunta textarea');
  if (firstTa && window.handleInput) window.handleInput(firstTa);
  if (window.initAccessibility) window.initAccessibility();
  console.log('[loadDynamicBlocks] Blocos carregados com sucesso');
};

  // Navegação para a próxima seção/pergunta
  function goNext() {
    console.log('[JORNADA_CONTROLLER] Iniciando goNext...');
    const state = JC.state;
    let currentSection = document.querySelector('.j-section:not(.hidden)')?.id;
    if (!currentSection) {
      console.error('[JORNADA_CONTROLLER] Nenhuma seção ativa encontrada');
      window.toast && window.toast('Nenhuma seção ativa encontrada. Tente recarregar.');
      return;
    }
    // Corrigir truncamento
    if (currentSection.startsWith('section-int') || currentSection === 'section-00') {
      currentSection = 'section-intro';
      console.log('[JORNADA_CONTROLLER] Corrigido truncamento: section-intro');
    }

    const flow = [
      { from: 'section-intro', to: 'section-termos' },
      { from: 'section-termos', to: 'section-senha' },
      { from: 'section-senha', to: 'section-guia' },
      { from: 'section-guia', to: 'section-selfie' },
      { from: 'section-selfie', to: 'section-perguntas' },
      { from: 'section-perguntas', to: 'section-final' },
      { from: 'section-final', to: null }
    ];

    if (currentSection === 'section-perguntas') {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada em goNext');
        window.showSection && window.showSection('section-final');
        return;
      }
      const blocos = S.blocos();
      if (!blocos.length) {
        console.error('[JORNADA_CONTROLLER] Nenhum bloco encontrado em goNext');
        window.showSection && window.showSection('section-final');
        return;
      }
      const bloco = blocos[state.blocoIndex];
      if (!bloco) {
        console.error('[JORNADA_CONTROLLER] Bloco não encontrado no índice:', state.blocoIndex);
        window.showSection && window.showSection('section-final');
        return;
      }
      const perguntas = S.perguntasDo(bloco);
      if (!perguntas.length) {
        console.error('[JORNADA_CONTROLLER] Nenhuma pergunta encontrada no bloco:', state.blocoIndex);
        window.showSection && window.showSection('section-final');
        return;
      }
      const current = perguntas[state.perguntaIndex];
      if (current) {
        current.classList.remove('active');
      }
      if (state.perguntaIndex + 1 < perguntas.length) {
        state.perguntaIndex++;
        const next = perguntas[state.perguntaIndex];
        next.classList.add('active');
        if (window.runTyping) {
          window.runTyping(next);
        }
      } else if (state.blocoIndex + 1 < blocos.length) {
        state.blocoIndex++;
        state.perguntaIndex = 0;
        blocos.forEach(b => b.style.display = 'none');
        const nextBloco = blocos[state.blocoIndex];
        nextBloco.style.display = 'block';
        const firstPergunta = S.perguntasDo(nextBloco)[0];
        if (firstPergunta) {
          firstPergunta.classList.add('active');
          if (window.runTyping) {
            window.runTyping(firstPergunta);
          }
        }
      } else {
        window.showSection && window.showSection('section-final');
      }
    } else {
      const nextSection = flow.find(f => f.from === currentSection)?.to;
      if (nextSection && window.showSection) {
        const nextSectionEl = document.getElementById(nextSection) || document.querySelector(`[data-section="${nextSection.replace('section-', '')}"], .${nextSection}`);
        if (nextSectionEl) {
          window.showSection(nextSection);
          console.log('[JORNADA_CONTROLLER] Navegando de', currentSection, 'para', nextSection);
        } else {
          console.error('[JORNADA_CONTROLLER] Seção seguinte não encontrada:', nextSection);
          window.toast && window.toast(`Seção ${nextSection} não encontrada. Tente recarregar.`);
        }
      } else {
        console.log('[JORNADA_CONTROLLER] Nenhuma seção seguinte definida para:', currentSection);
        window.toast && window.toast('Fim do fluxo. Tente recarregar.');
      }
    }
  }

  // Iniciar jornada
  function startJourney() {
    console.log('[JORNADA_CONTROLLER] Iniciando jornada... Dependências:', {
      JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
      JORNADA_QA: !!window.JORNADA_QA,
      JORNADA_PAPER: !!window.JORNADA_PAPER,
      JORNADA_TYPE: !!window.JORNADA_TYPE,
      JORNADA_RENDER: !!window.JORNADA_RENDER
    });
    if (window.JORNADA_BLOCKS && window.JORNADA_QA && window.JORNADA_PAPER && window.JORNADA_TYPE) {
      const sectionPerguntas = document.getElementById('section-perguntas');
      if (!sectionPerguntas) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        window.toast && window.toast('Seção de perguntas não encontrada.');
        return;
      }
      window.showSection && window.showSection('section-perguntas');
      loadDynamicBlocks();
      JC.state.blocoIndex = 0;
      JC.state.perguntaIndex = 0;
      if (window.JORNADA_RENDER && window.JORNADA_RENDER.renderPerguntas) {
        window.JORNADA_RENDER.renderPerguntas(0);
      }
    } else {
      console.error('[JORNADA_CONTROLLER] Dependências ausentes:', {
        JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
        JORNADA_QA: !!window.JORNADA_QA,
        JORNADA_PAPER: !!window.JORNADA_PAPER,
        JORNADA_TYPE: !!window.JORNADA_TYPE,
        JORNADA_RENDER: !!window.JORNADA_RENDER
      });
      window.toast && window.toast('Erro: Dependências não carregadas.');
    }
  }

  // Eventos globais
  function bindEvents() {
    if (window.__JC_EVENTS_BOUND) return;
    window.__JC_EVENTS_BOUND = true;

    document.removeEventListener('click', window.__JC_clickHandler);
    window.__JC_clickHandler = (e) => {
      const btn = e.target.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next');
      if (btn) {
        console.log('[JORNADA_CONTROLLER] Clique no botão avançar:', btn.id || btn.className);
        e.preventDefault();
        goNext();
      }
    };
    document.addEventListener('click', window.__JC_clickHandler, { capture: true });

    document.removeEventListener('keydown', window.__JC_keydownHandler);
    window.__JC_keydownHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next')) {
          console.log('[JORNADA_CONTROLLER] Tecla Enter/Espaço no botão avançar:', activeEl.id || activeEl.className);
          e.preventDefault();
          goNext();
        }
      }
    };
    document.addEventListener('keydown', window.__JC_keydownHandler);
  }

  // Inicialização
  function bindBoot() {
    if (window.__JC_BIND_DONE) return;
    window.__JC_BIND_DONE = true;

    document.removeEventListener('DOMContentLoaded', window.__JC_onDomC);
    window.__JC_onDomC = () => {
      console.log('[JORNADA_CONTROLLER] Inicialização no DOMContentLoaded...');
      JC.init();
    };
    document.addEventListener('DOMContentLoaded', window.__JC_onDomC, { once: true });
  }

  // Exports globais
  JC.onReady = (cb) => {
    if (JC.ready) {
      try { cb(); } catch (e) {}
      return;
    }
    JC._onReady = JC._onReady || [];
    JC._onReady.push(cb);
  };
  JC.startJourney = startJourney;
  JC.goNext = goNext;

  // Inicializar
  bindEvents();
  bindBoot();

  console.log('[JORNADA_CONTROLLER] pronto');
})();
```

#### 3. Corrigir Validação da Senha e Olho Mágico
Ajustar o bloco `Senha` em `jornada-conhecimento-com-luz1.html` para garantir a validação e o funcionamento do olho mágico.

**Mudanças**:
- Adicionar verificações robustas para os elementos do DOM.
- Exibir toasts claros para erros.

**Código Ajustado (Bloco `Senha`)**:
```javascript
(function() {
  const log = (...a) => { try { console.log('[Senha v4]', ...a); } catch (_) {} };
  const VALID_PASSWORD = 'luz123'; // Defina a senha correta aqui

  function getSenhaSection() {
    return document.getElementById('section-senha') || document.querySelector('[data-section="senha"], .section-senha') || document;
  }

  function getSenhaInput() {
    const root = getSenhaSection();
    const tries = [
      '#senhaInput', '#iniciar', 'input[data-role="senha"]', 'input[name="senha"]',
      'input[name*="senha" i]', 'input[id*="senha" i]', 'input[type="password"]',
      'input[type="text"][name*="senha" i]', 'input[type="text"][id*="senha" i]',
      '.senha input', '.senha-input'
    ];
    for (const sel of tries) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return root.querySelector('input');
  }

  window.toggleSenha = function() {
    const input = getSenhaInput();
    if (!input) {
      log('[Senha] input não encontrado');
      window.toast && window.toast('Campo de senha não encontrado.');
      return;
    }
    input.type = (input.type === 'password' ? 'text' : 'password');
    const eye = getSenhaSection().querySelector('[data-role="eye"], [data-action="toggle-password"] i, [data-action="toggle-password"] svg, .eye-icon');
    if (eye) {
      eye.classList.toggle('on');
      log('[Senha] Visibilidade da senha alternada');
    } else {
      log('[Senha] Olho mágico não encontrado');
      window.toast && window.toast('Botão de visibilidade não encontrado.');
    }
  };

  let lastStartJourney = 0;
  window.startJourney = function() {
    const now = performance.now();
    if (now - lastStartJourney < 1000) {
      log('[startJourney] Debounce: evitando chamada repetida');
      return;
    }
    lastStartJourney = now;

    const inputSenha = getSenhaInput();
    const inputNome = getSenhaSection().querySelector('#nomeInput, [data-role="nome"], input[name="nome"]');
    const senha = (inputSenha && inputSenha.value || '').trim().toLowerCase();
    const nome = (inputNome && inputNome.value || '').trim();

    log('[startJourney] Senha fornecida:', senha ? '[oculta]' : 'nenhuma', 'Nome:', nome || 'nenhum');

    if (!senha) {
      window.toast && window.toast('Digite a senha para continuar.');
      if (inputSenha) inputSenha.focus();
      log('[startJourney] Senha não fornecida');
      return;
    }

    if (senha !== VALID_PASSWORD) {
      window.toast && window.toast('Senha incorreta. Tente novamente.');
      if (inputSenha) inputSenha.focus();
      log('[startJourney] Senha inválida:', senha);
      return;
    }

    if (nome) {
      try { localStorage.setItem('JORNADA_NOME', nome); } catch (_) {}
    }
    window.speak && window.speak('');

    const hasGuia = document.getElementById('section-guia') || document.querySelector('[data-section="guia"], .section-guia');
    const hasSelfie = document.getElementById('section-selfie') || document.querySelector('[data-section="selfie"], .section-selfie');

    if (!hasGuia) {
      console.error('[startJourney] Seção section-guia não encontrada');
      window.toast && window.toast('Seção de guia não encontrada. Verifique o DOM.');
      return;
    }
    if (!hasSelfie) {
      console.error('[startJourney] Seção section-selfie não encontrada');
      window.toast && window.toast('Seção de selfie não encontrada. Verifique o DOM.');
      return;
    }

    if (window.showSection) {
      window.showSection('section-guia');
      log('[startJourney] Navegação para section-guia');
    } else {
      log('[startJourney] window.showSection não definido');
      window.toast && window.toast('Erro ao navegar para a seção de guia.');
    }
  };
})();
```

#### 4. Corrigir Efeitos de Datilografia e Navegação
Ajustar o bloco `Datilografia` para suportar todas as páginas de termos e garantir que `section-guia` e `section-selfie` sejam exibidas.

**Mudanças**:
- Expandir seletores para incluir `.termos-texto`, `.content`, `[data-termos]`.
- Adicionar verificação para seções ausentes.

**Código Ajustado (Bloco `Datilografia`)**:
```javascript
(function() {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  if (G.__typingLock == null) G.__typingLock = false;
  if (G.__DEFAULT_SPEED_TYPING == null) G.__DEFAULT_SPEED_TYPING = 80;
  const DEFAULT_SPEED = G.__DEFAULT_SPEED_TYPING;

  function typeTextOnce(el, text, speed = 24) {
    if (!el || el.dataset.typerApplied === '1') return;
    el.dataset.typerApplied = '1';
    el.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      el.textContent += text[i] || '';
      i++;
      if (i >= text.length) clearInterval(timer);
    }, speed);
  }

  function typeWriter(el, text, speed, showCursor) {
    if (!el || el.dataset.typing === '1' || el.dataset.typed === '1') return Promise.resolve();
    if (!window.utils || !window.utils.dedupe) {
      console.error('[typeWriter] window.utils.dedupe não definido');
      window.toast && window.toast('Erro ao processar datilografia.');
      return Promise.resolve();
    }
    el.dataset.typing = '1';
    el.textContent = '';
    const highlight = el.querySelector('.highlight') || document.createElement('div');
    if (!highlight.parentNode) {
      highlight.className = 'highlight';
      el.prepend(highlight);
    }

    text = window.utils.dedupe(text || '').replace(/[{}[\]]/g, '').trim();
    let i = 0;

    return new Promise(resolve => {
      function step() {
        if (!el.isConnected || el.offsetParent === null || el.closest('.j-section.hidden')) {
          el.classList.remove('lumen-typing');
          const h = el.querySelector('.highlight');
          if (h) h.style.width = '0';
          el.dataset.typed = '0';
          el.dataset.typing = '0';
          return resolve();
        }

        if (i < text.length) {
          const char = text.charAt(i++);
          el.textContent += char;
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.font = getComputedStyle(el).font;
            highlight.style.width = `${ctx.measureText(el.textContent).width}px`;
          } catch (_) {}
          setTimeout(step, speed || DEFAULT_SPEED);
        } else {
          el.classList.add('typing-done');
          el.classList.remove('lumen-typing');
          const h = el.querySelector('.highlight');
          if (h) h.style.width = '0';
          el.dataset.typed = '1';
          el.dataset.typing = '0';
          resolve();
        }
      }
      if (showCursor) el.classList.add('lumen-typing');
      setTimeout(step, 0);
    });
  }

  let __abortTypingPlaceholder = null;
  async function typePlaceholder(inp, text, speed = 22) {
    if (!inp) return;
    if (__abortTypingPlaceholder) __abortTypingPlaceholder();
    let abort = false;
    __abortTypingPlaceholder = () => abort = true;
    inp.placeholder = '';
    const aria = document.getElementById('aria-pergunta');
    if (aria) aria.textContent = text;
    text = window.utils ? window.utils.dedupe(text) : text;
    for (let i = 0; i <= text.length; i++) {
      if (abort) break;
      inp.placeholder = text.slice(0, i) + (i < text.length ? '▌' : '');
      await new Promise(r => setTimeout(r, speed));
    }
    if (!abort) inp.placeholder = text;
  }

  async function typeAnswer(textarea, text, speed = 36) {
    if (!textarea) return;
    textarea.value = '';
    textarea.classList.add('lumen-typing');
    text = window.utils ? window.utils.dedupe(text) : text;
    for (let i = 0; i <= text.length; i++) {
      textarea.value = text.slice(0, i);
      await new Promise(r => setTimeout(r, speed));
    }
    textarea.classList.add('typing-done');
  }

  async function runTyping(root) {
    if (!root || root.classList.contains('hidden') || !(root instanceof Element)) {
      console.log('[runTyping] Root inválido ou oculto:', root?.id || root?.className || root);
      return;
    }
    if (G.__typingLock) {
      console.log('[runTyping] Bloqueado por __typingLock, liberando...');
      G.__typingLock = false;
    }
    G.__typingLock = true;

    try {
      window.speak && window.speak('');
      const elements = Array
        .from(root.querySelectorAll('[data-typing], .text, p, h1, h2, h3, h4, [class*="text"], [class*="title"], [class*="content"], .termos-texto, .pergunta-enunciado, [data-termos]'))
        .filter(el => !el.dataset.typed && el.offsetParent !== null && !el.closest('.j-section.hidden'));

      if (elements.length === 0) {
        console.log('[runTyping] Nenhum elemento de texto encontrado em:', root.id || root.className);
        console.log('[runTyping] Snapshot do DOM:', Array.from(root.children).slice(0, 10).map(el => ({
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          class: el.className || '',
          attrs: Object.keys(el.dataset || {}).join(','),
          text: (el.textContent || '').slice(0, 50)
        })));
      }

      for (const el of elements) {
        if (el.dataset.typing === '1' || el.dataset.typed === '1') continue;
        const rawText = el.getAttribute('data-text') || el.textContent || '';
        const text = window.utils ? window.utils.dedupe(rawText) : rawText;
        el.textContent = '';
        const highlight = el.querySelector('.highlight');
        if (highlight) highlight.style.width = '0';
        const speed = parseInt(el.getAttribute('data-speed') || DEFAULT_SPEED, 10);
        const showCursor = String(el.getAttribute('data-cursor') || 'true') === 'true';
        await window.typeWriter(el, text, speed, showCursor);
        if (window.JORNADA.tts.enabled && window.JORNADA.tts.readingMode === 'after' && !window.isMuted) {
          await window.speak(text);
        }
        console.log('[runTyping] Datilografia e TTS aplicados em:', el.tagName, el.className || el.id, 'texto:', text.slice(0, 50));
      }
    } catch (e) {
      console.error('[runTyping] erro:', e);
      window.toast && window.toast('Erro durante a datilografia.');
    } finally {
      G.__typingLock = false;
    }
  }

  window.typeTextOnce = typeTextOnce;
  window.typeWriter = typeWriter;
  window.runTyping = runTyping;
  window.typePlaceholder = typePlaceholder;
  window.typeAnswer = typeAnswer;
})();
```


window.loadDynamicBlocks = function() {
  const content = document.getElementById('perguntas-container');
  if (!content) {
    console.log('[loadDynamicBlocks] Container de perguntas não encontrado');
    window.toast && window.toast('Erro ao carregar perguntas.');
    return;
  }

  const blocks = window.JORNADA_BLOCKS || [];
  if (!blocks.length) {
    console.error('[loadDynamicBlocks] JORNADA_BLOCKS não definido ou vazio');
    window.toast && window.toast('Nenhum bloco de perguntas encontrado.');
    return;
  }

  content.innerHTML = '';
  blocks.forEach((block, bIdx) => {
    const bloco = document.createElement('section');
    bloco.className = 'j-bloco';
    bloco.dataset.bloco = bIdx;
    bloco.dataset.video = block.video_after || '';

    (block.questions || []).forEach((q, qIdx) => {
      const label = typeof q === 'string' ? q : (q.label || q.text || '');
      const div = document.createElement('div');
      div.className = 'j-pergunta';
      div.dataset.pergunta = qIdx;

      div.innerHTML = `
        <label class="pergunta-enunciado text" 
               data-typing="true" 
               data-text="Pergunta ${qIdx + 1}: ${label}" 
               data-speed="36" 
               data-cursor="true"></label>
        <textarea rows="4" class="input" placeholder="Digite sua resposta..."></textarea>
        <div class="accessibility-controls">
          <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
          <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
          <button class="btn-avancar" data-action="avancar">Avançar</button>
        </div>
      `;
      bloco.appendChild(div);
    });

    content.appendChild(bloco);
  });

  const firstBloco = content.querySelector('.j-bloco');
  if (firstBloco) {
    firstBloco.style.display = 'block';
    const first = firstBloco.querySelector('.j-pergunta');
    if (first) {
      first.classList.add('active');
      setTimeout(() => window.runTyping && window.runTyping(first), 100);
    }
  } else {
    console.error('[loadDynamicBlocks] Nenhum bloco criado');
    window.toast && window.toast('Erro ao criar blocos de perguntas.');
  }

  if (window.loadAnswers) window.loadAnswers();
  const firstTa = document.querySelector('.j-bloco .j-pergunta textarea');
  if (firstTa && window.handleInput) window.handleInput(firstTa);
  if (window.initAccessibility) window.initAccessibility();
  console.log('[loadDynamicBlocks] Blocos carregados com sucesso');
};
```

---

### Instruções para Teste

1. **Verificar Erro Assíncrono**:
   - Abra o DevTools (F12) e vá para a aba "Console". Confirme que o erro `Uncaught (in promise)` não aparece mais após clicar no botão "Avançar".
   - Se o erro persistir, inspecione a aba "Sources" para identificar o listener problemático.

2. **Testar Navegação**:
   - Na `section-intro`, clique no botão "Avançar" e confirme que navega para `section-termos`. O log `[JORNADA_CONTROLLER] Navegando de section-intro para section-termos` deve aparecer.
   - Navegue até `section-senha`, `section-guia`, `section-selfie`, e `section-perguntas`, verificando cada transição.

3. **Testar Validação da Senha**:
   - Na `section-senha`, teste com uma senha errada (ex.: "errada") e confirme que o toast "Senha incorreta. Tente novamente." aparece.
   - Teste com a senha correta (`luz123`) e verifique se navega para `section-guia`.

4. **Testar Olho Mágico**:
   - Clique no botão do olho mágico e confirme que o campo de senha alterna entre `type="password"` e `type="text"`.

5. **Testar Efeitos de Datilografia**:
   - Navegue pelas páginas de termos (`termos-pg1` a `termos-pg5`) e confirme que o efeito de datilografia funciona em todas.
   - Verifique se o log `[runTyping] Nenhum elemento de texto encontrado` desaparece.

6. **Testar Perguntas e Botões**:
   - Na `section-perguntas`, confirme que as perguntas aparecem com botões de acessibilidade (`btn-mic`, `btn-audio`, `btn-avancar`).
   - Clique no botão "Avançar" e verifique se navega para a próxima pergunta ou bloco.

7. **Verificar Carregamento de Scripts**:
   - Abra o DevTools e vá para a aba "Network". Confirme que todos os scripts carregam com status 200.
   - Verifique a aba "Console" para logs como `[LOAD] jornada-controller.js carregado` e `[JORNADA_CONTROLLER] JC.init executado`.

8. **Testar Localmente**:
   - Use `npx http-server` para testar localmente e evitar problemas de cache ou CORS.
   - Incremente para `?v=6` nos scripts para garantir que a versão mais recente seja carregada.

---

### Instruções para Voltar à Versão Anterior

Dado que a versão anterior "rodava quase tudo" e os problemas atuais (erros assíncronos, navegação travada) indicam regressões, recomendo voltar à versão anterior para economizar tempo. Aqui está o plano:

1. **Fazer Backup**:
   - Salve a versão atual em uma pasta separada ou branch Git:
     ```bash
     git branch versao-atual
     git add .
     git commit -m "Backup da versão atual"
     ```

2. **Restaurar a Versão Anterior**:
   - Copie os arquivos da versão anterior para o diretório do projeto.
   - Se usar Git, reverta para o commit anterior:
     ```bash
     git checkout <commit-id-da-versao-anterior>
     ```

3. **Configurar o Backend API**:
   - Atualize `API_BASE` para `https://lumen-backend-api.onrender.com/api`:
     ```javascript
     const PRIMARY_DEFAULT = 'https://lumen-backend-api.onrender.com/api';
     ```
   - Adicione verificações de erro em `chooseBase`:
     ```javascript
     async function chooseBase() {
       if (typeof window.API?.health === 'function') {
         try {
           const ok = await window.API.health();
           window.API_BASE = ok ? API_PRIMARY : API_FALLBACK;
         } catch (e) {
           console.error('[BOOT] Erro ao verificar API health:', e);
           window.API_BASE = API_FALLBACK;
           window.toast && window.toast('Erro ao conectar com o servidor. Usando fallback.');
         }
       } else {
         console.warn('[BOOT] API.health não definido, usando PRIMARY:', API_PRIMARY);
         window.API_BASE = API_PRIMARY;
       }
       console.log('[BOOT] API_BASE =', window.API_BASE);
     }
     ```

4. **Incorporar Correções**:
   - Aplique o bloco `Senha` ajustado para validação e olho mágico.
   - Use o `runTyping` ajustado para garantir efeitos de datilografia em todas as páginas de termos.
   - Aplique o `loadDynamicBlocks` ajustado para exibir perguntas e botões.

5. **Testar Localmente**:
   - Use `npx http-server` para testar a versão anterior com as correções.
   - Verifique os logs no console para confirmar que não há erros de sintaxe ou módulos ausentes.

6. **Deploy em Staging**:
   - Faça o deploy em um ambiente de teste com `?v=6`.
   - Teste o fluxo completo e monitore os logs.

---

### Recomendação Final

**Volte para a versão anterior** para garantir estabilidade e economizar tempo. A versão anterior era mais confiável, e os problemas com o Backend API podem ser resolvidos rapidamente com as correções acima. A versão atual tem regressões (erros assíncronos, navegação travada, `JC.init` não definido) que exigem mais depuração.

Se preferir continuar com a versão atual, use os arquivos fornecidos e siga as instruções de teste. Caso encontre novos erros ou precise dos arquivos da versão anterior, envie os logs ou o conteúdo. Vamos fazer esse site brilhar, uhuuuuuuu! 🚀Script iniciado');

  // Evita múltiplas inicializações
  if (window.__JC_INIT_DONE) {
    console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
    return;
  }
  window.__JC_INIT_DONE = true;

  // Define namespace JC
  const JC = (window.JC = window.JC || {});
  JC.state = JC.state || { route: 'intro', booted: false, blocoIndex: 0, perguntaIndex: 0 };
  console.log('[JORNADA_CONTROLLER] JC.state definido:', JC.state);

  // Define JC.init imediatamente
  if (typeof JC.init !== 'function') {
    JC.init = function initJornada() {
      if (JC.state.booted) {
        console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
        return;
      }
      JC.state.booted = true;
      JC.state.route = 'intro';
      JC.ready = true;
      console.log('[JORNADA_CONTROLLER] JC.init executado');

      try {
        if (window.JORNADA_RENDER && window.JORNADA_RENDER.updateCanvasBackground) {
          window.JORNADA_RENDER.updateCanvasBackground('section-intro');
          console.log('[JORNADA_CONTROLLER] updateCanvasBackground chamado');
        }
        if (window.JORNADA_CHAMA && window.JORNADA_CHAMA.ensureHeroFlame) {
          window.JORNADA_CHAMA.ensureHeroFlame('section-intro');
          console.log('[JORNADA_CONTROLLER] ensureHeroFlame chamado');
        }
        const section = document.getElementById('section-intro');
        if (section && window.showSection) {
          window.showSection('section-intro');
          console.log('[JORNADA_CONTROLLER] showSection chamado para section-intro');
        } else {
          console.error('[JORNADA_CONTROLLER] section-intro não encontrada ou showSection ausente');
          window.toast && window.toast('Seção de introdução não encontrada.');
        }
        const startBtn = document.querySelector('#iniciar, [data-action="start"], [data-action="iniciar"], .btn-iniciar');
        if (startBtn) {
          startBtn.removeEventListener('click', window.__JC_startJourney);
          window.__JC_startJourney = () => {
            console.log('[JORNADA_CONTROLLER] Botão Iniciar clicado');
            startJourney();
          };
          startBtn.addEventListener('click', window.__JC_startJourney, { once: true });
          console.log('[JORNADA_CONTROLLER] Evento de clique adicionado ao botão Iniciar');
        }
        loadDynamicBlocks();
        if (JC._onReady && Array.isArray(JC._onReady)) {
          JC._onReady.forEach(fn => { try { fn(); } catch (e) {} });
          JC._onReady = [];
          console.log('[JORNADA_CONTROLLER] Callbacks onReady executados');
        }
      } catch (e) {
        console.error('[JORNADA_CONTROLLER] Erro em initJornada:', e);
        window.toast && window.toast('Erro ao inicializar a jornada.');
      }
    };
    console.log('[JORNADA_CONTROLLER] JC.init definido');
  }

  // Seletores e utilitários
  const S = {
    blocos() {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        window.toast && window.toast('Seção de perguntas não encontrada.');
        return [];
      }
      return Array.from(section.querySelectorAll('.j-bloco,[data-bloco]'));
    },
    perguntasDo(bloco) {
      if (!bloco || !(bloco instanceof Element)) {
        console.error('[JORNADA_CONTROLLER] Bloco inválido em perguntasDo:', bloco);
        return [];
      }
      return Array.from(bloco.querySelectorAll('.j-pergunta,[data-pergunta]'));
    },
    perguntaAtual() {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        return null;
      }
      return section.querySelector('.j-pergunta.active,[data-pergunta].active');
    }
  };

  // Carrega blocos dinâmicos
  function loadDynamicBlocks() {
    console.log('[JORNADA_CONTROLLER] Iniciando loadDynamicBlocks...');
    const content = document.getElementById('perguntas-container');
    if (!content) {
      console.error('[JORNADA_CONTROLLER] Erro: #perguntas-container não encontrado!');
      window.toast && window.toast('Container de perguntas não encontrado.');
      return;
    }
    if (!Array.isArray(window.JORNADA_BLOCKS) || !window.JORNADA_BLOCKS.length) {
      console.error('[JORNADA_CONTROLLER] Erro: JORNADA_BLOCKS não definido ou vazio!', window.JORNADA_BLOCKS);
      window.toast && window.toast('Blocos de perguntas não encontrados.');
      return;
    }
    const validBlocks = window.JORNADA_BLOCKS.filter(block => Array.isArray(block?.questions) && block.questions.length);
    if (!validBlocks.length) {
      console.error('[JORNADA_CONTROLLER] Erro: Nenhum bloco válido com perguntas encontrado!', window.JORNADA_BLOCKS);
      window.toast && window.toast('Nenhum bloco de perguntas válido.');
      return;
    }
    content.innerHTML = '';
    window.JORNADA_BLOCKS.forEach((block, idx) => {
      if (!Array.isArray(block?.questions)) {
        console.warn(`[JORNADA_CONTROLLER] Bloco ${idx} inválido: sem perguntas`, block);
        return;
      }
      const bloco = document.createElement('section');
      bloco.className = 'j-bloco';
      bloco.dataset.bloco = idx;
      bloco.dataset.video = block.video_after || '';
      bloco.style.display = 'none';
      block.questions.forEach((q, qIdx) => {
        if (!q?.label) {
          console.warn(`[JORNADA_CONTROLLER] Pergunta ${qIdx} no bloco ${idx} inválida: sem label`, q);
          return;
        }
        const pergunta = document.createElement('div');
        pergunta.className = 'j-pergunta';
        pergunta.dataset.pergunta = qIdx;
        pergunta.innerHTML = `
          <label class="pergunta-enunciado text"
                 data-typing="true"
                 data-text="<b>Pergunta ${qIdx + 1}:</b> ${q.label}"
                 data-speed="40" data-cursor="true"></label>
          <textarea rows="4" class="input" placeholder="Digite sua resposta..." oninput="window.handleInput && window.handleInput(this)"></textarea>
          <div class="accessibility-controls">
            <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
            <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
            <button class="btn-avancar" data-action="avancar">Avançar</button>
          </div>
        `;
        bloco.appendChild(pergunta);
      });
      content.appendChild(bloco);
    });
    const blocos = document.querySelectorAll('.j-bloco');
    const firstBloco = content.querySelector('.j-bloco');
    if (!firstBloco) {
      console.error('[JORNADA_CONTROLLER] Nenhum bloco criado após loadDynamicBlocks!');
      return;
    }
    firstBloco.style.display = 'block';
    const firstPergunta = firstBloco.querySelector('.j-pergunta');
    if (firstPergunta) {
      firstPergunta.classList.add('active');
      if (window.runTyping) {
        window.runTyping(firstPergunta);
      }
      const firstTa = firstPergunta.querySelector('textarea');
      if (firstTa && window.handleInput) {
        window.handleInput(firstTa);
      }
    }
    if (window.loadAnswers) {
      window.loadAnswers();
    }
    console.log('[JORNADA_CONTROLLER] loadDynamicBlocks concluído');
  }

  // Navegação para a próxima seção/pergunta
  function goNext() {
    console.log('[JORNADA_CONTROLLER] Iniciando goNext...');
    const state = JC.state;
    let currentSection = document.querySelector('.j-section:not(.hidden)')?.id;
    if (!currentSection) {
      console.error('[JORNADA_CONTROLLER] Nenhuma seção ativa encontrada');
      window.toast && window.toast('Nenhuma seção ativa encontrada. Tente recarregar.');
      return;
    }
    // Corrigir truncamento
    if (currentSection.startsWith('section-int')) {
      currentSection = 'section-intro';
      console.log('[JORNADA_CONTROLLER] Corrigido truncamento: section-intro');
    }

    const flow = [
      { from: 'section-intro', to: 'section-termos' },
      { from: 'section-termos', to: 'section-senha' },
      { from: 'section-senha', to: 'section-guia' },
      { from: 'section-guia', to: 'section-selfie' },
      { from: 'section-selfie', to: 'section-perguntas' },
      { from: 'section-perguntas', to: 'section-final' },
      { from: 'section-final', to: null }
    ];

    if (currentSection === 'section-perguntas') {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada em goNext');
        window.showSection && window.showSection('section-final');
        return;
      }
      const blocos = S.blocos();
      if (!blocos.length) {
        console.error('[JORNADA_CONTROLLER] Nenhum bloco encontrado em goNext');
        window.showSection && window.showSection('section-final');
        return;
      }
      const bloco = blocos[state.blocoIndex];
      if (!bloco) {
        console.error('[JORNADA_CONTROLLER] Bloco não encontrado no índice:', state.blocoIndex);
        window.showSection && window.showSection('section-final');
        return;
      }
      const perguntas = S.perguntasDo(bloco);
      if (!perguntas.length) {
        console.error('[JORNADA_CONTROLLER] Nenhuma pergunta encontrada no bloco:', state.blocoIndex);
        window.showSection && window.showSection('section-final');
        return;
      }
      const current = perguntas[state.perguntaIndex];
      if (current) {
        current.classList.remove('active');
      }
      if (state.perguntaIndex + 1 < perguntas.length) {
        state.perguntaIndex++;
        const next = perguntas[state.perguntaIndex];
        next.classList.add('active');
        if (window.runTyping) {
          window.runTyping(next);
        }
      } else if (state.blocoIndex + 1 < blocos.length) {
        state.blocoIndex++;
        state.perguntaIndex = 0;
        blocos.forEach(b => b.style.display = 'none');
        const nextBloco = blocos[state.blocoIndex];
        nextBloco.style.display = 'block';
        const firstPergunta = S.perguntasDo(nextBloco)[0];
        if (firstPergunta) {
          firstPergunta.classList.add('active');
          if (window.runTyping) {
            window.runTyping(firstPergunta);
          }
        }
      } else {
        window.showSection && window.showSection('section-final');
      }
    } else {
      const nextSection = flow.find(f => f.from === currentSection)?.to;
      if (nextSection && window.showSection) {
        const nextSectionEl = document.getElementById(nextSection) || document.querySelector(`[data-section="${nextSection.replace('section-', '')}"], .${nextSection}`);
        if (nextSectionEl) {
          window.showSection(nextSection);
          console.log('[JORNADA_CONTROLLER] Navegando de', currentSection, 'para', nextSection);
        } else {
          console.error('[JORNADA_CONTROLLER] Seção seguinte não encontrada:', nextSection);
          window.toast && window.toast(`Seção ${nextSection} não encontrada. Tente recarregar.`);
        }
      } else {
        console.log('[JORNADA_CONTROLLER] Nenhuma seção seguinte definida para:', currentSection);
        window.toast && window.toast('Fim do fluxo. Tente recarregar.');
      }
    }
  }

  // Iniciar jornada
  function startJourney() {
    console.log('[JORNADA_CONTROLLER] Iniciando jornada... Dependências:', {
      JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
      JORNADA_QA: !!window.JORNADA_QA,
      JORNADA_PAPER: !!window.JORNADA_PAPER,
      JORNADA_TYPE: !!window.JORNADA_TYPE,
      JORNADA_RENDER: !!window.JORNADA_RENDER
    });
    if (window.JORNADA_BLOCKS && window.JORNADA_QA && window.JORNADA_PAPER && window.JORNADA_TYPE) {
      window.showSection && window.showSection('section-perguntas');
      loadDynamicBlocks();
      JC.state.blocoIndex = 0;
      JC.state.perguntaIndex = 0;
      if (window.JORNADA_RENDER && window.JORNADA_RENDER.renderPerguntas) {
        window.JORNADA_RENDER.renderPerguntas(0);
      }
    } else {
      console.error('[JORNADA_CONTROLLER] Dependências ausentes:', {
        JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
        JORNADA_QA: !!window.JORNADA_QA,
        JORNADA_PAPER: !!window.JORNADA_PAPER,
        JORNADA_TYPE: !!window.JORNADA_TYPE,
        JORNADA_RENDER: !!window.JORNADA_RENDER
      });
      window.toast && window.toast('Erro: Dependências não carregadas.');
    }
  }

  // Eventos globais
  function bindEvents() {
    if (window.__JC_EVENTS_BOUND) return;
    window.__JC_EVENTS_BOUND = true;

    document.removeEventListener('click', window.__JC_clickHandler);
    window.__JC_clickHandler = (e) => {
      const btn = e.target.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next');
      if (btn) {
        console.log('[JORNADA_CONTROLLER] Clique no botão avançar:', btn.id || btn.className);
        e.preventDefault();
        goNext();
      }
    };
    document.addEventListener('click', window.__JC_clickHandler, true);

    document.removeEventListener('keydown', window.__JC_keydownHandler);
    window.__JC_keydownHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next')) {
          console.log('[JORNADA_CONTROLLER] Tecla Enter/Espaço no botão avançar:', activeEl.id || activeEl.className);
          e.preventDefault();
          goNext();
        }
      }
    };
    document.addEventListener('keydown', window.__JC_keydownHandler);
  }

  // Inicialização
  function bindBoot() {
    if (window.__JC_BIND_DONE) return;
    window.__JC_BIND_DONE = true;

    document.removeEventListener('DOMContentLoaded', window.__JC_onDomC);
    window.__JC_onDomC = () => {
      console.log('[JORNADA_CONTROLLER] Inicialização no DOMContentLoaded...');
      JC.init();
    };
    document.addEventListener('DOMContentLoaded', window.__JC_onDomC, { once: true });
  }

  // Exports globais
  JC.onReady = (cb) => {
    if (JC.ready) {
      try { cb(); } catch (e) {} return;
    }
    JC._onReady = JC._onReady || [];
    JC._onReady.push(cb);
  };
  JC.startJourney = startJourney;
  JC.goNext = goNext;

  // Inicializar
  bindEvents();
  bindBoot();

  console.log('[JORNADA_CONTROLLER] pronto');
})();
```

#### 6. Ajustar `jornada-bootstrap.js`
Remover o timeout redundante e garantir uma única inicialização.

**Mudanças**:
- Remover o timeout de segurança, já que `JC.init` está funcionando.
- Adicionar verificação para evitar inicializações duplicadas.

**Código Ajustado**:
<xaiArtifact artifact_id="db49c15b-cdc6-435f-8afb-7c0e17e598df" artifact_version_id="1d6c242d-f8c4-489f-ae21-bd039e3e52d0" title="jornada-bootstrap.js" contentType="text/javascript">
```javascript
/* =========================================================
   jornada-bootstrap.js
   Inicialização da jornada com tolerância a erros e espera por dependências
   ========================================================= */
(function () {
  'use strict';
  console.log('[BOOT] Iniciando micro-boot v5.5...');

  // Sondagem de módulos
  const must = ['CONFIG', 'JUtils', 'JCore', 'JAuth', 'JChama', 'JPaperQA', 'JTyping', 'JController', 'JRender', 'JBootstrap', 'JMicro', 'I18N', 'API'];
  const missing = must.filter(k => !(k in window));
  if (missing.length) {
    console.warn('[BOOT] Módulos ausentes:', missing);
    window.toast && window.toast('Alguns módulos não foram carregados. Tente recarregar.');
  }

  // Definição segura de API_BASE
  const PRIMARY_DEFAULT = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'https://lumen-backend-api.onrender.com/api';
  const API = window.API || {};
  const API_PRIMARY = API.API_PRIMARY || PRIMARY_DEFAULT;
  const API_FALLBACK = API.API_FALLBACK || 'https://conhecimento-com-luz-api.onrender.com';

  async function chooseBase() {
    if (typeof window.API?.health === 'function') {
      try {
        const ok = await window.API.health();
        window.API_BASE = ok ? API_PRIMARY : API_FALLBACK;
      } catch {
        console.warn('[BOOT] Health falhou, usando FALLBACK:', API_FALLBACK);
        window.API_BASE = API_FALLBACK;
      }
    } else {
      console.warn('[BOOT] API.health não definido, usando PRIMARY:', API_PRIMARY);
      window.API_BASE = API_PRIMARY;
    }
    console.log('[BOOT] API_BASE =', window.API_BASE);
  }

  // Função de inicialização
  async function boot() {
    if (window.__BOOT_COMPLETED) {
      console.log('[BOOT] Inicialização já concluída, ignorando');
      return;
    }
    window.__BOOT_COMPLETED = true;
    console.log('[BOOT] Tentando iniciar • rota:', location.hash || 'intro');
    const route = (location.hash || '#intro').slice(1);
    try {
      if (window.JORNADA_RENDER) {
        if (route === 'intro') {
          window.JORNADA_RENDER.renderIntro && window.JORNADA_RENDER.renderIntro();
        } else {
          window.JORNADA_RENDER.render && window.JORNADA_RENDER.render(route);
        }
      } else {
        console.warn('[BOOT] JORNADA_RENDER não disponível, pulando renderização');
      }
      if (window.JC && typeof window.JC.init === 'function') {
        await window.JC.init();
        console.log('[BOOT] JC.init concluído');
      } else {
        console.warn('[BOOT] JC.init não disponível, usando fallback');
        window.JC = window.JC || {};
        window.JC.state = window.JC.state || { route: 'intro', booted: true };
        window.JC.init = function() {
          window.JC.state.booted = true;
          window.JC.ready = true;
          console.warn('[BOOT] JC.init (fallback) aplicado');
        };
        await window.JC.init();
      }
      console.log('[BOOT] Inicialização concluída com sucesso');
    } catch (e) {
      console.error('[BOOT] Erro ao iniciar:', e);
      window.toast && window.toast('Erro ao iniciar a jornada.');
    }
  }

  // Espera dependências
  function startWhenReady() {
    if (window.__BOOT_STARTED) {
      console.log('[BOOT] startWhenReady já iniciado, ignorando');
      return;
    }
    window.__BOOT_STARTED = true;
    let tries = 0;
    const maxTries = 100;
    const interval = setInterval(async () => {
      tries++;
      console.log('[BOOT] Tentativa', tries, 'de', maxTries);
      if (window.JC && typeof window.JC.init === 'function') {
        clearInterval(interval);
        await boot();
        console.log('[BOOT] startWhenReady concluído');
      } else if (tries >= maxTries) {
        clearInterval(interval);
        console.error('[BOOT] JC não disponível após', maxTries, 'tentativas');
        window.JC = window.JC || {};
        window.JC.state = window.JC.state || { route: 'intro', booted: true };
        window.JC.init = function() {
          window.JC.state.booted = true;
          window.JC.ready = true;
          console.warn('[BOOT] JC.init (fallback) aplicado');
        };
        await boot();
        console.log('[BOOT] startWhenReady concluído com fallback');
      }
    }, 100);
  }

  // Iniciar após escolher API_BASE
  chooseBase().finally(() => {
    console.log('[BOOT] API_BASE escolhido, iniciando startWhenReady...');
    startWhenReady();
  });
})();
