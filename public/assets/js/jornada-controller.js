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
    'section-filme-ao-encontro': global.JORNADA_VIDEOS?.afterBlocks?.[0] || '/assets/img/filme-0-ao-encontro-da-jornada.mp4',
    'section-filme-entrando': '/assets/img/filme-1-entrando-na-jornada.mp4',
    'section-final': global.JORNADA_VIDEOS?.final
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

  JC.setOrder = function (order) {
    sectionOrder = order;
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
            console.log('[JornadaController] Exibindo página de termos:', currentTermosPage, 'Visível:', page.offsetParent !== null);
          } else {
            console.error('[JornadaController] Uma ou mais páginas de termos (#termos-pg1, #termos-pg2) não encontradas');
            window.toast && window.toast('Erro: Páginas de termos não encontradas.');
          }
          container = page;
        } else if (id === 'section-perguntas' && global.JPaperQA) {
          global.JPaperQA.renderQuestions();
          container = target.querySelector('#jornada-conteudo');
        } else {
          container = target;
        }

        // Aplica traduções i18n
        if (global.i18n) {
          try {
            await i18n.waitForReady(5000);
            global.i18n.apply(container || target);
            console.log('[JornadaController] Traduções i18n aplicadas a:', id);
          } catch (e) {
            console.warn('[JornadaController] Falha ao aplicar i18n:', e);
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
            console.log('[JornadaController] Botão ativado imediatamente em:', id, 'Botão:', btn.id || btn.className);
            window.toast && window.toast('Conteúdo pronto! Clique para avançar.');
          } else {
            console.error('[JornadaController] Botão de avançar não encontrado em:', id);
            window.toast && window.toast('Botão de avançar não encontrado!');
          }
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target: id } }));
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id } }));
          if (videoMapping[id] && global.JPaperQA) {
            speechSynthesis.cancel();
            setTimeout(() => {
              global.JPaperQA.loadVideo(videoMapping[id]);
              console.log('[JornadaController] Carregando vídeo para seção:', id, 'Vídeo:', videoMapping[id]);
            }, 500);
          }
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
          if (!btn) {
            btn = container?.querySelector('button') || target.querySelector('button') || document.querySelector('#iniciar, [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-iniciar, .start-btn, .next-btn, .btn-avancar, .btn-avanca');
            console.warn('[JornadaController] Botão não encontrado pelos seletores padrão, usando fallback:', btn ? (iranno

System: Uhuuu, amigão! Nada de travar, estamos avançando na Jornada do Conhecimento com Luz! 🚀 Agradeço pelo feedback detalhado e pelo HTML atualizado. Vamos resolver os problemas um a um:

- **Texto inteiro exibido antes da datilografia**: O texto em `#section-guia` aparece antes do efeito, apesar do CSS `opacity: 0`. Vamos reforçar o CSS e garantir a execução precoce do `TypingBridge.js`.
- **Internacionalização (i18n) não funcionou**: As traduções não estão sendo aplicadas, provavelmente devido a falhas no carregamento do `i18n.js` ou chaves de tradução ausentes.
- **Botão "Confirmar" extra**: O botão duplicado em `#section-guia` foi removido do HTML.
- **Travamento em `#section-senha`**: O botão de avançar não funciona, possivelmente devido a falhas na validação da senha ou no evento `allTypingComplete`.

Com base nos logs anteriores (ex.: `[TypingBridge] Elementos [data-typing] encontrados`, `[JornadaController] Botão clicado em: section-senha`), no histórico (erros de i18n, MIME, navegação), e nos scripts fornecidos, vou ajustar os scripts e o HTML para corrigir esses problemas e garantir a coerência dos efeitos e da navegação.

---

### **HTML Ajustado**

#### **Para `#section-guia`**
```html
<div id="section-guia" class="j-section hidden">
  <div class="conteudo-pergaminho">
    <h2 data-typing="true" data-i18n="guia_title">Escolha seu Guia ✨</h2>
    <div class="guia-container">
      <p data-typing="true" data-i18n="guia_zion">Zion (Grok): Curioso e direto, busca respostas profundas com visão cósmica.</p>
      <p data-typing="true" data-i18n="guia_lumen">Lumen (ChatGPT): Acolhedor e reflexivo, guia com empatia e clareza.</p>
      <p data-typing="true" data-i18n="guia_arian">Arian (Gemini): Criativo e versátil, inspira com perspectivas inovadoras.</p>
      <div class="guia-name-input">
        <label for="guiaNameInput" data-i18n="guia_name_label">Seu Nome</label>
        <input id="guiaNameInput" type="text" data-i18n-placeholder="guia_name_placeholder" placeholder="Digite seu nome para a jornada...">
      </div>
      <div class="guia-options">
        <button class="btn" data-action="select-guia" data-guia="zion" data-i18n="guia_zion_button">Escolher Zion</button>
        <button class="btn" data-action="select-guia" data-guia="lumen" data-i18n="guia_lumen_button">Escolher Lumen</button>
        <button class="btn" data-action="select-guia" data-guia="arian" data-i18n="guia_arian_button">Escolher Arian</button>
      </div>
      <video id="video-guia" style="display: none;">
        <source src="/assets/img/conhecimento-com-luz-jardim.mp4" type="video/mp4">
        Seu navegador não suporta vídeo.
      </video>
      <button data-action="avancar" class="btn btn-avancar" disabled data-i18n="avancar_button">Avançar</button>
    </div>
  </div>
</div>
