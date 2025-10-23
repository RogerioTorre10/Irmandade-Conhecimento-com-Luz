(function () {
  'use strict';

  let lastPreview = 0;
  let lastCapture = 0;

  // Utils
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
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

  async function initSelfie(root) {
    // Esconder outras seções
    const sections = qsa('.j-section');
    sections.forEach(section => {
      if (section.id !== 'section-selfie') {
        section.classList.add('hidden');
        section.style.display = 'none';
        section.setAttribute('aria-hidden', 'true');
        console.log(`[Selfie] Seção ${section.id} escondida`);
      }
    });

    // Definir currentSection para evitar fallback
    if (window.JC) {
      window.JC.currentSection = 'section-selfie';
      console.log('[Selfie] Definido window.JC.currentSection como section-selfie');
    }

    // Preencher nomes e dados do guia
    const nameInput = qs('#nameInput', root);
    const saved = {
      nome: sessionStorage.getItem('jornada.nome') || 'USUÁRIO',
      guia: sessionStorage.getItem('jornada.guia') || 'zion'
    };

    if (nameInput) {
      nameInput.value = saved.nome.toUpperCase();
      nameInput.addEventListener('input', () => {
        const newName = nameInput.value.trim().toUpperCase();
        sessionStorage.setItem('jornada.nome', newName);
        console.log('[Selfie] Nome atualizado:', newName);
      });
    }

    // Datilografia no título e parágrafo
    const elements = qsa('[data-typing="true"]', root);
    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

    // Atualizar selfieImage com o arquivo selecionado
    const selfieInput = qs('#selfieInput', root);
    if (selfieInput) {
      selfieInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = qs('#selfieImage', root);
            if (img) {
              img.src = event.target.result;
              img.style.display = 'block';
              console.log('[Selfie] Imagem selecionada:', file.name);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#previewBtn, #captureBtn, #btnSkipSelfie, #btnStartJourney');
      if (!btn) return;

      e.preventDefault();
      const now = performance.now();

      if (btn.id === 'previewBtn') {
        if (now - lastPreview < 1000) return;
        lastPreview = now;
        const img = qs('#selfieImage', root);
        if (img && img.src) {
          console.log('[Selfie] Pré-visualização atualizada!');
          window.toast?.('Pré-visualização atualizada!');
        } else {
          console.log('[Selfie] Nenhuma imagem selecionada.');
          window.toast?.('Selecione uma imagem primeiro.');
        }

      } else if (btn.id === 'captureBtn') {
        if (now - lastCapture < 1000) return;
        lastCapture = now;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = qs('#selfieImage', root);

        if (!img || !img.src) {
          window.toast?.('Erro ao capturar imagem: selecione uma imagem válida.');
          console.log('[Selfie] Elementos de imagem não encontrados');
          return;
        }

        canvas.width = 320; // Tamanho fixo para a prévia
        canvas.height = 480; // Aspect ratio 2/3
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scale = parseFloat(qs('#selfieScale', root)?.value || 1);
        const offsetX = parseFloat(qs('#selfieOffsetX', root)?.value || 0);
        const offsetY = parseFloat(qs('#selfieOffsetY', root)?.value || 0);

        ctx.save();
        ctx.translate(15 + offsetX, 35 + offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, 70, 90);
        ctx.restore();

        const link = document.createElement('a');
        link.download = 'selfie-irmandade.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        console.log('[Selfie] Imagem baixada');

        try {
          localStorage.setItem('JORNADA_SELFIE', link.href);
        } catch (_) {}

        const avancarBtn = qs('#btnStartJourney', root);
        if (avancarBtn) {
          avancarBtn.disabled = false;
          console.log('[Selfie] Botão de avançar ativado após captura');
          window.toast?.('Imagem capturada! Clique em Entrar na Jornada para continuar.');
        }

      } else if (btn.id === 'btnSkipSelfie' || btn.id === 'btnStartJourney') {
        if (window.JC) {
          speechSynthesis.cancel();
          qsa('video').forEach(video => {
            video.pause();
            video.src = '';
            video.load();
          });
          window.JC.show('section-card'); // Alterado para a próxima seção
          console.log('[Selfie] Navegação para section-card');
        } else {
          console.error('[Selfie] window.JC não definido');
          window.toast?.('Erro ao navegar para próxima seção.');
        }
      }
    });

    console.log('[Selfie] Bloco de captura e navegação carregado');
  }

  document.addEventListener('section:shown', (e) => {
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
