(function () {
  'use strict';

  let lastPreview = 0;
  let lastCapture = 0;

  // Utils
  const qs = (s, r = document) => r.querySelector(s);
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function typeLocal(el, text, speed) {
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

  async function runTypingAndSpeak(el, text) {
    if (!el || !text) {
      console.error('[Selfie] Elemento ou texto ausente para datilografia:', { el, text });
      return;
    }

    console.log('[Selfie] Iniciando datilografia para:', text);
    el.classList.remove('typing-done', 'typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align', 'left', 'important');
    el.setAttribute('dir', 'ltr');

    const speed = Number(el.dataset.speed || 40);
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try {
          window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' });
        } catch (e) {
          console.error('[Selfie] Erro no runTyping:', e);
          el.textContent = text;
          res();
        }
      });
    } else {
      await typeLocal(el, text, speed);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    console.log('[Selfie] Datilografia concluída:', text);

    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: 1.0 });
      if (p && typeof p.then === 'function') {
        console.log('[Selfie] Iniciando TTS para:', text);
        await p;
        console.log('[Selfie] TTS concluído:', text);
      } else {
        console.warn('[Selfie] TTS não disponível, pulando fala.');
      }
    } catch (e) {
      console.error('[Selfie] Erro no TTS:', e);
    }
  }

  function initSelfie(root) {
    // Esconder section-guia
    const guiaSection = document.getElementById('section-guia');
    if (guiaSection) {
      guiaSection.classList.add('hidden');
      guiaSection.style.display = 'none';
      guiaSection.setAttribute('aria-hidden', 'true');
      console.log('[Selfie] Seção guia escondida');
    }

    // Preencher nomes
    const nameSlot = qs('#userNameSlot', root);
    const guideNameSlot = qs('#guideNameSlot', root);
    const saved = {
      nome: sessionStorage.getItem('jornada.nome') || 'USUÁRIO',
      guia: sessionStorage.getItem('jornada.guia') || 'GUIA'
    };

    if (nameSlot) {
      nameSlot.textContent = saved.nome.toUpperCase();
      console.log('[Selfie] Nome do usuário definido:', saved.nome);
    }
    if (guideNameSlot) {
      guideNameSlot.textContent = saved.guia.toUpperCase();
      console.log('[Selfie] Nome do guia definido:', saved.guia);
    }

    // Datilografia no título
    const title = qs('[data-typing="true"]', root);
    if (title) {
      const text = (title.dataset.text || title.textContent || '').trim();
      runTypingAndSpeak(title, text);
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#captureBtn, #btnSkipSelfie, #section-selfie [data-action="avancar"]');
      if (!btn) return;

      e.preventDefault();
      const now = performance.now();

      if (btn.id === 'captureBtn') {
        if (now - lastCapture < 1000) return;
        lastCapture = now;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = document.getElementById('selfieImage');
        const bg = document.getElementById('guia-bg-png');
        const nameSlot = document.getElementById('userNameSlot');
        const guideNameSlot = document.getElementById('guideNameSlot');

        if (!img || !bg || !nameSlot || !guideNameSlot) {
          window.toast?.('Erro ao capturar imagem.');
          console.log('[Selfie] Elementos de imagem, fundo ou nomes não encontrados');
          return;
        }

        canvas.width = bg.naturalWidth || bg.width;
        canvas.height = bg.naturalHeight || bg.height;
        ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

        const scale = parseFloat(document.getElementById('selfieScale')?.value || 1);
        const offsetX = parseFloat(document.getElementById('selfieOffsetX')?.value || 0);
        const offsetY = parseFloat(document.getElementById('selfieOffsetY')?.value || 0);

        ctx.save();
        ctx.translate(15 + offsetX, 35 + offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, 70, 90);
        ctx.restore();

        ctx.font = 'bold 2.5rem Cardo, serif';
        ctx.fillStyle = '#f7d37a';
        ctx.textAlign = 'center';
        ctx.fillText(guideNameSlot.textContent || 'GUIA', canvas.width / 2, canvas.height * 0.02 + 30);
        ctx.font = 'bold 2rem Cardo, serif';
        ctx.fillText(nameSlot.textContent || 'USUÁRIO', canvas.width / 2, canvas.height * 0.98 - 10);

        const link = document.createElement('a');
        link.download = 'selfie-irmandade.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        console.log('[Selfie] Imagem baixada');

        try {
          localStorage.setItem('JORNADA_SELFIE', link.href);
        } catch (_) {}

        const avancarBtn = qs('#section-selfie [data-action="avancar"]');
        if (avancarBtn) {
          avancarBtn.disabled = false;
          console.log('[Selfie] Botão de avançar ativado após captura');
          window.toast?.('Imagem capturada! Clique em Avançar para continuar.');
        }

      } else if (btn.id === 'btnSkipSelfie' || btn.dataset.action === 'avancar') {
        if (window.JC) {
          speechSynthesis.cancel();
          document.querySelectorAll('video').forEach(video => {
            video.pause();
            video.src = '';
            video.load();
          });
          window.JC.goNext();
          console.log('[Selfie] Navegação para próxima seção');
        } else {
          console.error('[Selfie] window.JC não definido');
          window.toast?.('Erro ao navegar para próxima seção.');
        }
      }
    });

    console.log('[Selfie] Bloco de captura e navegação carregado');
  }

  document.addEventListener('sectionLoaded', (e) => {
    const id = e.detail.sectionId;
    if (id !== 'section-selfie') return;

    const root = e.detail.node;
    if (!root) {
      console.warn('[Selfie] Nó raiz não encontrado para a seção', id);
      return;
    }

    initSelfie(root);
  });
})();
