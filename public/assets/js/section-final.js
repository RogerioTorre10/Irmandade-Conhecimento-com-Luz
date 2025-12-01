/* /assets/js/section-final.js — v5
 * Página final da Jornada Essencial
 * - Datilografia + voz
 * - Botões de PDF/HQ
 * - Vídeo final de retorno ao portal usando player global
 */

(function () {
  'use strict';

  const SECTION_ID   = 'section-final';
  const HOME_URL     = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';
  const FINAL_MOVIE  = '/assets/videos/filme-5-fim-da-jornada.mp4';

  let started = false;

  // Utilitário de pausa
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Fila de fala: garante que um parágrafo termina antes do outro
  let speechChain = Promise.resolve();

  function queueSpeak(text) {
    if (!('speechSynthesis' in window) || !text) return Promise.resolve();

    speechChain = speechChain.then(() => new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang   = 'pt-BR';
      utter.rate   = 0.9;
      utter.pitch  = 1;
      utter.volume = 0.9;
      utter.onend  = resolve;
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

    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) {
        // pequena pausa para não pesar
        // eslint-disable-next-line no-await-in-loop
        await sleep(delay);
      }
    }

    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await sleep(200);
  }

  function ensureFinalDOM() {
    const section = document.getElementById(SECTION_ID);
    if (!section) return {};

    const titleEl   = section.querySelector('#final-title');
    const msgEl     = section.querySelector('#final-message');
    const botoes    = section.querySelector('.final-acoes');

    return { section, titleEl, msgEl, botoes };
  }

  // ------------------------ SEQUÊNCIA FINAL ------------------------
  async function startFinalSequence() {
    if (started) return;
    started = true;

    try { speechSynthesis.cancel(); } catch (e) {}
    speechChain = Promise.resolve();

    const { section, titleEl, msgEl, botoes } = ensureFinalDOM();
    if (!section || !titleEl || !msgEl) return;

    // Garante que a seção esteja visível (mesmo que tenha vindo com style="display:none")
    section.style.display = 'block';

    const tituloOriginal =
      titleEl.dataset.original ||
      titleEl.textContent.trim() ||
      'Gratidão por Caminhar com Luz';

    titleEl.dataset.original = tituloOriginal;
    titleEl.textContent = '';
    titleEl.style.opacity = 0;
    titleEl.style.transform = 'translateY(-16px)';

    const ps = msgEl.querySelectorAll('p');
    ps.forEach(p => {
      const txt = p.dataset.original || p.textContent.trim();
      p.dataset.original = txt;
      p.textContent = '';
      p.style.opacity = 0;
      p.style.transform = 'translateY(10px)';
      p.classList.remove('revealed');
    });

    section.classList.add('show');
    await sleep(200);

    // TÍTULO
    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = 1;
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    // PARÁGRAFOS (um por vez)
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const txt = p.dataset.original || '';
      if (!txt) continue;
      p.style.transition = 'all 0.8s ease';
      p.style.opacity = 1;
      p.style.transform = 'translateY(0)';
      // eslint-disable-next-line no-await-in-loop
      await typeText(p, txt, 55, true);
      p.classList.add('revealed');
      // eslint-disable-next-line no-await-in-loop
      await sleep(300);
    }

    // BOTÕES
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
    }

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  // ------------------------ PDF / HQ ------------------------
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
          answers: window.JornadaAnswers || window.__QA_ANSWERS__ || { teste: 'finalizado' },
          meta: window.__QA_META__ || { finishedAt: new Date().toISOString() },
          lang: 'pt-BR'
        })
      });

      const data = await res.json().catch(() => ({}));
      if (data.pdfUrl) window.open(data.pdfUrl, '_blank');
      if (data.hqUrl) window.open(data.hqUrl, '_blank');
      if (!data.pdfUrl && !data.hqUrl) {
        alert('Jornada concluída! PDF/HQ em breve disponível.');
      }
    } catch (e) {
      console.error('[FINAL] Erro ao gerar PDF/HQ:', e);
      alert('Erro temporário. Tente novamente em alguns instantes.');
    } finally {
      btn.textContent = original;
      btn.disabled = false;
      btn.dataset.loading = '0';
    }
  }

  // ------------------------ VÍDEO DE SAÍDA ------------------------
  let finalReturning = false;

  function handleVoltarInicio() {
    if (finalReturning) {
      console.log('[FINAL] Voltar ao Início já em andamento, ignorando clique extra.');
      return;
    }
    finalReturning = true;

    console.log('[FINAL] Voltar ao Início acionado.');

    const src = FINAL_MOVIE;

    // Player cinematográfico global
    if (typeof window.playVideo === 'function') {
      window.playVideo(src, {
        useGoldBorder: true,
        pulse: true,
        onEnded: () => {
          console.log('[FINAL] Vídeo final concluído, redirecionando para portal...');
          window.location.href = HOME_URL;
        }
      });
      return;
    }

    // Fallback: usa playTransitionVideo se existir
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, null);
      setTimeout(() => {
        window.location.href = HOME_URL;
      }, 16000); // tempo aproximado de segurança
      return;
    }

    // Fallback bruto: sem vídeo
    window.location.href = HOME_URL;
  }

  // ------------------------ EVENTOS ------------------------

  // Quando o JC disser que a section-final foi mostrada
  document.addEventListener('section:shown', e => {
    const id = e.detail?.sectionId || e.detail;
    if (id !== SECTION_ID) return;

    console.log('[FINAL] section:shown recebido para section-final, iniciando sequência...');

    const sec = document.getElementById(SECTION_ID);
    if (sec) {
      sec.style.display = 'block';
    }

    startFinalSequence();
  });

  // Clicks nos botões
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
    }
  });

  // Fallback: se a página carregar já com a final visível (debug etc.)
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (!sec) return;

    const visible = sec.classList.contains('show') ||
                    getComputedStyle(sec).display !== 'none';

    if (visible) {
      startFinalSequence();
    }
  });

})();
