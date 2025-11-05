/ * /assets/js/section-card.js — VERSÃO FINAL CONSOLIDADA (CSS mask + guias.json + fallbacks + SYNC MOBILE) */
(function () {
'use strict';
const MOD = 'section-card.js';
// IDs aceitos para a seção
const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
// Navegação/fluxo
const NEXT_SECTION_ID = 'section-perguntas';
const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';
// Imagens fallback e placeholder
const CARD_BG = {
arian: '/assets/img/irmandade-quarteto-bg-arian.png',
lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
};
const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';
// Fonte preferencial de dados do guia
const GUIAS_JSON = '/assets/data/guias.json';
let GUIAS_CACHE = null;
// === SINCRONIZAÇÃO MOBILE ===
window.addEventListener('storage', (e) => {
if (e.key === 'jc.guia' || e.key === 'jc.nome' || e.key === 'jc.selfieDataUrl') {
console.log('%c[SYNC] Dados atualizados via storage!', 'color: cyan', e);
renderCard(); // RECARREGA O CARD
}
});
// Helpers de DOM
const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
// ---------- Utilitários ----------
async function waitForTransitionUnlock(timeoutMs = 12000) {
if (!window.__TRANSITION_LOCK) return;
let done = false;
const p = new Promise(res => {
const fn = () => { if (!done) { done = true; document.removeEventListener('transition:ended', fn); res(); } };
document.addEventListener('transition:ended', fn, { once: true });
});
const t = new Promise(res => setTimeout(res, timeoutMs));
await Promise.race([p, t]);
}
async function runTypingAndSpeak(el, text) {
if (!el || !text) return;
const speed = Number(el.dataset.speed || 40);
if (typeof window.runTyping === 'function') {
await new Promise(res => {
try { window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' }); }
catch { el.textContent = text; res(); }
});
} else {
el.textContent = text;
}
if (typeof window.speak === 'function') window.speak(text);
}
// === LEITURA FORÇADA DE DADOS ===
function getUserData() {
let nome = 'AMOR';
let guia = 'zion';
if (global.JC?.data) {
if (global.JC.data.nome) nome = global.JC.data.nome;
if (global.JC.data.guia) guia = global.JC.data.guia;
}
const lsNome = localStorage.getItem('jc.nome');
const lsGuia = localStorage.getItem('jc.guia');
if (lsNome) nome = lsNome;
if (lsGuia) guia = lsGuia;
const ssGuia = sessionStorage.getItem('jornada.guia');
if (ssGuia) guia = ssGuia;
nome = nome.toUpperCase().trim();
guia = guia.toLowerCase().trim();
global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
global.JC.data.nome = nome;
global.JC.data.guia = guia;
try {
localStorage.setItem('jc.nome', nome);
localStorage.setItem('jc.guia', guia);
sessionStorage.setItem('jornada.guia', guia);
} catch {}
return { nome, guia };
}
// =============================================
// CARD DO GUIA: FUNDO + NOME + FOTO + DADOS
// =============================================
async function renderCard(section) {
if (!section) return;
const { nome, guia } = getUserData();
// 1. FUNDO DO CARD
const guideBg = qs('#guideBg', section);
const stage = qs('.card-stage', section);
const bgUrl = CARD_BG[guia] || CARD_BG.zion;
if (guideBg) {
guideBg.src = bgUrl;
guideBg.addEventListener('load', () => guideBg.style.opacity = '1');
guideBg.addEventListener('error', () => guideBg.src = CARD_BG.zion);
} else if (stage) {
stage.style.backgroundImage = url('${bgUrl}');
stage.style.backgroundSize = 'cover';
stage.style.backgroundPosition = 'center';
}
// 2. NOME DO PARTICIPANTE
const userNameSlot = qs('#userNameSlot', section);
if (userNameSlot) userNameSlot.textContent = nome;
// 3. FOTO DA SELFIE (ou placeholder)
const flameSelfie = qs('#selfieImage', section);
const flameLayer = qs('.flame-layer', section);
const selfieUrl = global.JC?.data?.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl');
if (flameSelfie) {
flameSelfie.src = selfieUrl || PLACEHOLDER_SELFIE;
flameSelfie.addEventListener('load', () => {
flameLayer?.classList.add('show');
});
flameSelfie.addEventListener('error', () => {
flameSelfie.src = PLACEHOLDER_SELFIE;
flameLayer?.classList.add('show', 'placeholder-only');
});
}
// 4. NOME DO GUIA
const guideNameSlot = qs('#card-guia-nome', section);
if (guideNameSlot) {
const nomes = { arian: 'Arian', lumen: 'Lumen', zion: 'Zion' };
guideNameSlot.textContent = nomes[guia] || 'Guia';
}
// 5. FRASE DO GUIA (do JSON)
if (!GUIAS_CACHE) {
try {
const res = await fetch(GUIAS_JSON);
GUIAS_CACHE = await res.json();
} catch (e) {
console.warn('Falha ao carregar guias.json', e);
}
}
if (GUIAS_CACHE) {
const guiaData = GUIAS_CACHE[guia] || GUIAS_CACHE.zion;
const fraseEl = qs('#card-frase', section);
if (fraseEl && guiaData?.frase) {
fraseEl.textContent = "${guiaData.frase}";
}
}
console.log('%c[CARD] Renderizado:', 'color: gold; font-weight: bold', { nome, guia, bgUrl });
}
// === INIT ===
async function initCard(root) {
await renderCard(root);
// Espera transição e aplica datilografia/TTS
await waitForTransitionUnlock();
const typings = qsa('[data-typing="true"]', root);
for (const el of typings) {
const text = (el.dataset.text || el.textContent || '').trim();
await runTypingAndSpeak(el, text);
}
// Botão continuar
const btnNext = qs('#btnNext', root);
if (btnNext) {
btnNext.onclick = () => {
try { speechSynthesis.cancel(); } catch {}
qsa('video').forEach(v => { try { v.pause(); v.src=''; v.load(); } catch {} });
if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
} else {
window.JC?.show?.(NEXT_SECTION_ID);
}
};
}
console.log([${MOD}] Card exibido);
}
// ---------- ESCUTAS ----------
document.addEventListener('section:shown', (e) => {
const id = e.detail.sectionId;
if (!SECTION_IDS.includes(id)) return;
const root = e.detail.node || qs(#${id}) || qs('#jornada-content-wrapper') || document.body;
initCard(root);
});
// Fallback: se a seção já estiver visível sem evento
document.addEventListener('DOMContentLoaded', () => {
const visible = SECTION_IDS.map(id => qs(#${id})).find(el => el && (el.offsetParent !== null || el.style.display !== 'none'));
if (visible) initCard(visible);
});
// === FALLBACK VISUAL DE EMERGÊNCIA ===
document.addEventListener('DOMContentLoaded', async () => {
try {
const sec = qs('#section-card');
if (!sec) return;
sec.style.display = 'block';
sec.style.zIndex = '2';
sec.style.position = 'relative';
const sel = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
const bgUrl = CARD_BG[sel] || CARD_BG.zion;
let stage = qs('.card-stage', sec);
if (!stage) {
stage = document.createElement('div');
stage.className = 'card-stage';
stage.style.position = 'relative';
stage.style.minHeight = '66vw';
stage.style.background = #000 url("${bgUrl}") center/cover no-repeat;
sec.appendChild(stage);
console.warn('[section-card.js] stage recriado manualmente');
} else if (!stage.style.backgroundImage) {
stage.style.backgroundImage = url("${bgUrl}");
stage.style.backgroundSize = 'cover';
stage.style.backgroundPosition = 'center';
}
if (!stage.querySelector('.flame-layer')) {
const flame = document.createElement('div');
flame.className = 'flame-layer show';
flame.innerHTML = <img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}" alt="Selfie ou Placeholder">;
flame.style.position = 'absolute';
flame.style.left = '50%';
flame.style.bottom = '160px';
flame.style.transform = 'translateX(-50%)';
stage.appendChild(flame);
}
if (!stage.querySelector('.card-footer')) {
const foot = document.createElement('div');
foot.className = 'card-footer';
foot.innerHTML = <span class="card-name-badge"><span id="userNameSlot">USUÁRIO</span></span>;
foot.style.position = 'absolute';
foot.style.left = '50%';
foot.style.bottom = '72px';
foot.style.transform = 'translateX(-50%)';
stage.appendChild(foot);
}
console.log('[section-card.js] Fallback visual aplicado com sucesso.');
renderCard(sec);
} catch (err) {
console.error('[section-card.js] Fallback visual falhou', err);
}
});
console.log([${MOD}] carregado (CSS mask; guias.json; robusto; sync mobile));
})();
