/* section-selfie.js — VERSÃO FINAL CORRIGIDA: SEM REPETIÇÃO DE TEXTO */
(function (window) {
  'use strict';

  const NS = (window.JCSelfie = window.JCSelfie || {});
  if (NS.__final) return;
  NS.__final = true;

  const NEXT_SECTION_ID = 'section-card';
  const VIDEO_SRC = '/assets/videos/filme-card-dourado.mp4';
  const FINAL_ZOOM = 0.65;

  let stream = null, videoEl, canvasEl, previewImg;
  let lastCapture = null;

  const toast = msg => window.toast?.(msg) || alert(msg);

  window.DEBUG_JC = () => {
    console.log('JC.data:', window.JC?.data);
    console.log('sessionStorage.jornada.guia:', sessionStorage.getItem('jornada.guia'));
    console.log('localStorage.jc.nome:', localStorage.getItem('jc.nome'));
  };

  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    const ssNome = sessionStorage.getItem('jornada.nome');
    const ssGuia = sessionStorage.getItem('jornada.guia');
    if (ssNome && ssNome.trim()) nome = ssNome.trim();
    if (ssGuia && ssGuia.trim()) guia = ssGuia.trim().toLowerCase();

    if (!ssNome || !ssGuia) {
      const lsNome = localStorage.getItem('jc.nome');
      const lsGuia = localStorage.getItem('jc.guia');
      if (lsNome) nome = lsNome;
      if (lsGuia) guia = lsGuia;
    }

    nome = nome.toUpperCase().trim();
    guia = guia.toLowerCase().trim();

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;

    try {
      sessionStorage.setItem('jornada.nome', nome);
      sessionStorage.setItem('jornada.guia', guia);
    } catch (e) {}

    console.log(`%c[SELFIE] Dados finais → Nome: ${nome}, Guia: ${guia}`, 'color: cyan; font-weight: bold');
    return { nome, guia };
  }

  function typeWriter(el, text, speed = 35) {
    if (!el) return;
    el.textContent = '';
    el.style.opacity = '1';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) el.textContent += text[i++];
      else clearInterval(timer);
    }, speed);
  }

// ================================
// LANG/I18N helpers (fallback safe)
// ================================
function getActiveLang() {
  // 1) i18n global (se existir)
  const l1 = window.i18n?.currentLang;

  // 2) chaves comuns em storage (caso você salve em algum lugar)
  const l2 = sessionStorage.getItem('jornada.lang') || sessionStorage.getItem('i18n.lang');
  const l3 = localStorage.getItem('jc.lang') || localStorage.getItem('i18n.lang');

  // 3) html lang
  const l4 = document.documentElement?.lang;

  const lang = (l1 || l2 || l3 || l4 || 'pt-BR').toString().trim();
  return lang;
}

