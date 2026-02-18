// section-final.js — Jornada Essencial (Final)
// Mantém datilografia/TTS + botões internos (PDF / SelfieCard) + payload “diamante”
// Compatível com o controller (event: section:shown)

(function () {
  'use strict';

  const SECTION_ID = 'section-final';

  // --------------------------------------------------
  // Helpers DOM
  // --------------------------------------------------
  const $  = (sel, root) => (root || document).querySelector(sel);
  const qa = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function clampStr(v) {
    return String(v ?? '').trim();
  }

  function safeLower(v) {
    return clampStr(v).toLowerCase();
  }

  function parseJSON(str) {
    try { return JSON.parse(str); } catch { return null; }
  }

  // --------------------------------------------------
  // Estado (robusto): tenta várias origens
  // --------------------------------------------------
  function getJornadaState() {
    const cfgKey = (window.APP_CONFIG && window.APP_CONFIG.STORAGE_KEY) ? window.APP_CONFIG.STORAGE_KEY : 'jornada_essencial_v1';

    // 1) globais (se existirem)
    const g =
      window.JORNADA_STATE ||
      window.__JORNADA_STATE__ ||
      window.state ||
      window.JORNADA ||
      null;

    // 2) storage principal (se existir)
    const byKey = parseJSON(localStorage.getItem(cfgKey)) || parseJSON(sessionStorage.getItem(cfgKey));

    // 3) chaves legadas que você já viu no console
    const nomeLS = localStorage.getItem('JORNADA_NOME') || sessionStorage.getItem('JORNADA_NOME');
    const guiaLS = localStorage.getItem('JORNADA_GUIA') || sessionStorage.getItem('JORNADA_GUIA');

    // 4) possíveis respostas em storage (muitos nomes diferentes)
    const respostasLS =
      parseJSON(localStorage.getItem('JORNADA_RESPOSTAS')) ||
      parseJSON(sessionStorage.getItem('JORNADA_RESPOSTAS')) ||
      parseJSON(localStorage.getItem('RESPOSTAS')) ||
      parseJSON(sessionStorage.getItem('RESPOSTAS')) ||
      parseJSON(localStorage.getItem('jornada_respostas')) ||
      parseJSON(sessionStorage.getItem('jornada_respostas')) ||
      null;

    // 5) selfieCard em storage
    const selfieLS =
      localStorage.getItem('JORNADA_SELFIE_CARD') ||
      sessionStorage.getItem('JORNADA_SELFIE_CARD') ||
      localStorage.getItem('selfieCard') ||
      sessionStorage.getItem('selfieCard') ||
      null;

    // mescla (prioridade: globais > storage por key > legados)
    const s = Object.assign(
      {},
      (byKey && typeof byKey === 'object') ? byKey : {},
      (g && typeof g === 'object') ? g : {},
      {
        nome: nomeLS || (g && (g.nome || g.name || g.participantName)) || (byKey && (byKey.nome || byKey.name || byKey.participantName)) || '',
        guia: guiaLS || (g && (g.guiaSelecionado || g.guia || g.guide)) || (byKey && (byKey.guiaSelecionado || byKey.guia || byKey.guide)) || '',
      }
    );

    // respostas podem estar em vários campos
    const resp =
      (g && (g.respostas || g.answers || g.perguntas || g.responses)) ||
      (byKey && (byKey.respostas || byKey.answers || byKey.perguntas || byKey.responses)) ||
      respostasLS ||
      [];

    s.respostas = resp;

    // selfiecard pode estar em vários campos
    s.selfieCard =
      (g && (g.selfieBase64 || g.selfieCard || g.cardImage)) ||
      (byKey && (byKey.selfieBase64 || byKey.selfieCard || byKey.cardImage)) ||
      selfieLS ||
      '';

    return s;
  }

  function normalizeGuiasId(v) {
    const g = safeLower(v);
    if (g === 'arian' || g === 'arion') return 'arian';
    if (g === 'zion') return 'zion';
    if (g === 'lumen') return 'lumen';
    return g;
  }

  function buildFinalPayloadDiamante() {
    const s = getJornadaState();

    console.log('[FINAL][STATE RAW]', s);

    const nome = clampStr(s.nome || s.name || s.participantName);
    const guia = normalizeGuiasId(s.guiaSelecionado || s.guia || s.guide);

    // respostas: sempre array de strings (guard-rail)
    let respostas = s.respostas ?? [];
    if (!Array.isArray(respostas)) respostas = [respostas];

    respostas = respostas
      .map(r => clampStr(r))
      .filter(Boolean);

    const selfieCard = clampStr(s.selfieCard || s.selfieBase64 || '');

    const payload = { nome, guia, respostas, selfieCard };

    console.log('[FINAL][PAYLOAD NORMALIZED]', payload);
    return payload;
  }

  // --------------------------------------------------
  // Download util (SelfieCard local)
  // --------------------------------------------------
  function downloadDataUrl(dataUrl, filename) {
    try {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename || 'selfiecard.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  }

  // --------------------------------------------------
  // UI status (dentro do container, não fora)
  // --------------------------------------------------
  function ensureStatusBox(root) {
    let box = $('#finalStatus', root);
    if (box) return box;

    // tenta anexar perto dos botões internos
    const host =
      $('#section-final .j-panel', root) ||
      $('#section-final .j-perg-v-inner', root) ||
      $('#section-final .glass', root) ||
      root;

    box = document.createElement('div');
    box.id = 'finalStatus';
    box.className = 'final-status';
    box.setAttribute('role', 'status');
    box.style.marginTop = '10px';
    box.style.padding = '10px 12px';
    box.style.borderRadius = '10px';
    box.style.fontFamily = 'Cardo, serif';
    box.style.fontSize = '14px';
    box.style.lineHeight = '1.2';
    box.style.textAlign = 'center';
    box.style.opacity = '0.95';
    box.style.display = 'none';

    host.appendChild(box);
    return box;
  }

  function setStatus(root, msg, kind) {
    const box = ensureStatusBox(root);
    if (!msg) {
      box.style.display = 'none';
      box.textContent = '';
      return;
    }
    box.style.display = 'block';
    box.textContent = msg;

    // kind: ok | err | warn
    box.style.border = (kind === 'ok')
      ? '1px solid rgba(120, 255, 160, 0.55)'
      : (kind === 'warn')
        ? '1px solid rgba(255, 205, 110, 0.6)'
        : '1px solid rgba(255, 120, 120, 0.6)';

    box.style.background = 'rgba(0,0,0,0.55)';
    box.style.color = (kind === 'ok')
      ? 'rgba(220,255,235,0.95)'
      : (kind === 'warn')
        ? 'rgba(255,240,210,0.95)'
        : 'rgba(255,220,220,0.95)';
  }

  function startMagicDots(root, baseText) {
    let t = 0;
    setStatus(root, baseText || 'Forjando seu pergaminho…', 'warn');
    return setInterval(() => {
      t = (t + 1) % 4;
      const dots = '.'.repeat(t);
      setStatus(root, (baseText || 'Forjando seu pergaminho') + dots, 'warn');
    }, 350);
  }

  // --------------------------------------------------
  // Datilografia/TTS (usa infra existente se disponível)
  // --------------------------------------------------
  async function typeOnce(el, text, opts) {
    if (!el) return;
    if (el.dataset && el.dataset.typingDone === '1') return;
    el.dataset.typingDone = '1';

    // Preferência: usar TypingBridge existente (se houver)
    if (window.runTyping && typeof window.runTyping === 'function') {
      // runTyping(el, text?, opts?) — compat
      try {
        await window.runTyping(el, text, opts || {});
        return;
      } catch {}
    }

    // Fallback: escreve de uma vez + (opcional) TTS se houver speakText
    if (typeof text === 'string' && text.length) el.textContent = text;
    if (opts && opts.speak && window.speakText && typeof window.speakText === 'function') {
      try { window.speakText(el.textContent); } catch {}
    }
  }

  // --------------------------------------------------
  // Bind botões internos (PDF / SelfieCard)
  // IDs esperados (ajuste se seus IDs forem diferentes):
  //  - #btnBaixarPDFHQ
  //  - #btnSelfieCard   (se não existir, você pode duplicar o padrão do PDF)
  // --------------------------------------------------
  function bindFinalButtons(root) {
    const btnPdf = $('#btnBaixarPDFHQ', root) || $('[data-action="baixar-pdf"]', root);
    const btnSelfie = $('#btnSelfieCard', root) || $('[data-action="baixar-selfiecard"]', root);

    // Se o HTML ainda não tem btnSelfieCard, não quebra — só avisa via status quando tentar.
    if (btnPdf && !btnPdf.dataset.boundFinalPdf) {
      btnPdf.dataset.boundFinalPdf = '1';

      btnPdf.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        // API pronta?
        if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
          setStatus(root, '❌ API não está pronta. Verifique se /assets/js/api.js carregou.', 'err');
          return;
        }

        // trava botões imediatamente
        btnPdf.disabled = true;
        if (btnSelfie) btnSelfie.disabled = true;

        let timer = null;

        try {
          const payload = buildFinalPayloadDiamante();
          console.log('[FINAL][PAYLOAD]', payload);

          // Guard-rails
          if (!payload.nome || payload.nome.length < 2) {
            setStatus(root, '⚠️ Nome inválido. Volte e confirme o nome antes de gerar o PDF.', 'warn');
            return;
          }
          if (!Array.isArray(payload.respostas) || payload.respostas.length === 0) {
            setStatus(root, '⚠️ Sem respostas. Finalize as perguntas antes de gerar o PDF.', 'warn');
            return;
          }
          if (!payload.guia) {
            // não impede gerar, mas corrige visual
            payload.guia = 'lumen';
          }

          timer = startMagicDots(root, 'Forjando seu pergaminho');

          const result = await window.API.gerarPDFEHQ(payload);

          if (result && result.ok) {
            setStatus(root, '✅ Pergaminho gerado e baixado com sucesso!', 'ok');
          } else {
            setStatus(root, '❌ Não consegui gerar o PDF. Veja o console para detalhes.', 'err');
            console.warn('[FINAL][PDF] result:', result);
          }
        } catch (e) {
          console.error('[FINAL][PDF] erro:', e);
          setStatus(root, '❌ Erro ao gerar o PDF. Confira o console (Network/Console).', 'err');
        } finally {
          if (timer) clearInterval(timer);
          btnPdf.disabled = false;          // ✅ sempre volta
          if (btnSelfie) btnSelfie.disabled = false;
        }
      });
    }

    if (btnSelfie && !btnSelfie.dataset.boundFinalSelfie) {
      btnSelfie.dataset.boundFinalSelfie = '1';

      btnSelfie.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const payload = buildFinalPayloadDiamante();
        console.log('[FINAL][SELFIE] payload:', payload);

        if (!payload.selfieCard) {
          setStatus(root, '⚠️ SelfieCard ainda não está disponível neste momento.', 'warn');
          return;
        }

        // Se for dataURL, baixa local
        if (/^data:image\//i.test(payload.selfieCard)) {
          const fname = `SelfieCard-${payload.nome || 'participante'}-${new Date().toISOString().slice(0,10)}.png`;
          const ok = downloadDataUrl(payload.selfieCard, fname);
          setStatus(root, ok ? '✅ SelfieCard baixado!' : '❌ Não consegui baixar o SelfieCard.', ok ? 'ok' : 'err');
          return;
        }

        // Se vier base64 puro, tenta converter para dataURL
        if (/^[A-Za-z0-9+/=]+$/.test(payload.selfieCard) && payload.selfieCard.length > 200) {
          const dataUrl = 'data:image/png;base64,' + payload.selfieCard;
          const fname = `SelfieCard-${payload.nome || 'participante'}-${new Date().toISOString().slice(0,10)}.png`;
          const ok = downloadDataUrl(dataUrl, fname);
          setStatus(root, ok ? '✅ SelfieCard baixado!' : '❌ Não consegui baixar o SelfieCard.', ok ? 'ok' : 'err');
          return;
        }

        // Caso seja URL (raro), tenta baixar
        if (/^https?:\/\//i.test(payload.selfieCard)) {
          try {
            setStatus(root, 'Forjando seu SelfieCard…', 'warn');
            const r = await fetch(payload.selfieCard, { cache: 'no-store' });
            if (!r.ok) throw new Error('HTTP ' + r.status);
            const blob = await r.blob();

            const a = document.createElement('a');
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = `SelfieCard-${payload.nome || 'participante'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1500);

            setStatus(root, '✅ SelfieCard baixado!', 'ok');
          } catch (e) {
            console.error('[FINAL][SELFIE] erro:', e);
            setStatus(root, '❌ Não consegui baixar o SelfieCard. Veja o console.', 'err');
          }
          return;
        }

        setStatus(root, '⚠️ Formato de SelfieCard não reconhecido.', 'warn');
      });
    }
  }

  // --------------------------------------------------
  // Sequência final (texto + efeitos)
  // --------------------------------------------------
  async function startFinalSequence(root) {
    // elementos principais (ajuste selectors se necessário)
    const title = $('#section-final .final-title, #section-final .j-title, #section-final h2', root);
    const text  = $('#section-final .final-text, #section-final .j-text, #section-final .typing-target', root);

    // reativa botões internos se existirem (antes estavam inoperantes)
    bindFinalButtons(root);

    if (title) await typeOnce(title, null, { speed: 34, speak: true });
    if (text)  await typeOnce(text, null, { speed: 28, speak: true });

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  // --------------------------------------------------
  // Init único por render
  // --------------------------------------------------
  async function initOnce(root) {
    if (!root || root.dataset.finalInitialized === 'true') return;
    root.dataset.finalInitialized = 'true';

    // pequeno delay para layout estabilizar
    await new Promise(r => setTimeout(r, 60));

    // bind + sequencia
    await startFinalSequence(root);

    // debug (payload pronto)
    try {
      const payload = buildFinalPayloadDiamante();
      console.log('[FINAL][PAYLOAD]', payload);
    } catch {}
  }

  // Escuta evento do controller
  document.addEventListener('section:shown', (ev) => {
    const id = (ev && ev.detail && ev.detail.id) ? ev.detail.id : '';
    if (id !== SECTION_ID) return;

    const root = document.getElementById(SECTION_ID);
    initOnce(root);
  });

})();
