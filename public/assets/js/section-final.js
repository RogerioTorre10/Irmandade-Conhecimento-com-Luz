(function () {
  'use strict';

  const MOD = 'section-final.js';
  const SECTION_ID = 'section-final';
  const NEXT_SECTION_ID = 'section-home';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';

  const BTN_DL_SEL = '#btn-baixar-pdf-hq';
  const BTN_END_SEL = '#btn-finalizar';
  const $ = (sel, root = document) => root.querySelector(sel);

  const S = {
    generating: false,
    pdfUrl: null,
    hqUrl: null,
  };

  function apiBase() {
    return (window.APP_CONFIG?.API_BASE) || (window.API?.BASE_URL) || '/api';
  }

  function payload() {
    const guia = window.JC?.state?.guia || {};
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
    if (S.generating) return;
    S.generating = true;

    try {
      if (window.API?.gerarPDFHQ) {
        const res = await window.API.gerarPDFHQ(payload());
        S.pdfUrl = res?.pdfUrl || null;
        S.hqUrl = res?.hqUrl || null;
      } else {
        const url = apiBase().replace(/\/+$/, '') + '/jornada/finalizar';
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload()),
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json().catch(() => ({}));
        S.pdfUrl = data?.pdfUrl || null;
        S.hqUrl = data?.hqUrl || null;
      }

      if (!S.pdfUrl && !S.hqUrl) {
        const blob = new Blob([JSON.stringify(payload(), null, 2)], { type: 'application/json' });
        S.pdfUrl = URL.createObjectURL(blob);
      }

      window.toast?.('Artefatos prontos para download!');
      enableDownloadButton(true);
    } catch (e) {
      console.error('[FINAL] Falha ao gerar PDF/HQ:', e);
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
    if (S.pdfUrl) triggerDownload(S.pdfUrl, 'jornada.pdf');
    if (S.hqUrl) triggerDownload(S.hqUrl, 'hq.zip');
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
      console.warn('[FINAL] Download falhou; abrindo em nova aba:', e);
      window.open(url, '_blank', 'noopener');
    }
  }

  function finishFlow() {
    try {
      // delete window.__SELFIE_DATA_URL__;
      // delete window.__QA_ANSWERS__;
      // delete window.__QA_META__;
    } catch {}

    if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else if (window.JC?.finish) {
      window.JC.finish();
    } else if (window.JC?.show && document.getElementById(NEXT_SECTION_ID)) {
      window.JC.show(NEXT_SECTION_ID);
    } else if (typeof window.showSection === 'function' && document.getElementById(NEXT_SECTION_ID)) {
      window.showSection(NEXT_SECTION_ID);
    } else {
      window.location.hash = `#${NEXT_SECTION_ID}`;
    }
  }

  function bindSection(node) {
    const btnDl = $(BTN_DL_SEL, node);
    const btnEnd = $(BTN_END_SEL, node);

    if (btnDl) {
      btnDl.addEventListener('click', async () => {
        if (!S.pdfUrl && !S.hqUrl) await generateArtifacts();
        downloadAll();
      });
    }

    if (btnEnd) {
      btnEnd.addEventListener('click', () => {
        finishFlow();
      });
    }

    generateArtifacts();
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    if (!node) return;
    enableDownloadButton(false);
    bindSection(node);
  });

  window.JFinal = {
    generate: generateArtifacts,
    download: downloadAll,
    finish: finishFlow,
  };

  console.log(`[${MOD}] carregado`);
})();
