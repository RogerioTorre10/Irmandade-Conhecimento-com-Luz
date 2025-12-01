/* section-final.js — FINAL v2.0 (voz + datilografia + PDF/HQ + vídeo externo) */
(function () {
  'use strict';

  const SECTION_ID = 'section-final';
  const HOME_URL   = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';

  let started = false;

  // ---------------------------------------
  // Utilitários
  // ---------------------------------------

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Fila de fala: garante sincronismo da leitura por parágrafo
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!('speechSynthesis' in window) || !text) return Promise.resolve();

    speechChain = speechChain.then(() => new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang   = 'pt-BR';
      utter.rate   = 0.9;
      utter.pitch  = 1;
      utter.volume = 0.9;
      utter.onend   = resolve;
      utter.onerror = resolve;
      window.speechSynthesis.speak(utter);
    }));

    return speechChain;
  }

  async function typeText(el, text, delay = 55, withVoice = false) {
    if (!el || !text) return;

    el.textContent = '';
    el.style.opacity = '1';
    el.classList.add('typing-active');

    // Inicia leitura e datilografia juntas, mas só libera o próximo parágrafo
    // quando a leitura termina
    let speechPromise = Promise.resolve();
    if (withVoice) {
      speechPromise = queueSpeak(text);
    }

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) {
        await sleep(delay);
      }
    }

    // Espera a voz terminar antes de concluir este parágrafo
    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await sleep(200);
  }

  // ---------------------------------------
  // Sequência final (texto + voz + botões)
  // ---------------------------------------

  async function startFinalSequence() {
    if (started) return;
    started = true;

    try {
      document.body.classList.add('final-lock');
    } catch (e) {
      console.warn('[FINAL] Não consegui aplicar final-lock no <body>.', e);
    }

    // Reseta qualquer fala pendente de outras seções
    try {
      window.speechSynthesis && window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('[FINAL] Erro ao cancelar speech anterior.', e);
    }
    speechChain = Promise.resolve();

    const section   = document.getElementById(SECTION_ID);
    const titleEl   = document.getElementById('final-title');
    const messageEl = document.getElementById('final-message');
    const botoes    = document.querySelector('.final-acoes');

    if (!section || !titleEl || !messageEl) {
      console.warn('[FINAL] Elementos principais não encontrados.');
      return;
    }

    // PREPARA TÍTULO E PARÁGRAFOS
    const tituloOriginal =
      titleEl.getAttribute('data-original') ||
      titleEl.textContent.trim() ||
      'Gratidão por Caminhar com Luz';

    titleEl.setAttribute('data-original', tituloOriginal);
    titleEl.textContent = '';
    titleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(-16px)';

    const ps = messageEl.querySelectorAll('p');
    ps.forEach(p => {
      const txt = p.getAttribute('data-original') || p.textContent.trim();
      p.setAttribute('data-original', txt);
      p.textContent = '';
      p.style.opacity = '0';
      p.style.transform = 'translateY(10px)';
      p.classList.remove('revealed');
    });

    section.classList.add('show');
    await sleep(200);

    // TÍTULO (datilografa + lê, e só segue quando terminar de ler)
    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = '1';
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    // PARÁGRAFOS (um por vez: lê + datilografa juntos)
    for (let i = 0; i < ps.length; i++) {
      const p   = ps[i];
      const txt = p.getAttribute('data-original') || '';
      if (!txt) continue;

      p.style.transition = 'all 0.8s ease';
      p.style.opacity = '1';
      p.style.transform = 'translateY(0)';

      await typeText(p, txt, 55, true);
      p.classList.add('revealed');
      await sleep(300);
    }

    // BOTÕES APARECEM
    if (botoes) {
      botoes.style.opacity = '0';
      botoes.style.transform = 'scale(0.9)';
      botoes.style.transition = 'all 0.8s ease';
      botoes.style.pointerEvents = 'none';

      await sleep(400);

      botoes.classList.add('show');
      botoes.style.opacity = '1';
      botoes.style.transform = 'scale(1)';

      botoes.querySelectorAll('button, a').forEach(el => {
        el.disabled = false;
        el.classList.remove('disabled');
        el.removeAttribute('aria-disabled');
        el.style.pointerEvents = 'auto';
      });

      console.log('[FINAL] Botões liberados. Aguardando clique do participante.');
    }

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  // ---------------------------------------
  // Geração de PDF / HQ
  // ---------------------------------------

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
          answers: window.JornadaAnswers || { teste: 'finalizado' },
          meta: { finishedAt: new Date().toISOString() },
          lang: 'pt-BR'
        })
      });

      const data = await res.json().catch(() => ({}));

      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl)  window.open(data.hqUrl, '_blank');

      if (!data.pdfUrl && !data.hqUrl) {
        alert('Jornada concluída! PDF/HQ em breve disponível.');
      }
    } catch (e) {
      console.error('[FINAL] Erro ao gerar PDF/HQ:', e);
      alert('Erro temporário. Tente novamente em 10s.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // ---------------------------------------
  // Saída: vídeo de transição (via módulo externo)
  // ---------------------------------------

  function handleVoltarInicio() {
    console.log('[FINAL] Clique em Voltar ao Início.');

    // Preferência: função global gerenciada por video-transicao.js
    if (typeof window.playVideoTransicaoFinal === 'function') {
      try {
        window.playVideoTransicaoFinal();
        return;
      } catch (e) {
        console.error('[FINAL] Erro ao chamar playVideoTransicaoFinal():', e);
      }
    }

    // Fallback de segurança: vai direto para o portal
    window.location.href = HOME_URL;
  }

  // ---------------------------------------
  // LISTENERS GERAIS
  // ---------------------------------------

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

  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && (sec.classList.contains('show') || getComputedStyle(sec).display !== 'none')) {
      startFinalSequence();
    }
  });

})();
