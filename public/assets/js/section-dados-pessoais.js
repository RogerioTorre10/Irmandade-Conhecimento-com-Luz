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

  const trigger = e.target.closest?.(
    '.select-trigger, .dropdown-trigger, [data-select-trigger], .campo-opcao, .choice, button'
  );

  if (trigger) {
    e.preventDefault();
    e.stopPropagation();
    touchMoved = false;
   }
  }, true);

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

    temperamento: ($('#dp-temperamento', root)?.value || '').trim(),
    comportamento: ($('#dp-comportamento', root)?.value || '').trim(),
    carater: ($('#dp-carater', root)?.value || '').trim(),
    indole: ($('#dp-indole', root)?.value || '').trim(),
    vazioExistencial: ($('#dp-vazio-existencial', root)?.value || '').trim(),
    plenoExistencial: ($('#dp-pleno-existencial', root)?.value || '').trim(),

  perfilPersonalidade: {
    temperamento: ($('#dp-temperamento', root)?.value || '').trim(),
    comportamento: ($('#dp-comportamento', root)?.value || '').trim(),
    carater: ($('#dp-carater', root)?.value || '').trim(),
    indole: ($('#dp-indole', root)?.value || '').trim(),
    vazioExistencial: ($('#dp-vazio-existencial', root)?.value || '').trim(),
    plenoExistencial: ($('#dp-pleno-existencial', root)?.value || '').trim()
  },

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
      '#dp-observacoes': data.observacoes,
      '#dp-temperamento': data.temperamento || data.perfilPersonalidade?.temperamento,
      '#dp-comportamento': data.comportamento || data.perfilPersonalidade?.comportamento,
      '#dp-carater': data.carater || data.perfilPersonalidade?.carater,
      '#dp-indole': data.indole || data.perfilPersonalidade?.indole,
      '#dp-vazio-existencial': data.vazioExistencial || data.perfilPersonalidade?.vazioExistencial,
      '#dp-pleno-existencial': data.plenoExistencial || data.perfilPersonalidade?.plenoExistencial
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

  const content = String(text || '').trim();

  el.textContent = '';
  el.classList.remove('typing-done', 'type-done');
  el.classList.add('typing-active');

  return new Promise((resolve) => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      el.textContent = content;
      el.classList.remove('typing-active');
      el.classList.add('typing-done', 'type-done');
      resolve();
    };

    if (typeof window.runTyping === 'function') {
      try {
        window.runTyping(
          el,
          content,
          finish,
          { speed, cursor: true }
        );

        setTimeout(finish, Math.max(600, content.length * speed + 500));
        return;
      } catch (e) {
        console.warn(`[${MOD}] runTyping falhou:`, e);
      }
    }

    if (typeof window.typeWriter === 'function') {
      try {
        window.typeWriter(el, content, speed);
        setTimeout(finish, Math.max(600, content.length * speed + 500));
        return;
      } catch (e) {
        console.warn(`[${MOD}] typeWriter falhou:`, e);
      }
    }

    let i = 0;

    const tick = () => {
      if (i <= content.length) {
        el.textContent = content.slice(0, i);
        i++;
        setTimeout(tick, speed);
      } else {
        finish();
      }
    };

    tick();
  });
}

  function iniciarLeituraDadosPessoais(root, textoManual = '') {
  const texto = String(
    textoManual ||
    root?.querySelector?.('#dp-subtitle')?.dataset?.text ||
    root?.querySelector?.('#dp-subtitle')?.textContent ||
    ''
  ).trim();

  if (!texto) return Promise.resolve();

  if (window.JORNADA_TRANSICAO_ATIVA) {
    return new Promise((resolve) => {
      window.addEventListener('jornada:transicao:end', () => {
        iniciarLeituraDadosPessoais(root, texto).then(resolve);
      }, { once: true });
    });
  }

  if (!('speechSynthesis' in window)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(texto);

      u.lang =
        window.i18n?.getLang?.() ||
        window.i18n?.currentLang ||
        document.documentElement.lang ||
        'pt-BR';

      u.rate = 0.92;
      u.pitch = 1.03;
      u.volume = 1;

      u.onend = resolve;
      u.onerror = resolve;

      if (window.EffectCoordinator?.speak) {
        window.EffectCoordinator.speak(texto);
        resolve();
        return;
      }

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);

    } catch (e) {
      console.warn('[DADOS] falha na leitura:', e);
      resolve();
    }
  });
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
    await iniciarLeituraDadosPessoais(root, txt);

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
    await iniciarLeituraDadosPessoais(root, txt);

    subtitle.classList.add('typed');
  }
}

  function bindMobileSelectSheet(root) {
  if (!root || root.dataset.dpSelectSheetBound === '1') return;
  root.dataset.dpSelectSheetBound = '1';

  function closeSheet() {
    document.querySelectorAll('.dp-select-sheet').forEach(el => el.remove());
  }

  function openSheet(select) {
    closeSheet();

    const sheet = document.createElement('div');
    sheet.className = 'dp-select-sheet';

    const panel = document.createElement('div');
    panel.className = 'dp-select-panel';

    const title = document.createElement('div');
    title.className = 'dp-select-title';
    title.textContent =
      select.closest('label')?.querySelector('span')?.textContent?.trim() ||
      'Escolha uma opção';

    const list = document.createElement('div');
    list.className = 'dp-select-list';

    Array.from(select.options).forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dp-select-option';
      btn.textContent = opt.textContent || opt.value || '—';

      if (opt.selected) btn.classList.add('is-selected');

      btn.addEventListener('click', () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeSheet();
      });

      list.appendChild(btn);
    });

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'dp-select-cancel';
    cancel.textContent = 'Cancelar';
    cancel.addEventListener('click', closeSheet);

    panel.appendChild(title);
    panel.appendChild(list);
    panel.appendChild(cancel);
    sheet.appendChild(panel);

    sheet.addEventListener('click', (ev) => {
      if (ev.target === sheet) closeSheet();
    });

    document.body.appendChild(sheet);
  }

  root.querySelectorAll('select').forEach((select) => {
    if (select.dataset.mobileSheet === '1') return;
    select.dataset.mobileSheet = '1';

    let touchStartY = 0;
    let touchMoved = false;

    select.addEventListener('touchstart', (ev) => {
      touchStartY = ev.touches?.[0]?.clientY || 0;
      touchMoved = false;
    }, { passive: true });

    select.addEventListener('touchmove', (ev) => {
      const y = ev.touches?.[0]?.clientY || 0;
      if (Math.abs(y - touchStartY) > 12) {
        touchMoved = true;
      }
    }, { passive: true });

    const abrirCustom = (ev) => {
      if (touchMoved) {
        touchMoved = false;
        return;
      }

      ev.preventDefault();
      ev.stopPropagation();

      try {
        select.blur();
      } catch {}

      openSheet(select);
    };

    select.addEventListener('pointerdown', abrirCustom, { passive: false });
    select.addEventListener('mousedown', abrirCustom, { passive: false });
    select.addEventListener('click', abrirCustom, { passive: false });
  });
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

    bindMobileSelectSheet(root);
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
