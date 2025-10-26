// /assets/js/jornada-final.js
(function () {
  'use strict';

  const NS = '[FINAL]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  // Ajuste IDs se necessário
  const SECTION_ID = 'section-final';
  const BTN_DL_SEL = '#btn-baixar-pdf-hq';
  const BTN_END_SEL = '#btn-finalizar';

  const $ = (sel, root = document) => root.querySelector(sel);

  // Estado
  const S = {
    generating: false,
    pdfUrl: null,
    hqUrl: null,
  };

  // Resolve API base
  function apiBase() {
    return (window.APP_CONFIG?.API_BASE) || (window.API?.BASE_URL) || '/api';
  }

  function payload() {
    // Dados colhidos ao longo da jornada
    const guia = (window.JC?.state?.guia) || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;
    const answers = window.__QA_ANSWERS__ || null;
    const meta = window.__QA_META__ || {};
    const lang = (window.i18n?.lang) || 'pt';
    const timeNow = new Date().toISOString();

    return {
      guide: guia,
      selfieDataUrl: selfie,
      answers,
      meta,
      lang,
      completedAt: timeNow,
      appVersion: (window.APP_CONFIG?.version || 'v1'),
    };
  }

  async function generateArtifacts() {
    if (S.generating) { log('Geração já em andamento.'); return; }
    S.generating = true;

    try {
      // Integração preferencial com seu wrapper de API, se existir
      if (window.API?.gerarPDFHQ) {
        log('Gerando via window.API.gerarPDFHQ…');
        const res = await window.API.gerarPDFHQ(payload());
        S.pdfUrl = res?.pdfUrl || null;
        S.hqUrl  = res?.hqUrl  || null;
      } else {
        // Fallback: chamar endpoint REST
        const url = apiBase().replace(/\/+$/, '') + '/jornada/finalizar';
        log('Gerando via REST:', url);
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json().catch(() => ({}));
        S.pdfUrl = data?.pdfUrl || null;
        S.hqUrl  = data?.hqUrl  || null;
      }

      if (!S.pdfUrl && !S.hqUrl) {
        warn('Backend não retornou URLs de PDF/HQ. Ativando fallback simples.');
        // Fallback ultra-simples: baixar as respostas como JSON para não deixar o usuário sem nada
        const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' });
        S.pdfUrl = URL.createObjectURL(blob);
      }

      window.toast?.('Artefatos prontos para download!');
      enableDownloadButton(true);
    } catch (e) {
      err('Falha ao gerar PDF/HQ:', e);
      window.toast?.('Não foi possível gerar os arquivos agora.');
    } finally {
      S.generating = false;
    }
  }

  function enableDownloadButton(enabled) {
    const btn = $(BTN_DL_SEL);
    if (btn) btn.disabled = !enabled;
  }

  function downloadAll() {
    // Prioridade: PDF e HQ se existirem; senão baixa o fallback JSON
    if (S.pdfUrl) triggerDownload(S.pdfUrl, 'jornada.pdf'); // nome sugestivo
    if (S.hqUrl)  triggerDownload(S.hqUrl,  'hq.zip');      // supondo zip da HQ
    if (!S.pdfUrl && !S.hqUrl) {
      window.toast?.('Nada para baixar no momento.');
    }
  }

  function triggerDownload(url, filename) {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      warn('Download falhou; abrindo em nova aba:', e);
      window.open(url, '_blank', 'noopener');
    }
  }

  function finishFlow() {
    // Li

