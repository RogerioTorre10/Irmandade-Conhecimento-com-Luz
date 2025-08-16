/* Jornada Conhecimento com Luz – utilidades globais
   Coloque este arquivo em: public/jornada.js
   Não inclua <script>...</script> aqui. Use <script src="/jornada.js"></script> nas páginas. */
(function () {
  'use strict';

  // =========================
  // CONFIG
  // =========================
  // Se quiser trocar em tempo de execução, defina window.API_BASE antes de carregar este arquivo.
  const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 'https://conhecimento-com-luz-api.onrender.com';

  // Endpoints possíveis no backend para geração do PDF (o código testa em ordem)
  const PDF_ENDPOINTS = ['/generate-pdf', '/pdf', '/api/pdf'];

  // =========================
  // HELPERS
  // =========================
  const toIsoStamp = () =>
    new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  const nomePDF = () => `Jornada_${toIsoStamp()}.pdf`;

  function baixarBlob(blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nomePDF();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }

  function baixarBase64(b64) {
    const a = document.createElement('a');
    a.href = 'data:application/pdf;base64,' + b64;
    a.download = nomePDF();
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function safeJSONParse(text, fallback) {
    try { return JSON.parse(text); } catch { return fallback; }
  }

  // Coleta respostas do storage (se você já as salva lá) ou tenta ler inputs visíveis como fallback.
  function coletarPayload() {
    // 1) Preferir storage
    let respostas = safeJSONParse(localStorage.getItem('respostas_jornada') || '{}', {});

    // 2) Fallback simples: varrer inputs da página se storage estiver vazio
    if (!respostas || (typeof respostas === 'object' && Object.keys(respostas).length === 0)) {
      respostas = {};
      const add = (key, val) => {
        if (!key) return;
        // se existirem múltiplos campos com o mesmo nome, vira array
        if (key in respostas) {
          if (!Array.isArray(respostas[key])) respostas[key] = [respostas[key]];
          respostas[key].push(val);
        } else {
          respostas[key] = val;
        }
      };
      document.querySelectorAll('input, textarea, select').forEach(el => {
        const key = el.name || el.id || '';
        if (!key) return;
        if (el.type === 'checkbox') add(key, !!el.checked);
        else if (el.type === 'radio') { if (el.checked) add(key, el.value); }
        else add(key, el.value);
      });
    }

    return {
      respostas,
      meta: {
        agente: 'Lumen',
        gerado_em: new Date().toISOString(),
        tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
      }
    };
  }

  // Limpa tudo e volta para a intro
  function resetarTotal() {
    // 1) Limpar campos visíveis
    document.querySelectorAll('input, textarea, select').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else el.value = '';
    });

    // 2) Limpar storages
    try { localStorage.removeItem('respostas_jornada'); } catch {}
    try { sessionStorage.removeItem('veio_da_intro'); } catch {}

    // 3) Voltar à intro
    location.href = '/jornada-intro.html'; // troque para 'jornada-intro.html' se o site estiver em subpasta
  }

  // =========================
  // PDF
  // =========================
  async function gerarPDF(dados) {
    let lastErr;

    for (const ep of PDF_ENDPOINTS) {
      try {
        const res = await fetch(API_BASE + ep, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json,application/pdf'
          },
          body: JSON.stringify(dados || {})
        });

        const ct = (res.headers.get('content-type') || '').toLowerCase();

        // Caso o backend devolva application/pdf direto
        if (res.ok && ct.includes('application/pdf')) {
          const blob = await res.blob();
          baixarBlob(blob);
          return;
        }

        // Caso devolva JSON com base64
        const json = await res.json().catch(() => ({}));
        const base64 = json.pdf_base64 || json.file || json.pdf;
        if (base64) {
          baixarBase64(base64);
          return;
        }

        throw new Error(`Resposta inesperada de ${ep}`);
      } catch (e) {
        lastErr = e;
        // tenta o próximo endpoint
      }
    }

    throw lastErr || new Error('Falha ao gerar PDF');
  }

  // =========================
  // EXPOSE
  // =========================
  // Disponibiliza no escopo global para você chamar de qualquer página:
  //   window.JornadaUtil.gerarPDF(payload)
  //   window.JornadaUtil.coletarPayload()
  //   window.JornadaUtil.resetarTotal()
  window.JornadaUtil = {
    gerarPDF,
    coletarPayload,
    resetarTotal,
    // utilitários extras, caso queira usar
    _config: { API_BASE, PDF_ENDPOINTS }
  };
})();

