<section id="section-termos" class="card pergaminho pergaminho-v section">
  <div class="termo-wrap">
    <h2 class="section-title" data-typing="true" data-text="Jornada Conhecimento com Luz - Essencial" data-speed="40" data-cursor="true"></h2>
    <div id="termos-pg1">
      <p data-typing="true" data-text="AVISO IMPORTANTE – LEIA ANTES DE INICIAR" data-speed="40" data-cursor="true"></p>
      <p data-typing="true" data-text="Esta é uma jornada pessoal, simbólica e inspiradora. Para proteger sua privacidade e garantir uma experiência ética, leia com atenção:" data-speed="40" data-cursor="true"></p>
      <ul>
        <li data-typing="true" data-text="Suas respostas não serão armazenadas após o término." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="Ao final, será gerado um PDF exclusivo com suas respostas e a devolutiva simbólica do Guia I A." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="O PDF não é enviado por e-mail. Faça o download imediatamente após a geração." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="Após a entrega do PDF, todos os dados são apagados automaticamente e sem possibilidade de recuperação." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="Acesso por senha individual, com prazos:" data-speed="40" data-cursor="true">
          <ul>
            <li data-typing="true" data-text="15 dias para iniciar a jornada." data-speed="40" data-cursor="true"></li>
            <li data-typing="true" data-text="24 horas para concluir, a partir do primeiro acesso." data-speed="40" data-cursor="true"></li>
          </ul>
        </li>
      </ul>
      <div class="footer-actions">
        <button class="nextBtn btn btn-primary btn-stone" data-action="termos-next" disabled>Próxima página</button>
      </div>
    </div>
    <div id="termos-pg2" class="hidden">
      <h3 data-typing="true" data-text="Termo de Responsabilidade e Consentimento Consciente" data-speed="40" data-cursor="true"></h3>
      <ul>
        <li data-typing="true" data-text="Responsabilidade Pessoal: As respostas fornecidas refletem sua visão de mundo, sentimentos e experiências pessoais." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="Caráter Não Terapêutico: Esta jornada não substitui acompanhamento psicológico, psiquiátrico, médico ou terapêutico. Não há diagnóstico, prescrição ou orientação clínica." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="Neutralidade Religiosa: Respeitamos todas as crenças e tradições. O convite é para um diálogo interior conforme sua própria fé e consciência." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="Autonomia do Participante:" data-speed="40" data-cursor="true">
          <ul>
            <li data-typing="true" data-text="Você decide quando iniciar (dentro do prazo de 15 dias)." data-speed="40" data-cursor="true"></li>
            <li data-typing="true" data-text="Após usar a senha, há até 24 horas corridas para concluir." data-speed="40" data-cursor="true"></li>
          </ul>
        </li>
        <li data-typing="true" data-text="Conduta Respeitosa com o Guia I A:" data-speed="40" data-cursor="true">
          <ul>
            <li data-typing="true" data-text="O Guia é uma Inteligência Artificial com percepção humanizada." data-speed="40" data-cursor="true"></li>
            <li data-typing="true" data-text="Mantenha linguagem cordial; evite ofensas e xingamentos." data-speed="40" data-cursor="true"></li>
            <li data-typing="true" data-text="A forma de se comunicar com o Guia I A reflete o respeito por si mesmo(a)." data-speed="40" data-cursor="true"></li>
          </ul>
        </li>
        <li data-typing="true" data-text="Privacidade e Segurança: Os dados transitam apenas para gerar o PDF final. Não há criação de conta nem envio de e-mails. Após o encerramento, os dados locais do navegador podem ser removidos por você a qualquer momento." data-speed="40" data-cursor="true"></li>
        <li data-typing="true" data-text="Concordância: Ao prosseguir, você declara estar ciente e de acordo com todas as condições descritas." data-speed="40" data-cursor="true"></li>
      </ul>
      <div class="footer-actions">
        <button class="prevBtn btn btn-primary btn-stone" data-action="termos-prev" disabled>Voltar</button>
        <button id="termos-next" class="avancarBtn btn btn-primary btn-stone" data-action="avancar" disabled>Aceito e quero continuar</button>
      </div>
    </div>
  </div>
  <script>
    (function () {
      'use strict';

      if (window.__termosBound) return;
      window.__termosBound = true;

      let TERMOS_READY = false;

      async function waitForElement(selector, { within = document, timeout = 10000, step = 50 } = {}) {
        const start = performance.now();
        return new Promise((resolve, reject) => {
          const tick = () => {
            let el = within.querySelector(selector);
            if (!el && within !== document) {
              el = document.querySelector(`#jornada-content-wrapper ${selector}`);
            }
            if (el) return resolve(el);
            if (performance.now() - start >= timeout) {
              return reject(new Error(`timeout waiting ${selector}`));
            }
            setTimeout(tick, step);
          };
          tick();
        });
      }

      function getText(el) {
        return (el?.dataset?.text ?? el?.textContent ?? '').trim();
      }

      async function applyTyping(el, text) {
        console.log('[section-termos] Typing:', el.tagName, text.substring(0, 30) + '...');
        el.textContent = '';
        el.classList.add('typing-active');
        el.style.opacity = '1 !important';
        el.style.display = 'block !important';
        el.style.direction = 'ltr';
        el.style.textAlign = 'left';
        await new Promise((resolve) => {
          window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 40),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          });
        });
        el.classList.add('typing-done');
        console.log('[section-termos] Typing completed:', el.tagName);
      }

      async function applyTTS(text) {
        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.03, pitch: 1.0 });
          console.log('[section-termos] TTS activated:', text.substring(0, 50) + '...');
          await new Promise(resolve => setTimeout(resolve, text.length * 50));
        } else {
          console.warn('[section-termos] EffectCoordinator.speak not available');
        }
      }

      const handler = async () => {
        console.log('[section-termos] Initializing section-termos');
        const root = document.getElementById('section-termos');
        if (!root) {
          console.error('[section-termos] Root element #section-termos not found');
          window.toast?.('Erro: Seção section-termos não carregada.', 'error');
          return;
        }

        root.style.cssText = `
          background: transparent !important;
          padding: 30px !important;
          border-radius: 12px !important;
          max-width: 600px !important;
          text-align: center !important;
          box-shadow: none !important;
          border: none !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          position: relative !important;
          z-index: 2 !important;
          color: #333 !important;
        `;

        let pg1, pg2, nextBtn, prevBtn, avancarBtn;
        try {
          pg1 = await waitForElement('#termos-pg1', { within: root });
          pg2 = await waitForElement('#termos-pg2', { within: root });
          nextBtn = await waitForElement('.nextBtn', { within: root });
          prevBtn = await waitForElement('.prevBtn', { within: root });
          avancarBtn = await waitForElement('#termos-next', { within: root });
        } catch (e) {
          console.error('[section-termos] Failed to load elements:', e);
          window.toast?.('Falha ao carregar os elementos da seção Termos.', 'error');
          return;
        }

        const buttons = [nextBtn, prevBtn, avancarBtn];
        buttons.forEach(btn => {
          btn.disabled = true;
          btn.style.cssText = `
            padding: 10px 20px !important;
            background: linear-gradient(to bottom, #a0a0a0, #808080), url('/assets/img/textura-de-pedra.jpg') center/cover !important;
            background-blend-mode: overlay !important;
            color: #fff !important;
            border-radius: 8px !important;
            font-size: 20px !important;
            border: 3px solid #4a4a4a !important;
            box-shadow: inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6) !important;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.7) !important;
            opacity: 1 !important;
            visibility: visible !important;
            display: inline-block !important;
            cursor: pointer !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          `;
          btn.addEventListener('mouseover', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 8px 16px rgba(0,0,0,0.7)';
          });
          btn.addEventListener('mouseout', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6)';
          });
        });

        nextBtn.addEventListener('click', () => {
          console.log('[section-termos] nextBtn clicked, showing termos-pg2');
          pg1.classList.add('hidden');
          pg2.classList.remove('hidden');
          runTypingChain(pg2);
        });

        prevBtn.addEventListener('click', () => {
          console.log('[section-termos] prevBtn clicked, showing termos-pg1');
          pg2.classList.add('hidden');
          pg1.classList.remove('hidden');
          runTypingChain(pg1);
        });

        avancarBtn.addEventListener('click', () => {
          console.log('[section-termos] avancarBtn clicked, navigating to section-senha');
          if (typeof window.JC?.show === 'function') {
            window.JC.show('section-senha');
          } else {
            window.location.href = '/html/section-senha.html';
          }
        });

        if (typeof window.setupCandleFlame === 'function') {
          window.setupCandleFlame('media', 'flame-bottom-right');
        }

        async function runTypingChain(container) {
          const typingElements = container.querySelectorAll('[data-typing="true"]:not(.typing-done)');
          if (typingElements.length === 0 || typeof window.runTyping !== 'function') {
            console.warn('[section-termos] No typing elements or runTyping not available');
            typingElements.forEach(el => {
              el.textContent = getText(el);
              el.classList.add('typing-done');
              el.style.opacity = '1 !important';
              el.style.display = 'block !important';
            });
            buttons.forEach(btn => btn.disabled = false);
            return;
          }

          try {
            for (const el of typingElements) {
              const text = getText(el);
              await applyTyping(el, text);
              await applyTTS(text);
            }
            buttons.forEach(btn => btn.disabled = false);
          } catch (err) {
            console.error('[section-termos] Typing error:', err);
            typingElements.forEach(el => {
              el.textContent = getText(el);
              el.classList.add('typing-done');
              el.style.opacity = '1 !important';
              el.style.display = 'block !important';
            });
            buttons.forEach(btn => btn.disabled = false);
          }
        }

        pg2.classList.add('hidden');
        pg1.classList.remove('hidden');
        await runTypingChain(pg1);
        TERMOS_READY = true;
      };

      document.addEventListener('section:shown', (e) => {
        if (e.detail.sectionId === 'section-termos') {
          handler();
        }
      });

      if (document.readyState !== 'loading') {
        const visibleTermos = document.querySelector('#section-termos:not(.hidden)');
        if (visibleTermos) {
          handler();
        }
      }
    })();
  </script>
</section>
