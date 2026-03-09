/* /assets/js/section-perguntas-bloco.js
 * Controlador universal dos blocos de perguntas
 * - section-perguntas-raizes
 * - section-perguntas-reflexoes
 * - section-perguntas-crescimento
 * - section-perguntas-integracao
 * - section-perguntas-sintese
 *
 * Unifica o melhor do section-perguntas.js antigo:
 * - tema por guia
 * - datilografia + TTS
 * - botão de microfone
 * - botões com efeito de clique
 * - devolutiva do guia
 * - progresso do bloco e total
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

  const $ = (sel, root = document) => (root || document).querySelector(sel);
  const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));

  const State = {
    sectionId: null,
    bloco: null,
    questionIndex: 0,
    mounted: false
  };

  function log(...a) { console.log(MOD, ...a); }
  function warn(...a) { console.warn(MOD, ...a); }
  function err(...a) { console.error(MOD, ...a); }

  function getSectionFromEvent(detail) {
    if (detail?.node && detail.node.id) return detail.node;
    const id = detail?.sectionId || detail?.id || null;
    if (id) return document.getElementById(id);
    return document.querySelector('section[id^="section-perguntas-"]');
  }

  function getCurrentSection() {
    return document.querySelector('section[id^="section-perguntas-"]');
  }

  function getSectionId(section) {
    return section?.id || null;
  }

  function getLang() {
    const l =
      window.i18n?.lang ||
      window.i18n?.currentLang ||
      document.documentElement.lang ||
      sessionStorage.getItem('jornada.lang') ||
      localStorage.getItem('JORNADA_LANG') ||
      'pt-BR';
    return String(l || 'pt-BR').trim();
  }

  function getBlocoAtual(sectionId) {
    if (!sectionId) return null;
    if (!window.JORNADA_PAPER_QA || typeof window.JORNADA_PAPER_QA.getBlockBySection !== 'function') {
      warn('JORNADA_PAPER_QA não encontrado.');
      return null;
    }
    return window.JORNADA_PAPER_QA.getBlockBySection(sectionId, getLang());
  }

  function normalizeGuide(raw) {
    const x = String(raw || '').trim().toLowerCase();
    if (!x) return 'lumen';
    if (x === 'arian') return 'arion';
    if (x.includes('lumen')) return 'lumen';
    if (x.includes('zion')) return 'zion';
    if (x.includes('arion') || x.includes('arian')) return 'arion';
    return x;
  }

  function applyGuiaTheme(section) {
    const guiaRaw =
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('JORNADA_GUIA') ||
      localStorage.getItem('jornada.guia') ||
      document.body.dataset.guia ||
      'lumen';

    const guia = normalizeGuide(guiaRaw);
    document.body.dataset.guia = guia;
    if (section) section.dataset.guia = guia;

    const colorMap = {
      lumen: '#9cff57',
      zion: '#ffd54a',
      arion: '#6dc8ff',
      default: '#ffd54a'
    };

    const color = colorMap[guia] || colorMap.default;
    localStorage.setItem('JORNADA_GUIA_COLOR', color);

    const title =
      section?.querySelector('.perguntas-title, .jp-block-title, #question-block-title');
    if (title) {
      title.style.color = color;
      title.style.textShadow = `0 0 10px ${color}55, 0 0 24px ${color}88`;
    }

    const totalValue = section?.querySelector('#progress-total-value');
    const qValue = section?.querySelector('#progress-question-value');
    if (totalValue) totalValue.style.color = color;
    if (qValue) qValue.style.color = color;

    log('Tema do guia aplicado:', guia, color);
  }

  function getQuestionText(bloco, qIndex = 0) {
    const pergunta = bloco?.questions?.[qIndex];
    if (!pergunta) return '';
    return String(pergunta.label || '').trim();
  }

  function getQuestionId(bloco, qIndex = 0) {
    const pergunta = bloco?.questions?.[qIndex];
    return pergunta?.id || `q${qIndex + 1}`;
  }

  function answerKey(bloco, qIndex = 0) {
    return `jornada_resp_${bloco.id}_${getQuestionId(bloco, qIndex)}`;
  }

  function saveAnswer(bloco, qIndex, value) {
    if (!bloco) return;
    localStorage.setItem(answerKey(bloco, qIndex), String(value || ''));
  }

  function getAnswer(bloco, qIndex) {
    if (!bloco) return '';
    return localStorage.getItem(answerKey(bloco, qIndex)) || '';
  }

 async function setGuideResponse(text, kind = 'info') {

  const wrap = document.getElementById('jp-ai-response-wrap');
  const box  = document.getElementById('jp-ai-response');

  if (!wrap || !box) return;

  const content = String(text || '').trim();

  if (!content) {
    box.hidden = true;
    box.textContent = '';
    box.classList.remove('is-visible','is-revealing');
    wrap.dataset.kind = '';
    return;
  }

  wrap.dataset.kind = kind;
  box.hidden = false;

  box.innerHTML = content
    .split('\n')
    .map((line,i)=>`<div class="ai-line" style="animation-delay:${i*120}ms">${line}</div>`)
    .join('');

  void box.offsetWidth;

  box.classList.add('is-revealing');
  box.classList.add('is-visible');

  setTimeout(()=>{
    box.classList.remove('is-revealing');
  },1300);

}

  function updateProgress(bloco) {
    const totalBlocks = window.JORNADA_PAPER_QA?.getTotalBlocks?.(getLang()) || 5;
    const currentBlock = (bloco?.index ?? 0) + 1;

    const totalValue = document.getElementById('progress-total-value');
    const totalFill = document.getElementById('progress-total-fill');
    if (totalValue) totalValue.textContent = `${currentBlock} / ${totalBlocks}`;
    if (totalFill) totalFill.style.width = `${(currentBlock / totalBlocks) * 100}%`;

    // No modelo atual: 1 pergunta por bloco
    const questionValue = document.getElementById('progress-question-value');
    const questionFill = document.getElementById('progress-question-fill');
    if (questionValue) questionValue.textContent = `1 / 1`;
    if (questionFill) questionFill.style.width = '100%';

    const blockValue = document.getElementById('progress-block-value');
    const blockFill = document.getElementById('progress-block-fill');
    if (blockValue) blockValue.textContent = `${currentBlock} de ${totalBlocks}`;
    if (blockFill) blockFill.style.width = `${(currentBlock / totalBlocks) * 100}%`;

    document.dispatchEvent(new CustomEvent('perguntas:state-changed', {
      detail: {
        blocoAtual: currentBlock,
        blocosTotal: totalBlocks
      }
    }));
  }

  function stopSpeaking() {
    try { window.speechSynthesis?.cancel(); } catch {}
  }

  async function speakText(text) {
    const clean = String(text || '').trim();
    if (!clean) return;

    try {
      stopSpeaking();

      if (typeof window.typeAndSpeak === 'function') {
        // Só fala; a datilografia já foi feita por nós
        const fake = document.createElement('span');
        fake.textContent = clean;
        await window.typeAndSpeak(fake, clean, 0);
        return;
      }

      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = document.documentElement.lang || getLang() || 'pt-BR';
        utter.rate = 0.92;
        utter.pitch = 1;
        utter.volume = 1;

        await new Promise((resolve) => {
          utter.onend = resolve;
          utter.onerror = resolve;
          window.speechSynthesis.speak(utter);
        });
      }
    } catch (e) {
      warn('TTS falhou:', e);
    }
  }

  async function typeQuestion(el, text, speed = 26, withVoice = true) {
    if (!el) return;
    const content = String(text || '').trim();
    el.textContent = '';
    el.classList.remove('typing-done');

    for (let i = 0; i <= content.length; i++) {
      el.textContent = content.slice(0, i);
      await new Promise(r => setTimeout(r, speed));
    }

    el.classList.add('typing-done');

    if (withVoice) {
      await speakText(content);
    }
  }

  function bindPressFx(btn) {
    if (!btn || btn.dataset.pressFxBound === '1') return;
    btn.dataset.pressFxBound = '1';

    const add = () => btn.classList.add('is-pressed');
    const rem = () => btn.classList.remove('is-pressed');

    btn.addEventListener('mousedown', add);
    btn.addEventListener('mouseup', rem);
    btn.addEventListener('mouseleave', rem);
    btn.addEventListener('touchstart', add, { passive: true });
    btn.addEventListener('touchend', rem);
    btn.addEventListener('touchcancel', rem);
  }

  function ensureMicAttached(textarea) {
    if (!textarea) return;

    if (window.JORNADA_MICRO?.attach) {
      try {
        if (textarea.dataset.micReady !== '1') {
          window.JORNADA_MICRO.attach(textarea, { mode: 'append', lang: getLang() });
          textarea.dataset.micReady = '1';
        }
      } catch (e) {
        warn('Falha ao acoplar JORNADA_MICRO:', e);
      }
    }
  }

  function triggerMic(textarea) {
    if (!textarea) return;

    ensureMicAttached(textarea);

    const localMicBtn =
      textarea.parentElement?.querySelector('.mic-btn') ||
      textarea.closest('.jp-answer-frame')?.querySelector('.mic-btn') ||
      document.querySelector('.mic-btn');

    if (localMicBtn) {
      localMicBtn.click();
      return;
    }

    // fallback robusto
    try {
      if (typeof window.startMic === 'function') return window.startMic();
      if (typeof window.initSpeechRecognition === 'function') return window.initSpeechRecognition();

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { warn('SpeechRecognition não suportado.'); return; }

      if (!window.__REC__) {
        const rec = new SR();
        rec.lang = document.documentElement.lang || getLang() || 'pt-BR';
        rec.continuous = false;
        rec.interimResults = true;

        rec.onresult = (ev) => {
          let finalTxt = '';
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            const res = ev.results[i];
            finalTxt += res[0].transcript || '';
            if (res.isFinal) {
              const prev = textarea.value.trim();
              textarea.value = prev ? (prev + ' ' + finalTxt.trim()) : finalTxt.trim();
              textarea.dispatchEvent(new Event('input', { bubbles: true }));
              finalTxt = '';
            }
          }
        };

        rec.onerror = (e) => warn('MIC onerror:', e);
        window.__REC__ = rec;
      }

      window.__REC__.start();
    } catch (e) {
      err('Erro ao iniciar microfone:', e);
    }
  }

  function showMissingAnswerFeedback() {
    if (typeof window.toast === 'function') {
      window.toast('Escreva sua resposta antes de continuar.');
    } else {
      alert('Escreva sua resposta antes de continuar.');
    }
  }

  function goNext(bloco) {
    const nextSection = bloco?.nextSection || FINAL_SECTION_ID;
    const video = bloco?.transitionVideo || FINAL_VIDEO_FALLBACK;

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(video, nextSection);
      return;
    }

    if (window.JC?.show) {
      window.JC.show(nextSection);
      return;
    }

    window.location.hash = '#' + nextSection;
  }

  function clearAnswerUI() {
  const ta = document.getElementById('jp-answer-input');
  if (ta) {
    ta.value = '';
    ta.focus();
  }

  const wrap = document.getElementById('jp-ai-response-wrap');
  const box  = document.getElementById('jp-ai-response');

  if (wrap) wrap.dataset.kind = '';
  if (box) {
    box.hidden = true;
    box.textContent = '';
    box.innerHTML = '';
    box.classList.remove('is-visible', 'is-revealing');
  }
}
  
  function bindButtons(section, bloco, perguntaText) {
    const btnTTS = $('#jp-btn-falar', section);
    const btnMic = $('#jp-btn-mic', section);
    const btnApagar = $('#jp-btn-apagar', section);
    const btnConfirm = $('#jp-btn-confirmar', section);
    const textarea = $('#jp-answer-input', section);

    [btnTTS, btnMic, btnApagar, btnConfirm].forEach(bindPressFx);

    if (btnTTS) {
      btnTTS.onclick = async (ev) => {
        ev.preventDefault();
        await speakText(perguntaText);
      };
    }

    if (btnMic) {
      btnMic.onclick = (ev) => {
        ev.preventDefault();
        triggerMic(textarea);
      };
    }

    if (btnApagar) {
      btnApagar.onclick = (ev) => {
        ev.preventDefault();
        clearAnswerUI();
      };
    }

    if (btnConfirm) {
      btnConfirm.onclick = (ev) => {
        ev.preventDefault();

        const val = String(textarea?.value || '').trim();
        if (!val) {
          showMissingAnswerFeedback();
          textarea?.focus();
          return;
        }

        saveAnswer(bloco, 0, val);
        goNext(bloco);
      };
    }
  }

  async function renderBloco(section) {
    const sectionId = getSectionId(section);
    if (!sectionId || !sectionId.startsWith('section-perguntas-')) return;

    const bloco = getBlocoAtual(sectionId);
    if (!bloco) {
      warn('Bloco não encontrado para', sectionId);
      return;
    }

    State.sectionId = sectionId;
    State.bloco = bloco;
    State.questionIndex = 0;
    State.mounted = true;

    applyGuiaTheme(section);

    const titleEl =
      $('#question-block-title', section) ||
      $('.jp-block-title', section) ||
      $('.perguntas-title', section);

    if (titleEl) {
      titleEl.textContent = bloco.title || `Bloco ${(bloco.index ?? 0) + 1}`;
    }

    const questionEl =
      $('#question-display', section) ||
      $('#jp-question-typed', section) ||
      $('.jp-question-typed', section);

    const textarea =
      $('#jp-answer-input', section) ||
      $('#answer-input', section) ||
      $('textarea', section);

    const perguntaText = getQuestionText(bloco, 0);

    if (textarea) {
      textarea.value = getAnswer(bloco, 0);
      textarea.focus();
      ensureMicAttached(textarea);
    }

    setGuideResponse('');
    updateProgress(bloco);
    bindButtons(section, bloco, perguntaText);

    if (questionEl) {
      await typeQuestion(questionEl, perguntaText, 26, true);
    }

    log('Bloco renderizado:', bloco.id);
  }

  document.addEventListener('sectionLoaded', function (ev) {
    const section = getSectionFromEvent(ev.detail);
    const id = getSectionId(section);
    if (!id || !id.startsWith('section-perguntas-')) return;

    setTimeout(() => renderBloco(section), 80);
  });

  document.addEventListener('DOMContentLoaded', function () {
    const section = getCurrentSection();
    const id = getSectionId(section);
    if (id && id.startsWith('section-perguntas-')) {
      renderBloco(section);
    }
  });

  // API pública para futura devolutiva do Lumen / Zion / Arion
  window.JORNADA_PERGUNTAS_BLOCO = {
    setGuideResponse,
    rerender() {
      const section = getCurrentSection();
      if (section) renderBloco(section);
    },
    getState() {
      return { ...State };
    }
  };

  log('inicializado.');
})(window, document);
