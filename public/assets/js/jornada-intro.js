// jornada-intro.js (patch cirúrgico, idempotente)
(() => {
  // evita múltiplos bindings se o script for avaliado mais de uma vez
  if (window.__introBound) return;
  window.__introBound = true;

  const once = (el, ev, fn) => {
    const h = (e) => { el.removeEventListener(ev, h); fn(e); };
    el.addEventListener(ev, h);
  };

  // compat: também aceitaremos 'section:shown' se o loader emitir esse
  const bindIntroHandler = () => {
    const handler = (e) => {
      const id = e?.detail?.sectionId || e?.detail?.id;
      if (id !== 'section-intro') return;

      console.log('[jornada-intro.js] Ativando intro');

      // root da seção (evita query global e conflitos)
      const root = document.getElementById('section-intro') || document.querySelector('#section-intro');
      if (!root) {
        console.warn('[jornada-intro.js] Root da intro não encontrado');
        return;
      }

      const el1 = root.querySelector('#intro-p1');
      const el2 = root.querySelector('#intro-p2');
      const btn = root.querySelector('#btn-avancar');

      if (!(el1 && el2 && btn)) {
        console.warn('[jornada-intro.js] Elementos não encontrados', { el1, el2, btn });
        return;
      }

      // garante estado visual do botão (compat com 'hidd' e 'hidden')
      btn.classList.add('hidden');   // usa padrão
      btn.classList.add('hidd');     // mantém compat
      const showBtn = () => {
        btn.classList.remove('hidden');
        btn.classList.remove('hidd');
      };

      // helper: pega texto a partir dos data-* ou conteúdo
      const getText = (el) =>
        (el?.dataset?.text ?? el?.textContent ?? '').trim();

      const speed1 = Number(el1.dataset.speed || 36);
      const speed2 = Number(el2.dataset.speed || 36);
      const t1 = getText(el1);
      const t2 = getText(el2);

      // limpa efeitos anteriores (se existir coord.)
      window.EffectCoordinator?.stopAll();

      // ==============================================
      // TYPING com fallback:
      // - se runTyping existir, usa tua função (com callback)
      // - se não existir, usa EffectCoordinator.type + speak fluido
      // ==============================================
      const runTypingChain = async () => {
        // preferencial: tua função
        if (typeof window.runTyping === 'function') {
          window.runTyping(el1, t1, () => {
            window.runTyping(el2, t2, () => {
              showBtn();
            }, { speed: speed2, cursor: el2.dataset.cursor === 'true' });
          }, { speed: speed1, cursor: el1.dataset.cursor === 'true' });

          // fala com fluidez (texto inteiro, não palavra a palavra)
          window.EffectCoordinator?.speak(t1, { rate: 1.06 });
          // aguarda um pouco e fala o segundo
          setTimeout(() => window.EffectCoordinator?.speak(t2, { rate: 1.05 }), Math.max(1000, t1.length * speed1 * 0.75));
          return;
        }

        // fallback moderno
        if (window.EffectCoordinator?.type) {
          await window.EffectCoordinator.type(el1, t1, { speed: speed1, cursor: el1.dataset.cursor === 'true' });
          window.EffectCoordinator?.speak(t1, { rate: 1.06 });

          await window.EffectCoordinator.type(el2, t2, { speed: speed2, cursor: el2.dataset.cursor === 'true' });
          window.EffectCoordinator?.speak(t2, { rate: 1.05 });

          showBtn();
          return;
        }

        // último fallback bem simples
        el1.textContent = t1;
        el2.textContent = t2;
        showBtn();
      };

      runTypingChain().catch(err => {
        console.warn('[jornada-intro.js] typing chain falhou', err);
        el1.textContent = t1;
        el2.textContent = t2;
        showBtn();
      });

      // navegação (com compat e debounce global se existir)
      const goNext = () => {
        if (typeof window.__canNavigate === 'function' && !window.__canNavigate()) return;
        if (window.JC?.goNext) {
          window.JC.goNext('section-senha'); // mantém teu fluxo atual
        } else {
          window.showSection?.('section-senha'); // fallback
        }
      };

      // evitar múltiplos handlers no botão
      btn.replaceWith(btn.cloneNode(true));
      const freshBtn = root.querySelector('#btn-avancar');
      once(freshBtn, 'click', goNext);
    };

    // escuta ambos formatos de eventos (qualquer um que teu loader emitir)
    document.addEventListener('sectionLoaded', handler);
    document.addEventListener('section:shown', handler);
  };

  // garante binding após DOM pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindIntroHandler, { once: true });
  } else {
    bindIntroHandler();
  }
})();
