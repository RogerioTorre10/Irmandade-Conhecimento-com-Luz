(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_ID = 'section-card';
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-card-dourado.mp4';

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

// helper: espera o vídeo acabar
async function waitForTransitionUnlock(timeoutMs = 15000) {
  if (!window.__TRANSITION_LOCK) return;
  let resolved = false;
  const p = new Promise(resolve => {
    const onEnd = () => { if (!resolved) { resolved = true; document.removeEventListener('transition:ended', onEnd); resolve(); } };
    document.addEventListener('transition:ended', onEnd, { once: true });
  });
  const t = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([p, t]); // não fica preso para sempre
}

// … dentro do initOnce(root) ANTES de começar a digitar:
await waitForTransitionUnlock();

// agora sim, rode a sequência:
// for (const el of items) await typeOnce(el, ...);

  
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
      await new Promise(resolve => {
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

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: 1.0 });
      if (p && typeof p.then === 'function') await p;
    } catch (_) {}
  }

  async function loadGuias() {
    try {
      const response = await fetch('/assets/data/guias.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error(`[${MOD}] Erro ao carregar guias:`, e);
      return [
        { id: 'zion', nome: 'Zion', bgImage: '/assets/img/irmandade-quarteto-bg-zion.png' },
        { id: 'lumen', nome: 'Lumen', bgImage: '/assets/img/irmandade-quarteto-bg-lumen.png' },
        { id: 'arian', nome: 'Arian', bgImage: '/assets/img/irmandade-quarteto-bg-arian.png' }
      ];
    }
  }

  async function initCard(root) {
    const nameInput = qs('#nameInput', root);
    const nameSlot = qs('#userNameSlot', root);
    const guideNameSlot = qs('#guideNameSlot', root);
    const guiaBg = qs('#guideBg', root);

    const saved = {
      nome: sessionStorage.getItem('jornada.nome') || 'USUÁRIO',
      guia: sessionStorage.getItem('jornada.guia') || 'zion'
    };

    if (nameInput) {
      nameInput.value = saved.nome.toUpperCase();
      nameInput.addEventListener('input', () => {
        const newName = nameInput.value.trim().toUpperCase();
        sessionStorage.setItem('jornada.nome', newName);
        if (nameSlot) nameSlot.textContent = newName || 'USUÁRIO';
      });
    }

    if (nameSlot) nameSlot.textContent = saved.nome.toUpperCase();
    if (guideNameSlot) guideNameSlot.textContent = saved.guia.toUpperCase();

    const guias = await loadGuias();
    const selectedGuia = guias.find(g => g.id === saved.guia.toLowerCase()) || guias[0];
    if (guiaBg && selectedGuia.bgImage) {
      guiaBg.src = selectedGuia.bgImage;
    }

    const elements = qsa('[data-typing="true"]', root);
   // --- Selfie vinda da seção anterior (section-selfie) ---
const selfieImg   = qs('#selfieImage', root);
const flameLayer  = qs('.flame-layer', root);
const nameSlot    = qs('#cardParticipantName', root);   // <span id="cardParticipantName"> no rodapé
const guideName   = qs('#cardGuideName', root);         // opcional, se tiver

    // Tenta pegar a selfie nas duas fontes que usamos no fluxo
 const selfieUrl =
  (window.JC?.data?.selfieDataUrl) ||
  localStorage.getItem('jc.selfieDataUrl') ||
  sessionStorage.getItem('jc.selfieDataUrl') ||
  '/assets/img/irmandade-card-placeholder.jpg'

 if (selfieImg) {
  selfieImg.setAttribute('href', selfieUrl);
  // Acende o glow da chama mesmo com placeholder (se preferir, só com selfie real)
  if (flameLayer) flameLayer.style.opacity = '1';
}

// Ajuste dos nomes (prioriza sessão e cai para JC.data)
const nomeUpper = (
  sessionStorage.getItem('jornada.nome') ||
  window.JC?.data?.nome ||
  'AMOR'
).toUpperCase();

if (nameSlot) nameSlot.textContent = nomeUpper;

// 3) Nome do guia (se tiver no layout do card)
const guiaUpper = (
  sessionStorage.getItem('jornada.guia') ||
  window.JC?.data?.guia ||
  'ZION'
).toUpperCase();

if (guideName) guideName.textContent = guiaUpper;

// 4) Marca que o CARD foi exibido (usaremos para bloquear a próxima seção)
window.JC = window.JC || {};
JC.flags = JC.flags || {};
JC.flags.cardShown = true;
    
// Garante o guia selecionado em caixa alta
const guiaSel = (sessionStorage.getItem('jornada.guia') || 'zion').toUpperCase();
if (guideNameSlot) guideNameSlot.textContent = guiaSel;

    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

const btn = qs('#btnStartJourney', root) || qs('#btnNext', root);
    if (btn) {
      btn.addEventListener('click', () => {
        speechSynthesis.cancel();
        qsa('video').forEach(video => {
          video.pause();
          video.src = '';
          video.load();
        });

       // onde você tem algo como:
btn.addEventListener('click', () => {
  // marque como visto/confirmado
  window.JC = window.JC || {};
  JC.flags = JC.flags || {};
  JC.flags.cardConfirmed = true;

  // segue sua lógica de transição:
  if (VideoTransicao?.play) {
    VideoTransicao.play({ src: '/assets/videos/filme-card-dourado.mp4', onEnd: () => goNext('section-perguntas') });
  } else {
    goNext('section-perguntas');
  }
});

        
        if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
          window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID);
        }
      });
    }

    console.log(`[${MOD}] Bloco de card carregado`);
  }

 // NO FINAL DO section-card.js, SUBSTITUA OS EVENT LISTENERS por:
document.addEventListener('section:shown', (e) => {
  const id = e.detail.sectionId;
  if (id !== SECTION_ID) return;
  console.log(`[CARD] Seção mostrada: ${id}`);
  const root = e.detail.node;
  if (root) initCard(root);
});

// NOVO: Listener mais agressivo
document.addEventListener('sectionLoaded', (e) => {
  const id = e.detail.sectionId;
  if (id === SECTION_ID) {
    console.log(`[CARD] Seção carregada: ${id}`);
    const root = e.detail.node || document.getElementById(id);
    if (root) initCard(root);
  }
});

// FORCE no DOM direto
const cardSection = document.getElementById(SECTION_ID);
if (cardSection) {
  cardSection.addEventListener('click', () => initCard(cardSection), { once: true });
}

  console.log(`[${MOD}] carregado`);
})();
