/* /assets/js/section-dados-pessoais.js */
(function () {
  'use strict';

  const MOD = 'section-dados-pessoais.js';
  const SECTION_ID = 'section-dados-pessoais';
  const STORAGE_KEY = 'JORNADA_DADOS_PESSOAIS';

  const VIDEO_BACK = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';
  const VIDEO_NEXT = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';
  const PREV_SECTION_ID = 'section-card';
  const NEXT_SECTION_ID = 'section-perguntas-raizes';

  if (window.__DADOS_PESSOAIS_BOUND__) {
    console.log(`[${MOD}] já inicializado, ignorando.`);
    return;
  }
  window.__DADOS_PESSOAIS_BOUND__ = true;

  function log(...args) {
    console.log(`[${MOD}]`, ...args);
  }

  function $(root, sel) {
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
      const el = $(root, sel);
      if (el && typeof val === 'string') el.value = val;
    });
  }

  function validate(data) {
    if (!data.nomeCompleto || data.nomeCompleto.length < 2) {
      return 'Informe o nome completo.';
    }
    return '';
  }

  function setStatus(root, msg, type = 'info') {
    const el = $('#dados-pessoais-status', root);
    if (!el) return;
    el.textContent = msg || '';
    el.dataset.kind = type;
    el.style.display = msg ? 'block' : 'block';
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

  function bind(root) {
    if (root.__DADOS_PESSOAIS_BINDED__) return;
    root.__DADOS_PESSOAIS_BINDED__ = true;

    const btnNext = $('#btn-dp-continuar', root);
    const btnBack = $('#btn-dp-voltar', root);

    root.addEventListener('input', () => {
      saveData(collect(root));
      setStatus(root, '');
    });

    if (btnBack) {
      btnBack.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        saveData(collect(root));
        navigateTo(PREV_SECTION_ID, VIDEO_BACK);
      });
    }

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
        setStatus(root, '✅ Dados salvos com sucesso.', 'ok');
        navigateTo(NEXT_SECTION_ID, VIDEO_NEXT);
      });
    }
  }

  function init(root) {
    if (!root) return;
    hydrate(root, loadData());
    bind(root);
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

  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById(SECTION_ID);
    if (root) init(root);
  });
})();
