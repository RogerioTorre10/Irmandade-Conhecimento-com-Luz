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
 *   1º envia para API
 *   2º só avança se devolutiva pronta
 * - se a devolutiva falhar:
 *   botão vira "Tentar novamente"
 *   e NÃO avança
 * - botão Ouvir:
 *   antes da devolutiva => narra a pergunta
 *   depois da devolutiva => narra a devolutiva
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

const I18N_UI = {
  'pt-BR': {
    guide_feedback_label: 'Devolutiva do Guia',
    guide_reflecting: 'Guia refletindo...',
    continue: 'Continuar',
    retry: 'Tentar novamente',
    write_answer_first: 'Escreva sua resposta antes de continuar.',
    thinking_about_answer: 'Só um momento, vou refletir sobre sua resposta...',
    incomplete_feedback:
      'A devolutiva ainda não chegou completa. Toque em "Tentar novamente" para reenviar tua resposta ao guia.',
    connection_oscillated:
      'A conexão com o guia oscilou neste momento. Toque em "Tentar novamente" para buscar a devolutiva.',
    block_closing: [
      'PARABÉNS!!! Finalizamos o {blocoNome}. Estou recolhendo os sinais mais preciosos que você deixou nesta etapa...',
      'Encerramos o {blocoNome}. Aguarde um instante: estou contemplando com carinho o sentido desta nossa travessia...',
      'Que belo passo demos no {blocoNome}! Agora, reúno as chamas desta etapa para te devolver luz...',
      'Concluímos o {blocoNome}. Estou observando cada fio para te devolver luz...',
      'Etapa concluída: {blocoNome}. Recolho os ecos para te responder com toda a luz.'
    ]
  },

  'en-US': {
    guide_feedback_label: 'Guide Feedback',
    guide_reflecting: 'Guide reflecting...',
    continue: 'Continue',
    retry: 'Try again',
    write_answer_first: 'Write your answer before continuing.',
    thinking_about_answer: 'Just a moment, I will reflect on your answer...',
    incomplete_feedback:
      'The feedback has not arrived completely yet. Tap "Try again" to resend your answer to the guide.',
    connection_oscillated:
      'The connection with the guide fluctuated at this moment. Tap "Try again" to retrieve the feedback.',
    block_closing: [
      'Congratulations! We have completed {blocoNome}. I am gathering the most precious signs from this stage...',
      'We have finished {blocoNome}. Please wait a moment while I contemplate the meaning of this passage...',
      'What a beautiful step we have taken in {blocoNome}! I am now gathering the flames of this stage to return light to you...',
      'We have concluded {blocoNome}. I am observing each thread of this stage to return light and clarity...',
      'Stage complete: {blocoNome}. I now gather its echoes to respond to you with light.'
    ]
  },

  'es-ES': {
    guide_feedback_label: 'Devolución del Guía',
    guide_reflecting: 'Guía reflexionando...',
    continue: 'Continuar',
    retry: 'Intentar de nuevo',
    write_answer_first: 'Escribe tu respuesta antes de continuar.',
    thinking_about_answer: 'Solo un momento, voy a reflexionar sobre tu respuesta...',
    incomplete_feedback:
      'La devolución aún no ha llegado completa. Toca "Intentar de nuevo" para reenviar tu respuesta al guía.',
    connection_oscillated:
      'La conexión con el guía osciló en este momento. Toca "Intentar de nuevo" para buscar la devolución.',
    block_closing: [
      '¡Felicidades! Hemos terminado {blocoNome}. Estoy recogiendo las señales más preciosas de esta etapa...',
      'Hemos cerrado {blocoNome}. Espera un momento: estoy contemplando con cariño el sentido de este paso...',
      '¡Qué hermoso paso dimos en {blocoNome}! Ahora reúno las llamas de esta etapa para devolverte luz...',
      'Hemos concluido {blocoNome}. Estoy observando cada hilo de esta etapa para devolverte luz y claridad...',
      'Etapa concluida: {blocoNome}. Recojo ahora sus ecos para responderte con luz.'
    ]
  },

  'fr-FR': {
    guide_feedback_label: 'Retour du Guide',
    guide_reflecting: 'Le guide réfléchit...',
    continue: 'Continuer',
    retry: 'Réessayer',
    write_answer_first: 'Écrivez votre réponse avant de continuer.',
    thinking_about_answer: 'Un instant, je vais réfléchir à votre réponse...',
    incomplete_feedback:
      'Le retour n’est pas encore arrivé complètement. Touchez « Réessayer » pour renvoyer votre réponse au guide.',
    connection_oscillated:
      'La connexion avec le guide a fluctué à cet instant. Touchez « Réessayer » pour récupérer le retour.',
    block_closing: [
      'Félicitations ! Nous avons terminé {blocoNome}. Je recueille les signes les plus précieux de cette étape...',
      'Nous avons achevé {blocoNome}. Attendez un instant : je contemple avec soin le sens de ce passage...',
      'Quel beau pas nous avons fait dans {blocoNome} ! Je rassemble maintenant les flammes de cette étape pour vous rendre de la lumière...',
      'Nous avons conclu {blocoNome}. J’observe chaque fil de cette étape pour vous rendre lumière et clarté...',
      'Étape terminée : {blocoNome}. J’en recueille maintenant les échos pour vous répondre avec lumière.'
    ]
  },

  'de-DE': {
    guide_feedback_label: 'Rückmeldung des Guides',
    guide_reflecting: 'Der Guide reflektiert...',
    continue: 'Weiter',
    retry: 'Erneut versuchen',
    write_answer_first: 'Schreiben Sie Ihre Antwort, bevor Sie fortfahren.',
    thinking_about_answer: 'Einen Moment, ich werde über Ihre Antwort nachdenken...',
    incomplete_feedback:
      'Die Rückmeldung ist noch nicht vollständig angekommen. Tippen Sie auf „Erneut versuchen“, um Ihre Antwort erneut an den Guide zu senden.',
    connection_oscillated:
      'Die Verbindung mit dem Guide hat in diesem Moment geschwankt. Tippen Sie auf „Erneut versuchen“, um die Rückmeldung abzurufen.',
    block_closing: [
      'Glückwunsch! Wir haben {blocoNome} abgeschlossen. Ich sammle nun die wertvollsten Zeichen dieser Etappe...',
      'Wir haben {blocoNome} beendet. Warten Sie einen Moment: Ich betrachte nun mit Sorgfalt den Sinn dieses Wegabschnitts...',
      'Was für ein schöner Schritt in {blocoNome}! Ich sammle nun die Flammen dieser Etappe, um Ihnen Licht zurückzugeben...',
      'Wir haben {blocoNome} abgeschlossen. Ich beobachte jeden Faden dieser Etappe, um Ihnen Licht und Klarheit zurückzugeben...',
      'Etappe abgeschlossen: {blocoNome}. Ich sammle nun ihre Echos, um Ihnen mit Licht zu antworten.'
    ]
  },

  'ja-JP': {
    guide_feedback_label: 'ガイドからの返答',
    guide_reflecting: 'ガイドが熟考しています...',
    continue: '続ける',
    retry: '再試行',
    write_answer_first: '続ける前に回答を書いてください。',
    thinking_about_answer: '少々お待ちください。あなたの答えについて考えています...',
    incomplete_feedback:
      '返答がまだ完全には届いていません。「再試行」を押して、ガイドにあなたの答えを再送してください。',
    connection_oscillated:
      'この瞬間、ガイドとの接続が不安定になりました。「再試行」を押して返答を取得してください。',
    block_closing: [
      '{blocoNome} が完了しました。この段階の大切な印を集めています...',
      '{blocoNome} を終えました。少しお待ちください。この歩みの意味を丁寧に見つめています...',
      '{blocoNome} で素晴らしい一歩を踏み出しました。今、この段階の炎を集めて光をお返しします...',
      '{blocoNome} を締めくくりました。この段階の一つひとつの糸を見つめ、光と明晰さをお返しします...',
      '段階完了: {blocoNome}。その響きを集め、光をもってお応えします。'
    ]
  },

  'zh-CN': {
    guide_feedback_label: '向导反馈',
    guide_reflecting: '向导正在思索...',
    continue: '继续',
    retry: '重试',
    write_answer_first: '请先写下你的回答，再继续。',
    thinking_about_answer: '请稍候，我将思考你的回答...',
    incomplete_feedback:
      '反馈尚未完整到达。请点击“重试”以重新将你的回答发送给向导。',
    connection_oscillated:
      '此刻与向导的连接出现波动。请点击“重试”以获取反馈。',
    block_closing: [
      '恭喜！我们已完成 {blocoNome}。我正在收集这一阶段最珍贵的印记...',
      '{blocoNome} 已结束。请稍候，我正在细心体会这一段旅程的意义...',
      '我们在 {blocoNome} 中迈出了美好的一步！我现在正汇聚这一阶段的火焰，把光回赠给你...',
      '{blocoNome} 已圆满结束。我正在观察这一阶段的每一条线索，把光与清晰带回给你...',
      '阶段完成：{blocoNome}。我正在收集它的回响，并以光回应你。'
    ]
  }
};

