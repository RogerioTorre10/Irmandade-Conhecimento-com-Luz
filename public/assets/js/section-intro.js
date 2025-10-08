<section id="section-intro" class="section bloco bloco-intro hidden">
  <div class="bloco-conteudo">
    <h1>Bem-vindo(a) à Jornada Essencial</h1>

    <p id="intro-p1" data-typing="true" data-text="Esta é uma experiência de reflexão profunda, simbólica e acolhedora, Rogério."></p>

    <p id="intro-p2" data-typing="true" data-text="Utilizaremos símbolos e arquétipos para iluminar sua vocação e seu propósito de vida."></p>

    <p id="intro-p3" data-typing="true" data-text="Antes de começar, você deve ler com atenção o Termo de Responsabilidade e seguir quando estiver pronto(a)."></p>

    <div class="termo">
      <h2>Termo de Responsabilidade e Consentimento</h2>
      <p>Ao iniciar, você concorda em participar de forma consciente e reconhece que este material é exclusivamente para autoconhecimento e desenvolvimento pessoal. Ele não substitui apoio médico, psicológico ou profissional.</p>
    </div>
    
    <footer>
            <button id="btn-avancar" class="btn btn-primary" disabled data-action="avancar">Iniciar Jornada</button>
    </footer>
  </div>
</section>
<script> 
(() => {
  if (window.__introBound) return;
  window.__introBound = true;

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

  async function waitForEl(selector, { within = document, timeout = 8000, step = 100 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        const el = within.querySelector(selector);
        console.log(`[waitForEl] Buscando ${selector}, tempo: ${performance.now() - start}ms`);
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

  // ===== HANDLER PRINCIPAL DA INTRO =====
  const handler = async (e) => {
    console.log('[section-intro.js] Evento recebido:', e?.detail);
    const id = e?.detail?.sectionId || e?.detail?.id || window.__currentSectionId;
    if (id !== 'section-intro') return;

    console.log('[section-intro.js] Ativando intro');

    let root = e?.detail?.root || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForEl('#section-intro', { timeout: 8000, step: 100 });
      } catch {
        root = document.querySelector('section.section.bloco-intro, section[data-section="section-intro"]') || null;
      }
    }

    if (!root) {
      console.warn('[section-intro.js] Root da intro não encontrado (após espera)');
      window.toast?.('Intro ainda não montou no DOM. Verifique a ordem do evento.', 'warn');
      return;
    }

    const el1 = root.querySelector('#intro-p1');
    const el2 = root.querySelector('#intro-p2');
    const btn = root.querySelector('#btn-avancar');
    console.log('[section-intro.js] Elementos encontrados:', { el1, el2, btn });

    if (!(el1 && el2 && btn)) {
      console.warn('[section-intro.js] Elementos não encontrados', { el1, el2, btn });
      return;
    }

    // Preparar botão
    btn.classList.add('hidden');
    btn.classList.add('hidd'); // se essa classe não existir, não faz mal

    const showBtn = () => {
      console.log('[section-intro.js] Mostrando botão');
      btn.classList.remove('hidden');
      btn.classList.remove('hidd');
      btn.style.display = 'inline-block';
      btn.style.pointerEvents = 'auto';
      btn.disabled = false;
    };

    // Parâmetros de typing
    const speed1 = Number(el1.dataset.speed || 36);
    const speed2 = Number(el2.dataset.speed || 36);
    const t1 = getText(el1);
    const t2 = getText(el2);
    const cursor1 = String(el1.dataset.cursor || 'true') === 'true';
    const cursor2 = String(el2.dataset.cursor || 'true') === 'true';
    console.log('[section-intro.js] Parâmetros de typing:', { t1, t2, speed1, speed2, cursor1, cursor2 });

    // Parar qualquer efeito anterior
    window.EffectCoordinator?.stopAll?.();

    const runTypingChain = async () => {
      console.log('[section-intro.js] Iniciando runTypingChain');
      if (typeof window.runTyping === 'function') {
        console.log('[section-intro.js] Usando runTyping');
        try {
          await new Promise((resolve) => {
            window.runTyping(el1, t1, () => {
              console.log('[section-intro.js] Typing concluído para intro-p1');
              resolve();
            }, { speed: speed1, cursor: cursor1 });
          });
          await new Promise((resolve) => {
            window.runTyping(el2, t2, () => {
              console.log('[section-intro.js] Typing concluído para intro-p2');
              showBtn();
              resolve();
            }, { speed: speed2, cursor: cursor2 });
          });
        } catch (err) {
          console.warn('[section-intro.js] Erro no runTyping:', err);
        }

        // TTS coordenado (se existir)
        window.EffectCoordinator?.speak?.(t1, { rate: 1.06 });
        setTimeout(() => window.EffectCoordinator?.speak?.(t2, { rate: 1.05 }), Math.max(1000, t1.length * speed1 * 0.75));
        return;
      }

      // Fallback
      console.log('[section-intro.js] Fallback: sem efeitos');
      el1.textContent = t1;
      el2.textContent = t2;
      showBtn();
    };

    try {
      await runTypingChain();
    } catch (err) {
      console.warn('[section-intro.js] Typing chain falhou', err);
      el1.textContent = t1;
      el2.textContent = t2;
      showBtn();
    }

    const goNext = () => {
      console.log('[section-intro.js] Botão clicado, navegando para section-termos');
      if (typeof window.__canNavigate === 'function' && !window.__canNavigate()) return;

      const nextSection = 'section-termos';
      if (window.JC?.goNext) {
        window.JC.goNext(nextSection);
      } else {
        window.showSection?.(nextSection);
      }
    };

    console.log('[section-intro.js] Configurando evento de clique no botão');
    const freshBtn = btn.cloneNode(true);
    btn.replaceWith(freshBtn);
    once(freshBtn, 'click', goNext);
  }; // <<<<<< FECHAMENTO DO HANDLER

  // ===== BIND DOS EVENTOS =====
  const bind = () => {
    document.addEventListener('sectionLoaded', handler);
    document.addEventListener('section:shown', handler);
    console.log('[section-intro.js] Handler ligado');

    // Se a intro já estiver visível, dispara uma vez
    const current = window.__currentSectionId || document.querySelector('#section-intro:not(.hidden)') ? 'section-intro' : null;
    if (current === 'section-intro') {
      handler({ detail: { sectionId: 'section-intro', root: document.getElementById('section-intro') } });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
</script>   
