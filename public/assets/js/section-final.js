/* /assets/js/section-final.js — v5 (corrigido i18n/lang)
 * Página final da Jornada Essencial
 * - Datilografia + voz
 * - Botões de PDF/HQ
 * - Vídeo final de retorno ao portal usando player global
 */

(function () {
  'use strict';

  const SECTION_ID   = 'section-final';
  const HOME_URL     = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';
  const FINAL_MOVIE  = '/assets/videos/filme-5-fim-da-jornada.mp4';

  let started = false;

  // ================================
  // LANG helper (fallback safe)
  // ================================
  function getActiveLang() {
    const l1 = window.i18n?.currentLang;
    const l2 = sessionStorage.getItem('jornada.lang') || sessionStorage.getItem('i18n.lang');
    const l3 = localStorage.getItem('jc.lang') || localStorage.getItem('i18n.lang');
    const l4 = document.documentElement?.lang;
    return (l1 || l2 || l3 || l4 || 'pt-BR').toString().trim();
  }
// ============================================
// FINAL — PDF MÁGICO (COM BOTÃO OPCIONAL)
// ============================================

function ensureFinalPdfStyles() {
  if (document.getElementById('final-pdf-magic-style')) return;

  const css = `
  @keyframes finalPdfPulse {
    0%   { box-shadow: 0 0 0 rgba(255,215,80,.0), 0 0 14px rgba(255,215,80,.25); }
    50%  { box-shadow: 0 0 0 rgba(255,215,80,.0), 0 0 26px rgba(255,215,80,.55); }
    100% { box-shadow: 0 0 0 rgba(255,215,80,.0), 0 0 14px rgba(255,215,80,.25); }
  }

  .final-pdf-wrap {
    margin-top: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }

  .final-pdf-row {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }

  .final-pdf-btn {
    border: 1px solid rgba(255, 215, 80, .55);
    border-radius: 16px;
    padding: 10px 14px;
    min-width: 200px;
    cursor: pointer;
    animation: finalPdfPulse 1.6s ease-in-out infinite;
    letter-spacing: .5px;
  }

  .final-pdf-btn[disabled] {
    opacity: .6 !important;
    cursor: not-allowed !important;
    animation: none !important;
  }

  .final-pdf-skip {
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 16px;
    padding: 10px 14px;
    min-width: 200px;
    cursor: pointer;
    opacity: .9;
  }

  .final-pdf-status {
    width: min(520px, 92%);
    text-align: center;
    font-size: 14px;
    line-height: 1.25;
    opacity: .95;
    padding: 8px 10px;
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(0,0,0,.18);
    backdrop-filter: blur(4px);
  }

  .final-pdf-status.ok {
    border-color: rgba(120,255,170,.35);
    box-shadow: 0 0 18px rgba(120,255,170,.18);
  }

  .final-pdf-status.err {
    border-color: rgba(255,120,120,.35);
    box-shadow: 0 0 18px rgba(255,120,120,.18);
  }
  `;

  const style = document.createElement('style');
  style.id = 'final-pdf-magic-style';
  style.textContent = css;
  document.head.appendChild(style);
}

function buildFinalPayloadDiamante() {
  const s = getJornadaState();
  console.log('[FINAL][STATE RAW]', s);

  // ---------------------------
  // Nome
  // ---------------------------
  const nome = String(
    s.nome ??
    s.name ??
    s.participantName ??
    s.participante ??
    localStorage.getItem('JORNADA_NOME') ??
    ''
  ).trim();

  // ---------------------------
  // Guia (normaliza para id)
  // ---------------------------
  const rawGuia = String(
    s.guiaSelecionado ??
    s.guia ??
    s.guide ??
    s.guideId ??
    localStorage.getItem('JORNADA_GUIA') ??
    sessionStorage.getItem('jornada.guia') ??
    ''
  ).trim().toLowerCase();

  const guiaMap = {
    zion: { id: 'zion', nome: 'Zion' },
    lumen: { id: 'lumen', nome: 'Lumen' },
    arian: { id: 'arian', nome: 'Arian' },
    arion: { id: 'arion', nome: 'Arion' }
  };

  const guiaObj = guiaMap[rawGuia] || null;

  // Se veio algo inválido tipo "guia", tenta fallback de outras fontes
  let guiaId = guiaObj ? guiaObj.id : '';
  let guiaNome = guiaObj ? guiaObj.nome : '';

  if (!guiaId) {
    const fb = String(
      localStorage.getItem('jc.guia') ||
      localStorage.getItem('JC_GUIA') ||
      ''
    ).trim().toLowerCase();
    if (guiaMap[fb]) {
      guiaId = guiaMap[fb].id;
      guiaNome = guiaMap[fb].nome;
    }
  }

  // ---------------------------
  // Respostas (aceita array ou objeto {id: resposta})
  // ---------------------------
  let respostas =
    s.respostas ??
    s.answers ??
    s.perguntas ??
    s.responses ??
    s.questions ??
    s.respostasObj ??
    s.respostas_map ??
    null;

  if (respostas && typeof respostas === 'object' && !Array.isArray(respostas)) {
    // formato do wizard: { "q1": "texto", ... }
    respostas = Object.values(respostas);
  }

  if (!Array.isArray(respostas)) respostas = [];
  respostas = respostas
    .map(r => String(r ?? '').trim())
    .filter(Boolean);

  // ---------------------------
  // Selfie/Card (dataURL)
  // ---------------------------
  let selfieCard = String(
    s.selfieBase64 ??
    s.selfieCard ??
    s.cardImage ??
    localStorage.getItem('jc.selfieDataUrl') ??
    ''
  ).trim();

  // normaliza base64 "puro" para dataURL
  if (selfieCard && !/^data:image\//i.test(selfieCard) && /^[A-Za-z0-9+/=]+$/.test(selfieCard.slice(0, 120))) {
    selfieCard = 'data:image/png;base64,' + selfieCard;
  }

  const payload = {
    nome,
    guia: guiaNome || guiaId || '',
    guiaId: guiaId || rawGuia || '',
    respostas,
    selfieCard
  };

  console.log('[FINAL][PAYLOAD NORMALIZED]', payload);
  return payload;
}
function setPdfStatus(root, msg, kind) {
  const el = root.querySelector('#finalPdfStatus');
  if (!el) return;
  el.classList.remove('ok', 'err');
  if (kind) el.classList.add(kind);
  el.textContent = msg;
}

function startMagicDots(root, baseMsg) {
  let n = 0;
  const tick = () => {
    n = (n + 1) % 4;
    setPdfStatus(root, baseMsg + '.'.repeat(n), null);
  };
  tick();
  return setInterval(tick, 420);
}

function mountFinalPdfUI(root) {
  ensureFinalPdfStyles();
  if (!root || root.querySelector('#finalPdfWrap')) return;

  // tenta colocar dentro de um container “natural” da final, mas sem depender de selector perfeito
  const host =
    root.querySelector('.j-perg-v-inner') ||
    root.querySelector('.j-panel') ||
    root.querySelector('.glass') ||
    root.querySelector('.content') ||
    root;

  const wrap = document.createElement('div');
  wrap.id = 'finalPdfWrap';
  wrap.className = 'final-pdf-wrap';

  wrap.innerHTML = `
    <div class="final-pdf-row">
      <button id="finalBtnPdf" type="button" class="final-pdf-btn">📜 Gerar meu Pergaminho (PDF)</button>
      <button id="finalBtnSkipPdf" type="button" class="final-pdf-skip">Agora não</button>
    </div>
    <div id="finalPdfStatus" class="final-pdf-status">
      Você escolhe: gerar e baixar o PDF agora, ou deixar para depois.
    </div>
  `;

  host.appendChild(wrap);

  const btnPdf = wrap.querySelector('#finalBtnPdf');
  const btnSkip = wrap.querySelector('#finalBtnSkipPdf');

  btnSkip.addEventListener('click', () => {
    // não faz nada além de “encerrar” o convite
    setPdfStatus(root, 'Tudo certo ✅ Você pode baixar depois quando quiser.', 'ok');
    btnSkip.disabled = true;
  });

  btnPdf.addEventListener('click', async () => {
    if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
      setPdfStatus(root, '❌ API não está pronta ainda. Verifique se /assets/js/api.js carregou.', 'err');
      return;
    }

    const payload = buildFinalPayloadDiamante();

    if (!payload.nome || payload.nome.length < 2) {
      setPdfStatus(root, '⚠️ Nome inválido. Volte e confirme o nome antes de gerar o PDF.', 'err');
      return;
    }

    if (!payload.respostas || payload.respostas.length === 0) {
      setPdfStatus(root, '⚠️ Ainda não há respostas registradas para gerar o PDF.', 'err');
      return;
    }

    btnPdf.disabled = true;
    btnSkip.disabled = true;

    const timer = startMagicDots(root, 'Forjando seu pergaminho');

    try {
      const result = await window.API.gerarPDFEHQ(payload);
      clearInterval(timer);

      if (result && result.ok) {
        setPdfStatus(root, '✅ Pergaminho gerado e baixado com sucesso!', 'ok');
      } else {
        setPdfStatus(root, '❌ Não consegui gerar o PDF. Veja o console para detalhes.', 'err');
        console.warn('[FINAL][PDF] result:', result);
        btnPdf.disabled = false;
        btnSkip.disabled = false;
      }
    } catch (e) {
      clearInterval(timer);
      console.error('[FINAL][PDF] erro:', e);
      setPdfStatus(root, '❌ Erro ao gerar o PDF. Confira o console (Network/Console).', 'err');
      btnPdf.disabled = false;
      btnSkip.disabled = false;
    }
  });
}


  // Utilitário de pausa
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Fila de fala: garante que um parágrafo termina antes do outro
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!('speechSynthesis' in window) || !text) return Promise.resolve();

    speechChain = speechChain.then(() => new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang   = getActiveLang(); // ✅ idioma ativo
      utter.rate   = 0.9;
      utter.pitch  = 1;
      utter.volume = 0.9;
      utter.onend  = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    }));

    return speechChain;
  }

  async function typeText(el, text, delay = 55, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.style.opacity = '1';
    el.classList.add('typing-active');

    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(delay);
      }
    }

    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await sleep(200);
  }

  function ensureFinalDOM() {
    const section = document.getElementById(SECTION_ID);
    if (!section) return {};

    const titleEl   = section.querySelector('#final-title');
    const msgEl     = section.querySelector('#final-message');
    const botoes    = section.querySelector('.final-acoes');

    return { section, titleEl, msgEl, botoes };
  }

  // ------------------------ SEQUÊNCIA FINAL ------------------------
  async function startFinalSequence() {
    if (started) return;
    started = true;

    try { speechSynthesis.cancel(); } catch (e) {}
    speechChain = Promise.resolve();

    const { section, titleEl, msgEl, botoes } = ensureFinalDOM();
    if (!section || !titleEl || !msgEl) return;

    // Garante que a seção esteja visível
    section.style.display = 'block';

    const tituloOriginal =
      titleEl.dataset.original ||
      titleEl.textContent.trim() ||
      'Gratidão por Caminhar com Luz';

    titleEl.dataset.original = tituloOriginal;
    titleEl.textContent = '';
    titleEl.style.opacity = 0;
    titleEl.style.transform = 'translateY(-16px)';

    const ps = msgEl.querySelectorAll('p');
    ps.forEach(p => {
      const txt = p.dataset.original || p.textContent.trim();
      p.dataset.original = txt;
      p.textContent = '';
      p.style.opacity = 0;
      p.style.transform = 'translateY(10px)';
      p.classList.remove('revealed');
    });

    section.classList.add('show');
    await sleep(200);

    // TÍTULO
    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = 1;
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    // PARÁGRAFOS (um por vez)
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const txt = p.dataset.original || '';
      if (!txt) continue;

      p.style.transition = 'all 0.8s ease';
      p.style.opacity = 1;
      p.style.transform = 'translateY(0)';
      // eslint-disable-next-line no-await-in-loop
      await typeText(p, txt, 55, true);
      p.classList.add('revealed');
      // eslint-disable-next-line no-await-in-loop
      await sleep(300);
    }

    // BOTÕES
    if (botoes) {
      botoes.style.opacity = '0';
      botoes.style.transform = 'scale(0.9)';
      botoes.style.transition = 'all 0.8s ease';
      botoes.style.pointerEvents = 'none';

      await sleep(400);

      botoes.classList.add('show');
      botoes.style.opacity = '1';
      botoes.style.transform = 'scale(1)';

      botoes.querySelectorAll('button, a').forEach(el => {
        el.disabled = false;
        el.classList.remove('disabled');
        el.removeAttribute('aria-disabled');
        el.style.pointerEvents = 'auto';
      });
    }

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  // ------------------------ PDF / HQ ------------------------
  async function generateArtifacts() {
    const langNow = getActiveLang(); // ✅ pega idioma 1x

    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.textContent;
    btn.textContent = 'Gerando sua Jornada...';
    btn.disabled = true;

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: window.JornadaAnswers || window.__QA_ANSWERS__ || { teste: 'finalizado' },
          meta: window.__QA_META__ || { finishedAt: new Date().toISOString() },
          lang: langNow // ✅ idioma ativo
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
      if (!data.pdfUrl && !data.hqUrl) {
        alert('Jornada concluída! PDF/HQ em breve disponível.');
      }
    } catch (e) {
      console.error('[FINAL] Erro ao gerar PDF/HQ:', e);
      alert('Erro temporário. Tente novamente em alguns instantes.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // ------------------------ VÍDEO DE SAÍDA ------------------------
  let finalReturning = false;

  function handleVoltarInicio() {
    if (finalReturning) {
      console.log('[FINAL] Voltar ao Início já em andamento, ignorando clique extra.');
      return;
    }
    finalReturning = true;

    console.log('[FINAL] Voltar ao Início acionado.');

    const src = FINAL_MOVIE;

    // Player cinematográfico global
    if (typeof window.playVideo === 'function') {
      window.playVideo(src, {
        useGoldBorder: true,
        pulse: true,
        onEnded: () => {
          console.log('[FINAL] Vídeo final concluído, redirecionando para portal...');
          window.location.href = HOME_URL;
        }
      });
      return;
    }

    // Fallback: usa playTransitionVideo se existir
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, null);
      setTimeout(() => {
        window.location.href = HOME_URL;
      }, 16000);
      return;
    }

    // Fallback bruto: sem vídeo
    window.location.href = HOME_URL;
  }

  // ------------------------ EVENTOS ------------------------

  // Quando o JC disser que a section-final foi mostrada
  document.addEventListener('section:shown', e => {
    const id = e.detail?.sectionId || e.detail;
    if (id !== SECTION_ID) return;

    console.log('[FINAL] section:shown recebido para section-final, iniciando sequência...');
    mountFinalPdfUI(root);

    const sec = document.getElementById(SECTION_ID);
    if (sec) sec.style.display = 'block';

    startFinalSequence();
  });
  // ============================================
