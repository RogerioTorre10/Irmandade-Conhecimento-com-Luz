(function () {
  'use strict';

  const MOD = 'section-final.js';
  const SECTION_ID = 'section-final';
  const NEXT_SECTION_ID = 'section-home';
  const VIDEO_SRC = '/assets/videos/filme-5-fim-da-jornada.mp4';

  const BTN_DL_SEL = '#btn-baixar-pdf-hq';
  const BTN_END_SEL = '#btn-finalizar';
  const $ = (sel, root = document) => (root || document).querySelector(sel);

  const S = {
    generating: false,
    pdfUrl: null,
    hqUrl: null,
  };

  // ---------- Helpers básicos ----------

  function apiBase() {
    // Ordem de prioridade:
    // 1) APP_CONFIG.API_BASE definido no HTML
    // 2) window.API.BASE_URL se existir
    // 3) Fallback explícito para o backend no Render
    const base =
      (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
      (window.API && window.API.BASE_URL) ||
      'https://lumen-backend-api.onrender.com';

    return String(base).replace(/\/+$/, '');
  }

  function payload() {
    const guia = (window.JC && window.JC.state && window.JC.state.guia) || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;
    const answers = window.__QA_ANSWERS__ || null;
    const meta = window.__QA_META__ || {};
    const lang =
      (window.i18n && (window.i18n.lang || window.i18n.language)) || 'pt-BR';
    const timeNow = new Date().toISOString();

    return {
      guide: guia,
      selfieDataUrl: selfie,
      answers,
      meta,
      lang,
      completedAt: timeNow,
      appVersion: (window.APP_CONFIG && window.APP_CONFIG.version) || 'v1',
    };
  }

  function enableDownloadButton(enabled) {
    const btn = $(BTN_DL_SEL);
    if (btn) btn.disabled = !enabled;
  }

  function triggerDownload(url, filename) {
    if (!url) return;
    try {
      const a = document.createElement('a');
      a.href = url;
      if (filename) a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.warn(`[${MOD}] Falha no download direto, abrindo em nova aba.`, e);
      window.open(url, '_blank', 'noopener');
    }
  }

  function downloadAll() {
    if (S.pdfUrl) triggerDownload(S.pdfUrl, 'jornada-conhecimento-com-luz.pdf');
    if (S.hqUrl) triggerDownload(S.hqUrl, 'hq-irmandade.zip');

    if (!S.pdfUrl && !S.hqUrl) {
      (window.toast || console.log)(
        'Ainda não há arquivos disponíveis para baixar.'
      );
    }
  }

  // ---------- Geração de PDF/HQ ----------

  async function generateArtifacts() {
    if (S.generating) return;
    S.generating = true;

    try {
      const body = payload();

      // 1) Se existir helper custom, usa ele
      if (window.API && typeof window.API.gerarPDFHQ === 'function') {
        const res = await window.API.gerarPDFHQ(body);
        S.pdfUrl = res && res.pdfUrl;
        S.hqUrl = res && res.hqUrl;
      } else {
        // 2) Fallback padrão: POST no backend
        const base = apiBase();
        const url = `${base}/jornada/finalizar`;

        console.log(`[${MOD}] Chamando API final: ${url}`);

        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }

        const data = await r.json().catch(() => ({}));
        S.pdfUrl = data && data.pdfUrl;
        S.hqUrl = data && data.hqUrl;
      }

      // 3) Se mesmo assim não vier link, gera JSON local de fallback
      if (!S.pdfUrl && !S.hqUrl) {
        console.warn(
          `[${MOD}] Nenhum link recebido da API; gerando arquivo local de fallback.`
        );
        const blob = new Blob([JSON.stringify(body, null, 2)], {
          type: 'application/json',
        });
        S.pdfUrl = URL.createObjectURL(blob);
      }

      (window.toast || console.log)(
        'Sua devolutiva está pronta para download.'
      );
      enableDownloadButton(true);
    } catch (e) {
      console.error(`[${MOD}] Falha ao gerar PDF/HQ:`, e);
      (window.toast || console.log)(
        'Não foi possível gerar os arquivos agora. Tente novamente mais tarde.'
      );
      enableDownloadButton(false);
    } finally {
      S.generating = false;
    }
  }

  // ---------- Finalizar jornada ----------

  function getTransitionFn() {
    if (typeof window.playVideoTransition === 'function')
      return window.playVideoTransition;
    if (typeof window.playTransitionThenGo === 'function')
      return window.playTransitionThenGo;
    return null;
  }

  function finishFlow() {
    try {
      // Se quiser limpar estado sensível após o fim:
      // delete window.__SELFIE_DATA_URL__;
      // delete window.__QA_ANSWERS__;
      // delete window.__QA_META__;
    } catch (e) {
      console.warn(`[${MOD}] Erro ao limpar estado local:`, e);
    }

    const fn = getTransitionFn();
    const hasNext = !!document.getElementById(NEXT_SECTION_ID);

    // 1) Encerrar com vídeo final se disponível
    if (fn && VIDEO_SRC && hasNext) {
      console.log(
        `[${MOD}] Encerrando com vídeo final ${VIDEO_SRC} → ${NEXT_SECTION_ID}`
      );
      try {
        fn(VIDEO_SRC, NEXT_SECTION_ID);
        return;
      } catch (e) {
        console.error(
          `[${MOD}] Erro na transição com vídeo final, usando fallback:`,
          e
        );
      }
    }

    // 2) Sem vídeo ou falhou: utiliza controlador oficial
    if (window.JC && typeof window.JC.finish === 'function') {
      console.log(`[${MOD}] Encerrando via JC.finish()`);
      window.JC.finish();
      return;
    }

    if (window.JC && typeof window.JC.show === 'function' && hasNext) {
      console.log(`[${MOD}] Encerrando via JC.show(${NEXT_SECTION_ID})`);
      window.JC.show(NEXT_SECTION_ID);
      return;
    }

    if (typeof window.showSection === 'function' && hasNext) {
      console.log(`[${MOD}] Encerrando via showSection(${NEXT_SECTION_ID})`);
      window.showSection(NEXT_SECTION_ID);
      return;
    }

    // 3) Último recurso: ancora
    if (hasNext) {
      console.log(`[${MOD}] Encerrando via hash #${NEXT_SECTION_ID}`);
      window.location.hash = `#${NEXT_SECTION_ID}`;
    }
  }

  // ---------- Bind da seção final ----------

  async function bindSection(node) {
    const btnDl = $(BTN_DL_SEL, node);
    const btnEnd = $(BTN_END_SEL, node);

    if (btnDl) {
      btnDl.addEventListener('click', async () => {
        if (!S.pdfUrl && !S.hqUrl) {
          await generateArtifacts();
        }
        downloadAll();
      });
    }

    if (btnEnd) {
      btnEnd.addEventListener('click', () => {
        finishFlow();
      });
    }

    enableDownloadButton(false);

    // Geração automática quando entrar na seção final
    generateArtifacts();
  }

  // Chamado pelo controlador quando a section-final é exibida
  document.addEventListener('sectionLoaded', (e) => {
    if (!e || e.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    if (!node) return;
    bindSection(node);
  });

  // Fallback: se já estiver ativa ao carregar
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (
      sec &&
      (sec.classList.contains('active') ||
        window.__currentSectionId === SECTION_ID)
    ) {
      bindSection(sec);
    }
  });

  // Debug manual
  window.JFinal = {
    generate: generateArtifacts,
    download: downloadAll,
    finish: finishFlow,
  };

  console.log(`[${MOD}] carregado`);
})();