function tSelfie(key, vars = {}) {
  // Se você tiver i18n.t / i18n.get / i18n.translate, usa
  const it = window.i18n;
  const lang = getActiveLang();

  // tenta funções comuns
  const candidates = [
    typeof it?.t === 'function' ? it.t(key, vars) : null,
    typeof it?.get === 'function' ? it.get(key, vars) : null,
    typeof it?.translate === 'function' ? it.translate(key, vars) : null,
  ].filter(Boolean);

  if (candidates.length) return String(candidates[0]);

  // fallback: dicionário mínimo
  const dict = {
    'pt-BR': {
      'selfie.title': 'Prepare sua selfie',
      'selfie.text': '{nome}, afaste o celular e posicione o rosto. {guia} te guiará.'
    },
    'en-US': {
      'selfie.title': 'Prepare your selfie',
      'selfie.text': '{nome}, hold your phone a bit farther and frame your face. {guia} will guide you.'
    },
    'es-ES': {
      'selfie.title': 'Prepara tu selfie',
      'selfie.text': '{nome}, aleja el teléfono y encuadra tu rostro. {guia} te guiará.'
    }
  };

  const base = dict[lang] || dict['pt-BR'];
  let str = base[key] || dict['pt-BR'][key] || key;

  // interpolação simples {nome} {guia}
  Object.keys(vars).forEach(k => {
    str = str.replaceAll(`{${k}}`, String(vars[k] ?? ''));
  });
  return str;
}

  
 function speak(text) {
  const lang = getActiveLang();

  if (window.speak) {
    // Se existir um speak global seu, tente passar lang se ele aceitar
    try { window.speak(text, { lang }); return; } catch (e) {}
    window.speak(text); // fallback
    return;
  }

  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;   // ✅ usa idioma ativo
    u.rate = 0.9;
    speechSynthesis.speak(u);
  }
}


  function updateZoom() {
    const all = +document.getElementById('zoomAll').value;
    const x = +document.getElementById('zoomX').value;
    const y = +document.getElementById('zoomY').value;

    document.getElementById('zoomAllVal').textContent = all.toFixed(2) + '×';
    document.getElementById('zoomXVal').textContent = x.toFixed(2) + '×';
    document.getElementById('zoomYVal').textContent = y.toFixed(2) + '×';

    const scaleX = all * x;
    const scaleY = all * y;

    [videoEl, canvasEl].forEach(el => {
      if (el) {
        el.style.transform = `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`;
      }
    });
  }

  async function startCamera() {
    stopCamera();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 } },
        audio: false
      });
      videoEl.srcObject = stream;
      videoEl.style.display = 'block';
      canvasEl.style.display = 'none';
      previewImg.style.display = 'none';
      document.getElementById('btn-selfie-capture').disabled = false;
      updateZoom();
    } catch (e) {
      toast('Câmera bloqueada. Ative as permissões.');
      document.getElementById('selfie-error').style.display = 'block';
    }
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    if (videoEl) videoEl.srcObject = null;
  }

  function capture() {
    const canvas = canvasEl;
    const video = videoEl;
    const ctx = canvas.getContext('2d');
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;

    canvas.width = w; canvas.height = h;

    const scale = FINAL_ZOOM;
    const sw = w / scale, sh = h / scale;
    const sx = (video.videoWidth - sw) / 2;
    const sy = (video.videoHeight - sh) / 2;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    lastCapture = canvas.toDataURL('image/jpeg', 0.92);

    videoEl.style.display = 'none';
    canvasEl.style.display = 'block';
    document.getElementById('btn-selfie-confirm').disabled = false;
  }

  function playTransitionThenGo() {
    console.log(`[SELFIE] Transição → ${NEXT_SECTION_ID}`);
    if (window.playTransitionVideo) {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else {
      const v = document.createElement('video');
      v.src = VIDEO_SRC;
      v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
      v.muted = v.playsInline = true;
      v.onended = () => { v.remove(); goTo(NEXT_SECTION_ID); };
      document.body.appendChild(v);
      v.play().catch(() => { v.remove(); goTo(NEXT_SECTION_ID); });
    }
  }

  function goTo(id) {
    if (window.JC?.show) window.JC.show(id, { force: true });
    else forceShow(id);
  }

  function forceShow(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden'); el.classList.add('active');
      el.scrollIntoView({ behavior: 'smooth' });
      el.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id } }));
    }
  }

  function confirmAndGo() {
    if (!lastCapture) {
      toast('Tire uma foto primeiro.');
      return;
    }

    window.JC = window.JC || {}; window.JC.data = window.JC.data || {};
    window.JC.data.selfieDataUrl = lastCapture;
    try { localStorage.setItem('jc.selfieDataUrl', lastCapture); } catch {}

    window.dispatchEvent(new CustomEvent('selfie:captured', { detail: { dataUrl: lastCapture } }));
    playTransitionThenGo();
  }

  // === INIT COM ANTI-REPETIÇÃO ===
  document.addEventListener('sectionLoaded', e => {
    if (e.detail?.sectionId !== 'section-selfie') return;

    videoEl = document.getElementById('selfieVideo');
    canvasEl = document.getElementById('selfieCanvas');
    previewImg = document.getElementById('selfiePreview');

    const title = document.getElementById('selfie-title');
    const texto = document.getElementById('selfieTexto');
    const { nome, guia } = getUserData();

    setTimeout(() => {
      // TÍTULO: só uma vez
      if (title && !title.classList.contains('typed')) {
        const titleText = (title.dataset.text || 'Prepare sua selfie').trim();
        title.textContent = '';
        typeWriter(title, titleText, 40);
        title.classList.add('typed');
      }

      // TEXTO PERSONALIZADO: só uma vez
      if (texto && !texto.classList.contains('typed')) {
        const guiaNomeMap = { arian: 'Arian', lumen: 'Lumen', zion: 'Zion' };
        const guiaNome = guiaNomeMap[guia] || 'Guia';
        const fullText = `${nome}, afaste o celular e posicione o rosto. ${guiaNome} te guiará.`;
        texto.textContent = '';
        typeWriter(texto, fullText, 36);
        speak(fullText);
        texto.classList.add('typed');
      }
    }, 300);

    document.querySelectorAll('input[type=range]').forEach(input => {
      input.oninput = updateZoom;
    });
    updateZoom();

    document.getElementById('startCamBtn').onclick = startCamera;
    document.getElementById('btn-selfie-capture').onclick = capture;
    document.getElementById('btn-selfie-confirm').onclick = confirmAndGo;
    document.getElementById('btn-skip-selfie').onclick = () => {
      stopCamera();
      playTransitionThenGo();
    };
    
    const guiaCanon =
  canonGuia(window.JORNADA_STATE?.guiaSelecionado) ||
  canonGuia(window.JORNADA_STATE?.guia) ||
  canonGuia(sessionStorage.getItem('JORNADA_GUIA')) ||
  canonGuia(localStorage.getItem('JORNADA_GUIA')) ||
  canonGuia(guiaSelecionadoAgora) ||
  'zion'; // fallback neutro (NUNCA lumen)

  sessionStorage.setItem('JORNADA_GUIA', guiaCanon);
  localStorage.setItem('JORNADA_GUIA', guiaCanon);
  window.JORNADA_STATE = window.JORNADA_STATE || {};
  window.JORNADA_STATE.guia = guiaCanon;
  window.JORNADA_STATE.guiaSelecionado = guiaCanon;
  console.log('[SELFIE] guiaCanon gravado:', guiaCanon);    
  });

  document.addEventListener('sectionWillHide', e => {
    if (e.detail?.sectionId === 'section-selfie') stopCamera();
  });

  const section = document.getElementById('section-selfie');
  if (section && section.classList.contains('active')) {
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: 'section-selfie' } }));
    }, 100);
  }
