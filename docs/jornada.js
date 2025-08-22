// ===============================
// jornada.js - Orquestrador suave
// ===============================

(() => {
  // garante que os módulos base estão presentes
  if (typeof QUESTIONS === 'undefined') {
    console.error('QUESTIONS não encontrado. Verifique se questions.js foi carregado antes.');
    return;
  }
  if (typeof STATE === 'undefined') {
    console.error('STATE não encontrado. Verifique se state.js foi carregado antes.');
    return;
  }

  // seções
  const secIntro  = document.getElementById('sec-intro');
  const secWizard = document.getElementById('sec-wizard');
  const secFinal  = document.getElementById('sec-final');

  // botões
  const btnIniciar   = document.getElementById('btnIniciar');
  const btnFinalizar = document.getElementById('btnFinalizar');
  const btnRevisar   = document.getElementById('btnRevisar');
  const btnLimpar    = document.getElementById('btnLimparRespostas');
  const btnDownload  = document.getElementById('btnBaixarPDFHQ');

  // fluxo de telas
  function hide(sec) {
    if (!sec) return;
    const active = document.activeElement;
    if (active && sec.contains(active)) active.blur();
    sec.classList.add('hidden');
    sec.setAttribute('aria-hidden','true');
  }
  function show(sec) {
    if (!sec) return;
    sec.classList.remove('hidden');
    sec.removeAttribute('aria-hidden');
  }
  function goIntro()  { hide(secWizard); hide(secFinal);  show(secIntro); }
  function goWizard() { hide(secIntro);  hide(secFinal);  show(secWizard); }
  function goFinal()  { hide(secIntro);  hide(secWizard); show(secFinal); }

  // inicialização
  document.addEventListener('DOMContentLoaded', () => {
    // Decide se mostra final ou wizard
    if (STATE.finished) {
      goFinal();
    } else {
      secIntro ? goIntro() : goWizard();
    }

    // liga botões
    btnIniciar   && btnIniciar.addEventListener('click', () => goWizard());
    btnFinalizar && btnFinalizar.addEventListener('click', () => goFinal());
    btnRevisar   && btnRevisar.addEventListener('click', () => goWizard());
    btnLimpar    && btnLimpar.addEventListener('click', () => {
      if (confirm("Tem certeza que deseja limpar todas as respostas?")) {
        if (typeof clearState === 'function') clearState();
        goWizard();
      }
    });
    btnDownload  && btnDownload.addEventListener('click', async (e) => {
      if (typeof hasEnoughAnswers === 'function' && !hasEnoughAnswers()) {
        e.preventDefault();
        alert("Responda o questionário antes de gerar o PDF/HQ 🙏");
        goWizard();
        return;
      }
      if (typeof window.generatePDFandHQ === 'function') {
        await window.generatePDFandHQ(STATE.answers);
      } else {
        alert("Função generatePDFandHQ não encontrada!");
      }
    });
  });
})();
