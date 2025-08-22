// jornada.js — orquestrador
(() => {
  const secIntro  = document.getElementById('sec-intro');
  const secWizard = document.getElementById('sec-wizard');
  const secFinal  = document.getElementById('sec-final');

  const btnIniciar   = document.getElementById('btnIniciar');
  const btnFinalizar = document.getElementById('btnFinalizar');
  const btnRevisar   = document.getElementById('btnRevisar');
  const btnLimpar    = document.getElementById('btnLimparRespostas');
  const btnDownload  = document.getElementById('btnBaixarPDFHQ');

  function hide(sec){
    if(!sec) return;
    const a = document.activeElement;
    if (a && sec.contains(a)) a.blur();
    sec.classList.add('hidden');
    sec.setAttribute('aria-hidden','true');
    sec.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el => el.setAttribute('tabindex','-1'));
  }
  function show(sec){
    if(!sec) return;
    sec.classList.remove('hidden');
    sec.removeAttribute('aria-hidden');
    sec.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(el => el.removeAttribute('tabindex'));
  }
  function goIntro(){  hide(secWizard); hide(secFinal);  show(secIntro);  }
  function goWizard(){ hide(secIntro);  hide(secFinal);  show(secWizard); }
  function goFinal(){  hide(secIntro);  hide(secWizard); show(secFinal);  }

  function hasEnoughAnswers(){
    const ans = window.STATE?.answers || {};
    return Object.keys(ans).some(k => {
      const v = ans[k];
      return v !== undefined && v !== null && String(v).trim() !== '';
    });
  }

  // Função de geração (só define se não existir uma sua)
  window.generatePDFandHQ = window.generatePDFandHQ || (async function(answers){
    const url = `${window.API_BASE}/generate`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ answers })
    });
    if (!resp.ok) throw new Error(`Erro ${resp.status}`);
    const data = await resp.json();
    alert('Geração solicitada: ' + (data.message || 'OK'));
    // TODO: lidar com retorno real (URL de download, base64 etc.)
  });

  document.addEventListener('DOMContentLoaded', () => {
    if (window.STATE?.finished) goFinal();
    else secIntro ? goIntro() : goWizard();

    // Caso o wizard tenha vindo escondido por markup
    if (secWizard){ secWizard.classList.remove('hidden'); secWizard.removeAttribute('aria-hidden'); }

    btnIniciar?.addEventListener('click', () => {
      window.STATE.finished = false; window.saveState(); goWizard();
    });

    btnFinalizar?.addEventListener('click', () => {
      if (!hasEnoughAnswers()){
        alert('Responda o questionário antes de finalizar. 🙏'); goWizard(); return;
      }
      window.STATE.finished = true; window.saveState(); goFinal();
    });

    btnRevisar?.addEventListener('click', () => {
      window.STATE.finished = false; window.saveState(); goWizard();
    });

    btnLimpar?.addEventListener('click', () => {
      if (!confirm('Limpar TODAS as respostas?')) return;
      window.clearState();
      document.querySelectorAll('[data-qid]').forEach(el=>{
        if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
        else el.value = '';
      });
      goWizard();
    });

    btnDownload?.addEventListener('click', async (e) => {
      if (!hasEnoughAnswers()){
        e.preventDefault();
        alert('Responda o questionário antes de gerar o PDF e a HQ. 🙏');
        goWizard(); return;
      }
      try {
        btnDownload.setAttribute('disabled','true');
        btnDownload.setAttribute('aria-disabled','true');
        await window.generatePDFandHQ(window.STATE.answers);
      } catch (err) {
        console.error(err);
        alert('Erro ao gerar PDF/HQ. Tente novamente.');
      } finally {
        btnDownload.removeAttribute('disabled');
        btnDownload.removeAttribute('aria-disabled');
      }
    });
  });
})();
