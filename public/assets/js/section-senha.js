(function () {
  'use strict';

  const SECTION_ID = 'section-senha';
  const HOME_URL = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';
  const NEXT_SECTION_ID = 'section-guia';
  const HIDE_CLASS = 'hidden';

  const TYPING_SPEED = 48;
  const INITIAL_DELAY_MS = 180;
  const TTS_LATCH_MS = 420;
  const START_DELAY_MS = 260;
  const BETWEEN_BLOCKS_MS = 520;

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] já carregado');
    return;
  }

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerOn: false,
    initToken: 0,
    activeRunToken: 0
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function waitForElement(selector, { within = document, timeout = 8000, step = 100 } = {}) {
    const t0 = performance.now();
    return new Promise((resolve, reject) => {
      const loop = () => {
        const el = within.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - t0 >= timeout) return reject(new Error(`Timeout: ${selector}`));
        setTimeout(loop, step);
      };
      loop();
    });
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
    el.style.zIndex = 'auto';
  }

  function cancelAllSpeech() {
    try { window.speechSynthesis?.cancel?.(); } catch {}
    try { window.EffectCoordinator?.stop?.(); } catch {}
  }

  async function waitForTransitionUnlock(timeoutMs = 20000) {
    function transitionStillRunning() {
      return !!(
        window.__TRANSITION_LOCK ||
        document.documentElement.classList.contains('is-transitioning') ||
        document.body.classList.contains('is-transitioning') ||
        document.documentElement.classList.contains('vt-force-fixed') ||
        document.body.classList.contains('vt-force-fixed')
      );
    }

    if (!transitionStillRunning()) return;

    const start = Date.now();

    await new Promise((resolve) => {
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        document.removeEventListener('transition:ended', onEnd);
        clearInterval(timer);
        resolve();
      };

      const onEnd = () => {
        setTimeout(() => {
          if (!transitionStillRunning()) finish();
        }, 80);
      };

      const timer = setInterval(() => {
        if (!transitionStillRunning()) finish();
        if (Date.now() - start >= timeoutMs) finish();
      }, 120);

      document.addEventListener('transition:ended', onEnd);
    });
  }

  function isElementActuallyVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      el.classList.contains(HIDE_CLASS) ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  async function waitForSectionVisible(root, timeoutMs = 8000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (isElementActuallyVisible(root)) return true;
      await sleep(120);
    }
    return isElementActuallyVisible(root);
  }

  function getActiveGuide() {
    return (
      window.__GUIA_ATIVO ||
      window.guiaAtual ||
      window.JORNADA_GUIA_ATIVO ||
      localStorage.getItem('guiaSelecionado') ||
      sessionStorage.getItem('guiaSelecionado') ||
      document.body?.dataset?.guia ||
      'lumen'
    ).toString().toLowerCase();
  }

  function getActiveLang() {
    return (
      window.i18n?.getLanguage?.() ||
      localStorage.getItem('i18n_lang') ||
      sessionStorage.getItem('i18n_lang') ||
      document.documentElement.lang ||
      'pt-BR'
    );
  }

  function buildGuideVoiceContext() {
    const guide = getActiveGuide();
    const lang = getActiveLang();
    const presetByGuide = {
      lumen: { voiceGender: 'female', pitch: 1.08, rate: 1.00, style: 'acolhedora' },
      zion:  { voiceGender: 'male',   pitch: 0.92, rate: 0.96, style: 'firme' },
      arian: { voiceGender: 'female', pitch: 1.16, rate: 0.94, style: 'inspiradora' }
    };
    return { lang, guide, ...(presetByGuide[guide] || presetByGuide.lumen) };
  }

  function syncGuideVoiceContext(root) {
    const ctx = buildGuideVoiceContext();
    window.__JC_VOICE_CONTEXT = ctx;
    window.__GUIDE_VOICE_CONTEXT = ctx;
    window.__SENHA_VOICE_CONTEXT = ctx;
    if (root) {
      root.dataset.lang = ctx.lang;
      root.dataset.guide = ctx.guide;
      root.dataset.voiceGender = ctx.voiceGender;
      root.dataset.voicePitch = String(ctx.pitch);
      root.dataset.voiceRate = String(ctx.rate);
      root.dataset.voiceStyle = ctx.style;
    }
    if (window.EffectCoordinator) {
      window.EffectCoordinator.voiceContext = {
        ...(window.EffectCoordinator.voiceContext || {}),
        ...ctx
      };
    }
    return ctx;
  }

  async function applySectionI18n(root) {
    if (!root) return;
    try {
      if (window.i18n?.apply) {
        await window.i18n.apply(root);
      } else if (window.applyI18n) {
        await window.applyI18n(root);
      }
    } catch (err) {
      console.warn('[JCSenha] falha ao aplicar i18n:', err);
    }

    root.querySelectorAll('[data-i18n-text]').forEach((el) => {
      const key = el.dataset.i18nText;
      if (!key || !window.i18n?.t) return;
      const translated = window.i18n.t(key);
      if (translated && typeof translated === 'string' && translated.trim() && translated !== key) {
        const clean = translated.trim();
        el.dataset.text = clean;
        el.setAttribute('data-text', clean);
      }
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.dataset.i18nPlaceholder;
      if (!key || !window.i18n?.t) return;
      const translated = window.i18n.t(key);
      if (translated && typeof translated === 'string' && translated.trim() && translated !== key) {
        el.placeholder = translated.trim();
      }
    });
  }

  function normalizeParagraph(el, { clear = false } = {}) {
    if (!el) return false;
    const key = el.dataset?.i18nText;
    const translated = (key && window.i18n?.t ? window.i18n.t(key) : null);
    const source = (
      (translated && translated !== key ? translated : null) ||
      el.getAttribute('data-text') ||
      el.dataset?.text ||
      el.textContent ||
      ''
    ).trim();
    if (!source) return false;
    el.dataset.text = source;
    el.setAttribute('data-text', source);
    el.classList.remove('typing-active', 'typing-done', 'type-done');
    el.removeAttribute('data-spoken');
    el.removeAttribute('data-typed');
    el.removeAttribute('aria-busy');
    if (clear) {
      el.textContent = '';
    } else if (!el.textContent.trim()) {
      el.textContent = source;
    }
    return true;
  }

  function prepareTypingNodes(root, { clear = false } = {}) {
    if (!root) return;
    root.querySelectorAll('[data-typing="true"]').forEach((el) => normalizeParagraph(el, { clear }));
  }

  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise((resolve) => {
      let i = 0;
      el.textContent = '';
      (function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      })();
    });
  }

  async function flushFrames(count = 2) {
    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  async function typeOnce(el, { speed = TYPING_SPEED, speak = true, voiceCtx = null, runToken = 0 } = {}) {
    if (!el) return;
    if (runToken !== window.JCSenha.state.activeRunToken) return;

    const key = el.dataset?.i18nText;
    const translated = (key && window.i18n?.t ? window.i18n.t(key) : null);
    const rawText =
      (translated && translated !== key ? translated : null) ||
      el.dataset?.text ||
      el.getAttribute('data-text') ||
      el.textContent ||
      '';
    const text = String(rawText).trim();
    if (!text) return;

    el.dataset.text = text;
    el.setAttribute('data-text', text);

    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    el.textContent = '';
    el.classList.add('typing-active');
    el.classList.remove('typing-done', 'type-done');
    el.removeAttribute('data-spoken');
    el.setAttribute('aria-busy', 'true');

    let usedFallback = false;

    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(el, text, () => resolve(), { speed, cursor: true });
        } catch (err) {
          console.warn('[JCSenha] runTyping falhou, fallback local', err);
          usedFallback = true;
          resolve();
        }
      });
    } else {
      usedFallback = true;
    }

    if (runToken !== window.JCSenha.state.activeRunToken) return;

    if (usedFallback) {
      await localType(el, text, speed);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    el.removeAttribute('aria-busy');
    el.setAttribute('data-typed', 'true');

    window.G.__typingLock = prevLock;

    if (speak && text && !el.dataset.spoken && runToken === window.JCSenha.state.activeRunToken) {
      try {
        if (window.EffectCoordinator?.speak && !el.dataset.spoken) {
          cancelAllSpeech();
          const speakOptions = {
            rate:   voiceCtx?.rate   ?? 1.0,
            pitch:  voiceCtx?.pitch  ?? 1.0,
            lang:   voiceCtx?.lang   ?? document.documentElement.lang ?? 'pt-BR',
            gender: voiceCtx?.voiceGender ?? 'female',
            guide:  voiceCtx?.guide  ?? 'lumen',
            style:  voiceCtx?.style  ?? 'acolhedora'
          };
          await window.EffectCoordinator.speak(text, speakOptions);
          el.dataset.spoken = 'true';
        }
      } catch (err) {
        console.error('[JCSenha] erro no TTS:', err);
      }
    }

    await sleep(80);
  }

  function getTransitionSrc(root, btn) {
    return (btn?.dataset?.transitionSrc) ||
      (root?.dataset?.transitionSrc) ||
      '/assets/videos/filme-senha-confirmada.mp4';
  }

  function saveSenha(value) {
    try {
      if (window.JC?.data) {
        window.JC.data.senha = value;
      } else {
        window.JCData = window.JCData || {};
        window.JCData.senha = value;
      }
    } catch {}
  }

  async function initOnce(root, triggerToken) {
    if (!root) return;
    if (triggerToken !== window.JCSenha.state.initToken) return;

    root.dataset.senhaInitialized = 'false';
    root.dataset.transitionReady = 'false';

    cancelAllSpeech();
    prepareTypingNodes(root, { clear: false });

    await waitForTransitionUnlock();
    await flushFrames(2);
    await sleep(START_DELAY_MS);

    if (triggerToken !== window.JCSenha.state.initToken) return;

    const visible = await waitForSectionVisible(root, 6000);
    if (!visible) {
      console.warn('[JCSenha] section não ficou visível a tempo; mantendo texto fallback');
      return;
    }

    ensureVisible(root);

    let instr1, instr2, instr3, instr4, input, toggle, btnNext, btnPrev;
    try {
      instr1   = await waitForElement('#senha-instr1',       { within: root });
      instr2   = await waitForElement('#senha-instr2',       { within: root });
      instr3   = await waitForElement('#senha-instr3',       { within: root });
      instr4   = await waitForElement('#senha-instr4',       { within: root });
      input    = await waitForElement('#senha-input',        { within: root });
      toggle   = await waitForElement('.btn-toggle-senha',   { within: root });
      btnNext  = await waitForElement('#btn-senha-avancar',  { within: root });
      btnPrev  = await waitForElement('#btn-senha-prev',     { within: root });
    } catch (e) {
      console.error('[JCSenha] elementos não encontrados:', e);
      window.toast?.('Erro: elementos da seção Senha não carregados.', 'error');
      return;
    }

    await applySectionI18n(root);
    await flushFrames(2);

    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);
    seq.forEach((el) => normalizeParagraph(el, { clear: false }));

    const voiceCtx = syncGuideVoiceContext(root);

    [btnPrev, btnNext, input, toggle].forEach((el) => el?.setAttribute('disabled', 'true'));

    await sleep(INITIAL_DELAY_MS);

    if (triggerToken !== window.JCSenha.state.initToken) return;

    window.JCSenha.state.activeRunToken = triggerToken;

    seq.forEach((el) => normalizeParagraph(el, { clear: true }));

    for (const el of seq) {
      if (triggerToken !== window.JCSenha.state.activeRunToken) return;
      await typeOnce(el, { speed: TYPING_SPEED, speak: true, voiceCtx, runToken: triggerToken });
      await sleep(BETWEEN_BLOCKS_MS);
    }

    if (triggerToken !== window.JCSenha.state.activeRunToken) return;

    [btnPrev, btnNext, input, toggle].forEach((el) => el?.removeAttribute('disabled'));
    input.focus();

    // --- Botão olho ---
    if (toggle.dataset.boundToggle !== '1') {
      toggle.dataset.boundToggle = '1';
      toggle.addEventListener('click', () => {
        const inputSenha = root.querySelector('#senha-input');
        if (!inputSenha) return;
        const atual = inputSenha.getAttribute('type');
        inputSenha.setAttribute('type', atual === 'password' ? 'text' : 'password');
        console.log('[JCSenha] olho mágico:', atual, '->', inputSenha.getAttribute('type'));
      });
    }

    // --- Botão Voltar ---
    if (btnPrev.dataset.boundPrev !== '1') {
      btnPrev.dataset.boundPrev = '1';
      btnPrev.addEventListener('click', () => {
        cancelAllSpeech();
        window.JCSenha.state.initToken++;
        window.JCSenha.state.activeRunToken = 0;
        root.dataset.senhaInitialized = 'false';
        if (HOME_URL && /^https?:\/\//.test(HOME_URL)) {
          window.location.href = HOME_URL;
          return;
        }
        if (window.JC?.show) {
          window.JC.show(HOME_URL);
        } else {
          history.back();
        }
      });
    }

    // --- Botão Avançar ---
    if (btnNext.dataset.boundNext !== '1') {
      btnNext.dataset.boundNext = '1';

      btnNext.addEventListener('click', async () => {
        const emailInput = root.querySelector('#senha-email');
        const email = (emailInput?.value || '').trim();

        if (!email) {
          window.toast?.('Digite seu e-mail.', 'warning');
          emailInput?.focus();
          return;
        }

        const etapa = btnNext.dataset.authStage || 'start';

        // ETAPA 1 — ENVIAR CÓDIGO
        if (etapa === 'start') {
          const senhaDigitada =
            sessionStorage.getItem('jornada.senha_original') ||
            sessionStorage.getItem('jornada.senha') ||
            (input.value || '').trim();

          if (!senhaDigitada) {
            window.toast?.('Por favor, digite sua senha para continuar.', 'warning');
            input.focus();
            return;
          }

          saveSenha(senhaDigitada);
          sessionStorage.setItem('jornada.email', email);
          sessionStorage.setItem('jornada.senha_original', senhaDigitada);
          sessionStorage.setItem('jornada.senha', senhaDigitada);

          btnNext.setAttribute('disabled', 'true');

          try {
            const resp = await fetch('https://lumen-backend-api.onrender.com/api/auth/start', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                senha: senhaDigitada,
                device_hash: localStorage.getItem('jornada_device_hash') || 'browser'
              })
            });

            const data = await resp.json();

            if (!resp.ok || !data.ok) {
              throw new Error(data?.detail || data?.message || 'Senha inválida.');
            }

            window.toast?.('Código enviado ao e-mail.', 'success');

            const wrap2fa = root.querySelector('#senha-2fa-wrap');
            if (wrap2fa) wrap2fa.style.display = 'flex';

            const confirmWrap = root.querySelector('#senha-confirmar-wrap');
            if (confirmWrap) confirmWrap.style.display = 'flex';

            input.value = '';
            input.placeholder = 'Digite o código recebido por e-mail';
            input.setAttribute('inputmode', 'numeric');

            btnNext.dataset.authStage = 'verify';
            btnNext.removeAttribute('disabled');

          } catch (err) {
            console.error('[JCSenha] erro ao iniciar 2FA:', err);
            btnNext.removeAttribute('disabled');
            window.toast?.(err.message || 'Erro ao validar senha.', 'error');
          }

          return;
        }

        // ETAPA 2 — VALIDAR CÓDIGO
        if (etapa === 'verify') {
          const code = (input.value || '').trim();
          const senhaSalva =
            sessionStorage.getItem('jornada.senha_original') ||
            sessionStorage.getItem('jornada.senha') ||
            '';

          if (!code) {
            window.toast?.('Digite o código recebido.', 'warning');
            input.focus();
            return;
          }

          btnNext.setAttribute('disabled', 'true');

          try {
            const resp = await fetch('https://lumen-backend-api.onrender.com/api/auth/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                senha: senhaSalva,
                code,
                device_hash: localStorage.getItem('jornada_device_hash') || 'browser'
              })
            });

            const data = await resp.json();

            if (!resp.ok || !data.ok) {
              throw new Error(data?.detail || data?.message || 'Código inválido.');
            }

            console.log('[JCSenha] 2FA confirmado:', data);

            if (window.JORNADA_SESSION?.iniciarSessao) {
              await window.JORNADA_SESSION.iniciarSessao({ email });
            }

            sessionStorage.setItem('jornada.senha_original', senhaSalva);
            sessionStorage.setItem('jornada.senha', senhaSalva);

            window.toast?.('Acesso confirmado.', 'success');

            if (window.JC?.show) {
              window.JC.show('section-guia');
            }

          } catch (err) {
            console.error('[JCSenha] erro ao confirmar 2FA:', err);
            btnNext.removeAttribute('disabled');
            window.toast?.(err.message || 'Erro ao confirmar código.', 'error');
          }

          return;
        }
      });
    }

    root.dataset.transitionReady = 'true';
    root.dataset.senhaInitialized = 'true';
    window.JCSenha.state.ready = true;
    console.log('[JCSenha] pronto');

    // --- Botões 2FA dedicados ---
    const btnEnviar2FA   = root.querySelector('#btn-enviar-2fa');
    const btnReenviar2FA = root.querySelector('#btn-reenviar-2fa');
    const emailInput2FA  = root.querySelector('#senha-email');

    async function enviarCodigo2FA() {
     const email = (emailInput2FA?.value || '').trim();

     const etapaAtual = btnNext.dataset.authStage || 'start';

     const senhaDigitada =
       sessionStorage.getItem('jornada.senha_original') ||
       sessionStorage.getItem('jornada.senha') ||
       (etapaAtual === 'start' ? (input.value || '').trim() : '');

     if (!email) {
       window.toast?.('Digite seu e-mail.', 'warning');
      return;
    }

    if (!senhaDigitada) {
      window.toast?.('Digite sua palavra-chave antes de solicitar o código.', 'warning');
      input.focus();
      return;
     }

      try {
        btnEnviar2FA?.setAttribute('disabled', 'true');

        const resp = await fetch('https://lumen-backend-api.onrender.com/api/auth/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            senha: senhaDigitada,
            device_hash: localStorage.getItem('jornada_device_hash') || navigator.userAgent
          })
        });

        const data = await resp.json();

        if (!resp.ok || !data.ok) {
          throw new Error(data?.detail || data?.message || 'Senha inválida.');
        }

        sessionStorage.setItem('jornada.email', email);
        sessionStorage.setItem('jornada.senha_original', senhaDigitada);
        sessionStorage.setItem('jornada.senha', senhaDigitada);

        window.toast?.('Código enviado ao e-mail.', 'success');

        const wrap2fa = root.querySelector('#senha-2fa-wrap');
        if (wrap2fa) wrap2fa.style.display = 'flex';

        const confirmWrap = root.querySelector('#senha-confirmar-wrap');
        if (confirmWrap) confirmWrap.style.display = 'flex';

        input.value = '';
        input.placeholder = 'Digite o código enviado...';
        input.setAttribute('inputmode', 'numeric');

        btnNext.dataset.authStage = 'verify';

      } catch (err) {
        console.error('[JCSenha] erro ao enviar código:', err);
        window.toast?.(err.message || 'Erro ao enviar código.', 'error');
      } finally {
        btnEnviar2FA?.removeAttribute('disabled');
      }
    }

    if (btnEnviar2FA && btnEnviar2FA.dataset.bound !== '1') {
      btnEnviar2FA.dataset.bound = '1';
      btnEnviar2FA.addEventListener('click', enviarCodigo2FA);
    }

    if (btnReenviar2FA && btnReenviar2FA.dataset.bound !== '1') {
      btnReenviar2FA.dataset.bound = '1';
      btnReenviar2FA.addEventListener('click', enviarCodigo2FA);
    }
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;

    const root = node || document.getElementById(SECTION_ID);
    if (!root) return;

    cancelAllSpeech();
    window.JCSenha.state.initToken += 1;
    const myToken = window.JCSenha.state.initToken;

    initOnce(root, myToken);
  }

  function bind() {
    if (!window.JCSenha.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCSenha.state.listenerOn = true;
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();

})();
