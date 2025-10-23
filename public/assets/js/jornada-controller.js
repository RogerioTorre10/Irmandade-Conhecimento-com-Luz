(function () {
  'use strict';

  const JC = window.JC = window.JC || {};

  JC.currentSection = null;

  JC.show = async (sectionId) => {
    console.log('[JC.show] Iniciando exibição para:', sectionId);

    if (JC.currentSection === sectionId) {
      console.log('[JC.show] Já está na seção:', sectionId);
      return;
    }

    JC.currentSection = sectionId;

    const wrapper = document.getElementById('jornada-content-wrapper');
    if (!wrapper) {
      console.error('[JC.show] #jornada-content-wrapper não encontrado');
      window.toast?.('Erro: Container de conteúdo não encontrado.', 'error');
      return;
    }

    // Esconder todas as seções
    wrapper.querySelectorAll('section').forEach(sec => {
      sec.classList.add('hidden');
      sec.setAttribute('aria-hidden', 'true');
      sec.style.display = 'none';
      sec.style.opacity = '0';
      sec.style.visibility = 'hidden';
    });

    // Carregar seção
    let section = document.getElementById(sectionId);
    if (!section) {
      console.log('[JC.show] Seção não encontrada, tentando carregar:', sectionId);
      try {
        await window.carregarEtapa(sectionId);
        section = document.getElementById(sectionId);
      } catch (e) {
        console.error('[JC.show] Falha ao carregar seção:', sectionId, e);
        window.toast?.(`Erro: Não foi possível carregar a seção ${sectionId}.`, 'error');
        return;
      }
    }

    if (!section) {
      console.error('[JC.show] Seção ainda não encontrada após carregar:', sectionId);
      window.toast?.(`Erro: Seção ${sectionId} não encontrada.`, 'error');
      return;
    }

    section.classList.remove('hidden');
    section.setAttribute('aria-hidden', 'false');
    section.style.display = 'block';
    section.style.opacity = '1';
    section.style.visibility = 'visible';

    // Disparar evento
    const event = new CustomEvent('section:shown', {
      detail: { sectionId, node: section }
    });
    document.dispatchEvent(event);

    console.log('[JC.show] Evento section:shown disparado para:', sectionId);
    console.log('[JC.show] Conteúdo de #jornada-content-wrapper:', wrapper.innerHTML.substring(0, 100) + '...');
  };

  JC.handleSectionLogic = (sectionId) => {
    console.log('[JC.handleSectionLogic] Processando lógica para:', sectionId);
    // Aqui você pode adicionar lógica específica por seção, ex:
    // if (sectionId === 'section-senha') { iniciarSenha(); }
  };

  JC.attachButtonEvents = (sectionId) => {
    console.log('[JC.attachButtonEvents] Anexando botões para:', sectionId);
    const buttons = document.querySelectorAll(`#${sectionId} [data-action]`);
    console.log('[JC.attachButtonEvents] Botões encontrados:', buttons.length);

    buttons.forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (!action) return;

      btn.addEventListener('click', () => {
        console.log(`[JC] Botão clicado: ${action}`);
        // Aqui você pode mapear ações específicas
        // Exemplo: if (action === 'avancar') { JC.show('section-next'); }
      });
    });
  };

  JC.init = () => {
    console.log('[JC] Controller inicializado');

    const sectionId = JC.currentSection || 'section-intro';
    JC.attachButtonEvents(sectionId);
    JC.handleSectionLogic(sectionId);
  };

  // Reagir automaticamente ao evento de exibição de seção
  document.addEventListener('section:shown', (e) => {
    const sectionId = e.detail.sectionId;
    JC.attachButtonEvents(sectionId);
    JC.handleSectionLogic(sectionId);
  });

  console.log('[JC] Controller carregado');
})();
