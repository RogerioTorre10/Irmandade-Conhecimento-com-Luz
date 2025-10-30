/* /assets/js/section-selfie.js — FASE 4.5 (ajuste espaçamento lateral dos botões + novo vídeo)
   - Mantém prévia 3:4 (CARD metric)
   - Adiciona espaçamento central entre botões no mobile e desktop
   - Atualiza vídeo de transição para '/assets/videos/filme-selfie-card.mp4'
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase45_bound) return;
  NS.__phase45_bound = true;

  const MOD = 'section-selfie.js';
  const SECTION_ID = 'section-selfie';
  const NEXT_SECTION_ID = 'section-card';
  const VIDEO_SRC = '/assets/videos/filme-selfie-card.mp4';

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ... (demais funções idênticas à versão anterior FASE 4.4)

  // ---------- Botões com folga central ----------
  function ensureButtons(section) {
    let div = section.querySelector('#selfieButtons');
    if (!div) {
      const css = document.createElement('style');
      css.textContent = `
        #selfieButtons{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin:8px auto;width:92%;max-width:820px}
        #selfieButtons .btn{flex:1 1 28%;min-width:100px;max-width:180px;height:34px;line-height:34px;padding:0 8px;font-size:13px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s;text-align:center}
        #selfieButtons .btn:disabled{opacity:.5;cursor:not-allowed}
        @media (max-width: 480px){
          #selfieButtons{gap:10px}
          #selfieButtons .btn{flex:1 1 30%;font-size:12px;height:32px;line-height:32px;padding:0 6px}
        }
      `;
      document.head.appendChild(css);
      div = document.createElement('div');
      div.id = 'selfieButtons';
      div.innerHTML = `
        <button id="btn-preview" class="btn btn-stone-espinhos">Prévia</button>
        <button id="btn-shot" class="btn btn-stone-espinhos" disabled>Foto</button>
        <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Iniciar</button>`;
      section.appendChild(div);
    }

    if (!NS._buttonsReady) {
      NS._buttonsReady = true;
      const btnPreview = div.querySelector('#btn-preview');
      const btnShot = div.querySelector('#btn-shot');
      const btnConfirm = div.querySelector('#btn-confirm');

      btnPreview.onclick = async () => {
        await startCamera();
        if (btnPreview.textContent !== 'Prévia/Repetir') btnPreview.textContent = 'Prévia/Repetir';
        btnShot.disabled = false;
        btnConfirm.disabled = false;
      };
      btnShot.onclick = () => capturePhoto();
      btnConfirm.onclick = () => confirmPhoto();
    }

    div.style.position = 'relative';
    div.style.zIndex = '60';
  }

  // ---- Transição ----
  function playTransitionThenGo(id) {
    if (global.VideoTransicao?.play) {
      try { global.VideoTransicao.play({ src: VIDEO_SRC, onEnd: () => goNext(id) }); }
      catch { goNext(id); }
    } else { goNext(id); }
  }

  // (restante igual à 4.4 — preview, câmera, captura, texto, etc.)

})(window);