function log(...a) { console.log(MOD, ...a); }
function warn(...a) { console.warn(MOD, ...a); }
function err(...a) { console.error(MOD, ...a); }

function uiText(key, fallback = '') {
  const lang = getLang();
  const pack = I18N_UI[lang] || I18N_UI['pt-BR'];
  return pack?.[key] ?? fallback;
}

function uiFormat(text, vars = {}) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

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
  if (x === 'arion' || x === 'ariane') return 'arian';
  if (x.includes('arian') || x.includes('arion')) return 'arian';
  if (x.includes('zion')) return 'zion';
  if (x.includes('lumen')) return 'lumen';
  return 'lumen';
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

  const question = section?.querySelector('#jp-question-typed, .jp-question-typed, #question-display');
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
  const label = document.querySelector('.jp-ai-response-label');

  if (label) {
    label.textContent = uiText('guide_feedback_label', 'Devolutiva do Guia');
  }

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
    stopSpeaking(); // mata qualquer fala anterior antes de iniciar nova
    ttsPromise = speakText(content);
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

    return true;
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

  document.dispatchEvent(
    new CustomEvent('perguntas:state-changed', {
      detail: {
        blocoAtual: currentBlock,
        blocosTotal: totalBlocks
      }
    })
  );
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

  const filtered = voices.filter((v) =>
    String(v.lang || '').toLowerCase().startsWith(langShort)
  );

  const list = filtered.length ? filtered : voices;

  const femaleHints = ['female', 'woman', 'maria', 'luciana', 'helena', 'samantha', 'victoria', 'google português do brasil'];
  const maleHints = ['male', 'man', 'paulo', 'daniel', 'ricardo', 'jorge', 'google português'];

  if (guide === 'lumen' || guide === 'arian') {
    return list.find((v) => femaleHints.some((h) => String(v.name || '').toLowerCase().includes(h))) || list[0] || null;
  }

  if (guide === 'zion') {
    return list.find((v) => maleHints.some((h) => String(v.name || '').toLowerCase().includes(h))) || list[0] || null;
  }

  return list[0] || null;
}

