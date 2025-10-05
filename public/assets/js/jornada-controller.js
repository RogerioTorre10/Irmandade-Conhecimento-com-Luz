(function (global) {
  'use strict';

  if (!global.TypingBridge) {
    console.warn('[JornadaController] TypingBridge não inicializado, prosseguindo com limitações');
  }
  if (!global.JPaperQA) {
    console.warn('[JornadaController] JPaperQA não inicializado, prosseguindo com limitações');
  }

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let currentTermosPage = 'termos-pg1';
  let currentPerguntasIndex = 0;

  const videoMapping = {
    'section-senha-to-guia': '/assets/img/filme-senha-to-guia.mp4',
    'section-guia-to-selfie': '/assets/img/filme-guia-to-selfie.mp4',
    'section-selfie-to-bloco1': '/assets/img/filme-selfie-to-bloco1.mp4',
    'section-bloco1-to-bloco2': '/assets/img/filme-bloco1-to-bloco2.mp4',
    'section-bloco2-to-bloco3': '/assets/img/filme-bloco2-to-bloco3.mp4',
    'section-bloco3-to-bloco4': '/assets/img/filme-bloco3-to-bloco4.mp4',
    'section-bloco4-to-bloco5': '/assets/img/filme-bloco4-to-bloco5.mp4',
    'section-bloco5-to-final': '/assets/img/filme-bloco5-to-final.mp4'
  };

  function pauseAllVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.src = '';
      video.load();
    });
    const videoOverlay = document.querySelector('#videoOverlay');
    if (videoOverlay) videoOverlay.classList.add('hidden');
    console.log('[JornadaController] Todos os vídeos pausados');
  }

  function playTransitionVideo(fromSection, toSection) {
    const key = `${fromSection}-to-${toSection}`;
    const videoSrc = videoMapping[key];
    if (videoSrc && global.JPaperQA) {
      speechSynthesis.cancel();
      setTimeout(() => {
        global.JPaperQA.loadVideo(videoSrc);
        console.log('[JornadaController] Transição de vídeo:', key, 'Vídeo:', videoSrc);
      }, 300);
    }
  }

  JC.setOrder = function (order) {
    sectionOrder = order;
    console.log('[JornadaController] Ordem das seções definida:', order);
  };

  JC.goNext = function () {
    const currentId = global.__currentSectionId;
    let idx = sectionOrder.indexOf(currentId);
    if (idx >= 0 && idx < sectionOrder.length - 1) {
      let nextId = sectionOrder[idx + 1];
      while (nextId && !document.getElementById(nextId) && idx < sectionOrder.length - 1) {
        idx++;
        nextId = sectionOrder[idx + 1];
        console.warn('[JornadaController] Seção', sectionOrder[idx], 'não encontrada, tentando próxima:', nextId);
      }
      if (nextId && document.getElementById(nextId)) {
        console.log('[JornadaController] goNext: Avançando de', currentId, 'para', nextId);
        if (currentId === 'section-termos') {
          currentTermosPage = 'termos-pg1';
        }
        playTransitionVideo(currentId, nextId);
        JC.show(nextId);
      } else {
        console.error('[JornadaController] Nenhuma seção válida encontrada após', currentId);
        window.toast && window.toast('Erro: Nenhuma seção válida encontrada.');
      }
    } else {
      console.log('[JornadaController] goNext: Fim da jornada ou índice inválido:', idx);
    }
  };

  JC.goPrev = function () {
    const currentId = global.__currentSectionId;
    let idx = sectionOrder.indexOf(currentId);
    if (idx > 0) {
      let prevId = sectionOrder[idx - 1];
      while (prevId && !document.getElementById(prevId) && idx > 0) {
        idx--;
        prevId = sectionOrder[idx - 1];
        console.warn('[JornadaController] Seção', sectionOrder[idx], 'não encontrada, tentando anterior:', prevId);
      }
      if (prevId && document.getElementById(prevId)) {
        if (currentId === 'section-termos') {
          currentTermosPage = 'termos-pg1';
        }
        JC.show(prevId);
      } else {
        console.error('[JornadaController] Nenhuma seção válida encontrada antes de', currentId);
        window.toast && window.toast('Erro: Nenhuma seção válida encontrada.');
      }
    }
  };

  JC.show = function (id) {
    const now = performance.now();
    if (now - global.lastShowSection < 500) {
      console.log('[JornadaController] Debounce: evitando chamada repetida para:', id);
      return;
    }
    global.lastShowSection = now;

    try {
      speechSynthesis.cancel();
      pauseAllVideos();

      const all = document.querySelectorAll('div[id^="section-"]');
      const target = document.getElementById(id);
      if (!target) {
        console.error('[JornadaController] Seção não encontrada:', id);
        document.dispatchEvent(new CustomEvent('sectionError', { detail: { id, error: 'Section not found' } }));
        window.toast && window.toast(`Seção ${id} não encontrada.`);
        JC.goNext();
        return;
      }

      all.forEach(s => s.classList.add(HIDE_CLASS));
      target.classList.remove(HIDE_CLASS);
      global.__currentSectionId = id;
      global.G = global.G || {};
      global.G.__typingLock = false;

      // Cleanup de botões extras
      const extraBtns = target.querySelectorAll('.btn-confirm-extra, .btn-duplicate');
      extraBtns.forEach(btn => btn.remove());

      setTimeout(async () => {
        console.log('[JornadaController] Processando seção:', id, 'Página:', currentTermosPage);
        let container;
        if (id === 'section-termos') {
          const page = document.getElementById(currentTermosPage);
          if (!page) {
            console.error('[JornadaController] Página de termos não encontrada:', currentTermosPage);
            window.toast && window.toast(`Página ${currentTermosPage} não encontrada.`);
            return;
          }
          const pg1 = document.getElementById('termos-pg1');
          const pg2 = document.getElementById('termos-pg2');
          if (pg1 && pg2) {
            pg1.classList.add(HIDE_CLASS);
            pg2.classList.add(HIDE_CLASS);
            page.classList.remove(HIDE_CLASS);
            console.log('[JornadaController] Exibindo página de termos:', currentTermosPage);
          } else {
            console.error('[JornadaController] Uma ou mais páginas de termos não encontradas');
            window.toast && window.toast('Erro: Páginas de termos não encontradas.');
          }
          container = page;
        } else if (id === 'section-perguntas' && global.JPaperQA) {
          global.JPaperQA.renderQuestions();
          container = target.querySelector('#jornada-conteudo');
        } else {
          container = target;
        }

        if (global.i18n) {
          try {
            await i18n.waitForReady(10000);
            global.i18n.apply(container || target);
            console.log('[JornadaController] Traduções i18n aplicadas a:', id);
          } catch (e) {
            console.warn('[JornadaController] Falha ao aplicar i18n:', e);
            window.toast && window.toast('Traduções parciais aplicadas.');
          }
        }

        const textElements = container ? container.querySelectorAll('[data-typing="true"]:not(.hidden)') : [];
        console.log('[JornadaController] Elementos [data-typing] encontrados:', textElements.length, 'em', id);

        if (textElements.length === 0) {
          console.log('[JornadaController] Nenhum elemento com data-typing, ativando botão imediatamente');
          let btn = id === 'section-termos' ? container.querySelector('[data-action="termos-next"], [data-action="avancar"]') :
                   id === 'section-perguntas' ? target.querySelector(`[data-bloco="${currentPerguntasIndex}"] [data-action="avancar"]`) :
                   target.querySelector('[data-action="avancar"], [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-avancar, .btn-avanca, .btn, #iniciar, .btn-iniciar, .start-btn, .next-btn');
          if (!btn) {
            btn = container?.querySelector('button') || target.querySelector('button') || document.querySelector('#iniciar, [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-iniciar, .start-btn, .next-btn, .btn-avancar, .btn-avanca');
            console.warn('[JornadaController] Botão não encontrado pelos seletores padrão, usando fallback:', btn ? (btn.id || btn.className) : 'nenhum botão encontrado');
          }
          if (btn) {
            btn.disabled = false;
            console.log('[JornadaController] Botão ativado em:', id, 'Botão:', btn.id || btn.className);
            window.toast && window.toast('Conteúdo pronto! Clique para avançar.');
          } else {
            console.error('[JornadaController] Botão de avançar não encontrado em:', id);
            window.toast && window.toast('Botão de avançar não encontrado!');
          }
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target: id } }));
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id } }));
          return;
        }

        if (global.runTyping) {
          global.runTyping(container, () => {
            console.log('[JornadaController] Datilografia sequencial concluída para container:', id);
            document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id } }));
          });
        } else {
          console.warn('[JornadaController] runTyping não disponível, pulando datilografia');
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target: id } }));
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id } }));
        }

        const onAllComplete = () => {
          let btn = id === 'section-termos' ? container.querySelector('[data-action="termos-next"], [data-action="avancar"]') :
                   id === 'section-perguntas' ? target.querySelector(`[data-bloco="${currentPerguntasIndex}"] [data-action="avancar"]`) :
                   target.querySelector('[data-action="avancar"], [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-avancar, .btn-avanca, .btn, #iniciar, .btn-iniciar, .start-btn, .next-btn');
          if (btn) {
            btn.disabled = false;
            console.log('[JornadaController] Botão ativado após datilografia em:', id);
          }
        };

        document.addEventListener('allTypingComplete', onAllComplete, { once: true });
      }, 0);
    } catch (e) {
      console.error('[JornadaController] Erro ao mostrar seção:', e);
      window.toast && window.toast('Erro ao carregar seção.');
    }
  };

  // Listener para evitar travamento na senha
  document.addEventListener('allTypingComplete', (e) => {
    if (e.detail.target === 'section-senha') {
      const btn = document.querySelector('#section-senha [data-action="avancar"]');
      if (btn) {
        btn.disabled = false;
        console.log('[JornadaController] Botão de senha ativado');
      }
    }
  });
})(window);