// GERA PDF FINAL DA JORNADA


  // Clicks nos botões
  document.addEventListener('click', e => {
    const t = e.target;

    if (t.id === 'btnBaixarPDFHQ' || t.closest('#btnBaixarPDFHQ')) {
      e.preventDefault();
      generateArtifacts();
      return;
    }

    if (t.id === 'btnVoltarInicio' || t.closest('#btnVoltarInicio')) {
      e.preventDefault();
      handleVoltarInicio();
    }
  });

  // Fallback: se a página carregar já com a final visível (debug etc.)
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (!sec) return;

    const visible = sec.classList.contains('show') ||
                    getComputedStyle(sec).display !== 'none';

    if (visible) startFinalSequence();
  });

  /* =========================================================
   TEMA DO GUIA — reaplica em qualquer seção quando necessário
   ========================================================= */
  (function () {
    'use strict';

    function applyThemeFromSession() {
      const guiaRaw = sessionStorage.getItem('jornada.guia');
      const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : '';

      // fallback dourado
      let main = '#ffd700', g1 = 'rgba(255,230,180,0.85)', g2 = 'rgba(255,210,120,0.75)';

      if (guia === 'lumen') { main = '#00ff9d'; g1 = 'rgba(0,255,157,0.90)'; g2 = 'rgba(120,255,200,0.70)'; }
      if (guia === 'zion')  { main = '#00aaff'; g1 = 'rgba(0,170,255,0.90)'; g2 = 'rgba(255,214,91,0.70)'; }
      if (guia === 'arian') { main = '#ff00ff'; g1 = 'rgba(255,120,255,0.95)'; g2 = 'rgba(255,180,255,0.80)'; }

      document.documentElement.style.setProperty('--theme-main-color', main);
      document.documentElement.style.setProperty('--progress-main', main);
      document.documentElement.style.setProperty('--progress-glow-1', g1);
      document.documentElement.style.setProperty('--progress-glow-2', g2);
      document.documentElement.style.setProperty('--guide-color', main);

      if (guia) document.body.setAttribute('data-guia', guia);
    }

    document.addEventListener('DOMContentLoaded', applyThemeFromSession);
    document.addEventListener('sectionLoaded', () => setTimeout(applyThemeFromSession, 50));
    document.addEventListener('guia:changed', applyThemeFromSession);
  })();

})();function getJornadaState() {
  // Estado pode estar espalhado (globals + storage). Vamos compor com robustez.
  const out = {};

  // ---------- 0) JSTATE (wizard) ----------
  try {
    if (window.JSTATE && typeof window.JSTATE.load === 'function') {
      const st = window.JSTATE.load();
      if (st && typeof st === 'object') Object.assign(out, st);
    }
  } catch {}

  // ---------- 1) globals conhecidos ----------
  const g =
    window.JORNADA_STATE ||
    window.state ||
    window.JC_STATE ||
    window.__JORNADA_STATE__ ||
    (window.JC && window.JC.data) ||
    null;

  if (g && typeof g === 'object') Object.assign(out, g);

  // ---------- 2) localStorage: chaves simples usadas pelo projeto ----------
  try {
    const nomeLS = localStorage.getItem('JORNADA_NOME');
    const guiaLS = localStorage.getItem('JORNADA_GUIA');

    if (nomeLS && !out.nome) out.nome = nomeLS;
    if (guiaLS && !(out.guiaSelecionado || out.guia)) out.guiaSelecionado = guiaLS;
  } catch {}

  // ---------- 3) localStorage: blob principal (APP_CONFIG.STORAGE_KEY) ----------
  try {
    const storageKey = (window.APP_CONFIG && window.APP_CONFIG.STORAGE_KEY) ? window.APP_CONFIG.STORAGE_KEY : '';
    if (storageKey) {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') Object.assign(out, parsed);
      }
    }
  } catch {}

  // ---------- 4) localStorage: varredura para achar respostas/selfie se estiverem em outra chave ----------
  try {
    let bestAnswers = null;
    let bestLen = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!/jornada|essencial|respost|answer|pergunt|card|selfie|jc/i.test(k)) continue;

      const raw = localStorage.getItem(k);
      if (!raw) continue;

      let parsed = null;
      if (raw[0] === '{' || raw[0] === '[') {
        try { parsed = JSON.parse(raw); } catch {}
      }
      if (!parsed) continue;

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (!out.nome && parsed.nome) out.nome = parsed.nome;
        if (!(out.guiaSelecionado || out.guia) && (parsed.guiaSelecionado || parsed.guia)) out.guiaSelecionado = parsed.guiaSelecionado || parsed.guia;

        if (!out.selfieBase64 && (parsed.selfieBase64 || parsed.selfieCard || parsed.cardImage)) {
          out.selfieBase64 = parsed.selfieBase64 || parsed.selfieCard || parsed.cardImage;
        }

        const cand = parsed.respostas || parsed.answers || parsed.responses || parsed.perguntas || parsed.questions;
        if (Array.isArray(cand) && cand.length > bestLen) {
          bestLen = cand.length;
          bestAnswers = cand;
        }
      }

      if (Array.isArray(parsed) && parsed.length > bestLen) {
        bestLen = parsed.length;
        bestAnswers = parsed;
      }
    }

    if (bestAnswers && !out.respostas) out.respostas = bestAnswers;
  } catch {}

  // ---------- 5) selfieCard em chaves diretas ----------
  try {
    const directSelfieKeys = [
      'jc.selfieDataUrl',
      'JORNADA_SELFIECARD',
      'SELFIE_CARD',
      'SELFIE_BASE64',
      'CARD_IMAGE',
      'JORNADA_CARD',
      'JORNADA_CARD_BASE64'
    ];
    for (const k of directSelfieKeys) {
      const v = localStorage.getItem(k);
      if (v && !out.selfieBase64) {
        out.selfieBase64 = v;
        break;
      }
    }
  } catch {}

  return out;
}
function buildFinalPayloadDiamante() {
  const state = window.JORNADA_STATE || window.state || {};

  const nome = String(state.nome || '').trim();
  const guia = String(state.guiaSelecionado || state.guia || '').trim().toLowerCase();

  let respostas = state.respostas || [];
  if (!Array.isArray(respostas)) respostas = [];

  respostas = respostas
    .map(r => String(r || '').trim())
    .filter(Boolean);

  const selfieCard = state.selfieBase64 || state.selfieCard || '';

  return { nome, guia, respostas, selfieCard };
}