function speakText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return Promise.resolve();

  const guideRaw =
    sessionStorage.getItem('jornada.guia') ||
    sessionStorage.getItem('jornada.guide') ||
    localStorage.getItem('JORNADA_GUIA') ||
    localStorage.getItem('jornada.guia') ||
    localStorage.getItem('jornada.guide') ||
    document.body.dataset.guia ||
    window.currentGuide ||
    'lumen';

  const guide = normalizeGuide(guideRaw);
  const lang = document.documentElement.lang || getLang() || 'pt-BR';

  try {
    document.body.dataset.guia = guide;
    document.documentElement.dataset.guia = guide;
    sessionStorage.setItem('jornada.guia', guide);
    localStorage.setItem('jornada.guia', guide);
    window.currentGuide = guide;
  } catch {}

  // 1) Preferir o motor que já retorna promise real
  if (window.JORNADA_VOICE?.speak) {
    try {
      return window.JORNADA_VOICE.speak(clean, {
        lang,
        guide,
        rate: guide === 'zion' ? 0.92 : 0.98,
        pitch: guide === 'zion' ? 0.82 : 1.08,
        volume: 1
      });
    } catch (e) {
      console.warn('[speakText] JORNADA_VOICE falhou:', e);
    }
  }

  // 2) Se usar EffectCoordinator, só aceite se ele devolver thenable
  if (window.EffectCoordinator?.speak) {
    try {
      const result = window.EffectCoordinator.speak(clean, {
        guide,
        lang,
        rate: guide === 'zion' ? 0.92 : 0.98,
        pitch: guide === 'zion' ? 0.82 : 1.08,
        volume: 1
      });

      if (result && typeof result.then === 'function') {
        return result;
      }
    } catch (e) {
      console.warn('[speakText] EffectCoordinator falhou:', e);
    }
  }

  // 3) Fallback nativo
  if ('speechSynthesis' in window) {
    try {
      speechSynthesis.cancel();

      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = lang;
      utt.rate = guide === 'zion' ? 0.92 : 0.98;
      utt.pitch = guide === 'zion' ? 0.82 : 1.08;
      utt.volume = 1;

      return new Promise((resolve) => {
        utt.onend = () => resolve();
        utt.onerror = () => resolve();
        speechSynthesis.speak(utt);
      });
    } catch (e) {
      console.warn('[speakText] fallback nativo falhou:', e);
    }
  }

  return Promise.resolve();
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

  if (withVoice && typeof window.typeAndSpeak === 'function') {
    await window.typeAndSpeak(el, content, speed, {
      cursor: true,
      forceReplay: true
    });
    el.classList.add('typing-done');
    return;
  }

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

