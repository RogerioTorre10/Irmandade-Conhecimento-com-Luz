(function () {
  'use strict';

  const MOD = 'section-selfie.js';
  const SECTION_ID = 'section-selfie';
  const NEXT_SECTION_ID = 'section-card';

  // fallback caso não exista data-attr na section/botão
  const DEFAULT_VIDEO_SRC = '/assets/video/filme-eu-na-irmandade.mp4';

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ------- helpers de tipagem/tts (originais) -------
  async function typeLocal(el, text, speed) {
    return new Promise(resolve => {
      el.textContent = '';
      let i = 0;
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else resolve();
      };
      tick();
    });
  }

  async function runTypingAndSpeak(el, text) {
    if (!el || !text) return;

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
          el.textContent = text;
          res();
        }
      });
    } else {
      await typeLocal(el, text, speed);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: 1.0 });
      if (p && typeof p.then === 'function') await p;
    } catch (_) {}
  }

  // ------- TRANSIÇÃO POR VÍDEO -------
  function getTransitionSrc(root, btn) {
    // prioridade: botão > section > default
    const fromBtn = btn?.dataset?.transitionSrc;
    const fromSection = root?.dataset?.transitionSrc;
    return (fromBtn && fromBtn.trim()) || (fromSection && fromSection.trim()) || DEFAULT_VIDEO_SRC;
  }

  async function waitForTransitionUnlock(timeoutMs = 20000) {
    if (!window.__TRANSITION_LOCK) return;
    let done = false;
    await Promise.race([
      new Promise(res => {
        const onEnd = () => { if (!done){ done = true; document.removeEventListener('transition:ended', onEnd); res(); } };
        document.addEventListener('transition:ended', onEnd, { once: true });
      }),
      new Promise(res => setTimeout(res, timeoutMs))
    ]);
  }

  function dispatchTransitionEvent(name, detail = {}) {
    document.dispatchEvent(new CustomEvent(`transition:${name}`, { detail }));
  }

  function safeCleanupMedia() {
    try { speechSynthesis?.cancel?.(); } catch {}
    try {
      qsa('video').forEach(v => { v.pause(); v.src = ''; v.load(); });
    } catch {}
  }

  function goToSection(nextId) {
    if (window.JC?.show) window.JC.show(nextId);
    else location.hash = `#${nextId}`;
  }

  function playTransition(root, btn, nextId = NEXT_SECTION_ID) {
    const src = getTransitionSrc(root, btn);

    // evita reentrância
    if (window.__TRANSITION_LOCK) return;
    window.__TRANSITION_LOCK = true;
    dispatchTransitionEvent('started', { src, nextId });

    safeCleanupMedia();

    if (typeof window.playTransitionVideo === 'function' && src) {
      try {
        window.playTransitionVideo(src, nextId);
      } catch (e) {
        console.warn('[TRANSITION] playTransitionVideo falhou, fallback direto:', e);
        window.__TRANSITION_LOCK = false;
        dispatchTransitionEvent('ended', { fallback: true });
        goToSection(nextId);
      }
    } else {
      // fallback sem player
      window.__TRANSITION_LOCK = false;
      dispatchTransitionEvent('ended', { noPlayer: true });
      goToSection(nextId);
    }
  }

  // ------- INIT SELFIE (base do seu arquivo) -------
  async function initSelfie(root) {
    // isola seção
    qsa('.j-section').forEach(section => {
      if (section.id !== SECTION_ID) {
        section.classList.add('hidden');
        section.style.display = 'none';
        section.setAttribute('aria-hidden', 'true');
      }
    });
    window.JC && (window.JC.currentSection = SECTION_ID);

    // aguarda transição anterior (se houver)
    await waitForTransitionUnlock();

    // nome (maiúsculas via sessionStorage como no seu fluxo)
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
      });
    }

    // datilografia + TTS
    const elements = qsa('[data-typing="true"]', root);
    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

    // upload de selfie (fluxo atual)
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
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // ações (preview / capture / skip / start)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#previewBtn, #captureBtn, #btnSkipSelfie, #btnStartJourney');
      if (!btn) return;
      e.preventDefault();

      const img = qs('#selfieImage', root);

      if (btn.id === 'previewBtn') {
        if (img?.src) window.toast?.('Pré-visualização atualizada!');
        else window.toast?.('Selecione uma imagem primeiro.');
      }

      if (btn.id === 'captureBtn') {
        if (!img?.src) {
          window.toast?.('Erro ao capturar imagem: selecione uma imagem válida.');
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 480;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const scale   = parseFloat(qs('#selfieScale', root)?.value || 1);
        const offsetX = parseFloat(qs('#selfieOffsetX', root)?.value || 0);
        const offsetY = parseFloat(qs('#selfieOffsetY', root)?.value || 0);

        ctx.save();
        ctx.translate(15 + offsetX, 35 + offsetY);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, 70, 90);
        ctx.restore();

        const dataURL = canvas.toDataURL('image/png');
        try { localStorage.setItem('JORNADA_SELFIE', dataURL); } catch (_) {}

        const link = document.createElement('a');
        link.download = 'selfie-irmandade.png';
        link.href = dataURL;
        link.click();

        const avancarBtn = qs('#btnStartJourney', root);
        if (avancarBtn) {
          avancarBtn.disabled = false;
          window.toast?.('Imagem capturada! Clique em Entrar na Jornada para continuar.');
        }
      }

      if (btn.id === 'btnSkipSelfie' || btn.id === 'btnStartJourney') {
        // encerra vozes/mídias e inicia transição
        playTransition(root, btn, NEXT_SECTION_ID);
      }
    });

    console.log(`[${MOD}] Bloco de captura e navegação carregado`);
  }

  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (id !== SECTION_ID) return;
    const root = e.detail.node;
    if (!root) return;
    initSelfie(root);
  });

  // se já estiver visível no load
  if (document.getElementById(SECTION_ID) && !document.getElementById(SECTION_ID).classList.contains('hidden')) {
    initSelfie(document.getElementById(SECTION_ID));
  }

  // listener opcional: quando o player terminar a transição, libera lock
  document.addEventListener('transitionVideo:ended', () => {
    window.__TRANSITION_LOCK = false;
    dispatchTransitionEvent('ended', { from: MOD });
  });
  
  console.log(`[${MOD}] carregado`);
})();