function setPdfStatus(root, msg, kind) {
  const el = root.querySelector('#finalPdfStatus');
  if (!el) return;
  el.classList.remove('ok', 'err');
  if (kind) el.classList.add(kind);
  el.textContent = msg;
}

function startMagicDots(root, baseMsg) {
  let n = 0;
  const tick = () => {
    n = (n + 1) % 4;
    setPdfStatus(root, baseMsg + '.'.repeat(n), null);
  };
  tick();
  return setInterval(tick, 420);
}

function mountFinalPdfUI(root) {
  ensureFinalPdfStyles();
  if (!root || root.querySelector('#finalPdfWrap')) return;

  // tenta colocar dentro de um container “natural” da final, mas sem depender de selector perfeito
  const host =
    root.querySelector('.j-perg-v-inner') ||
    root.querySelector('.j-panel') ||
    root.querySelector('.glass') ||
    root.querySelector('.content') ||
    root;

  const wrap = document.createElement('div');
  wrap.id = 'finalPdfWrap';
  wrap.className = 'final-pdf-wrap';

  wrap.innerHTML = `
    <div class="final-pdf-row">
      <button id="finalBtnPdf" type="button" class="final-pdf-btn">📜 Gerar meu Pergaminho (PDF)</button>
      <button id="finalBtnSkipPdf" type="button" class="final-pdf-skip">Agora não</button>
    </div>
    <div id="finalPdfStatus" class="final-pdf-status">
      Você escolhe: gerar e baixar o PDF agora, ou deixar para depois.
    </div>
  `;

  host.appendChild(wrap);

  const btnPdf = wrap.querySelector('#finalBtnPdf');
  const btnSkip = wrap.querySelector('#finalBtnSkipPdf');

  btnSkip.addEventListener('click', () => {
    // não faz nada além de “encerrar” o convite
    setPdfStatus(root, 'Tudo certo ✅ Você pode baixar depois quando quiser.', 'ok');
    btnSkip.disabled = true;
  });

  btnPdf.addEventListener('click', async () => {
    if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
      setPdfStatus(root, '❌ API não está pronta ainda. Verifique se /assets/js/api.js carregou.', 'err');
      return;
    }

    const payload = buildFinalPayloadDiamante();

    if (!payload.nome || payload.nome.length < 2) {
      setPdfStatus(root, '⚠️ Nome inválido. Volte e confirme o nome antes de gerar o PDF.', 'err');
      return;
    }

    if (!payload.respostas || payload.respostas.length === 0) {
      setPdfStatus(root, '⚠️ Ainda não há respostas registradas para gerar o PDF.', 'err');
      return;
    }

    btnPdf.disabled = true;
    btnSkip.disabled = true;

    const timer = startMagicDots(root, 'Forjando seu pergaminho');

    try {
      const result = await window.API.gerarPDFEHQ(payload);
      clearInterval(timer);

      if (result && result.ok) {
        setPdfStatus(root, '✅ Pergaminho gerado e baixado com sucesso!', 'ok');
      } else {
        setPdfStatus(root, '❌ Não consegui gerar o PDF. Veja o console para detalhes.', 'err');
        console.warn('[FINAL][PDF] result:', result);
        btnPdf.disabled = false;
        btnSkip.disabled = false;
      }
    } catch (e) {
      clearInterval(timer);
      console.error('[FINAL][PDF] erro:', e);
      setPdfStatus(root, '❌ Erro ao gerar o PDF. Confira o console (Network/Console).', 'err');
      btnPdf.disabled = false;
      btnSkip.disabled = false;
    }
  });
}


  // Utilitário de pausa
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Fila de fala: garante que um parágrafo termina antes do outro
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!('speechSynthesis' in window) || !text) return Promise.resolve();

    speechChain = speechChain.then(() => new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang   = getActiveLang(); // ✅ idioma ativo
      utter.rate   = 0.9;
      utter.pitch  = 1;
      utter.volume = 0.9;
      utter.onend  = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    }));

    return speechChain;
  }

  async function typeText(el, text, delay = 55, withVoice = false) {
    if (!el || !text) return;
    el.textContent = '';
    el.style.opacity = '1';
    el.classList.add('typing-active');

    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(delay);
      }
    }

    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await sleep(200);
  }

  function ensureFinalDOM() {
    const section = document.getElementById(SECTION_ID);
    if (!section) return {};

    const titleEl   = section.querySelector('#final-title');
    const msgEl     = section.querySelector('#final-message');
    const botoes    = section.querySelector('.final-acoes');

    return { section, titleEl, msgEl, botoes };
  }

  // ------------------------ SEQUÊNCIA FINAL ------------------------
  async function startFinalSequence() {
    if (started) return;
    started = true;

    try { speechSynthesis.cancel(); } catch (e) {}
    speechChain = Promise.resolve();

    const { section, titleEl, msgEl, botoes } = ensureFinalDOM();
    if (!section || !titleEl || !msgEl) return;

    // Garante que a seção esteja visível
    section.style.display = 'block';

    const tituloOriginal =
      titleEl.dataset.original ||
      titleEl.textContent.trim() ||
      'Gratidão por Caminhar com Luz';

    titleEl.dataset.original = tituloOriginal;
    titleEl.textContent = '';
    titleEl.style.opacity = 0;
    titleEl.style.transform = 'translateY(-16px)';

    const ps = msgEl.querySelectorAll('p');
    ps.forEach(p => {
      const txt = p.dataset.original || p.textContent.trim();
      p.dataset.original = txt;
      p.textContent = '';
      p.style.opacity = 0;
      p.style.transform = 'translateY(10px)';
      p.classList.remove('revealed');
    });

    section.classList.add('show');
    await sleep(200);

    // TÍTULO
    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = 1;
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    // PARÁGRAFOS (um por vez)
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const txt = p.dataset.original || '';
      if (!txt) continue;

      p.style.transition = 'all 0.8s ease';
      p.style.opacity = 1;
      p.style.transform = 'translateY(0)';
      // eslint-disable-next-line no-await-in-loop
      await typeText(p, txt, 55, true);
      p.classList.add('revealed');
      // eslint-disable-next-line no-await-in-loop
      await sleep(300);
    }

    // BOTÕES
    if (botoes) {
      botoes.style.opacity = '0';
      botoes.style.transform = 'scale(0.9)';
      botoes.style.transition = 'all 0.8s ease';
      botoes.style.pointerEvents = 'none';

      await sleep(400);

      botoes.classList.add('show');
      botoes.style.opacity = '1';
      botoes.style.transform = 'scale(1)';

      botoes.querySelectorAll('button, a').forEach(el => {
        el.disabled = false;
        el.classList.remove('disabled');
        el.removeAttribute('aria-disabled');
        el.style.pointerEvents = 'auto';
      });
    }

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  // ------------------------ PDF / HQ ------------------------
  async function generateArtifacts() {
    const langNow = getActiveLang(); // ✅ pega idioma 1x

    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.textContent;
    btn.textContent = 'Gerando sua Jornada...';
    btn.disabled = true;

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: window.JornadaAnswers || window.__QA_ANSWERS__ || { teste: 'finalizado' },
          meta: window.__QA_META__ || { finishedAt: new Date().toISOString() },
          lang: langNow // ✅ idioma ativo
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
      if (!data.pdfUrl && !data.hqUrl) {
        alert('Jornada concluída! PDF/HQ em breve disponível.');
      }
    } catch (e) {
      console.error('[FINAL] Erro ao gerar PDF/HQ:', e);
      alert('Erro temporário. Tente novamente em alguns instantes.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // ------------------------ VÍDEO DE SAÍDA ------------------------
  let finalReturning = false;

  function handleVoltarInicio() {
    if (finalReturning) {
      console.log('[FINAL] Voltar ao Início já em andamento, ignorando clique extra.');
      return;
    }
    finalReturning = true;

    console.log('[FINAL] Voltar ao Início acionado.');

    const src = FINAL_MOVIE;

    // Player cinematográfico global
    if (typeof window.playVideo === 'function') {
      window.playVideo(src, {
        useGoldBorder: true,
        pulse: true,
        onEnded: () => {
          console.log('[FINAL] Vídeo final concluído, redirecionando para portal...');
          window.location.href = HOME_URL;
        }
      });
      return;
    }

    // Fallback: usa playTransitionVideo se existir
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, null);
      setTimeout(() => {
        window.location.href = HOME_URL;
      }, 16000);
      return;
    }

    // Fallback bruto: sem vídeo
    window.location.href = HOME_URL;
  }

  // ------------------------ EVENTOS ------------------------

  // Quando o JC disser que a section-final foi mostrada
  document.addEventListener('section:shown', e => {
    const id = e.detail?.sectionId || e.detail;
    if (id !== SECTION_ID) return;

    console.log('[FINAL] section:shown recebido para section-final, iniciando sequência...');
    mountFinalPdfUI(root);

    const sec = document.getElementById(SECTION_ID);
    if (sec) sec.style.display = 'block';

    startFinalSequence();
  });
  // ============================================
