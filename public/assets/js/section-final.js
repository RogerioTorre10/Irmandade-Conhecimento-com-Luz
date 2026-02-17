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
  
// ================================
// STATE (compat) — evita "state is not defined"
// ================================
function getJornadaState() {
  // 1) se você já tem um state global com outro nome
  if (window.JORNADA_STATE) return window.JORNADA_STATE;
  if (window.STATE) return window.STATE;

  // 2) se existe um controller/namespace
  if (window.JC && window.JC.state) return window.JC.state;
  if (window.JORNADA && window.JORNADA.state) return window.JORNADA.state;

  // 3) fallback: tenta localStorage (padrão do seu config.js)
  try {
    const key = (window.APP_CONFIG && window.APP_CONFIG.STORAGE_KEY) || 'jornada_essencial_v1';
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}

  // 4) fallback final
  return {};
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
    // após revelar botões padrão, injeta UI do PDF mágico
    const root = document.getElementById(SECTION_ID);
    if (root) mountFinalPdfUI(root);

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

  const root = document.getElementById(SECTION_ID);
  if (!root) return;

  mountFinalPdfUI(root);

    const sec = document.getElementById(SECTION_ID);
    if (sec) sec.style.display = 'block';

    startFinalSequence();
   // garante que typing + TTS iniciem sempre
    setTimeout(startFinalSequence, 150);
  }); 

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
