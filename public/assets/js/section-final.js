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

function getJornadaState() {
  // 1) memória em runtime
  const s =
    window.JORNADA_STATE ||
    window.APP_STATE ||
    window.state ||
    window.JC_STATE ||
    (window.JC && window.JC.state) ||
    (window.JORNADA && window.JORNADA.state) ||
    null;

  if (s && typeof s === 'object') return s;

  // 2) LocalStorage (fallback real do projeto)
  try {
    const key = (window.APP_CONFIG && window.APP_CONFIG.STORAGE_KEY) || 'jornada_essencial_v1';
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('[FINAL][STATE] LocalStorage parse fail', e);
  }

  // 3) fallback
  return {};
}

function buildFinalPayloadDiamante() {
  const s = getJornadaState ? getJornadaState() : (window.JORNADA_STATE || window.state || {});
  console.log('[FINAL][STATE RAW]', s);

  const nome = String(s.nome || s.name || s.participantName || '').trim();
  const guia = String(s.guiaSelecionado || s.guia || s.guide || '').trim().toLowerCase();

  // tenta achar respostas em vários formatos
  let respostas =
    s.respostas ||
    s.answers ||
    s.perguntas ||
    s.responses ||
    s.respostasLista ||
    [];

  // ✅ aqui é o ponto crítico: só zera se NÃO for array
  if (!Array.isArray(respostas)) respostas = [];

  // normaliza strings
  respostas = respostas
    .map(r => String(r ?? '').trim())
    .filter(Boolean);

  const selfieCard = String(
    s.selfieBase64 ||
    s.selfieCard ||
    s.cardImage ||
    s.selfiecard ||
    ''
  ).trim();

  const payload = { nome, guia, respostas, selfieCard };
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
    // remove UI antiga (botão grande + 'agora não') se existir
    const legacy = root && root.querySelector ? root.querySelector('#finalPdfWrap') : null;
    if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);
    if (!root) return;

    // evita duplicar
    if (root.querySelector('#finalPdfStatus')) return;

    // tenta achar o "host" dentro do container final (onde ficam os botões)
    const host =
      root.querySelector('.final-acoes') ||
      root.querySelector('.j-perg-v-inner') ||
      root.querySelector('.j-panel') ||
      root.querySelector('.glass') ||
      root.querySelector('.content') ||
      root;

    // cria status logo ABAIXO dos botões (dentro do container)
    const status = document.createElement('div');
    status.id = 'finalPdfStatus';
    status.className = 'final-pdf-status';
    status.textContent = '✅ Você pode gerar o PDF agora, ou baixar depois.';

    // insere no lugar certo: após o bloco de botões, se existir
    if (host.classList && host.classList.contains('final-acoes') && host.parentNode) {
      host.parentNode.insertBefore(status, host.nextSibling);
    } else {
      host.appendChild(status);
    }

    // --------------------------------------------------
    // Descobre os dois botões já existentes no container
    // (PDF + SelfieCard)
    // --------------------------------------------------
    const actionsRoot = root.querySelector('.final-acoes') || host;

    const btns = Array.from(actionsRoot.querySelectorAll('button'));
    // tenta por data-action/id primeiro
    const btnPdf =
      actionsRoot.querySelector('[data-action="pdf"]') ||
      actionsRoot.querySelector('#btnPdf') ||
      actionsRoot.querySelector('#btnFinalPdf') ||
      btns[0] || null;

    const btnSelfie =
      actionsRoot.querySelector('[data-action="selfie"]') ||
      actionsRoot.querySelector('#btnSelfie') ||
      actionsRoot.querySelector('#btnFinalSelfie') ||
      btns[1] || null;

    // evita múltiplos binds
    if (btnPdf && btnPdf.dataset.pdfBound === '1') return;
    if (btnPdf) btnPdf.dataset.pdfBound = '1';
    if (btnSelfie) btnSelfie.dataset.selfieBound = '1';

    // helpers
    function setStatus(msg, kind) {
      // reaproveita função existente se houver
      if (typeof setPdfStatus === 'function') {
        setPdfStatus(root, msg, kind);
      } else {
        status.textContent = msg || '';
        status.classList.toggle('is-err', kind === 'err');
        status.classList.toggle('is-ok', kind === 'ok');
      }
    }

   // ----------------------------------------------------
// CLICK: PDF (gera + baixa)  ✅ com guard-rail + finally
// ----------------------------------------------------
if (btnPdf) {
  btnPdf.addEventListener('click', async (ev) => {
    ev.preventDefault();
    ev.stopPropagation();

    // API pronta?
    if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
      setStatus('✖ API não está pronta. Verifique se /assets/js/api.js carregou.', 'err');
      return;
    }

    // trava botões imediatamente
    btnPdf.disabled = true;
    if (btnSelfie) btnSelfie.disabled = true;

    let timer = null;

    try {
      const payload = buildFinalPayloadDiamante();
      console.log('[FINAL][PAYLOAD]', payload);

      // Guard-rail: nome e respostas
      if (!payload.nome || payload.nome.length < 2) {
        setStatus('⚠ Nome inválido. Volte e confirme o nome antes de gerar o PDF.', 'err');
        return;
      }
      if (!Array.isArray(payload.respostas) || payload.respostas.length === 0) {
        setStatus('⚠ Sem respostas. Finalize as perguntas antes de gerar o PDF.', 'err');
        return;
      }

      timer = startMagicDots(root, 'Forjando seu pergaminho…');

      const result = await window.API.gerarPDFEHQ(payload);

      if (result && result.ok) {
        setStatus('✅ Pergaminho gerado e baixado com sucesso!', 'ok');
      } else {
        setStatus('✖ Não consegui gerar o PDF. Veja o console para detalhes.', 'err');
        console.warn('[FINAL][PDF] result:', result);
      }
    } catch (e) {
      console.error('[FINAL][PDF] erro:', e);
      setStatus('✖ Erro ao gerar o PDF. Confira o console (Network/Console).', 'err');
    } finally {
      if (timer) clearInterval(timer);
      btnPdf.disabled = false;            // ✅ sempre volta
      if (btnSelfie) btnSelfie.disabled = false;
    }
  });
}


    // --------------------------------------------------
    // CLICK: SelfieCard (download local)
    // --------------------------------------------------
    if (btnSelfie) {
      btnSelfie.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const payload = buildFinalPayloadDiamante();
        console.log('[FINAL][PAYLOAD]', payload);
        const img = payload.selfieCard;

        if (!img || String(img).trim().length < 50) {
          setStatus('⚠️ SelfieCard ainda não está disponível neste momento.', 'err');
          return;
        }

        try {
          // aceita dataURL ou base64 puro
          let dataUrl = String(img).trim();
          if (!dataUrl.startsWith('data:image')) {
            dataUrl = 'data:image/png;base64,' + dataUrl.replace(/^base64,/, '');
          }

          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = (payload.nome ? payload.nome : 'selfiecard') + '-selfiecard.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setStatus('✅ SelfieCard baixado com sucesso!', 'ok');
        } catch (e) {
          console.error('[FINAL][SELFIE] erro:', e);
          setStatus('❌ Não consegui baixar a SelfieCard. Veja o console.', 'err');
        }
      });
    }
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

    const sec = document.getElementById(SECTION_ID);
    if (sec) {
      sec.style.display = 'block';
      mountFinalPdfUI(sec);
    }

    startFinalSequence();
  });
  // ============================================
// PDF: geração é acionada APENAS via botões da UI (mountFinalPdfUI)
// ============================================

})();
