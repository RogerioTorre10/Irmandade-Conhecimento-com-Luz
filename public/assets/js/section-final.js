/* section-final.js — FINAL v3.1 (blindado: voz + datilografia + PDF/HQ + vídeo externo) */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const HOME_URL   = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ----------------------- VOZ + DATILOGRAFIA -----------------------
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!window.speechSynthesis || !text) return Promise.resolve();
    speechChain = speechChain.then(() => new Promise(resolve => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang   = 'pt-BR';
      u.rate   = 0.9;
      u.pitch  = 1;
      u.volume = 0.9;
      u.onend   = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
    }));
    return speechChain;
  }

  async function typeText(el, text, delay = 55, withVoice = false) {
    if (!el || !text) return;

    el.textContent = '';
    el.style.opacity = '1';
    el.classList.add('typing-active');

    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) await sleep(delay);
    }

    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await sleep(200);
  }

  // ----------------------- GARANTIR DOM FINAL -----------------------

  function ensureFinalDOM() {
    const section = document.getElementById(SECTION_ID);
    if (!section) return { section: null, titleEl: null, msgEl: null, botoes: null };

    // container principal
    let container =
      section.querySelector('.final-container') ||
      section.querySelector('.final-pergaminho-wrap') ||
      section.querySelector('.final-inner');

    if (!container) {
      container = document.createElement('div');
      container.className = 'final-container';
      section.appendChild(container);
    }

    // título
    let titleEl = document.getElementById('final-title');
    if (!titleEl) {
      titleEl = document.createElement('h2');
      titleEl.id = 'final-title';
      titleEl.dataset.original = 'Gratidão por Caminhar com Luz';
      container.appendChild(titleEl);
    } else if (!titleEl.dataset.original && !titleEl.textContent.trim()) {
      titleEl.dataset.original = 'Gratidão por Caminhar com Luz';
    }

    // mensagem
    let msgEl = document.getElementById('final-message');
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.id = 'final-message';
      container.appendChild(msgEl);
    }

    // se não houver parágrafos, cria dois padrão
    let ps = msgEl.querySelectorAll('p');
    if (!ps.length) {
      const p1 = document.createElement('p');
      p1.dataset.original = 'Suas respostas foram recebidas com honra pela Irmandade.';
      msgEl.appendChild(p1);

      const p2 = document.createElement('p');
      p2.dataset.original = 'Você ativou sementes de confiança, coragem e luz.';
      msgEl.appendChild(p2);

      ps = msgEl.querySelectorAll('p');
    } else {
      ps.forEach(p => {
        if (!p.dataset.original) {
          const txt = p.textContent.trim();
          if (txt) p.dataset.original = txt;
        }
      });
    }

    // ações
    let botoes =
      section.querySelector('.final-acoes') ||
      section.querySelector('.final-actions');

    if (!botoes) {
      botoes = document.createElement('div');
      botoes.className = 'final-acoes';
      container.appendChild(botoes);
    }

    // botão PDF/HQ
    let btnPDF = document.getElementById('btnBaixarPDFHQ');
    if (!btnPDF) {
      btnPDF = document.createElement('button');
      btnPDF.id = 'btnBaixarPDFHQ';
      btnPDF.className = 'btn btn-stone';
      btnPDF.textContent = 'Baixar PDF / HQ';
      botoes.appendChild(btnPDF);
    }

    // botão voltar
    let btnVoltar = document.getElementById('btnVoltarInicio');
    if (!btnVoltar) {
      btnVoltar = document.createElement('button');
      btnVoltar.id = 'btnVoltarInicio';
      btnVoltar.className = 'btn btn-gold';
      btnVoltar.textContent = 'Voltar ao Início';
      botoes.appendChild(btnVoltar);
    }

    return { section, titleEl, msgEl, botoes };
  }

  // ----------------------- SEQUÊNCIA FINAL -----------------------

  let started = false;

  async function startFinalSequence() {
    if (started) return;
    started = true;

    try { speechSynthesis.cancel(); } catch {}

    const { section, titleEl, msgEl, botoes } = ensureFinalDOM();
    if (!section || !titleEl || !msgEl || !botoes) return;

    const titulo = titleEl.dataset.original || titleEl.textContent.trim() || 'Gratidão por Caminhar com Luz';
    titleEl.textContent = '';
    titleEl.style.opacity = 0;

    const ps = msgEl.querySelectorAll('p');
    ps.forEach(p => {
      const txt = p.dataset.original || p.textContent.trim();
      p.dataset.original = txt;
      p.textContent = '';
      p.style.opacity = 0;
    });

    await sleep(200);

    // título
    titleEl.style.transition = 'all .9s ease';
    titleEl.style.opacity = 1;
    await typeText(titleEl, titulo, 65, true);
    await sleep(400);

    // parágrafos
    for (const p of ps) {
      p.style.transition = 'all .8s ease';
      p.style.opacity = 1;
      await typeText(p, p.dataset.original, 55, true);
      await sleep(200);
    }

    // botões
    botoes.style.opacity = 0;
    botoes.style.transform = 'scale(0.9)';
    botoes.style.transition = 'all .8s ease';
    await sleep(300);
    botoes.classList.add('show');
    botoes.style.opacity = 1;
    botoes.style.transform = 'scale(1)';
  }

  // ----------------------- PDF / HQ -----------------------

  async function generateArtifacts() {
    const btn = document.getElementById('btnBaixarPDFHQ');
    if (!btn || btn.dataset.loading === '1') return;

    btn.dataset.loading = '1';
    const original = btn.textContent;
    btn.textContent = 'Gerando sua Jornada...';
    btn.disabled = true;

    try {
      const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: window.JornadaAnswers || {},
          meta: { finishedAt: new Date().toISOString() },
          lang: 'pt-BR'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl)  window.open(data.hqUrl, '_blank');
      if (!data.pdfUrl && !data.hqUrl) {
        alert('PDF/HQ estarão disponíveis em instantes.');
      }
    } catch (e) {
      console.error('[FINAL] Erro ao gerar PDF/HQ:', e);
      alert('Erro temporário. Tente novamente em alguns segundos.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

 // ----------------------- VÍDEO DE SAÍDA (PORTAL) -----------------------
let finalReturning = false;

function handleVoltarInicio() {
  if (finalReturning) {
    console.log('[FINAL] Voltar ao Início já em andamento, ignorando clique extra.');
    return;
  }
  finalReturning = true;

  console.log('[FINAL] Voltar ao Início acionado.');

  const finalMovie = '/assets/videos/filme-5-fim-da-jornada.mp4';

  // 1) PREFERENCIAL: player cinematográfico global
  if (typeof window.playVideo === 'function') {
    window.playVideo(finalMovie, {
      useGoldBorder: true,
      pulse: true,
      onEnded: () => {
        console.log('[FINAL] Vídeo final concluído, redirecionando para portal.html...');
        window.location.href = HOME_URL;
      }
    });
    return;
  }

  // 2) FALLBACK: sem vídeo, vai direto pro portal
  window.location.href = HOME_URL;
}


  // ----------------------- EVENTOS -----------------------

  document.addEventListener('section:shown', e => {
    const id = e.detail?.sectionId || e.detail;
    if (id === SECTION_ID) {
      startFinalSequence();
    }
  });

  document.addEventListener('click', e => {
    const t = e.target;

    if (t.id === 'btnBaixarPDFHQ' || t.closest('#btnBaixarPDFHQ')) {
      e.preventDefault();
      generateArtifacts();
      return;
    }

    if (t.id === 'btnVoltarInicio' || t.closest('#btnVoltarInicio')) {
      e.preventDefault();
      handleVoltarInicio();
      return;
    }
  });

  // ------------------ EVENTO QUE DISPARA A PÁGINA FINAL ------------------
document.addEventListener('section:shown', e => {
  const id = e.detail?.sectionId || e.detail;
  if (id === SECTION_ID) {
    console.log('[FINAL] section:shown recebido para section-final, iniciando sequência...');
    startFinalSequence();
  }
});

})();