// GERA PDF FINAL DA JORNADA
// ============================================

try {
  console.log('[FINAL] Preparando payload para PDF...');

  const payload = buildFinalPayload();

  console.log('[FINAL] Payload:', payload);

  const result = await API.gerarPDFEHQ(payload);

  console.log('[FINAL] Resultado PDF:', result);

  if (!result.ok) {
    console.warn('[FINAL] Falha ao gerar PDF:', result.error);
  }

} catch (err) {
  console.error('[FINAL] Erro ao gerar PDF:', err);
}


  // Clicks nos botões
  document.addEventListener('click', e => {
    const t = e.target;

    if (t.id === 'btnBaixarPDFHQ' || t.closest('#btnBaixarPDFHQ')) {
      e.preventDefault();
      generateArtifacts();
      return;
    }

    if (t.id === 'btnVoltarInicio' || t.closest('#btnVoltarInicio')) {
      e.preventDefault();
      handleVoltarInicio();
    }
  });

  // Fallback: se a página carregar já com a final visível (debug etc.)
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (!sec) return;

    const visible = sec.classList.contains('show') ||
                    getComputedStyle(sec).display !== 'none';

    if (visible) startFinalSequence();
  });

  /* =========================================================
   TEMA DO GUIA — reaplica em qualquer seção quando necessário
   ========================================================= */
  (function () {
    'use strict';

    function applyThemeFromSession() {
      const guiaRaw = sessionStorage.getItem('jornada.guia');
      const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : '';

      // fallback dourado
      let main = '#ffd700', g1 = 'rgba(255,230,180,0.85)', g2 = 'rgba(255,210,120,0.75)';

      if (guia === 'lumen') { main = '#00ff9d'; g1 = 'rgba(0,255,157,0.90)'; g2 = 'rgba(120,255,200,0.70)'; }
      if (guia === 'zion')  { main = '#00aaff'; g1 = 'rgba(0,170,255,0.90)'; g2 = 'rgba(255,214,91,0.70)'; }
      if (guia === 'arian') { main = '#ff00ff'; g1 = 'rgba(255,120,255,0.95)'; g2 = 'rgba(255,180,255,0.80)'; }

      document.documentElement.style.setProperty('--theme-main-color', main);
      document.documentElement.style.setProperty('--progress-main', main);
      document.documentElement.style.setProperty('--progress-glow-1', g1);
      document.documentElement.style.setProperty('--progress-glow-2', g2);
      document.documentElement.style.setProperty('--guide-color', main);

      if (guia) document.body.setAttribute('data-guia', guia);
    }

    document.addEventListener('DOMContentLoaded', applyThemeFromSession);
    document.addEventListener('sectionLoaded', () => setTimeout(applyThemeFromSession, 50));
    document.addEventListener('guia:changed', applyThemeFromSession);
  })();

})();