// === PATCH VISIBILIDADE + TEXTO + BOTOES ===
(function ensureSelfieReady(){
  const ROOT_ID = 'section-selfie';

  function show(el){ if(!el) return; el.classList.remove('hidden'); el.style.removeProperty('display'); el.setAttribute('aria-hidden','false'); }

  async function typeSafe(el, txt){
    if(!el) return;
    const msg = (txt || el.dataset?.text || el.textContent || '').trim();
    if(!msg) return;
    try{
      if(typeof window.runTyping === 'function'){
        await new Promise(res => window.runTyping(el, msg, res, { speed: Number(el.dataset.speed||34), cursor:true }));
      } else {
        el.textContent=''; let i=0, sp=Number(el.dataset.speed||34);
        await new Promise(res => { (function tick(){ if(i<msg.length){ el.textContent+=msg.charAt(i++); setTimeout(tick, sp);} else res(); })(); });
      }
      // TTS (opcional)
      try{ await window.EffectCoordinator?.speak?.(msg, { lang:'pt-BR', rate:1.05 }); }catch{}
    }catch(_){ el.textContent = msg; }
    el.classList.add('typing-done');
  }

  async function boot(){
    const root = document.getElementById(ROOT_ID);
    if(!root) return;

    // Seção visível
    show(root);

    // Cabeçalho + botão skip
    show(root.querySelector('.selfie-header'));
    show(root.querySelector('#btnSkipSelfie'));

    // Texto orientativo com NOME
    const nome = (window.JC?.data?.nome || sessionStorage.getItem('jornada.nome') || 'AMIGO(A)').toString().toUpperCase();
    const txtEl = root.querySelector('#selfieTexto');
    if(txtEl){
      txtEl.style.opacity = '1';
      const base = (txtEl.dataset?.text || '').replace(/\{\{\s*(NOME|nome|name)\s*\}\}/g, nome);
      await typeSafe(txtEl, base);
    }

    // Mostrar grid/câmera/controles
    ['.selfie-grid','.selfie-controls','.selfie-actions','.ranges','.selfie-preview-wrap']
      .forEach(sel => show(root.querySelector(sel)));
    ['#startCamBtn','#btn-selfie-preview','#btn-selfie-confirm','#btn-selfie-next']
      .forEach(sel => { const b = root.querySelector(sel); if(b) show(b); });

    // Se o script principal não rodou ainda, garante handlers mínimos:
    const startBtn  = root.querySelector('#startCamBtn');
    const prevBtn   = root.querySelector('#btn-selfie-preview');
    const confBtn   = root.querySelector('#btn-selfie-confirm');
    const nextBtn   = root.querySelector('#btn-selfie-next');
    const videoEl   = root.querySelector('#selfieVideo');
    const canvasEl  = root.querySelector('#selfieCanvas');
    const preview   = root.querySelector('#selfiePreview');

    // Habilita depois que a câmera iniciar
    if(startBtn && !startBtn.dataset._bind){
      startBtn.dataset._bind = '1';
      startBtn.addEventListener('click', async () => {
        try{
          const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:'user' }, audio:false });
          videoEl.srcObject = stream;
          await videoEl.play();
          prevBtn && (prevBtn.disabled = false);
          confBtn && (confBtn.disabled = false);
        }catch(e){
          console.warn('[Selfie] getUserMedia falhou:', e);
          const err = root.querySelector('#selfie-error'); if(err){ err.textContent='Não foi possível acessar a câmera.'; show(err); }
        }
      });
    }

    // Prévia simples (fallback)
    if(prevBtn && !prevBtn.dataset._bind){
      prevBtn.dataset._bind = '1';
      prevBtn.addEventListener('click', () => {
        if(!videoEl?.srcObject) return;
        const vw = videoEl.videoWidth||640, vh = videoEl.videoHeight||480;
        canvasEl.width = vw; canvasEl.height = vh;
        const ctx = canvasEl.getContext('2d'); ctx.drawImage(videoEl,0,0,vw,vh);
        const dataUrl = canvasEl.toDataURL('image/jpeg',0.9);
        if(preview){ preview.src = dataUrl; show(preview.closest('.selfie-preview-wrap')); }
        window.JC = window.JC || {}; window.JC.data = window.JC.data || {};
        window.JC.data.selfiePreview = dataUrl;
      });
    }

    // Confirmar
    if(confBtn && !confBtn.dataset._bind){
      confBtn.dataset._bind = '1';
      confBtn.addEventListener('click', ()=>{
        const dataUrl = window.JC?.data?.selfiePreview;
        if(!dataUrl){ window.toast?.('Gere uma prévia antes de confirmar.', 'warning'); return; }
        window.JC.data.selfie = dataUrl;
        nextBtn && (nextBtn.disabled = false);
        window.toast?.('Foto confirmada! Pode iniciar a próxima etapa.', 'success');
      });
    }
  }

  // Rodar quando a seção for mostrada e também como fallback no load
  document.addEventListener('section:shown', (e)=>{
    if(e?.detail?.sectionId === 'section-selfie') boot();
  });
  if(document.readyState !== 'loading'){
    const s = document.getElementById(ROOT_ID);
    if(s && !s.classList.contains('hidden')) boot();
  } else {
    document.addEventListener('DOMContentLoaded', ()=> {
      const s = document.getElementById(ROOT_ID);
      if(s && !s.classList.contains('hidden')) boot();
    }, { once:true });
  }
})();