function updateMicButtonState(active) {
  const btn =
    document.getElementById('jp-btn-mic') ||
    document.querySelector('#jp-btn-mic') ||
    document.querySelector('.mic-btn');

  if (!btn) return;

  btn.classList.toggle('recording', !!active);
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  btn.dataset.active = active ? '1' : '0';

  if (active) {
    btn.style.background = '#b30000';
    btn.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.10), 0 0 14px rgba(255,0,0,0.45)';
  } else {
    btn.style.removeProperty('background');
    btn.style.removeProperty('box-shadow');
  }
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

  try {
    if (window.JORNADA_MICRO?.start) {
      window.__MIC_ACTIVE__ = true;
      window.__MIC_INSTANCE__ = window.JORNADA_MICRO;
      updateMicButtonState(true);
      window.JORNADA_MICRO.start(textarea, { mode: 'append', lang: getLang() });
      return;
    }

    if (typeof window.startMic === 'function') {
      window.__MIC_ACTIVE__ = true;
      updateMicButtonState(true);
      return window.startMic();
    }

    if (typeof window.initSpeechRecognition === 'function') {
      window.__MIC_ACTIVE__ = true;
      updateMicButtonState(true);
      return window.initSpeechRecognition();
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      warn('SpeechRecognition não suportado.');
      updateMicButtonState(false);
      return;
    }

    if (!window.__REC__) {
      const rec = new SR();
      rec.lang = document.documentElement.lang || getLang() || 'pt-BR';
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        window.__MIC_ACTIVE__ = true;
        updateMicButtonState(true);
      };

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

      rec.onend = () => {
        window.__MIC_ACTIVE__ = false;
        window.__MIC_INSTANCE__ = null;
        updateMicButtonState(false);
      };

      rec.onerror = (e) => {
        warn('MIC onerror:', e);
        window.__MIC_ACTIVE__ = false;
        window.__MIC_INSTANCE__ = null;
        updateMicButtonState(false);
      };

      window.__REC__ = rec;
    }

    window.__MIC_ACTIVE__ = true;
    window.__MIC_INSTANCE__ = window.__REC__;
    updateMicButtonState(true);
    textarea.focus();
    window.__REC__.start();
  } catch (e) {
    window.__MIC_ACTIVE__ = false;
    window.__MIC_INSTANCE__ = null;
    updateMicButtonState(false);
    err('Erro ao iniciar microfone:', e);
  }
}

