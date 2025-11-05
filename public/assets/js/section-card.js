(function (global) {
'use strict';


const MOD = 'section-card.js';
const NS = (global.JCCard = global.JCCard || {});
if (NS.__bound) return; // evita duplo-bind
NS.__bound = true;


// ====== Config ======
const DEFAULT_NEXT_SECTION_ID = 'section-perguntas';


// Ajuste os caminhos conforme seu /assets/img/
const CARD_BG = {
arian: '/assets/img/irmandade-quarteto-bg-arian.png',
lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
};


// Placeholder quando não houver selfie do participante
const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';


// ====== Utils ======
const d = document;
const qs = (sel, root = d) => root.querySelector(sel);
const qid = (id) => d.getElementById(id);
const on = (el, evt, fn, opt) => el && el.addEventListener(evt, fn, opt);


function pickGuideBg(guia) {
return CARD_BG[guia] || `/assets/img/bg-${guia}.jpg`;
}


function getUserData() {
const jc = (global.JC && global.JC.data) ? global.JC.data : {};


let guia = jc.guia || sessionStorage.getItem('jornada.guia') || 'lumen';
let nome = jc.nome || jc.participantName || localStorage.getItem('jc.nome') || 'USUÁRIO';
let selfieDataUrl = jc.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl') || null;


guia = String(guia || 'lumen').toLowerCase().trim();
nome = String(nome || 'USUÁRIO').toUpperCase().trim();


return { guia, nome, selfieDataUrl };
}
// === NAVEGAÇÃO ===
  function resolveGoNext() {
    return (nextId = DEFAULT_NEXT_SECTION_ID) => {
      try { speechSynthesis.cancel(); } catch {}
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo('/assets/videos/filme-0-ao-encontro-da-jornada.mp4', nextId);
      } else if (window.JC?.show) {
        window.JC.show(nextId, { force: true });
      }
    };
  }

function resolveGoNext() {
// Preferência: transição com vídeo, depois controlador da jornada, depois hash simples
if (typeof global.playTransitionThenGo === 'function') {
return (nextId = DEFAULT_NEXT_SECTION_ID) => global.playTransitionThenGo(nextId);
}
if (global.JC && typeof global.JC.go === 'function') {
return (nextId = DEFAULT_NEXT_SECTION_ID) => global.JC.go(nextId);
}
return (nextId = DEFAULT_NEXT_SECTION_ID) => {
try { location.hash = `#${nextId}`; } catch {}
console.log(`[${MOD}] Avançar (fallback hash) →`, nextId);
};
}


// ====== Estrutura mínima (fallback) ======
function ensureCardStructure() {
// Encontra ou cria a seção
const section =
qs('#section-card') ||
qs('#section-eu-na-irmandade') ||
(function () {
const wrap = qs('#jornada-content-wrapper') || d.body;
const sec = d.createElement('section');
sec.id = 'section-card';
sec.className = 'card pergaminho pergaminho-v section';
wrap.appendChild(sec);
return sec;
})();


})(window);
