(function () {
  'use strict';

  if (window.__introBound) return;
  window.__introBound = true;

  // ===== GUARDAS E ESTADOS =====
  let INTRO_READY = false;
  let nomeDigitado = false;
  let dadosGuiaCarregados = false;
  // Você pode adicionar: let guiaSelecionado = false; se necessário no futuro

  // ===== HELPERS (mantidos do seu código original) =====
  const once = (el, ev, fn) => {
    if (!el) {
      console.warn('[section-intro.js] Elemento para evento não encontrado:', ev);
      return;
    }
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForEl(selector, { within = document, timeout = 2000, step = 100 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        // Corrigido para buscar no WITHIN (que é o ROOT da seção)
        const el = within.querySelector(selector); 
        console.log(`[waitForEl] Buscando ${selector}, tempo: ${Math.round(performance.now() - start)}ms`);
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) {
          console.error(`[waitForEl] Timeout após ${timeout}ms para ${selector}`);
          return reject(new Error(`timeout waiting ${selector}`));
        }
        setTimeout(tick, step);
      };
      tick();
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
  
  // ===== NOVA FUNÇÃO DE CONTROLE: HABILITAÇÃO DO BOTÃO =====
  const checkReady = (btn) => {
    // O botão só é habilitado se o nome foi digitado E os dados dos guias foram carregados.
    if (nomeDigitado && dadosGuiaCarregados) {
      btn.disabled = false;
      btn.classList.remove('disabled-temp');
      console.log('[Guia Setup] Botão "Iniciar" ativado.');
    } else {
      btn.disabled = true;
      btn.classList.add('disabled-temp');
    }
  };

  // ===== NOVA FUNÇÃO: CARREGAMENTO DE DADOS E SETUP DO GUIA (SEU PROBLEMA DE FETCH AQUI) =====
  async function loadAndSetupGuia(root, btn) {
    const nameInput = root.querySelector('#name-input');
    const guiaPlaceholder = root.querySelector('#guia-selfie-placeholder');

    // 1) Monitora o campo de nome
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            nomeDigitado = nameInput.value.trim().length > 2;
            checkReady(btn);
        });
        nomeDigitado = nameInput.value.trim().length > 2;
    }

    // 2) Tenta carregar os dados dos guias com fetch
    try {
        console.log('[Guia Setup] Iniciando fetch para dados dos guias...');
        const response = await fetch('/assets/data/guias.json'); 
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - Verifique o caminho '/assets/data/guias.json'`);
        }
        
        const guias = await response.json();
        console.log('[Guia Setup] Dados dos guias carregados com sucesso:', guias.length);

        // 3) Renderiza o seletor de guia
        if (guiaPlaceholder && guias.length > 0) {
            if (typeof window.JornadaGuiaSelfie?.renderSelector === 'function') {
                window.JornadaGuiaSelfie.renderSelector(guiaPlaceholder, guias);
                
                // Monitora a seleção para garantir que o botão só habilite DEPOIS de escolher
                document.addEventListener('guiaSelected', (e) => {
                    log('[Intro] Guia selecionado. Verificando se pode avançar.');
                    dadosGuiaCarregados = true; // Confirma que o dado foi usado
                    checkReady(btn); // Re-checa o estado (nome + guia selecionado)
                }, { once: true });
                
                // Mantenha dadosGuiaCarregados como 'false' se você exigir a seleção!
                dadosGuiaCarregados = false; // Começa como false, só será true após o evento 'guiaSelected'
                
            } else {
                console.warn('[Guia Setup] Função de renderização do guia não encontrada. Avance sem seleção.');
                dadosGuiaCarregados = true; // Fallback: avança mesmo sem o renderizador do Guia
            }
        } else {
            // Se não houver dados de guia, avança apenas com o nome
            dadosGuiaCarregados = true;
        }
        // <<< ATENÇÃO: AQUI AS LINHAS DELETADAS SUMIRAM. O 'try' TERMINA LIMPO.

    } catch (err) {
        console.error('[Guia Setup] Falha crítica no fetch dos guias. Verifique a URL e o JSON:', err);
        window.toast?.('Falha ao carregar dados dos guias. Tente recarregar a página.', 'error');
        // Em caso de falha, forçamos o avanço para não travar:
        dadosGuiaCarregados = true; 
    } finally {
        checkReady(btn); // ATUALIZA O ESTADO DO BOTÃO NO FINAL
    }
}


  // ===== HANDLER PRINCIPAL DA INTRO (fluxo original) =====
  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    console.log('[section-intro.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-intro') return;

    console.log('[section-intro.js] Ativando intro');

    // 1) Garante o root da seção
    let root = node || document.getElementById('section-intro');
    // ... (código de waitForEl e verificação de root mantido) ...
    if (!root) {
      try {
        root = await waitForEl('#section-intro', { timeout: 8000, step: 100 });
      } catch {
        root = document.querySelector('section[data-section="intro"]') || null;
      }
    }
    if (!root) {
      console.warn('[section-intro.js] Root da intro não encontrado (após espera)');
      window.toast?.('Intro ainda não montou no DOM.', 'warn');
      return;
    }

   // 2) Busca elementos dentro do root, GARANTINDO que eles existam
    let el1, el2, btn;
    try {
        // Usa waitForEl para garantir que o DOM esteja pronto antes de prosseguir
        el1 = await waitForEl('#intro-p1', { within: root, timeout: 2000, step: 50 });
        el2 = await waitForEl('#intro-p2', { within: root, timeout: 2000, step: 50 });
        btn = await waitForEl('#btn-avancar', { within: root, timeout: 2000, step: 50 });
    } catch (e) {
        // Se falhar, registra o erro e prossegue com o fallback
        console.error('[section-intro.js] Falha ao esperar pelos elementos essenciais:', e);
    }
    
    console.log('[section-intro.js] Elementos encontrados:', { el1: !!el1, el2: !!el2, btn: !!btn });

    if (!(el1 && el2 && btn)) {
      console.warn('[section-intro.js] Elementos não encontrados - Falha na injeção de HTML?');
      window.toast?.('Falha ao carregar a Introdução.', 'error');
      return;
    }

    
    // 3) Garante visibilidade
    // ... (código de show/showSection mantido) ...
    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-intro');
      } else if (typeof window.showSection === 'function') {
        window.showSection('section-intro');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'block';
      }
    } catch (err) {
      console.warn('[section-intro.js] Falha ao exibir seção:', err);
      root.classList.remove('hidden');
      root.style.display = 'block';
    }

    // 4) Prepara botão e desabilita temporariamente
    btn.classList.add('hidden', 'disabled-temp');
    btn.disabled = true;
    const showBtn = () => {
      console.log('[section-intro.js] Mostrando botão (aguardando dados/nome)');
      btn.classList.remove('hidden');
      btn.style.display = 'inline-block';
      checkReady(btn); // Verifica se já pode habilitar
    };

    // 5) Parâmetros da datilografia
    const speed1 = Number(el1.dataset.speed || 36);
    const speed2 = Number(el2.dataset.speed || 36);
    const t1 = getText(el1);
    const t2 = getText(el2);
    const cursor1 = String(el1.dataset.cursor || 'true') === 'true';
    const cursor2 = String(el2.dataset.cursor || 'true') === 'true';

    // 6) Evita duplicar efeitos
    if (INTRO_READY) {
      console.log('[section-intro.js] Intro já preparada');
      showBtn();
      // Se já carregou uma vez, re-checa e re-ativa a lógica de guia e nome
      loadAndSetupGuia(root, btn);
      return;
    }

    // 7) Interrompe efeitos anteriores
    window.EffectCoordinator?.stopAll?.();

    // 8) Encadeia typing
    const runTypingChain = async () => {
      console.log('[section-intro.js] Iniciando runTypingChain');
      if (typeof window.runTyping === 'function') {
        try {
          await new Promise((resolve) => {
            window.runTyping(el1, t1, resolve, { speed: speed1, cursor: cursor1 });
          });
          console.log('[section-intro.js] Typing concluído para intro-p1');
          window.EffectCoordinator?.speak?.(t1, { rate: 1.06 });

          await new Promise((resolve) => {
            window.runTyping(el2, t2, resolve, { speed: speed2, cursor: cursor2 });
          });
          console.log('[section-intro.js] Typing concluído para intro-p2');
          setTimeout(() => window.EffectCoordinator?.speak?.(t2, { rate: 1.05 }), 300);
        } catch (err) {
          console.warn('[section-intro.js] Erro no runTyping:', err);
          el1.textContent = t1;
          el2.textContent = t2;
        }
      } else {
        console.log('[section-intro.js] Fallback: sem efeitos');
        el1.textContent = t1;
        el2.textContent = t2;
      }
      showBtn(); // Mostra o botão após o typing
    };

    try {
      await runTypingChain();
      INTRO_READY = true;
      // *** CHAMA A LÓGICA DE CARREGAMENTO DE DADOS APÓS O TEXTO ***
      await loadAndSetupGuia(root, btn);
    } catch (err) {
      console.warn('[section-intro.js] Typing chain falhou', err);
      el1.textContent = t1;
      el2.textContent = t2;
      showBtn();
      INTRO_READY = true;
    }

    // 9) Navegação (mantido do seu código original)
    const goNext = () => {
      console.log('[section-intro.js] Botão clicado, navegando para section-termos');
      if (typeof window.__canNavigate === 'function' && !window.__canNavigate()) return;

      const nextSection = 'section-termos';
      // ... (código de navegação mantido) ...
      try {
        if (window.JC?.goNext) {
          window.JC.goNext(nextSection);
        } else if (typeof window.showSection === 'function') {
          window.showSection(nextSection);
        }
      } catch (err) {
        console.error('[section-intro.js] Erro ao avançar:', err);
      }
    };

    console.log('[section-intro.js] Configurando evento de clique no botão');
    const freshBtn = btn.cloneNode(true);
    btn.replaceWith(freshBtn);
    once(freshBtn, 'click', goNext);
  };

  // ===== BIND DOS EVENTOS (mantido do seu código original) =====
  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });
    console.log('[section-intro.js] Handler ligado');

    const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
    if (visibleIntro) {
      handler({ detail: { sectionId: 'section-intro', node: visibleIntro } });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