function showMissingAnswerFeedback() {
  const msg = uiText('write_answer_first', 'Escreva sua resposta antes de continuar.');
  if (typeof window.toast === 'function') {
    window.toast(msg);
  } else {
    alert(msg);
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
    .filter(Boolean).length;
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

function buildFallbackFeedback({ guia, nome, blocoNome, resposta, pergunta, idioma }) {
  const guide = normalizeGuide(guia || 'lumen');
  const participant = String(nome || 'Caminhante').trim() || 'Caminhante';
  const answer = String(resposta || '').trim();
  const questionText = String(pergunta || '').trim();
  const block = String(blocoNome || 'esta etapa').trim();
  const lang = idioma || getLang();

  const fallbackPorGuia = {
    'pt-BR': {
      lumen: `${participant}, sua resposta em ${block} revela um movimento sincero de percepção interior. Ao expressar "${answer || questionText || 'sua vivência'}", você deixa transparecer sensibilidade, honestidade e desejo de caminhar com mais consciência. Receba esta reflexão como um acolhimento: continue ouvindo sua verdade com serenidade, porque há luz no modo como você escolheu responder a esta etapa.`,
      zion: `${participant}, o que você compartilhou em ${block} mostra presença, verdade e disposição para enxergar mais fundo. Ao dizer "${answer || questionText || 'sua vivência'}", você revela um posicionamento interno que merece respeito e continuidade. Leve esta resposta como um sinal de força: aquilo que começa em reflexão pode amadurecer em direção, clareza e propósito.`,
      arian: `${participant}, sua resposta em ${block} carrega delicadeza e profundidade. Quando você expressa "${answer || questionText || 'sua vivência'}", percebemos um traço do seu mundo interior pedindo escuta, cuidado e crescimento. Que esta devolutiva te alcance com acolhimento e te ajude a seguir com mais presença, verdade e conexão com a luz que floresce dentro de você.`
    },
    'en-US': {
      lumen: `${participant}, your answer in ${block} reveals a sincere movement of inner perception. By expressing "${answer || questionText || 'your experience'}", you show sensitivity, honesty, and a desire to walk with greater awareness. Receive this reflection as an embrace: keep listening to your truth with serenity, because there is light in the way you chose to answer this stage.`,
      zion: `${participant}, what you shared in ${block} shows presence, truth, and a willingness to look deeper. By saying "${answer || questionText || 'your experience'}", you reveal an inner stance that deserves respect and continuity. Take this response as a sign of strength: what begins in reflection can mature into direction, clarity, and purpose.`,
      arian: `${participant}, your answer in ${block} carries delicacy and depth. When you express "${answer || questionText || 'your experience'}", we perceive a trace of your inner world asking for listening, care, and growth. May this feedback reach you with welcome and help you move forward with more presence, truth, and connection with the light blooming within you.`
    },
    'es-ES': {
      lumen: `${participant}, tu respuesta en ${block} revela un movimiento sincero de percepción interior. Al expresar "${answer || questionText || 'tu vivencia'}", dejas ver sensibilidad, honestidad y deseo de caminar con mayor conciencia. Recibe esta reflexión como acogida: sigue escuchando tu verdad con serenidad, porque hay luz en la forma en que elegiste responder a esta etapa.`,
      zion: `${participant}, lo que compartiste en ${block} muestra presencia, verdad y disposición para mirar más hondo. Al decir "${answer || questionText || 'tu vivencia'}", revelas una postura interior que merece respeto y continuidad. Toma esta respuesta como una señal de fuerza: lo que comienza en reflexión puede madurar en dirección, claridad y propósito.`,
      arian: `${participant}, tu respuesta en ${block} lleva delicadeza y profundidad. Cuando expresas "${answer || questionText || 'tu vivencia'}", percibimos un rasgo de tu mundo interior que pide escucha, cuidado y crecimiento. Que esta devolución te alcance con acogida y te ayude a seguir con más presencia, verdad y conexión con la luz que florece dentro de ti.`
    }
  };

  const pack = fallbackPorGuia[lang] || fallbackPorGuia['pt-BR'];
  return pack[guide] || pack.lumen;
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

function getDadosPessoaisState() {
  try {
    return (
      window.JORNADA_STATE?.dadosPessoais ||
      JSON.parse(sessionStorage.getItem('JORNADA_DADOS_PESSOAIS') || 'null') ||
      JSON.parse(localStorage.getItem('JORNADA_DADOS_PESSOAIS') || 'null') ||
      {}
    );
  } catch {
    return {};
  }
}

function buildDadosPessoaisPayload() {
  const dp = getDadosPessoaisState() || {};
  return {
    nomeCompleto: String(dp.nomeCompleto || dp.nome || '').trim(),
    idadeFaixa: String(dp.idadeFaixa || '').trim(),
    cidade: String(dp.cidade || '').trim(),
    estado: String(dp.estado || '').trim(),
    estadoCivil: String(dp.estadoCivil || '').trim(),
    profissao: String(dp.profissao || '').trim(),
    filhos: String(dp.filhos || '').trim(),
    religiao: String(dp.religiao || '').trim(),
    observacoes: String(dp.observacoes || '').trim(),
    perfilPersonalidade: {
      temperamento: String(dp?.perfilPersonalidade?.temperamento || '').trim(),
      comportamento: String(dp?.perfilPersonalidade?.comportamento || '').trim(),
      carater: String(dp?.perfilPersonalidade?.carater || '').trim(),
      indole: String(dp?.perfilPersonalidade?.indole || '').trim()
    },
    eixoExistencial: {
      vazio: String(dp?.eixoExistencial?.vazio || '').trim(),
      pleno: String(dp?.eixoExistencial?.pleno || '').trim()
    }
  };
}

async function requestGuideFeedbackWithFallback(params) {
  const {
    nome,
    guia,
    blocoNome,
    respostas,
    idioma,
    pergunta,
    resposta,
    dadosPessoais
  } = params;

  const guide = normalizeGuide(guia || 'lumen');
  const fallbackText = buildFallbackFeedback({
    guia: guide,
    nome,
    blocoNome,
    resposta,
    pergunta,
    idioma
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
    resposta,
    dadosPessoais: dadosPessoais || buildDadosPessoaisPayload()
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
          dadosPessoais: bodyBase.dadosPessoais,
          retry: tentativa.retry,
          forceComplete: true,
          minSentences: tentativa.guia === 'lumen' ? 3 : 2,
          minChars: tentativa.guia === 'lumen' ? 160 : 120
        });
      } else if (typeof window.API.gerarDevolutiva === 'function') {
        raw = await window.API.gerarDevolutiva({
          nome,
          guia: tentativa.guia,
          bloco: blocoNome,
          pergunta,
          resposta,
          idioma,
          dadosPessoais: bodyBase.dadosPessoais,
          retry: tentativa.retry,
          forceComplete: true,
          minSentences: tentativa.guia === 'lumen' ? 3 : 2,
          minChars: tentativa.guia === 'lumen' ? 160 : 120
        });
      }

      const texto = extractFeedbackText(raw);
      if (!texto) {
        ultimoErro = new Error(`Resposta vazia para ${tentativa.guia}`);
        continue;
      }

      if (isWeakFeedback(texto, {
        minChars: tentativa.guia === 'lumen' ? 160 : 120,
        minSentences: tentativa.guia === 'lumen' ? 3 : 2
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
    } catch (e) {
      ultimoErro = e;
    }
  }

  console.error('[DEVOLUTIVA][ROBUSTA] usando fallback local:', ultimoErro);
  return {
    ok: true,
    texto: fallbackText,
    guia: 'lumen',
    fallbackUsed: true,
    source: 'frontend_local_fallback'
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
  const dadosPessoais = buildDadosPessoaisPayload();

  if (!respostas.length) {
    return {
      ok: false,
      texto: '',
      source: 'empty_block_answers'
    };
  }

  return requestGuideFeedbackWithFallback({
    nome,
    guia,
    blocoNome,
    respostas,
    idioma,
    pergunta: '',
    resposta: respostas[respostas.length - 1] || '',
    dadosPessoais
  });
}

function getBlockClosingLead(bloco) {
  const blocoNome = bloco?.title || bloco?.id || 'este bloco';
  const frases = uiText('block_closing', I18N_UI['pt-BR'].block_closing);
  const idx =
    typeof bloco?.index === 'number'
      ? bloco.index % frases.length
      : Math.floor(Math.random() * frases.length);

  return uiFormat(frases[idx], { blocoNome });
}

async function maybeHandleBlockClosure(section, bloco) {
  if (!isLastQuestionOfBlock(bloco)) {
    goNext(bloco);
    return;
  }

  try {
    setContinueState(section, 'loading');

    const lead = getBlockClosingLead(bloco);
    if (lead) {
      await setGuideResponse(lead, 'info');
      await new Promise((r) => setTimeout(r, 700));
    }

    const result = await gerarDevolutivaDoBloco(bloco);
    const textoFinal = String(result?.texto || '').trim();

    if (!textoFinal) {
      console.warn('[BLOCO] devolutiva do bloco vazia');
      setContinueState(section, 'retry');
      return;
    }

    // salva para a etapa final / PDF
    const existentes = getStoredBlockFeedbacks().filter(
      (item) => item?.blocoId !== (bloco?.id || '')
    );

    const blocoId = bloco?.id || '';
    const anteriores = getStoredBlockFeedbacks();
    const atual = anteriores.find((item) => item?.blocoId === blocoId) || {};
    const outros = anteriores.filter((item) => item?.blocoId !== blocoId);

    outros.push({
      blocoId,
      blocoTitulo: bloco?.title || bloco?.id || 'Bloco',
      respostas: getAllAnswersFromBlock(bloco),
      devolutiva: textoFinal,
      perguntas: Array.isArray(atual?.perguntas) ? atual.perguntas : [],
      guiaUsado: result?.guiaUsado || normalizeGuide(document.body.dataset.guia || 'lumen'),
      source: result?.source || 'desconhecida'
    });

    setStoredBlockFeedbacks(outros);

    await setGuideResponse(
      textoFinal,
      result?.fallbackUsed ? 'warning' : 'success'
    );

    console.log('[BLOCO] devolutiva concluída. source=', result?.source || 'desconhecida');

    await new Promise((r) => setTimeout(r, 1800));

    goNext(bloco);
  } catch (e) {
    console.error('[BLOCO] erro ao gerar devolutiva do bloco:', e);
    setContinueState(section, 'retry');
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
    btn.textContent = uiText('guide_reflecting', 'Guia refletindo...');
    btn.classList.add('is-loading');
    return;
  }

  if (state === 'ready') {
    btn.disabled = false;
    btn.textContent = uiText('continue', 'Continuar');
    btn.classList.add('is-ready');
    return;
  }

  if (state === 'error') {
    btn.disabled = false;
    btn.textContent = uiText('retry', 'Tentar novamente');
    btn.classList.add('is-error');
    return;
  }

  btn.disabled = false;
  btn.textContent = uiText('continue', 'Continuar');
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
      stopSpeaking();
      await speakQuestionOrGuideResponse(perguntaText);
    };
  }

  if (btnMic) {
    btnMic.onclick = async (ev) => {
      ev.preventDefault();

      const isRecording =
        btnMic.classList.contains('recording') ||
        window.__MIC_ACTIVE__ === true;

      if (isRecording) {
        try {
          if (window.__REC__) window.__REC__.stop();
          if (window.JORNADA_MICRO?.stop) window.JORNADA_MICRO.stop();
        } catch (e) {
          console.warn('[MIC] erro ao parar reconhecimento:', e);
        }

        window.__MIC_ACTIVE__ = false;
        window.__MIC_INSTANCE__ = null;
        updateMicButtonState(false);
        return;
      }

      updateMicButtonState(true);

      try {
        triggerMic(textarea);
      } catch (e) {
        btnMic.classList.remove('recording');
        console.warn('[MIC] erro ao iniciar:', e);
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

    if (btnConfirm.dataset.busy === '1') return;
    btnConfirm.dataset.busy = '1';
    btnConfirm.disabled = true;

    try {
      if (window.__MIC_ACTIVE__ && window.__MIC_INSTANCE__) {
        try { window.__MIC_INSTANCE__.stop(); } catch {}
        window.__MIC_ACTIVE__ = false;
        updateMicButtonState(false);
      }

      const state = section?.dataset?.continueState || 'idle';

      if (state === 'ready') {
        await maybeHandleBlockClosure(section, bloco);
        return;
      }

      if (state === 'loading') {
        return;
      }

      const val = String(textarea.value || '').trim();
      const dadosPessoais = buildDadosPessoaisPayload();

      if (!val) {
        showMissingAnswerFeedback();
        textarea?.focus();
        return;
      }

      saveAnswer(bloco, 0, val);
      setContinueState(section, 'loading');

      await setGuideResponse(
        uiText(
          'thinking_about_answer',
          'Só um momento, vou refletir sobre sua resposta...'
        ),
        'info'
      );

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
        respostas: [val],
        idioma: document.documentElement.lang || getLang() || 'pt-BR',
        pergunta: getQuestionText(bloco, 0),
        resposta: val,
        dadosPessoais
      });

      const texto = String(result?.texto || '').trim();

      if (!texto) {
        await setGuideResponse(
          uiText(
            'connection_oscillated',
            'A conexão com o guia oscilou neste momento. Toque em "Tentar novamente" para buscar a devolutiva.'
          ),
          'warn'
        );
        setContinueState(section, 'error');
        return;
      }

      await setGuideResponse(
        texto,
        result?.fallbackUsed ? 'warning' : 'success'
      );

      const blocoId = bloco?.id || '';
      const existentes = getStoredBlockFeedbacks().filter(
        (item) => item?.blocoId !== blocoId
      );

      const anterior =
        getStoredBlockFeedbacks().find((item) => item?.blocoId === blocoId) || {};

      existentes.push({
        blocoId,
        blocoTitulo: bloco?.title || bloco?.id || 'Bloco',
        respostas: [val],
        devolutiva: anterior?.devolutiva || '',
        perguntas: [
          {
            pergunta: getQuestionText(bloco, 0),
            resposta: val,
            devolutiva: texto
          }
        ],
        guiaUsado: result?.guiaUsado || normalizeGuide(guia),
        source: result?.source || 'desconhecida'
      });

      setStoredBlockFeedbacks(existentes);      

      setContinueState(section, 'ready');
    } catch (err) {
      console.error('[PERGUNTAS_BLOCO] erro no confirmar:', err);

      await setGuideResponse(
        uiText(
          'connection_oscillated',
          'A conexão com o guia oscilou neste momento. Toque em "Tentar novamente" para buscar a devolutiva.'
        ),
        'warn'
      ); 

      setContinueState(section, 'error');
    } finally {
      btnConfirm.dataset.busy = '0';
      btnConfirm.disabled = false;
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
    titleEl.textContent = String(
      bloco?.title || `Bloco ${(bloco?.index ?? 0) + 1}`
    ).trim();
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

document.addEventListener('section:shown', async (e) => {
  const section = e.detail?.node;
  if (!section || section.id !== 'section-dados-pessoais') return;

  await new Promise((r) => setTimeout(r, 180));

  if (typeof window.applyTypingAndTTS === 'function') {
    await window.applyTypingAndTTS('section-dados-pessoais', section, { forceReplay: true });
  } else {
    console.warn('[DADOS] applyTypingAndTTS não encontrado');
  }
});

log('inicializado.');
})(window, document);
