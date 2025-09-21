```javascript
/* =========================================================
   jornada-controller.js
   Controla a navegação e estado da jornada
   ========================================================= */
;(function () {
  'use strict';
  console.log('[JORNADA_CONTROLLER] Iniciando carregamento do script...');

  // Evita múltiplas inicializações
  if (window.__JC_INIT_DONE) {
    console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
    return;
  }
  window.__JC_INIT_DONE = true;

  // Define namespace JC
  const JC = (window.JC = window.JC || {});
  JC.state = JC.state || { route: 'intro', booted: false, blocoIndex: 0, perguntaIndex: 0 };

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
          <label class="pergunta-enunciado"
                 data-typing="true"
                 data-text="<b>Pergunta ${qIdx + 1}:</b> ${q.label}"
                 data-speed="40" data-cursor="true"></label>
          <textarea rows="4" class="input" placeholder="Digite sua resposta..." oninput="window.handleInput && window.handleInput(this)"></textarea>
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
  }

  // Navegação para a próxima seção/pergunta
  function goNext() {
    console.log('[JORNADA_CONTROLLER] Iniciando goNext...');
    const state = JC.state;
    const currentSection = document.querySelector('.j-section:not(.hidden)')?.id;
    const flow = [
      { from: 'section-intro', to: 'section-termos' },
      { from: 'section-termos', to: 'section-senha' },
      { from: 'section-senha', to: 'section-guia' },
      { from: 'section-guia', to: 'section-selfie' },
      { from: 'section-selfie', to: 'section-perguntas' },
      { from: 'section-perguntas', to: null },
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
        window.showSection(nextSection);
      } else {
        console.log('[JORNADA_CONTROLLER] Nenhuma seção seguinte definida para:', currentSection);
        window.toast && window.toast('Fim do fluxo. Tente recarregar.');
      }
    }
  }

  // Inicialização da jornada
  function initJornada() {
    if (JC.state.booted) {
      console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
      return;
    }
    JC.state.booted = true;
    JC.state.route = 'intro';
    JC.ready = true;

    try {
      if (window.JORNADA_RENDER && window.JORNADA_RENDER.updateCanvasBackground) {
        window.JORNADA_RENDER.updateCanvasBackground('section-intro');
      }
      if (window.JORNADA_CHAMA && window.JORNADA_CHAMA.ensureHeroFlame) {
        window.JORNADA_CHAMA.ensureHeroFlame('section-intro');
      }
      const section = document.getElementById('section-intro');
      if (section && window.showSection) {
        window.showSection('section-intro');
      } else {
        console.error('[JORNADA_CONTROLLER] section-intro não encontrada');
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
      }
      loadDynamicBlocks();
    } catch (e) {
      console.error('[JORNADA_CONTROLLER] Erro em initJornada:', e);
      window.toast && window.toast('Erro ao inicializar a jornada.');
    }
    if (JC._onReady && Array.isArray(JC._onReady)) {
      JC._onReady.forEach(fn => { try { fn(); } catch (e) {} });
      JC._onReady = [];
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
      initJornada();
    };
    document.addEventListener('DOMContentLoaded', window.__JC_onDomC, { once: true });

    window.removeEventListener('load', window.__JC_onLoadC);
    window.__JC_onLoadC = () => {
      console.log('[JORNADA_CONTROLLER] Inicialização no load...');
      initJornada();
    };
    window.addEventListener('load', window.__JC_onLoadC, { once: true });
  }

  // Exports globais
  JC.init = initJornada;
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

#### 2. `jornada-bootstrap.js`

**Mudanças**:
- **Ajustado `startWhenReady`**: Verifica `JC.init` em vez de `JC._state`, alinhando com o hotfix e `jornada-controller.js`. Aumentado `maxTries` para 100 (10 segundos).
- **Adicionado Fallback**: Força a criação de `JC.init` se não estiver disponível após as tentativas.
- **Padronizado `API_BASE`**: Usado `https://lumen-backend-api.onrender.com/api` com fallback para `https://conhecimento-com-luz-api.onrender.com`.
- **Removido Lista de Scripts Redundante**: A lista de scripts não é usada para nada além de logging, então simplifiquei o código.

<xaiArtifact artifact_id="ead42723-e106-4aff-8505-e03ff980547e" artifact_version_id="fddbca80-0468-4cd1-b2f2-4a5593200810" title="jornada-bootstrap.js" contentType="text/javascript">
```javascript
/* =========================================================
   jornada-bootstrap.js
   Inicialização da jornada com tolerância a erros e espera por dependências
   ========================================================= */
;(function () {
  'use strict';
  console.log('[BOOT] Iniciando micro-boot...');

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
      console.log('[BOOT] Inicialização concluída');
    } catch (e) {
      console.error('[BOOT] Erro ao iniciar:', e);
      window.toast && window.toast('Erro ao iniciar a jornada.');
    }
  }

  // Espera dependências
  function startWhenReady() {
    let tries = 0;
    const maxTries = 100;
    const interval = setInterval(async () => {
      tries++;
      console.log('[BOOT] Tentativa', tries, 'de', maxTries);
      if (window.JC && typeof window.JC.init === 'function') {
        clearInterval(interval);
        await boot();
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
      }
    }, 100);
  }

  // Iniciar após escolher API_BASE
  chooseBase().finally(() => {
    console.log('[BOOT] API_BASE escolhido, iniciando startWhenReady...');
    startWhenReady();
  });

  // Reexecuta boot no load
  window.addEventListener('load', () => {
    console.log('[BOOT] Inicialização final no load...');
    boot();
  });
})();
```

