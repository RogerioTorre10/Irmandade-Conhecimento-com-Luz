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

  // Aguarda fim de possível transição com vídeo (se seu motor usar esse lock/evento)
  async function waitForTransitionUnlock(timeoutMs = 15000) {
    if (!window.__TRANSITION_LOCK) return;

    let resolved = false;

    const p = new Promise((resolve) => {
      const onEnd = () => {
        if (resolved) return;
        resolved = true;
        document.removeEventListener('transition:ended', onEnd);
        resolve();
      };
      document.addEventListener('transition:ended', onEnd, { once: true });
    });

    const t = new Promise((resolve) => {
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      }, timeoutMs);
    });

    await Promise.race([p, t]);
  }

  // Base da API (configurável)
  function apiBase() {
    return (
      window.APP_CONFIG?.API_BASE ||
      window.API?.BASE_URL ||
      '/api'
    );
  }

  // Monta o pacote enviado para gerar PDF/HQ
  function payload() {
    const guia = window.JC?.state?.guia || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;
    const answers = window.__QA_ANSWERS__ || null;
    const meta = window.__QA_META__ || {};
    const lang = (window.i18n && (window.i18n.lang || window.i18n.language)) || 'pt';
    const timeNow = new Date().toISOString();

    return {
      guide: guia,
      selfieDataUrl: selfie,
      answers,
      meta,
      lang,
      completedAt: timeNow,
      appVersion: window.APP_CONFIG?.version || 'v1',
    };
  }

  // Gera (ou tenta gerar) PDF/HQ
  async function generateArtifacts() {
    if (S.generating) return;
    S.generating = true;

    try {
      const body = payload();

      // Preferência para helper custom se existir
      if (window.API?.gerarPDFHQ) {
        const res = await window.API.gerarPDFHQ(body);
        S.pdfUrl = res?.pdfUrl || null;
        S.hqUrl = res?.hqUrl || null;
      } else {
        // Fallback: POST padrão
        const base = apiBase().replace(/\/+$/, '');
        const url = base + '/jornada/finalizar';

        console.log(`[${MOD}] Chamando API final:`, url);

        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }

        const data = await r.json().catch(() => ({}));
        S.pdfUrl = data?.pdfUrl || null;
        S.hqUrl = data?.hqUrl || null;
      }

      // Se a API não retornar links, gera JSON local como fallback simbólico
      if (!S.pdfUrl && !S.hqUrl) {
        console.warn(`[${MOD}] Nenhum link recebido da API; gerando JSON local de fallback.`);
        const blob = new Blob(
          [JSON.stringify(body, null, 2)],
          { type: 'application/json' }
        );
        S.pdfUrl = URL.createObjectURL(blob);
      }

      window.toast?.('Sua devolutiva está pronta para download.');
      enableDownloadButton(true);
    } catch (e) {
      console.error('[FINAL] Falha ao gerar PDF/HQ:', e);
      window.toast?.('Não foi possível gerar os arquivos agora. Tente novamente mais tarde.');
      enableDownloadButton(false);
    } finally {
      S.generating = false;
    }
  }

  function enableDownloadButton(enabled) {
    const btn = $(BTN_DL_SEL);
    if (btn) btn.disabled = !enabled;
  }

  function downloadAll() {
    if (S.pdfUrl) triggerDownload(S.pdfUrl, 'jornada-conhecimento-com-luz.pdf');
    if (S.hqUrl) triggerDownload(S.hqUrl, 'hq-irmandade.zip');

    if (!S.pdfUrl && !S.hqUrl) {
      window.toast?.('Ainda não há arquivos disponíveis para baixar.');
    }
  }

  function triggerDownload(url, filename) {
    if (!url) return;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || '';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.warn('[FINAL] Download direto falhou; abrindo em nova aba:', e);
      window.open(url, '_blank', 'noopener');
    }
  }

  // Detecta função global de transição de vídeo usada no resto da jornada
  function getTransitionFn() {
    if (typeof window.playVideoTransition === 'function') return window.playVideoTransition;
    if (typeof window.playTransitionThenGo === 'function') return window.playTransitionThenGo;
    return null;
  }

  function finishFlow() {
    try {
      // Se quiser limpar dados locais depois da finalização, descomente:
      // delete window.__SELFIE_DATA_URL__;
      // delete window.__QA_ANSWERS__;
      // delete window.__QA_META__;
    } catch (e) {
      console.warn('[FINAL] Erro ao limpar estado local:', e);
    }

    const fn = getTransitionFn();
    const hasNext = !!document.getElementById(NEXT_SECTION_ID);

    // 1) Se tiver função de vídeo + fonte, usa filme final + volta para home
    if (fn && VIDEO_SRC && hasNext) {
      console.log(`[${MOD}] Encerrando com vídeo final:`, VIDEO_SRC, '→', NEXT_SECTION_ID);
      try {
        fn(VIDEO_SRC, NEXT_SECTION_ID);
        return;
      } catch (e) {
        console.error('[FINAL] Erro na transição com vídeo final:', e);
      }
    }

    // 2) Sem vídeo ou falhou: usa controlador da jornada
    if (window.JC?.finish) {
      console.log(`[${MOD}] Encerrando via JC.finish()`);
      window.JC.finish();
      return;
    }

    if (window.JC?.show && hasNext) {
      console.log(`[${MOD}] Encerrando via JC.show(${NEXT_SECTION_ID})`);
      window.JC.show(NEXT_SECTION_ID);
      return;
    }

    if (typeof window.showSection === 'function' && hasNext) {
      console.log(`[${MOD}] Encerrando via showSection(${NEXT_SECTION_ID})`);
      window.showSection(NEXT_SECTION_ID);
      return;
    }

    // 3) Último recurso: âncora
    if (hasNext) {
      console.log(`[${MOD}] Encerrando via hash #${NEXT_SECTION_ID}`);
      window.location.hash = `#${NEXT_SECTION_ID}`;
    }
  }

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

    // Garante que qualquer transição anterior terminou antes de disparar geração
    await waitForTransitionUnlock();
    enableDownloadButton(false);

    // Gera automaticamente assim que a seção final é exibida
    generateArtifacts();
  }

  // Quando o controlador carregar a section-final
  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    if (!node) return;
    bindSection(node);
  });

  // Fallback: se abrir direto na final (hash, etc.)
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && (sec.classList.contains('active') || window.__currentSectionId === SECTION_ID)) {
      bindSection(sec);
    }
  });

  // Exposição para debug manual no console
  window.JFinal = {
    generate: generateArtifacts,
    download: downloadAll,
    finish: finishFlow,
  };

  console.log(`[${MOD}] carregado`);
})();
