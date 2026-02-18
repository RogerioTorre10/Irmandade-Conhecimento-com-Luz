/* /assets/js/section-final.js — v6 (Diamante + PDF/SelfieCard)
 * Página final da Jornada Essencial
 * - Datilografia + voz (mantido)
 * - Botões existentes (PDF + SelfieCard) com feedback mágico
 * - Payload diamante robusto (pega nome/guia/respostas/selfieCard de onde existir)
 * - Remove legado /api/jornada/finalizar (404)
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
      margin-top: 10px;
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

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safeParseJSON(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function getStorageKey() {
    return (
      window.APP_CONFIG?.STORAGE_KEY ||
      window.JORNADA_CFG?.STORAGE_KEY ||
      window.CONFIG?.STORAGE_KEY ||
      'jornada_essencial_v1'
    );
  }

  // --------------------------------------------------
  // Estado robusto (não depende só do STORAGE_KEY)
  // --------------------------------------------------
  function getJornadaState() {
    // 1) globais
    const fromWindow =
      (window.JORNADA_STATE && typeof window.JORNADA_STATE === 'object') ? window.JORNADA_STATE :
      (window.state && typeof window.state === 'object') ? window.state :
      (window.JC_STATE && typeof window.JC_STATE === 'object') ? window.JC_STATE :
      {};

    // 2) storage principal + backups
    const key = getStorageKey();
    const candidates = [
      key,
      'jornada_essencial_v1',
      'jornada_essencial',
      'JORNADA_STATE',
      'jornada_state'
    ];

    let fromLS = {};
    for (const k of candidates) {
      const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
      const parsed = raw ? safeParseJSON(raw) : null;
      if (parsed && typeof parsed === 'object') {
        fromLS = parsed;
        break;
      }
    }

    // 3) chaves “unitárias” que você realmente usa hoje
    const nomeLS = (localStorage.getItem('JORNADA_NOME') || '').trim();
    const guiaLS = (localStorage.getItem('JORNADA_GUIA') || '').trim();

    const merged = Object.assign({}, fromWindow, fromLS);

    // injeta se estiver faltando
    if (!merged.nome && nomeLS) merged.nome = nomeLS;
    if (!merged.guiaSelecionado && !merged.guia && guiaLS) merged.guiaSelecionado = guiaLS;

    // espelho opcional (ajuda outras sections)
    window.JORNADA_STATE = merged;

    return merged;
  }

  // --------------------------------------------------
  // Respostas: tenta achar em vários locais
  // - aceita array
  // - aceita objeto {q1:"...", q2:"..."} -> vira array
  // --------------------------------------------------
  function readAnswersFromEverywhere(stateObj) {
    // 1) state (vários nomes)
    let a =
      stateObj?.respostas ??
      stateObj?.answers ??
      stateObj?.responses ??
      stateObj?.respostasArray ??
      stateObj?.answersArray ??
      null;

    // 2) globais comuns do seu projeto
    if (a == null) a = window.JornadaAnswers || window.__QA_ANSWERS__ || window.JORNADA_ANSWERS || null;

    // 3) storage fallback
    if (a == null) {
      const raw =
        localStorage.getItem('JORNADA_RESPOSTAS') ||
        localStorage.getItem('JORNADA_ANSWERS') ||
        localStorage.getItem('JORNADA_PERGUNTAS_RESPOSTAS');
      const parsed = raw ? safeParseJSON(raw) : null;
      if (parsed) a = parsed;
    }

    // normaliza
    if (Array.isArray(a)) {
      return a.map(v => String(v ?? '').trim()).filter(Boolean);
    }

    if (a && typeof a === 'object') {
      // objeto -> ordena por chave quando possível
      const keys = Object.keys(a);
      keys.sort((k1, k2) => {
        const n1 = parseInt(String(k1).replace(/\D+/g, ''), 10);
        const n2 = parseInt(String(k2).replace(/\D+/g, ''), 10);
        if (Number.isFinite(n1) && Number.isFinite(n2)) return n1 - n2;
        return String(k1).localeCompare(String(k2));
      });
      return keys.map(k => String(a[k] ?? '').trim()).filter(Boolean);
    }

    return [];
  }

  // --------------------------------------------------
  // SelfieCard: tenta achar em vários locais
  // --------------------------------------------------
  function readSelfieCardFromEverywhere(stateObj) {
    const s =
      stateObj?.selfieBase64 ??
      stateObj?.selfieCard ??
      stateObj?.cardImage ??
      stateObj?.cardBase64 ??
      window.SELFIE_CARD ??
      window.__SELFIE_CARD__ ??
      null;

    if (typeof s === 'string' && s.trim()) return s.trim();

    const raw =
      localStorage.getItem('JORNADA_SELFIECARD') ||
      localStorage.getItem('SELFIE_CARD') ||
      localStorage.getItem('JORNADA_CARD_IMAGE');

    return (raw || '').trim();
  }

  // --------------------------------------------------
  // Payload Diamante (o que vai pro backend)
  // --------------------------------------------------
  function buildFinalPayloadDiamante() {
    const s = getJornadaState();
    console.log('[FINAL][STATE RAW]', s);

    const nome = String(
      s.nome ?? s.name ?? s.participantName ?? s.participante ??
      localStorage.getItem('JORNADA_NOME') ?? ''
    ).trim();

    const guia = String(
      s.guiaSelecionado ?? s.guia ?? s.guide ?? s.selectedGuide ??
      localStorage.getItem('JORNADA_GUIA') ?? ''
    ).trim().toLowerCase();

    const respostas = readAnswersFromEverywhere(s);

    const selfieCard = readSelfieCardFromEverywhere(s);

    const payload = { nome, guia, respostas, selfieCard };
    console.log('[FINAL][PAYLOAD NORMALIZED]', payload);
    return payload;
  }

  // --------------------------------------------------
  // UI status dentro do container (sem “vazar” pra fora)
  // --------------------------------------------------
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
    if (!root) return;

    ensureFinalPdfStyles();

    // remove UI legado (se existir)
    const legacyWrap = root.querySelector('#finalPdfWrap') || root.querySelector('#finalPdfKrap');
    if (legacyWrap && legacyWrap.parentNode) legacyWrap.parentNode.removeChild(legacyWrap);

    // evita duplicar status
    let status = root.querySelector('#finalPdfStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'finalPdfStatus';
      status.className = 'final-pdf-status';
      status.textContent = '✅ Você pode gerar o PDF agora, ou baixar depois.';

      // host “natural”: logo abaixo dos botões
      const actions = root.querySelector('.final-acoes');
      if (actions && actions.parentNode) {
        actions.parentNode.insertBefore(status, actions.nextSibling);
      } else {
        root.appendChild(status);
      }
    }

    // pega os dois botões EXISTENTES no container final
    const actionsRoot = root.querySelector('.final-acoes') || root;

    const btns = Array.from(actionsRoot.querySelectorAll('button'));
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

    // bind único
    if (btnPdf && btnPdf.dataset.pdfBound === '1') return;
    if (btnPdf) btnPdf.dataset.pdfBound = '1';
    if (btnSelfie) btnSelfie.dataset.selfieBound = '1';

    // ------------------------------------------------------
    // CLICK: PDF (gera + baixa) ✅ guard-rails + finally
    // ------------------------------------------------------
    if (btnPdf) {
      btnPdf.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
          setPdfStatus(root, '✖ API não está pronta. Verifique se /assets/js/api.js carregou.', 'err');
          return;
        }

        // trava botões imediatamente
        btnPdf.disabled = true;
        if (btnSelfie) btnSelfie.disabled = true;

        let timer = null;

        try {
          const payload = buildFinalPayloadDiamante();
          console.log('[FINAL][PAYLOAD]', payload);

          if (!payload.nome || payload.nome.length < 2) {
            setPdfStatus(root, '⚠ Nome inválido. Volte e confirme o nome antes de gerar o PDF.', 'err');
            return;
          }

          if (!Array.isArray(payload.respostas) || payload.respostas.length === 0) {
            setPdfStatus(root, '⚠ Sem respostas. Finalize as perguntas antes de gerar o PDF.', 'err');
            return;
          }

          timer = startMagicDots(root, 'Forjando seu pergaminho');

          const result = await window.API.gerarPDFEHQ(payload);

          if (result && result.ok) {
            setPdfStatus(root, '✅ Pergaminho gerado e baixado com sucesso!', 'ok');
          } else {
            setPdfStatus(root, '✖ Não consegui gerar o PDF. Veja o console para detalhes.', 'err');
            console.warn('[FINAL][PDF] result:', result);
          }
        } catch (e) {
          console.error('[FINAL][PDF] erro:', e);
          setPdfStatus(root, '✖ Erro ao gerar o PDF. Confira o console (Network/Console).', 'err');
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
        const img = payload.selfieCard;

        if (!img || String(img).trim().length < 50) {
          setPdfStatus(root, '⚠️ SelfieCard ainda não está disponível neste momento.', 'err');
          return;
        }

        try {
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

          setPdfStatus(root, '✅ SelfieCard baixado com sucesso!', 'ok');
        } catch (e) {
          console.error('[FINAL][SELFIE] erro:', e);
          setPdfStatus(root, '❌ Não consegui baixar a SelfieCard. Veja o console.', 'err');
        }
      });
    }
  }

  // ================================
  // TTS fila (não atropela)
  // ================================
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!('speechSynthesis' in window) || !text) return Promise.resolve();

    speechChain = speechChain.then(() => new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang   = getActiveLang();
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
      if (i % 2 === 0) await sleep(delay);
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

    try { speechSynthesis.cancel(); } catch {}
    speechChain = Promise.resolve();

    const { section, titleEl, msgEl, botoes } = ensureFinalDOM();
    if (!section || !titleEl || !msgEl) return;

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

    // PARÁGRAFOS
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const txt = p.dataset.original || '';
      if (!txt) continue;

      p.style.transition = 'all 0.8s ease';
      p.style.opacity = 1;
      p.style.transform = 'translateY(0)';
      await typeText(p, txt, 55, true);
      p.classList.add('revealed');
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

  // ------------------------ VÍDEO DE SAÍDA ------------------------
  let finalReturning = false;

  function handleVoltarInicio() {
    if (finalReturning) return;
    finalReturning = true;

    const src = FINAL_MOVIE;

    if (typeof window.playVideo === 'function') {
      window.playVideo(src, {
        useGoldBorder: true,
        pulse: true,
        onEnded: () => { window.location.href = HOME_URL; }
      });
      return;
    }

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, null);
      setTimeout(() => { window.location.href = HOME_URL; }, 16000);
      return;
    }

    window.location.href = HOME_URL;
  }

  // ------------------------ EVENTOS ------------------------
  document.addEventListener('section:shown', (e) => {
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

  // opcional: se existir botão de “final/portal” e você quiser ligar aqui
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;
    // ajuste o seletor conforme seu HTML (id/data-action)
    if (t.matches?.('[data-action="finalizar"], #btnFinalizar, #btnVoltarPortal')) {
      e.preventDefault();
      handleVoltarInicio();
    }
  });

})();