#### 3. `jornada-shims.js`

**Mudanças**:
- **Removido `showSection` redundante**: Como `jornada-conhecimento-com-luz1.html` já define uma versão mais robusta de `window.showSection`, removi a definição de `jornada-shims.js` para evitar conflitos.
- **Simplificado Shims**: Mantive apenas os shims necessários para módulos ausentes e funções críticas.
- **Adicionado Verificações**: Garanti que os shims não sobrescrevam implementações reais.

<xaiArtifact artifact_id="9a4c5710-46cf-48fc-832a-77ac6676a3a1" artifact_version_id="7d984461-2bab-485a-84bb-d2725ecefc38" title="jornada-shims.js" contentType="text/javascript">
```javascript
/* =========================================================
   jornada-shims.js
   Garante funções globais e módulos ausentes
   ========================================================= */
(function () {
  'use strict';
  console.log('[SHIMS] Iniciando shims v5...');

  // Helpers leves
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Evita quebra se console não existir
  window.console = window.console || { log() {}, warn() {}, error() {} };

  // Classe usada para esconder seções
  const HIDE_CLASS = 'section-hidden';

  // Garante a classe CSS básica
  if (!q('#jornada-shims-style')) {
    const st = document.createElement('style');
    st.id = 'jornada-shims-style';
    st.textContent = `
      .${HIDE_CLASS} { display: none !important; }
      section[id^="section-"] { width: 100%; }
    `;
    document.head.appendChild(st);
  }

  // Shims para módulos ausentes
  window.CONFIG = window.CONFIG || {};
  window.JUtils = window.JUtils || {};
  window.JCore = window.JCore || {};
  window.JAuth = window.JAuth || {};
  window.JChama = window.JChama || {};
  window.JPaperQA = window.JPaperQA || {};
  window.JTyping = window.JTyping || {};
  window.JController = window.JController || {};
  window.JRender = window.JRender || {};
  window.JBootstrap = window.JBootstrap || {};
  window.JMicro = window.JMicro || {};
  window.I18N = window.I18N || {};
  window.API = window.API || { base: (window.API_BASE || '') };

  // Handler leve para inputs
  window.handleInput = window.handleInput || function handleInput(ev) {
    try {
      const el = ev && ev.target ? ev.target : null;
      if (!el) return;
      const max = parseInt(el.getAttribute('maxlength') || '0', 10);
      if (max > 0 && el.value.length > max) el.value = el.value.slice(0, max);
      el.dataset.touched = '1';
    } catch (e) {
      console.error('[SHIMS] handleInput erro:', e);
    }
  };

  // Ponte mínima para datilografia
  window.JORNADA_TYPE = window.JORNADA_TYPE || {
    run(rootSelector = '#perguntas-container') {
      try {
        const root = (typeof rootSelector === 'string')
          ? (window.q ? q(rootSelector) : document.querySelector(rootSelector))
          : rootSelector;
        if (!root) {
          console.warn('[JORNADA_TYPE] root não encontrado');
          return;
        }
        const firstText = (window.q ? q('[data-type="texto"], .j-texto, p, .typing', root)
          : root.querySelector('[data-type="texto"], .j-texto, p, .typing'));
        if (firstText && window.TypingBridge && typeof window.TypingBridge.play === 'function') {
          window.TypingBridge.play(firstText);
        }
        const inputs = (window.qa ? qa('textarea, input[type="text"], input[type="search"]', root)
          : Array.from(root.querySelectorAll('textarea, input[type="text"], input[type="search"]')));
        inputs.forEach(el => {
          el.removeEventListener('input', window.handleInput);
          el.addEventListener('input', window.handleInput);
        });
        console.log('[JORNADA_TYPE] run concluído');
      } catch (e) {
        console.error('[JORNADA_TYPE] erro:', e);
      }
    }
  };

  // Fallback para seção inicial
  document.addEventListener('DOMContentLoaded', () => {
    const visible = qa('section[id^="section-"]').find(s => !s.classList.contains(HIDE_CLASS));
    if (!visible && window.showSection) {
      if (q('#section-intro')) window.showSection('section-intro');
    }
  });
})();
```

#### 4. `jornada-conhecimento-com-luz1.html` (trecho até `</body>`)

