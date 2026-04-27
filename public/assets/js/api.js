/* ============================================
/* API.js — Irmandade Conhecimento com Luz (BLINDADO)
/* Geração de PDF com SelfieCard + Respostas
/* + Reset completo da jornada
/* + Blindagem da devolutiva por pergunta
/* ============================================ */

(function () {
  'use strict';

  function ensureUTF8(obj) {
  try {
    return JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (typeof value === 'string') {
          return value.normalize('NFC');
        }
        return value;
      })
    );
  } catch {
    return obj;
  }
}

  function normalizeBase(u) {
    return String(u || '').trim().replace(/\/+$/, '');
  }

  function pickApiBase() {
    const cfg = (window.APP_CONFIG && window.APP_CONFIG.API_BASE)
      ? window.APP_CONFIG.API_BASE
      : '';

    if (cfg) return normalizeBase(cfg);
    if (window.API_BASE) return normalizeBase(window.API_BASE);

    return normalizeBase('https://lumen-backend-api.onrender.com/api');
  }

  const API_PRIMARY = pickApiBase();
  const PDF_PATHS = [
  '/jornada/essencial/pdf',
  '/jornada-essencial/pdf',
  '/pdf',
  '/gerar-pdf'
 ];

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }  

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'jornada.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function isPdf(res) {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    return ct.includes('application/pdf');
  }

  function safeGetJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  }

  function safeRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
    try { sessionStorage.removeItem(key); } catch (_) {}
  }

  async function postJSON(base, path, payload, timeout = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const contentType = (res.headers.get('content-type') || '').toLowerCase();

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}${txt ? ` - ${txt.slice(0, 180)}` : ''}`);
    }

    if (contentType.includes('application/pdf')) {
      return { data: await res.blob(), response: res };
    }

    if (contentType.includes('application/json')) {
      return { data: await res.json(), response: res };
    }

    return { data: await res.blob(), response: res };
  } catch (err) {
    console.error('[API] postJSON erro:', err);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

  function resetJornadaCompleta() {
    try {
      const keysDiretas = [
        'jornada_respostas',
        'jornada_resposta_atual',
        'jornada_dados_pessoais',
        'jornada_guia',
        'jornada_nome',
        'jornada_progresso',
        'jornada_bloco_atual',
        'jornada_pergunta_atual',
        'jornada_devolutivas',
        'jornada_block_feedbacks',
        'jornada_final_feedback',
        'jornada_card',
        'jornada_selfie',
        'jornada_started_at',
        'selectedGuide',
        'guideName',
        'userName',
        'currentQuestion',
        'currentBlock',
        'answers',
        'answerDraft',
        'feedbackAtual',
        'selfieBase64',
        'JORNADA_SELFIECARD',
        'JORNADA_SELFIE',
        'JORNADA_RESPOSTAS',
        'JORNADA_DADOS',
        'JORNADA_GUIA',
        'JORNADA_FINAL',
        'JORNADA_BLOCOS'
      ];

      keysDiretas.forEach(safeRemove);

      const prefixes = ['jornada_', 'jc_', 'lumen_', 'lumem_', 'JORNADA_'];

      Object.keys(localStorage).forEach((key) => {
        if (prefixes.some((p) => key.startsWith(p))) {
          try { localStorage.removeItem(key); } catch (_) {}
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (prefixes.some((p) => key.startsWith(p))) {
          try { sessionStorage.removeItem(key); } catch (_) {}
        }
      });

      window.__JORNADA_STATE__ = null;
      window.JornadaState = null;
      window.__BLOCK_FEEDBACKS__ = {};
      window.__FINAL_FEEDBACK__ = null;
      window.__RESPOSTA_ATUAL__ = null;
      window.__DEVOLUTIVA_ATUAL__ = null;
      window.__LAST_DEVOLUTIVA_PAYLOAD__ = null;
      window.__LAST_BLOCK_PAYLOAD__ = null;

      if ('speechSynthesis' in window) {
        try { window.speechSynthesis.cancel(); } catch (_) {}
      }

      console.log('[API][RESET] Jornada limpa com sucesso.');
      return true;
    } catch (err) {
      console.error('[API][RESET] Falha ao limpar jornada:', err);
      return false;
    }
  }

  function voltarELimpar(destino = '/jornadas.html') {
    resetJornadaCompleta();
    window.location.href = destino;
  }

  function sanitizePdfPayload(payload) {
    return {
      ...(payload || {}),
      selfieCard:
        payload?.selfieCard ||
        localStorage.getItem('selfieBase64') ||
        null
    };
  }

  function sanitizePerguntaPayload(payload) {
    const p = { ...(payload || {}) };

    let respostaAtual = '';
    if (typeof p.resposta === 'string' && p.resposta.trim()) {
      respostaAtual = p.resposta.trim();
    } else if (typeof p.answer === 'string' && p.answer.trim()) {
      respostaAtual = p.answer.trim();
    } else if (typeof p.respostaAtual === 'string' && p.respostaAtual.trim()) {
      respostaAtual = p.respostaAtual.trim();
    }

    if (!respostaAtual) {
      const draftStorage =
        sessionStorage.getItem('jornada_resposta_atual') ||
        localStorage.getItem('jornada_resposta_atual') ||
        '';

      if (draftStorage && draftStorage.trim()) {
        respostaAtual = draftStorage.trim();
      }
    }

    delete p.respostas;
    delete p.answers;
    delete p.respostasAnteriores;
    delete p.respostas_bloco;
    delete p.allAnswers;
    delete p.historicoRespostas;

    p.resposta = respostaAtual;

    console.log('[API][DEVOLUTIVA][PAYLOAD_SANITIZADO]', {
      pergunta: p.pergunta || '',
      resposta: p.resposta || '',
      bloco: p.bloco || p.blocoId || '',
      guia: p.guia || '',
      nome: p.nome || '',
      dadosPessoais: p.dadosPessoais || null
  });

    window.__LAST_DEVOLUTIVA_PAYLOAD__ = p;
    return p;
  }

  function sanitizeBlocoPayload(payload) {
    const p = { ...(payload || {}) };

    if (!Array.isArray(p.respostas)) {
      const respostasStorage =
        safeGetJSON('jornada_respostas', null) ||
        safeGetJSON('JORNADA_RESPOSTAS', null);

      if (Array.isArray(respostasStorage) && respostasStorage.length) {
        p.respostas = respostasStorage;
      }
    }

    window.__LAST_BLOCK_PAYLOAD__ = p;
    return p;
  }

  async function gerarPDFEHQ(payload) {
  const safePayload = sanitizePdfPayload(payload || {});

  const fileName =
    (safePayload.nome || 'jornada')
      .toString()
      .replace(/[^\p{L}\p{N}_-]+/gu, '_')
      .slice(0, 40);

  const fname = `${fileName}-${new Date().toISOString().slice(0, 10)}.pdf`;

  const PDF_PATHS = [
    '/jornada/essencial/pdf',
    '/jornada/pdf',
    '/jornada-essencial/pdf',
    '/pdf',
    '/gerar-pdf'
  ];

  let lastError = null;

  for (const path of PDF_PATHS) {
    try {
      console.log('[PDF] tentando:', `${API_PRIMARY}${path}`);
      
      await sleep(400);

      const { data, response } = await postJSON(API_PRIMARY, path, safePayload, 60000);

  if (data instanceof Blob) {
    const size = data.size || 0;
    const type = String(data.type || '').toLowerCase();

    console.log('[PDF] blob recebido:', {
      path,
      status: response?.status,
      type,
      size
  });

  if (!size || size < 15000 || !type.includes('pdf')) {
    console.error('[PDF] bloqueado: blob inválido ou incompleto', { size, type, path });
    lastError = new Error(`PDF incompleto em ${path}. Size=${size}`);
    await sleep(900);
    continue;
  }

  triggerDownload(data, fname);

  return {
    ok: true,
    path,
    blob: data,
    size
  };
}

      if (data && typeof data === 'object' && data.url) {
        console.log('[PDF] sucesso via url:', path, data.url);
        window.open(data.url, '_blank');
        return { ok: true, path };
      }

      if (data && typeof data === 'object' && data.ok && data.pdf_url) {
        console.log('[PDF] sucesso via pdf_url:', path, data.pdf_url);
        window.open(data.pdf_url, '_blank');
        return { ok: true, path };
      }

      console.warn('[PDF] resposta sem blob/url:', path, data);
      lastError = new Error(`Resposta inesperada em ${path}`);
    } catch (e) {
      lastError = e;
      console.warn('[PDF] tentativa falhou:', path, e?.message || e);
      await sleep(300);
    }
  }

  console.error('[PDF] nenhuma rota respondeu corretamente.', lastError);
  return {
    ok: false,
    error: String(lastError?.message || 'Nenhuma rota de PDF respondeu corretamente.')
  };
}
  
  async function gerarDevolutivaBase(payload, path) {
    try {
      const sanitized =
        path === '/jornada/devolutiva'
          ? sanitizePerguntaPayload(payload)
          : sanitizeBlocoPayload(payload);

      const { data } = await postJSON(API_PRIMARY, path, sanitized, 120000);

      return {
        ok: true,
        texto:
          data?.texto ||
          data?.devolutiva ||
          data?.devolutivaBloco ||
          data?.feedback ||
          data?.message ||
          '',
        guia: data?.guia || sanitized?.guia || 'lumen',
        raw: data
      };

    } catch (e) {
      console.warn('[API] erro devolutiva', {
        path,
        message: e?.message,
        status: e?.status,
        body: e?.body
      });

      return {
        ok: false,
        error: String(e?.message || 'Erro desconhecido')
      };
    }
  }

  function bindResetButton(selector = '[data-reset-jornada], #btn-voltar-portal, #btnVoltarPortal, #btn-voltar') {
    try {
      const btn = document.querySelector(selector);
      if (!btn) return false;

      if (btn.__resetJornadaBound__) return true;
      btn.__resetJornadaBound__ = true;

      btn.addEventListener('click', function () {
        console.log('[API][RESET] Clique no botão voltar detectado.');
        resetJornadaCompleta();
      });

      return true;
    } catch (err) {
      console.warn('[API][RESET] Não foi possível bindar botão de reset:', err);
      return false;
    }
  }

  window.API = window.API || {};

  window.API.gerarPDFEHQ = gerarPDFEHQ;
  window.API.resetJornadaCompleta = resetJornadaCompleta;
  window.API.voltarELimpar = voltarELimpar;
  window.API.bindResetButton = bindResetButton;
  window.API._sanitizePerguntaPayload = sanitizePerguntaPayload;
  window.API._sanitizeBlocoPayload = sanitizeBlocoPayload;

  window.API.gerarDevolutiva = (payload) =>
    gerarDevolutivaBase(payload, '/jornada/devolutiva');

  window.API.gerarDevolutivaBloco = (payload) =>
    gerarDevolutivaBase(payload, '/jornada/devolutiva-bloco');

  console.log('[API] BLINDADO OK →', API_PRIMARY);

  
})();
