(function () {
  'use strict';

  let lastPreview = 0;
  let lastCapture = 0;

  function initSelfie() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#previewBtn, #captureBtn, #btnSkipSelfie, #section-selfie [data-action="avancar"]');
      if (!btn) return;

      e.preventDefault();
      const now = performance.now();

      if (btn.id === 'previewBtn') {
        if (now - lastPreview < 1000) return;
        lastPreview = now;
        const img = document.getElementById('selfieImage');
        const preview = document.querySelector('.selfie-preview');
        if (img && img.src && preview) {
          preview.style.opacity = '1';
          window.toast?.('Pré-visualização atualizada!');
          console.log('[Selfie] Pré-visualização atualizada!');
        } else {
          window.toast?.('Selecione uma imagem primeiro.');
          console.log('[Selfie] Nenhuma imagem ou preview encontrado.');
        }

      } else if (btn.id === 'captureBtn') {
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

        const avancarBtn = document.querySelector('#section-selfie [data-action="avancar"]');
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

    initSelfie();
  });
})();