**Mudanças**:
- **Removido Hotfix Redundante**: O hotfix para `JC` foi consolidado em `jornada-controller.js`.
- **Atualizado Ordem de Scripts**: Garantido que `jornada-shims.js` carrega antes de `jornada-controller.js` para fornecer fallbacks.
- **Adicionado Logs de Carregamento**: Mantido `onload` e `onerror` para depuração.
- **Padronizado `API_BASE`**: Alinhado com `jornada-bootstrap.js`.

<xaiArtifact artifact_id="e9003230-a49c-4999-b697-a0d4e2456d4b" artifact_version_id="2451cc22-14be-4ea3-84da-00d89761f33d" title="jornada-conhecimento-com-luz1.html" contentType="text/html">
```html
<!-- Scripts Externos -->
<script defer src="/config.js?v=5" onload="console.log('[LOAD] config.js carregado')" onerror="console.error('[LOAD] Erro ao carregar config.js')"></script>
<script defer src="/jornada-utils.js?v=5" onload="console.log('[LOAD] jornada-utils.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-utils.js')"></script>
<script defer src="/jornada-core.js?v=5" onload="console.log('[LOAD] jornada-core.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-core.js')"></script>
<script defer src="/jornada-auth.js?v=5" onload="console.log('[LOAD] jornada-auth.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-auth.js')"></script>
<script defer src="/jornada-chama.js?v=5" onload="console.log('[LOAD] jornada-chama.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-chama.js')"></script>
<script defer src="/jornada-paper-qa.js?v=5" onload="console.log('[LOAD] jornada-paper-qa.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-paper-qa.js')"></script>
<script defer src="/jornada-typing.js?v=5" onload="console.log('[LOAD] jornada-typing.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-typing.js')"></script>
<script defer src="/assets/js/jornada-typing-bridge.js?v=1" onload="console.log('[LOAD] jornada-typing-bridge.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-typing-bridge.js')"></script>
<script defer src="/assets/js/jornada-shims.js?v=5" onload="console.log('[LOAD] jornada-shims.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-shims.js')"></script>
<script defer src="/jornada-controller.js?v=5" onload="console.log('[LOAD] jornada-controller.js carregado'); console.log('[JC] Após controller: JC existe?', !!window.JC, 'init =', typeof (window.JC && window.JC.init))" onerror="console.error('[LOAD] Erro ao carregar jornada-controller.js')"></script>
<script defer src="/jornada-render.js?v=5" onload="console.log('[LOAD] jornada-render.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-render.js')"></script>
<script defer src="/jornada-bootstrap.js?v=5" onload="console.log('[LOAD] jornada-bootstrap.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-bootstrap.js')"></script>
<script defer src="/jornada-micro.js?v=5" onload="console.log('[LOAD] jornada-micro.js carregado')" onerror="console.error('[LOAD] Erro ao carregar jornada-micro.js')"></script>
<script defer src="/i18n/i18n.js?v=5" onload="console.log('[LOAD] i18n.js carregado')" onerror="console.error('[LOAD] Erro ao carregar i18n.js')"></script>
<script defer src="/api.js?v=5" onload="console.log('[LOAD] api.js carregado')" onerror="console.error('[LOAD] Erro ao carregar api.js')"></script>

<!-- Micro-boot: Inicialização segura -->
<script defer>
(function() {
  console.log('[BOOT] Iniciando micro-boot…');

  // Verificar módulos ausentes
  const must = ['CONFIG', 'JUtils', 'JCore', 'JAuth', 'JChama', 'JPaperQA', 'JTyping', 'JController', 'JRender', 'JBootstrap', 'JMicro', 'I18N', 'API'];
  const missing = must.filter(k => !(k in window));
  if (missing.length) {
    console.warn('[BOOT] Módulos ausentes:', missing);
    window.toast && window.toast('Alguns módulos não foram carregados. Tente recarregar.');
  }

  // Definir API_BASE com fallback
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

  // Iniciar jornada
  chooseBase().finally(async () => {
    try {
      if (window.JBootstrap && typeof window.JBootstrap.start === 'function') {
        await window.JBootstrap.start();
      } else {
        console.warn('[BOOT] JBootstrap.start não definido');
      }
    } catch (e) {
      console.error('[BOOT] Erro em JBootstrap.start:', e);
      window.toast && window.toast('Erro ao iniciar bootstrap.');
    }
    try {
      if (window.JC && typeof window.JC.init === 'function') {
        await window.JC.init();
      } else {
        console.warn('[BOOT] JC.init não definido, aplicando fallback');
        window.JC = window.JC || {};
        window.JC.state = window.JC.state || { route: 'intro', booted: true };
        window.JC.init = function() {
          window.JC.state.booted = true;
          window.JC.ready = true;
          console.warn('[BOOT] JC.init (fallback) aplicado');
        };
        await window.JC.init();
      }
    } catch (e) {
      console.error('[BOOT] Erro em JC.init:', e);
      window.toast && window.toast('Erro ao iniciar controlador.');
    }
    console.log('[BOOT] Jornada iniciada 🚀');
  });
})();
</script>
</body>
</html>