/* =========================================================
   TEMA DO GUIA — reaplica em qualquer seção quando necessário
   ========================================================= */
(function () {
  'use strict';

  function applyThemeFromSession() {
    const guiaRaw = sessionStorage.getItem('jornada.guia');
    const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : '';

    // fallback dourado
    let main = '#ffd700', g1 = 'rgba(255,230,180,0.85)', g2 = 'rgba(255,210,120,0.75)';

    if (guia === 'lumen') { main = '#00ff9d'; g1 = 'rgba(0,255,157,0.90)'; g2 = 'rgba(120,255,200,0.70)'; }
    if (guia === 'zion')  { main = '#00aaff'; g1 = 'rgba(0,170,255,0.90)'; g2 = 'rgba(255,214,91,0.70)'; }
    if (guia === 'arian') { main = '#ff00ff'; g1 = 'rgba(255,120,255,0.95)'; g2 = 'rgba(255,180,255,0.80)'; }

    document.documentElement.style.setProperty('--theme-main-color', main);
    document.documentElement.style.setProperty('--progress-main', main);
    document.documentElement.style.setProperty('--progress-glow-1', g1);
    document.documentElement.style.setProperty('--progress-glow-2', g2);
    document.documentElement.style.setProperty('--guide-color', main);

    if (guia) document.body.setAttribute('data-guia', guia);
  }

  // roda no carregamento e também quando o app troca seção
  document.addEventListener('DOMContentLoaded', applyThemeFromSession);
  document.addEventListener('sectionLoaded', () => setTimeout(applyThemeFromSession, 50));
  document.addEventListener('guia:changed', applyThemeFromSession);
})();
  
})(window);
