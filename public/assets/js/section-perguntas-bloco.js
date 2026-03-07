/* /assets/js/section-perguntas-bloco.js
 * Controlador universal para blocos da jornada
 * Funciona para todas as sections: perguntas-*
 */

(function (window, document) {
  'use strict';

  if (window.__PERGUNTAS_BLOCO__) return;
  window.__PERGUNTAS_BLOCO__ = true;

  const MOD = '[PERGUNTAS_BLOCO]';

  const FINAL_SECTION_ID = 'section-final';
  const FINAL_VIDEO_FALLBACK =
    window.JORNADA_FINAL_VIDEO ||
    '/assets/videos/filme-5-fim-da-jornada.mp4';

  function $(sel, root = document) {
    return root.querySelector(sel);
  }

  function getSection() {
    return document.querySelector('.section:not(.hidden)');
  }

  function getSectionId() {
    const s = getSection();
    return s ? s.id : null;
  }

  function getBlocoAtual() {
    const sectionId = getSectionId();
    if (!sectionId) return null;

    if (!window.JORNADA_PAPER_QA) {
      console.warn(MOD, 'JORNADA_PAPER_QA não encontrado.');
      return null;
    }

    return window.JORNADA_PAPER_QA.getBlockBySection(sectionId);
  }

  function typeText(el, text, speed = 35) {
    if (!el) return;

    let i = 0;
    el.textContent = '';

    const timer = setInterval(() => {
      el.textContent = text.slice(0, i);
      i++;

      if (i > text.length) {
        clearInterval(timer);
        el.classList.add('typing-done');
      }
    }, speed);
  }

  function speak(text) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    } catch (e) {
      console.warn(MOD, 'TTS falhou.');
    }
  }

  function applyMic(textarea) {
    if (!textarea) return;

    if (window.JORNADA_MICRO && window.JORNADA_MICRO.attach) {
      window.JORNADA_MICRO.attach(textarea, { mode: 'append' });
    }
  }

  function saveAnswer(blocoId, perguntaId, value) {
    const key = `jornada_resp_${blocoId}_${perguntaId}`;
    localStorage.setItem(key, value);
  }

  function getAnswer(blocoId, perguntaId) {
    const key = `jornada_resp_${blocoId}_${perguntaId}`;
    return localStorage.getItem(key) || '';
  }

  function updateProgress(blocoIndex, total) {
    const blockValue = $('#progress-block-value');
    const totalValue = $('#progress-total-value');

    if (blockValue) blockValue.textContent = `${blocoIndex + 1} de ${total}`;
    if (totalValue) totalValue.textContent = `${blocoIndex + 1} / ${total}`;

    const fill = $('#progress-block-fill');
    if (fill) {
      fill.style.width = `${((blocoIndex + 1) / total) * 100}%`;
    }
  }

  function goNext(bloco) {
    const nextSection = bloco.nextSection;
    const video = bloco.transitionVideo || FINAL_VIDEO_FALLBACK;

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(video, nextSection);
      return;
    }

    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show(nextSection);
    }
  }

  function clearAnswer() {
    const ta = $('#jp-answer-input');
    if (ta) {
      ta.value = '';
      ta.focus();
    }
  }

  function bindButtons(bloco, pergunta) {
    const btnTTS = $('#jp-btn-falar');
    const btnApagar = $('#jp-btn-apagar');
    const btnConfirm = $('#jp-btn-confirmar');

    const textarea = $('#jp-answer-input');

    if (btnTTS) {
      btnTTS.onclick = () => speak(pergunta.label);
    }

    if (btnApagar) {
      btnApagar.onclick = (ev) => {
        ev.preventDefault();
        clearAnswer();
      };
    }

    if (btnConfirm) {
      btnConfirm.onclick = (ev) => {
        ev.preventDefault();

        const val = textarea ? textarea.value.trim() : '';

        if (!val) {
          alert('Escreva sua resposta antes de continuar.');
          textarea?.focus();
          return;
        }

        saveAnswer(bloco.id, pergunta.id, val);
        goNext(bloco);
      };
    }
  }

  function renderBloco() {
    const bloco = getBlocoAtual();
    if (!bloco) return;

    const pergunta = bloco.questions[0];

    const questionEl = $('#question-display');
    const textarea = $('#jp-answer-input');

    if (questionEl) {
      typeText(questionEl, pergunta.label);
    }

    if (textarea) {
      textarea.value = getAnswer(bloco.id, pergunta.id);
      textarea.focus();
      applyMic(textarea);
    }

    const total = window.JORNADA_PAPER_QA.getTotalBlocks();
    updateProgress(bloco.index, total);

    bindButtons(bloco, pergunta);

    console.log(MOD, 'Bloco renderizado:', bloco.id);
  }

  document.addEventListener('sectionLoaded', function () {
    const id = getSectionId();
    if (!id) return;

    if (id.startsWith('section-perguntas-')) {
      setTimeout(renderBloco, 60);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    const id = getSectionId();
    if (id && id.startsWith('section-perguntas-')) {
      renderBloco();
    }
  });

  console.log(MOD, 'inicializado.');

})(window, document);
