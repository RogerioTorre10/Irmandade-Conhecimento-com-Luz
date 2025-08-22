<script>
// ==============================
// jornada.js — “bonitão & suave”
// ==============================

(() => {
  // ---- Config & Estado ----
  const CFG = window.JORNADA_CFG || {};
  const STORAGE_KEY = CFG.STORAGE_KEY || 'jornada_state_v1';

  const STATE = loadState() || { answers: {}, finished: false };

  const MIN_ANSWERS = 1; // mude para exigir mais respostas se quiser

  // ---- Util: storage ----
  function loadState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return { answers: {}, finished: false }; }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE)); }
    catch (e) { console.warn('Não foi possível salvar o estado:', e); }
  }
  function clearState() {
    STATE.answers = {};
    STATE.finished = false;
    saveState();
  }

  // ---- Seções & Botões ----
  const secIntro  = document.getElementById('sec-intro');
  const secWizard = document.getElementById('sec-wizard');
  const secFinal  = document.getElementById('sec-final');

  const btnIniciar   = document.getElementById('btnIniciar');
  const btnFinalizar = document.getElementById('btnFinalizar');
  const btnRevisar   = document.getElementById('btnRevisar');
  const btnLimpar    = document.getElementById('btnLimparRespostas');
  const btnDownload  = document.getElementById('btnBaixarPDFHQ');

  // ---- A11y: mostrar/esconder sem travar foco ----
  function hideSection(sec) {
    if (!sec) return;
    // desfoca se algo dentro está focado
    const active = document.activeElement;
    if (active && sec.contains(active)) active.blur();

    sec.classList.add('hidden');
    sec.setAttribute('aria-hidden', 'true');
    // tira do tab para leitores de tela/teclado
    sec.querySelectorAll('a,button,input,select,textarea,[tabindex]')
      .forEach(el => el.setAttribute('tabindex', '-1'));
  }
  function showSection(sec) {
    if (!sec) return;
    sec.classList.remove('hidden');
    sec.removeAttribute('aria-hidden');
    sec.querySelectorAll('a,button,input,select,textarea,[tabindex]')
      .forEach(el => el.removeAttribute('tabindex'));
    // foca no primeiro elemento "acionável"
    (sec.querySelector('[data-autofocus]') || sec.querySelector('button, input, textarea, select'))?.focus();
  }
  function goToIntro()  { hideSection(secWizard); hideSection(secFinal);  showSection(secIntro); }
  function goToWizard() { hideSection(secIntro);  hideSection(secFinal);  showSection(secWizard); }
  function goToFinal()  { hideSection(secIntro);  hideSection(secWizard); showSection(secFinal); }

  // ---- Respostas: captura, restaura, valida ----
  function hasEnoughAnswers() {
    return Object.keys(STATE.answers || {}).filter(k => notEmpty(STATE.answers[k])).length >= MIN_ANSWERS;
  }
  function notEmpty(v) { return v !== undefined && v !== null && String(v).trim() !== ''; }

  // Inputs: use data-qid="QX" em cada pergunta
  function bindAnswerCapture(root = document) {
    root.querySelectorAll('[data-qid]').forEach(el => {
      const qid = el.getAttribute('data-qid');
      const ev  = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') ? 'change' : 'input';
      el.addEventListener(ev, () => saveAnswerFromElement(el, qid));
    });
  }
  function saveAnswerFromElement(el, qid) {
    if (!qid) return;
    let value = '';
    if (el.type === 'checkbox') {
      // agrupa checkboxes com mesmo name
      const name = el.name;
      if (name) {
        value = Array.from(document.querySelectorAll(`input[type="checkbox"][name="${CSS.escape(name)}"]:checked`))
          .map(e => e.value);
      } else {
        value = el.checked;
      }
    } else if (el.type === 'radio') {
      const name = el.name;
      value = (name ? document.querySelector(`input[type="radio"][name="${CSS.escape(name)}"]:checked`)?.value : el.value) || '';
    } else {
      value = el.value;
    }

    STATE.answers[qid] = value;
    saveState();
    updateDownloadState();
  }

  function restoreAnswers(root = document) {
    Object.entries(STATE.answers || {}).forEach(([qid, val]) => {
      root.querySelectorAll(`[data-qid="${CSS.escape(qid)}"]`).forEach(el => {
        if (el.type === 'checkbox') {
          if (Array.isArray(val)) {
            // checkboxes por grupo (name)
            if (el.name) el.checked = val.includes(el.value);
            else el.checked = !!val;
          } else {
            el.checked = !!val;
          }
        } else if (el.type === 'radio') {
          el.checked = (String(el.value) === String(val));
        } else {
          el.value = Array.isArray(val) ? val.join(', ') : (val ?? '');
        }
      });
    });
  }

  // ---- Download habilitado somente com respostas ----
  function updateDownloadState() {
    if (!btnDownload) return;
    const ok = hasEnoughAnswers();
    btnDownload.disabled = !ok;
    btnDownload.setAttribute('aria-disabled', String(!ok));
  }

  // ---- Handlers de fluxo ----
  function onStart() {
    STATE.finished = false;
    saveState();
    goToWizard();
  }
  function onFinish() {
    if (!hasEnoughAnswers()) {
      alert('Responda o questionário antes de finalizar. 🙏');
      goToWizard();
      return;
    }
    STATE.finished = true;
    saveState();
    goToFinal();
  }
  function onReview() {
    STATE.finished = false;
    saveState();
    goToWizard();
  }
  function onClearAll() {
    if (!confirm('Tem certeza que deseja limpar todas as respostas? Esta ação não pode ser desfeita.')) return;
    clearState();
    // limpa DOM
    document.querySelectorAll('[data-qid]').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
      else el.value = '';
    });
    updateDownloadState();
    goToWizard();
  }
  async function onDownload(e) {
    if (!hasEnoughAnswers()) {
      e?.preventDefault();
      alert('Responda o questionário antes de gerar o PDF e a HQ. 🙏');
      goToWizard();
      return;
    }
    // Aqui você chama sua função real de geração
    if (typeof window.generatePDFandHQ === 'function') {
      try {
        btnDownload?.setAttribute('data-loading', 'true');
        await window.generatePDFandHQ(STATE.answers);
      } catch (err) {
        console.error(err);
        alert('Ocorreu um erro ao gerar o PDF/HQ. Tente novamente.');
      } finally {
        btnDownload?.removeAttribute('data-loading');
      }
    } else {
      alert('Função de geração de PDF/HQ não encontrada. Defina window.generatePDFandHQ(answers).');
    }
  }

  // ---- Inicialização ----
  document.addEventListener('DOMContentLoaded', () => {
    // garante que o wizard esteja visível quando necessário
    if (STATE.finished) {
      goToFinal();
    } else {
      // por padrão vamos para intro se existir, senão wizard
      if (secIntro) goToIntro(); else goToWizard();
    }

    bindAnswerCapture();
    restoreAnswers();
    updateDownloadState();

    // botões
    btnIniciar  && btnIniciar.addEventListener('click', onStart);
    btnFinalizar&& btnFinalizar.addEventListener('click', onFinish);
    btnRevisar  && btnRevisar.addEventListener('click', onReview);
    btnLimpar   && btnLimpar.addEventListener('click', onClearAll);
    btnDownload && btnDownload.addEventListener('click', onDownload);

    // segurança extra: se o wizard vier marcado como hidden no HTML, desfazemos
    if (secWizard) { secWizard.classList.remove('hidden'); secWizard.removeAttribute('aria-hidden'); }
  });

})();
</script>
