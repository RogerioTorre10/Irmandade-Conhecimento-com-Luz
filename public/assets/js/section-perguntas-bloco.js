/* /assets/js/section-perguntas-bloco.js
 * Controlador universal dos blocos de perguntas
 * - section-perguntas-raizes
 * - section-perguntas-reflexoes
 * - section-perguntas-crescimento
 * - section-perguntas-integracao
 * - section-perguntas-sintese
 *
 * Recursos:
 * - tema por guia
 * - datilografia + TTS
 * - botão de microfone
 * - botões com efeito de clique
 * - devolutiva do guia via API
 * - progresso do bloco e total
 * - botão Continuar em 2 cliques:
 *    1º envia para API
 *    2º só avança se devolutiva pronta
 * - se a devolutiva falhar:
 *    botão vira "Tentar novamente"
 *    e NÃO avança
 * - botão Ouvir:
 *    antes da devolutiva => narra a pergunta
 *    depois da devolutiva => narra a devolutiva
 * - efeito "oráculo medieval" na devolutiva
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
    document.documentElement.dataset.guia = guia;
    if (section) section.dataset.guia = guia;

    const themeMap = {
      lumen: {
        main: '#00c781',
        soft: 'rgba(0,199,129,0.28)',
        strong: 'rgba(0,199,129,0.62)',
        text: '#e8fff7'
      },
      zion: {
        main: '#59c8ff',
        soft: 'rgba(89,200,255,0.28)',
        strong: 'rgba(89,200,255,0.62)',
        text: '#eefaff'
      },
      arian: {
        main: '#ff4fd8',
        soft: 'rgba(255,79,216,0.28)',
        strong: 'rgba(255,79,216,0.62)',
        text: '#fff0fb'
      },
      arion: {
        main: '#ff4fd8',
        soft: 'rgba(255,79,216,0.28)',
        strong: 'rgba(255,79,216,0.62)',
        text: '#fff0fb'
      }
    };

    const theme = themeMap[guia] || themeMap.lumen;
    const root = document.documentElement;

    root.style.setProperty('--guia-main', theme.main);
    root.style.setProperty('--guia-soft', theme.soft);
    root.style.setProperty('--guia-strong', theme.strong);
    root.style.setProperty('--guia-text', theme.text);

    root.style.setProperty('--guide-color', theme.main);
    root.style.setProperty('--theme-main-color', theme.main);
    root.style.setProperty('--progress-main', theme.main);
    root.style.setProperty('--progress-glow-1', theme.soft);
    root.style.setProperty('--progress-glow-2', theme.strong);

    localStorage.setItem('JORNADA_GUIA_COLOR', theme.main);
    localStorage.setItem('JORNADA_GUIA_ATIVO', guia);

    const title = section?.querySelector('.perguntas-title, .jp-block-title, #question-block-title');
    if (title) {
      title.style.color = theme.main;
      title.style.textShadow = `0 0 10px ${theme.soft}, 0 0 24px ${theme.strong}`;
    }

    const question = section?.querySelector('#jp-question-typed, .jp-question-typed');
    if (question) {
      question.style.color = theme.text;
      question.style.textShadow = `0 0 6px ${theme.soft}`;
    }

    const textarea = section?.querySelector('#jp-answer-input, .jp-answer-input');
    if (textarea) {
      textarea.style.borderColor = theme.main;
      textarea.style.boxShadow = `0 0 12px ${theme.soft}, inset 0 0 10px rgba(255,255,255,0.04)`;
    }

    const bar = section?.querySelector('#progress-question-fill, .jp-progress-fill');
    if (bar) {
      bar.style.background = `linear-gradient(90deg, ${theme.main}, ${theme.main})`;
      bar.style.boxShadow = `0 0 12px ${theme.soft}, 0 0 20px ${theme.strong}`;
    }

    log('Tema do guia aplicado:', guia, theme.main);
  }

function getQuestionText(bloco, qIndex = 0) {
  try {
    const pergunta = bloco?.questions?.[qIndex];
    return String(pergunta?.label || 'Pergunta não encontrada').trim();
  } catch (e) {
    console.warn('[getQuestionText] erro:', e);
    return 'Pergunta indisponível';
  }
}

function getQuestionId(bloco, qIndex = 0) {
  const pergunta = bloco?.questions?.[qIndex];
  return pergunta?.id || `q${qIndex + 1}`;
}

function answerKey(bloco, qIndex = 0) {
  return `jornada_resp_${bloco.id}_${getQuestionId(bloco, qIndex)}`;
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
  const box = document.getElementById('jp-ai-response');

  if (!wrap || !box) return;

  const content = String(text || '').trim();

  if (!content) {
    box.hidden = true;
    box.textContent = '';
    box.innerHTML = '';
    box.classList.remove('is-visible', 'is-revealing', 'oracle-ready');
    wrap.dataset.kind = '';
    wrap.dataset.responseText = '';
    return;
  }

  wrap.dataset.kind = kind;
  wrap.dataset.responseText = content;

  box.hidden = false;
  box.textContent = '';
  box.innerHTML = '';
  box.classList.add('is-visible', 'is-revealing');

  let ttsPromise = null;

  try {
    if (typeof window.speakGuideText === 'function') {
      ttsPromise = window.speakGuideText(content);
    } else if (typeof speakQuestionOrGuideResponse === 'function') {
      ttsPromise = speakQuestionOrGuideResponse(content);
    } else if (typeof window.speakQuestionOrGuideResponse === 'function') {
      ttsPromise = window.speakQuestionOrGuideResponse(content);
    } else {
      console.warn('[DEVOLUTIVA][TTS] nenhum motor de voz disponível.');
    }
  } catch (err) {
    console.warn('[DEVOLUTIVA][TTS] falhou ao iniciar:', err);
  }

  const lines = content.split('\n').filter(Boolean);
  if (!lines.length) lines.push(content);

  for (let i = 0; i < lines.length; i++) {
    const lineEl = document.createElement('div');
    lineEl.className = 'ai-line oracle-line';
    box.appendChild(lineEl);

    const line = lines[i];
    for (let j = 0; j <= line.length; j++) {
      lineEl.textContent = line.slice(0, j);
      await new Promise((r) => setTimeout(r, 16));
    }

    await new Promise((r) => setTimeout(r, 120));
  }

  if (ttsPromise && typeof ttsPromise.then === 'function') {
    try {
      await ttsPromise;
    } catch (err) {
      console.warn('[DEVOLUTIVA][TTS] falhou durante execução:', err);
    }
  }

  box.classList.remove('is-revealing');
  box.classList.add('oracle-ready');

  box.style.textShadow = '0 0 8px var(--guia-soft), 0 0 18px rgba(255,255,255,0.08)';
  box.style.borderColor = 'var(--guia-main)';
}
  
  function getCurrentGuideResponseText() {
    const wrap = document.getElementById('jp-ai-response-wrap');
    const txt = wrap?.dataset?.responseText || '';
    return String(txt || '').trim();
  }

  function updateProgress(bloco) {
    const totalBlocks = window.JORNADA_PAPER_QA?.getTotalBlocks?.(getLang()) || 5;
    const currentBlock = (bloco?.index ?? 0) + 1;

    const totalValue = document.getElementById('progress-total-value');
    const totalFill = document.getElementById('progress-total-fill');
    if (totalValue) totalValue.textContent = `${currentBlock} / ${totalBlocks}`;
    if (totalFill) totalFill.style.width = `${(currentBlock / totalBlocks) * 100}%`;

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
    try {
      window.speechSynthesis?.cancel();
    } catch {}
  }

  function pickVoiceForGuide() {
    const guideRaw =
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('JORNADA_GUIA') ||
      document.body.dataset.guia ||
      'lumen';

    const guide = normalizeGuide(guideRaw);
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (!voices.length) return null;

    const lang = document.documentElement.lang || getLang() || 'pt-BR';
    const langShort = String(lang).slice(0, 2).toLowerCase();

    const filtered = voices.filter(v =>
      String(v.lang || '').toLowerCase().startsWith(langShort)
    );

    const list = filtered.length ? filtered : voices;

    const femaleHints = ['female', 'woman', 'maria', 'luciana', 'helena', 'samantha', 'victoria', 'google português do brasil'];
    const maleHints = ['male', 'man', 'paulo', 'daniel', 'ricardo', 'jorge', 'google português'];

    if (guide === 'lumen') {
      return list.find(v => femaleHints.some(h => String(v.name || '').toLowerCase().includes(h))) || list[0] || null;
    }

    if (guide === 'zion' || guide === 'arion') {
      return list.find(v => maleHints.some(h => String(v.name || '').toLowerCase().includes(h))) || list[0] || null;
    }

    return list[0] || null;
  }

  function speakText(text) {
    const clean = String(text || '').trim();
    if (!clean) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        stopSpeaking();

        const utter = new SpeechSynthesisUtterance(clean);
        utter.lang = document.documentElement.lang || getLang() || 'pt-BR';
        utter.rate = 0.92;
        utter.pitch = 1;
        utter.volume = 1;

        const voice = pickVoiceForGuide();
        if (voice) utter.voice = voice;

        utter.onend = () => resolve();
        utter.onerror = () => resolve();

        window.speechSynthesis.speak(utter);
      } catch (e) {
        warn('TTS falhou:', e);
        resolve();
      }
    });
  }

  async function speakQuestionOrGuideResponse(perguntaText) {
    const guideText = getCurrentGuideResponseText();

    if (guideText) {
      await speakText(guideText);
      return;
    }

    await speakText(perguntaText);
  }

  async function typeQuestion(el, text, speed = 26, withVoice = true) {
    if (!el) return;

    const content = String(text || '').trim();
    el.textContent = '';
    el.classList.remove('typing-done');

    const speechPromise = withVoice ? speakText(content) : Promise.resolve();

    for (let i = 0; i <= content.length; i++) {
      el.textContent = content.slice(0, i);
      await new Promise((r) => setTimeout(r, speed));
    }

    el.classList.add('typing-done');
    await speechPromise;
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

    try {
      if (typeof window.startMic === 'function') return window.startMic();
      if (typeof window.initSpeechRecognition === 'function') return window.initSpeechRecognition();

      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        warn('SpeechRecognition não suportado.');
        return;
      }

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
    const box = document.getElementById('jp-ai-response');

    if (wrap) {
      wrap.dataset.kind = '';
      wrap.dataset.responseText = '';
    }

    if (box) {
      box.hidden = true;
      box.textContent = '';
      box.innerHTML = '';
      box.classList.remove('is-visible', 'is-revealing', 'oracle-ready');
      box.style.removeProperty('text-shadow');
      box.style.removeProperty('border-color');
    }
  }

function getStoredBlockFeedbacks() {
  try {
    return JSON.parse(sessionStorage.getItem('JORNADA_DEVOLUTIVAS_BLOCO') || '[]');
  } catch {
    return [];
  }
}

function setStoredBlockFeedbacks(items) {
  try {
    sessionStorage.setItem('JORNADA_DEVOLUTIVAS_BLOCO', JSON.stringify(items || []));
  } catch {}
}

function getBlockQuestionsCount(bloco) {
  if (!bloco) return 0;
  if (Array.isArray(bloco.questions)) return bloco.questions.length;
  if (Array.isArray(bloco.perguntas)) return bloco.perguntas.length;
  return Number(bloco.totalQuestions || bloco.total || 0);
}

function getCurrentQuestionIndex(bloco) {
  if (!bloco) return 0;

  if (typeof bloco.currentIndex === 'number') return bloco.currentIndex;
  if (typeof bloco.questionIndex === 'number') return bloco.questionIndex;
  if (typeof bloco.idx === 'number') return bloco.idx;

  const raw =
    sessionStorage.getItem(`jp:${bloco.id}:idx`) ||
    sessionStorage.getItem(`bloco:${bloco.id}:idx`) ||
    '0';

  return Number(raw || 0);
}

function isLastQuestionOfBlock(bloco) {
  const total = getBlockQuestionsCount(bloco);
  const current = getCurrentQuestionIndex(bloco);
  return total > 0 && current >= total - 1;
}

function getAllAnswersFromBlock(bloco) {
  const total = getBlockQuestionsCount(bloco);
  const out = [];

  for (let i = 0; i < total; i++) {
    try {
      const val = getAnswer(bloco, i);
      const txt = String(val || '').trim();
      if (txt) out.push(txt);
    } catch {}
  }

  return out;
}


function countSentences(text) {
  return String(text || '')
    .split(/[.!?…]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .length;
}

function isWeakFeedback(text, opts = {}) {
  const minChars = Number(opts.minChars ?? 180);
  const minSentences = Number(opts.minSentences ?? 3);
  const txt = String(text || '').replace(/\s+/g, ' ').trim();

  if (!txt) return true;
  if (txt.length < minChars) return true;
  if (countSentences(txt) < minSentences) return true;
  if (!/[.!?…]$/.test(txt)) return true;
  return false;
}

function buildFallbackFeedback({ guia, nome, blocoNome, resposta, pergunta }) {
  const guide = normalizeGuide(guia || 'lumen');
  const participant = String(nome || 'Caminhante').trim() || 'Caminhante';
  const answer = String(resposta || '').trim();
  const questionText = String(pergunta || '').trim();
  const block = String(blocoNome || 'esta etapa').trim();

  const fallbackPorGuia = {
    lumen: `${participant}, sua resposta em ${block} revela um movimento sincero de percepção interior. Ao expressar "${answer || questionText || 'sua vivência'}", você deixa transparecer sensibilidade, honestidade e desejo de caminhar com mais consciência. Receba esta reflexão como um acolhimento: continue ouvindo sua verdade com serenidade, porque há luz no modo como você escolheu responder a esta etapa.`,
    zion: `${participant}, o que você compartilhou em ${block} mostra presença, verdade e disposição para enxergar mais fundo. Ao dizer "${answer || questionText || 'sua vivência'}", você revela um posicionamento interno que merece respeito e continuidade. Leve esta resposta como um sinal de força: aquilo que começa em reflexão pode amadurecer em direção, clareza e propósito.`,
    arion: `${participant}, sua resposta em ${block} carrega delicadeza e profundidade. Quando você expressa "${answer || questionText || 'sua vivência'}", percebemos um traço do seu mundo interior pedindo escuta, cuidado e crescimento. Que esta devolutiva te alcance com acolhimento e te ajude a seguir com mais presença, verdade e conexão com a luz que floresce dentro de você.`
  };

  return fallbackPorGuia[guide] || fallbackPorGuia.lumen;
}

function extractFeedbackText(resp) {
  return String(
    resp?.texto ||
    resp?.devolutivaBloco ||
    resp?.devolutiva ||
    resp?.feedback ||
    resp?.message ||
    ''
  ).trim();
}

async function requestGuideFeedbackWithFallback(params) {
  const {
    nome,
    guia,
    blocoNome,
    respostas,
    idioma,
    pergunta,
    resposta
  } = params;

  const guide = normalizeGuide(guia || 'lumen');
  const fallbackText = buildFallbackFeedback({
    guia: guide,
    nome,
    blocoNome,
    resposta,
    pergunta
  });

  if (!window.API) {
    return { ok: true, texto: fallbackText, guiaUsado: 'lumen', fallbackUsed: true };
  }

  const bodyBase = {
    nome,
    bloco: blocoNome,
    respostas: Array.isArray(respostas) ? respostas : [],
    idioma,
    pergunta,
    resposta
  };

  const tentativas = [
    { guia: guide, retry: false },
    { guia: guide, retry: true }
  ];

  if (guide !== 'lumen') {
    tentativas.push({ guia: 'lumen', retry: false, fallback: true });
  }

  let ultimoErro = null;

  for (const tentativa of tentativas) {
    try {
      let raw = null;

      if (Array.isArray(bodyBase.respostas) && bodyBase.respostas.length && typeof window.API.gerarDevolutivaBloco === 'function') {
        raw = await window.API.gerarDevolutivaBloco({
          nome,
          guia: tentativa.guia,
          bloco: blocoNome,
          respostas: bodyBase.respostas,
          idioma,
          retry: tentativa.retry,
          forceComplete: true,
          minSentences: tentativa.guia === 'lumen' ? 4 : 3,
          minChars: tentativa.guia === 'lumen' ? 220 : 180
        });
      } else if (typeof window.API.gerarDevolutiva === 'function') {
        raw = await window.API.gerarDevolutiva({
          nome,
          guia: tentativa.guia,
          bloco: blocoNome,
          pergunta,
          resposta,
          idioma,
          retry: tentativa.retry,
          forceComplete: true,
          minSentences: tentativa.guia === 'lumen' ? 4 : 3,
          minChars: tentativa.guia === 'lumen' ? 220 : 180
        });
      }

      const texto = extractFeedbackText(raw);
      if (!texto) {
        ultimoErro = new Error(`Resposta vazia para ${tentativa.guia}`);
        continue;
      }

      if (isWeakFeedback(texto, {
        minChars: tentativa.guia === 'lumen' ? 220 : 180,
        minSentences: tentativa.guia === 'lumen' ? 4 : 3
      })) {
        ultimoErro = new Error(`Resposta fraca para ${tentativa.guia}`);
        continue;
      }

      return {
        ok: true,
        texto: texto.trim(),
        guiaUsado: tentativa.guia,
        fallbackUsed: !!tentativa.fallback
      };
    } catch (err) {
      ultimoErro = err;
      console.warn('[DEVOLUTIVA][ROBUSTA] falha:', tentativa.guia, tentativa.retry ? 'retry' : 'primeira', err);
    }
  }

  console.warn('[DEVOLUTIVA][ROBUSTA] usando fallback local:', ultimoErro);
  return {
    ok: true,
    texto: fallbackText,
    guiaUsado: 'lumen',
    fallbackUsed: true
  };
}

async function gerarDevolutivaDoBloco(bloco) {
  const nome =
    sessionStorage.getItem('jornada.nome') ||
    localStorage.getItem('JORNADA_NOME') ||
    localStorage.getItem('jc.nome') ||
    'Participante';

  const guia =
    sessionStorage.getItem('jornada.guia') ||
    localStorage.getItem('JORNADA_GUIA') ||
    localStorage.getItem('jornada.guia') ||
    document.body.dataset.guia ||
    'lumen';

  const idioma = document.documentElement.lang || getLang() || 'pt-BR';
  const respostas = getAllAnswersFromBlock(bloco);
  const blocoNome = bloco?.title || bloco?.id || 'Bloco';

  if (!respostas.length) {
    return {
      ok: false,
      texto: ''
    };
  }

  return requestGuideFeedbackWithFallback({
    nome,
    guia,
    blocoNome,
    respostas,
    idioma,
    pergunta: '',
    resposta: respostas[respostas.length - 1] || ''
  });
}

  function getBlockClosingLead(bloco) {
  const blocoNome = bloco?.title || bloco?.id || 'este bloco';

  const frases = [
    `PARABÉNS!!! Finalizamos o ${blocoNome}. Estou recolhendo os sinais mais preciosos que você deixou nesta etapa...`,
    `Encerramos o ${blocoNome}. Aguarde um instante: estou contemplando com carinho o sentido desta nossa travessia...`,
    `Que belo passo demos no ${blocoNome}! Agora, reúno as chamas deste trecho para te devolver uma síntese viva e inspiradora...`,
    `Concluímos o ${blocoNome}. Estou observando cada fio desta etapa para transformar suas respostas em direção e clareza...`,
    `Etapa concluída: ${blocoNome}. Recolho agora os ecos deste bloco para te responder com toda a luz que você compartilhou...`
];

  const idx =
    typeof bloco?.index === 'number'
      ? bloco.index % frases.length
      : Math.floor(Math.random() * frases.length);

  return frases[idx];
}

async function maybeHandleBlockClosure(section, bloco) {
  if (!isLastQuestionOfBlock(bloco)) {
    goNext(bloco);
    return;
  }

  try {
    setContinueState(section, 'loading');
    await setGuideResponse(getBlockClosingLead(bloco), 'info');

    const result = await gerarDevolutivaDoBloco(bloco);

    if (result?.ok && result.texto) {
      const existentes = getStoredBlockFeedbacks().filter((item) => item?.blocoId !== (bloco?.id || ''));
      existentes.push({
        blocoId: bloco?.id || '',
        blocoTitulo: bloco?.title || bloco?.id || 'Bloco',
        respostas: getAllAnswersFromBlock(bloco),
        texto: result.texto,
        guiaUsado: result.guiaUsado || normalizeGuide(document.body.dataset.guia || 'lumen')
      });
      setStoredBlockFeedbacks(existentes);

      await setGuideResponse(result.texto, result.fallbackUsed ? 'warn' : 'success');
      goNext(bloco);
      return;
    }

    console.warn('[BLOCO] devolutiva não retornou conteúdo válido, seguindo com fallback de navegação.');
    goNext(bloco);
  } catch (e) {
    console.warn('[BLOCO] erro ao gerar devolutiva do bloco:', e);
    goNext(bloco);
  }
}


  function setContinueState(section, state) {
    if (!section) return;

    section.dataset.continueState = state || 'idle';

    const btn = section.querySelector('#jp-btn-confirmar');
    if (!btn) return;

    btn.classList.remove('is-loading', 'is-ready', 'is-error');

    if (state === 'loading') {
      btn.disabled = true;
      btn.textContent = window.i18n?.t('feedback.loading', 'Guia refletindo...');
      btn.classList.add('is-loading');
      return;
    }

    if (state === 'ready') {
      btn.disabled = false;
      btn.textContent = window.i18n?.t('common.continue', 'Continuar');
      btn.classList.add('is-ready');
      return;
    }

    if (state === 'error') {
      btn.disabled = false;
      btn.textContent = window.i18n?.t('common.retry', 'Tentar novamente');
      btn.classList.add('is-error');
      return;
    }

    btn.disabled = false;
    btn.textContent = 'Continuar';
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
        await speakQuestionOrGuideResponse(perguntaText);
      };
    }

   if (btnMic) {
  btnMic.onclick = async (ev) => {
    ev.preventDefault();

    const isRecording = btnMic.classList.contains('recording');

    if (isRecording) {
      btnMic.classList.remove('recording');

      try {
        if (window.__REC__) {
          window.__REC__.stop();
        }
      } catch (e) {
        console.warn('[MIC] erro ao parar reconhecimento:', e);
      }

      return;
    }

    btnMic.classList.add('recording');

    try {
      triggerMic(textarea);
    } catch (e) {
      btnMic.classList.remove('recording');
      console.warn('[MIC] erro ao iniciar:', e);
    }

    if (window.__REC__) {
      const rec = window.__REC__;

      rec.onend = (() => {
        const old = rec.onend;
        return function (...args) {
          btnMic.classList.remove('recording');
          if (typeof old === 'function') {
            try { old.apply(this, args); } catch {}
          }
        };
      })();

      rec.onerror = (() => {
        const old = rec.onerror;
        return function (...args) {
          btnMic.classList.remove('recording');
          if (typeof old === 'function') {
            try { old.apply(this, args); } catch {}
          }
        };
      })();
    }
  };
}

    if (btnApagar) {
      btnApagar.onclick = (ev) => {
        ev.preventDefault();
        clearAnswerUI();
        setContinueState(section, 'idle');
      };
    }

    if (btnConfirm) {
      btnConfirm.onclick = async (ev) => {
        ev.preventDefault();

        const state = section?.dataset?.continueState || 'idle';

        // só avança se a devolutiva já estiver pronta
       if (state === 'ready') {
       await maybeHandleBlockClosure(section, bloco);
       return;
      }

        // evita clique duplo durante carregamento
        if (state === 'loading') {
          return;
        }

        const val = String(textarea?.value || '').trim();

        if (!val) {
          showMissingAnswerFeedback();
          textarea?.focus();
          return;
        }

        saveAnswer(bloco, 0, val);
        setContinueState(section, 'loading');
        await setGuideResponse('Só um momento, vou refletir sobre sua resposta...', 'info');

        try {
          const guia =
            sessionStorage.getItem('jornada.guia') ||
            localStorage.getItem('JORNADA_GUIA') ||
            localStorage.getItem('jornada.guia') ||
            document.body.dataset.guia ||
            'lumen';

          const nome =
            sessionStorage.getItem('jornada.nome') ||
            localStorage.getItem('JORNADA_NOME') ||
            localStorage.getItem('jc.nome') ||
            'Participante';

          const result = await requestGuideFeedbackWithFallback({
          nome,
          guia,
          blocoNome: bloco?.title || bloco?.id || 'Bloco',
          respostas: [], // força modo PERGUNTA
          idioma: document.documentElement.lang || getLang() || 'pt-BR',
          pergunta: perguntaText,
          resposta: val
        });

          if (result?.ok && result.texto) {
            await setGuideResponse(result.texto, result.fallbackUsed ? 'warn' : 'success');
            setContinueState(section, 'ready');
            return;
          }

          await setGuideResponse(
            'A devolutiva ainda não chegou completa. Toque em "Tentar novamente" para reenviar tua resposta ao guia.',
            'warn'
          );
          setContinueState(section, 'error');

        } catch (e) {
          console.warn('Erro devolutiva IA', e);

          await setGuideResponse(
            'A conexão com o guia oscilou neste momento. Toque em "Tentar novamente" para buscar a devolutiva.',
            'warn'
          );
          setContinueState(section, 'error');
        }
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
    if (bloco.data_i18n && window.i18n?.t) {
    titleEl.textContent = window.i18n.t(`blocks.${bloco.id}`, bloco.title);
  } else {
    titleEl.textContent = bloco.title || `Bloco ${(bloco.index ?? 0) + 1}`;
  }
 }
    
    const questionEl =
  $('#jp-question-typed', section) ||
  $('.jp-question-typed', section) ||
  $('#question-display', section);

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
setContinueState(section, 'idle');
updateProgress(bloco);
bindButtons(section, bloco, perguntaText);

if (questionEl) {
  questionEl.textContent = '';
  questionEl.style.display = 'block';
  questionEl.style.visibility = 'visible';
  questionEl.style.opacity = '1';
  questionEl.style.minHeight = '42px';
  questionEl.setAttribute('data-typing', 'true');

  await typeQuestion(questionEl, perguntaText, 28, true);
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

  // garante vozes carregadas para o TTS por guia
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        try { window.speechSynthesis.getVoices(); } catch {}
      };
    }
  } catch {}

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
