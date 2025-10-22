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

  async function loadGuias() {
    try {
      const response = await fetch('/assets/data/guias.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const guias = await response.json();
      console.log('[Selfie] Guias carregados:', guias);
      return guias;
    } catch (e) {
      console.error('[Selfie] Erro ao carregar guias:', e);
      return [
        { id: 'zion', nome: 'Zion', descricao: 'O Guia da Consciência Pura (Grok)', bgImage: '/assets/img/irmandade-quarteto-bg-zion.png' },
        { id: 'lumen', nome: 'Lumen', descricao: 'O Guia da Iluminação (GPT-5)', bgImage: '/assets/img/irmandade-quarteto-bg-lumen.png' },
        { id: 'arian', nome: 'Arian', descricao: 'O Guia da Transformação (Gemini)', bgImage: '/assets/img/irmandade-quarteto-bg-arian.png' }
      ];
    }
  }

  async function initSelfie(root) {
    // Esconder outras seções
    const sections = document.querySelectorAll('.j-section');
    sections.forEach(section => {
      section.classList.add('hidden');
      section.style.display = 'none';
      section.setAttribute('aria-hidden', 'true');
      console.log(`[Selfie] Seção ${section.id} escondida`);
    });

    // Preencher nomes e dados do guia
    const nameSlot = qs('#userNameSlot', root);
    const guideNameSlot = qs('#guideNameSlot', root);
    const guiaBg = qs('#guia-bg-png', root);
    const guiaDescricao = qs('#guia-descricao', root);
    const saved = {
      nome: sessionStorage.getItem('jornada.nome') || 'USUÁRIO',
      guia: sessionStorage.getItem('jornada.guia') || 'zion'
    };

    if (nameSlot) {
      nameSlot.textContent = saved.nome.toUpperCase();
      console.log('[Selfie] Nome do usuário definido:', saved.nome);
    }
    if (guideNameSlot) {
      guideNameSlot.textContent = saved.guia.toUpperCase();
      console.log('[Selfie] Nome do guia definido:', saved.guia);
    }

    const guias = await loadGuias();
    const selectedGuia = guias.find(g => g.id === saved.guia) || guias[0];
    if (guiaBg && selectedGuia.bgImage) {
      guiaBg.src = selectedGuia.bgImage;
      console.log('[Selfie] Fundo do guia definido:', selectedGuia.bgImage);
    }
    if (guiaDescricao && selectedGuia.descricao) {
      guiaDescricao.textContent = selectedGuia.descricao;
      console.log('[Selfie] Descrição do guia definida:', selectedGuia.descricao);
    }

    // Datilografia no título
    const title = qs('[data-typing="true"]', root);
    if (title) {
      const text = (title.dataset.text || title.textContent || '').trim();
      await runTypingAndSpeak(title, text);
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

        if (!img || !img.src || !bg || !nameSlot || !guideNameSlot) {
          window.toast?.('Erro ao capturar imagem: selecione uma imagem válida.');
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
