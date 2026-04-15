/* /assets/js/section-dados-pessoais.js */
(function () {
  'use strict';

  const MOD = 'section-dados-pessoais.js';
  const SECTION_ID = 'section-dados-pessoais';
  const STORAGE_KEY = 'JORNADA_DADOS_PESSOAIS';

  const VIDEO_NEXT = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';
  const NEXT_SECTION_ID = 'section-perguntas-raizes';

  if (window.__DADOS_PESSOAIS_BOUND__) {
    console.log(`[${MOD}] já inicializado, ignorando.`);
    return;
  }
  window.__DADOS_PESSOAIS_BOUND__ = true;

  function log(...args) {
    console.log(`[${MOD}]`, ...args);
  }

  function $(sel, root = document) {
    if (!root || typeof root.querySelector !== 'function') return null;
    return root.querySelector(sel);
  }

  function loadData() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveData(data) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
      window.__JORNADA_DADOS_PESSOAIS__ = data || {};
      window.JORNADA_STATE = window.JORNADA_STATE || {};
      window.JORNADA_STATE.dadosPessoais = data || {};
    } catch (e) {
      console.warn(`[${MOD}] falha ao salvar`, e);
    }
  }

  function collect(root) {
    return {
      nomeCompleto: ($('#dp-nome', root)?.value || '').trim(),
      idadeFaixa: ($('#dp-idade-faixa', root)?.value || '').trim(),
      cidade: ($('#dp-cidade', root)?.value || '').trim(),
      estado: ($('#dp-estado', root)?.value || '').trim(),
      estadoCivil: ($('#dp-estado-civil', root)?.value || '').trim(),
      profissao: ($('#dp-profissao', root)?.value || '').trim(),
      filhos: ($('#dp-filhos', root)?.value || '').trim(),
      religiao: ($('#dp-religiao', root)?.value || '').trim(),
      observacoes: ($('#dp-observacoes', root)?.value || '').trim()
    };
  }

  function hydrate(root, data) {
    if (!data) return;

    const map = {
      '#dp-nome': data.nomeCompleto,
      '#dp-idade-faixa': data.idadeFaixa,
      '#dp-cidade': data.cidade,
      '#dp-estado': data.estado,
      '#dp-estado-civil': data.estadoCivil,
      '#dp-profissao': data.profissao,
      '#dp-filhos': data.filhos,
      '#dp-religiao': data.religiao,
      '#dp-observacoes': data.observacoes
    };

    Object.entries(map).forEach(([sel, val]) => {
      const el = $(sel, root);
      if (el && typeof val === 'string') el.value = val;
    });
  }

  function validate(data) {
    if (!data.nomeCompleto || data.nomeCompleto.length < 2) {
      return window.i18n?.t?.('dados.nome_invalido') || 'Informe o nome completo.';
    }
    return '';
  }

  function setStatus(root, msg, type = 'info') {
    const el = $('#dados-pessoais-status', root);
    if (!el) return;
    el.textContent = msg || '';
    el.dataset.kind = type;
    el.style.display = msg ? 'block' : 'none';
  }

  function navigateTo(sectionId, videoSrc) {
    if (typeof window.playTransitionVideo === 'function' && videoSrc) {
      window.playTransitionVideo(videoSrc, sectionId);
      return;
    }

    if (window.JornadaController?.show) {
      window.JornadaController.show(sectionId);
      return;
    }

    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show(sectionId, { force: true });
      return;
    }

    console.warn(`[${MOD}] nenhum controller disponível para navegar até ${sectionId}`);
  }

  function aplicarEfeitoBotao(root) {
    const botoes = root.querySelectorAll('#btn-dp-continuar');

    botoes.forEach((btn) => {
      btn.addEventListener('touchstart', () => {
        btn.classList.add('is-pressed');
      }, { passive: true });

      btn.addEventListener('touchend', () => {
        btn.classList.remove('is-pressed');
      });

      btn.addEventListener('touchcancel', () => {
        btn.classList.remove('is-pressed');
      });

      btn.addEventListener('mousedown', () => {
        btn.classList.add('is-pressed');
      });

      btn.addEventListener('mouseup', () => {
        btn.classList.remove('is-pressed');
      });

      btn.addEventListener('mouseleave', () => {
        btn.classList.remove('is-pressed');
      });
    });
  }

  function applyI18nToFields(root) {
    if (window.i18n?.applyTranslations) {
      window.i18n.applyTranslations(root);
      return;
    }

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const txt = window.i18n?.t?.(key);
      if (txt) el.textContent = txt;
    });

    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      const txt = window.i18n?.t?.(key);
      if (txt) el.setAttribute('placeholder', txt);
    });

    root.querySelectorAll('[data-i18n-text]').forEach((el) => {
      const key = el.getAttribute('data-i18n-text');
      const txt = window.i18n?.t?.(key);
      if (txt) {
        el.dataset.text = txt;
        if (!el.classList.contains('typed')) el.textContent = txt;
      }
    });
  }

  function runType(el, text, speed = 36) {
    if (!el) return Promise.resolve();

    el.textContent = '';
    el.classList.remove('typing-done', 'type-done');
    el.classList.add('typing-active');

    if (typeof window.typeWriter === 'function') {
      window.typeWriter(el, text, speed);
      setTimeout(() => {
        el.classList.remove('typing-active');
        el.classList.add('typing-done');
      }, Math.max(400, text.length * speed + 80));
      return Promise.resolve();
    }

    if (typeof window.runTyping === 'function') {
      return new Promise((resolve) => {
        window.runTyping(el, text, () => {
          el.classList.remove('typing-active');
          el.classList.add('typing-done');
          resolve();
        }, { speed, cursor: true });
      });
    }

    el.textContent = text;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    return Promise.resolve();
  }

  async function initHeader(root) {
    const title = $('#dp-title', root) || $('h1[data-i18n-text="dados.title"]', root);
    const subtitle = $('#dp-subtitle', root) || $('p[data-i18n-text="dados.subtitle"]', root);

    if (title && !title.classList.contains('typed')) {
      const txt =
        window.i18n?.t?.('dados.title') ||
        title.dataset.text ||
        'Dados Pessoais';

      title.dataset.text = txt;
      title.style.width = '100%';
      title.style.minHeight = '40px';
      await runType(title, txt, Number(title.dataset.speed || 38));
      title.classList.add('typed');
    }

    if (subtitle && !subtitle.classList.contains('typed')) {
      const txt =
        window.i18n?.t?.('dados.subtitle') ||
        subtitle.dataset.text ||
        'Preencha os dados para enriquecer sua devolutiva.';

      subtitle.dataset.text = txt;
      subtitle.style.width = '100%';
      subtitle.style.minHeight = '44px';
      await runType(subtitle, txt, Number(subtitle.dataset.speed || 30));
      subtitle.classList.add('typed');
    }
  }

  function bind(root) {
    if (root.__DADOS_PESSOAIS_BINDED__) return;
    root.__DADOS_PESSOAIS_BINDED__ = true;

    const btnNext = $('#btn-dp-continuar', root);

    root.addEventListener('input', () => {
      saveData(collect(root));
      setStatus(root, '');
    });

    if (btnNext) {
      btnNext.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const data = collect(root);
        const err = validate(data);

        if (err) {
          setStatus(root, `⚠ ${err}`, 'err');
          return;
        }

        saveData(data);
        setStatus(
          root,
          window.i18n?.t?.('dados.salvo_ok') || '✅ Dados salvos com sucesso.',
          'ok'
        );

        navigateTo(NEXT_SECTION_ID, VIDEO_NEXT);
      });
    }

    aplicarEfeitoBotao(root);
  }

  async function init(root) {
    if (!root) return;

    applyI18nToFields(root);
    hydrate(root, loadData());
    bind(root);
    await initHeader(root);

    log('inicializado com sucesso');
  }

  document.addEventListener('sectionLoaded', (e) => {
    const section = e?.detail?.section;
    if (section?.id === SECTION_ID) init(section);
  });

  document.addEventListener('section:shown', (e) => {
    const id = e?.detail?.sectionId;
    const node = e?.detail?.node;
    if (id === SECTION_ID && node) init(node);
  });

  document.addEventListener('i18n:changed', () => {
    const root = document.getElementById(SECTION_ID);
    if (!root) return;

    const title = $('#dp-title', root);
    const subtitle = $('#dp-subtitle', root);
    if (title) title.classList.remove('typed');
    if (subtitle) subtitle.classList.remove('typed');

    init(root);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById(SECTION_ID);
    if (root) init(root);
  });
})();
