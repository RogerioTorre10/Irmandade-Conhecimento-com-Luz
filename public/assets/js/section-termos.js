(function () {
  'use strict';

  // Namespace para isolar a seção
  window.JCTermos = window.JCTermos || {};

  // Verificar inicialização
  if (window.JCTermos.__bound) {
    console.log('[JCTermos] Já inicializado, ignorando...');
    return;
  }
  window.JCTermos.__bound = true;

  // Estado da seção
  window.JCTermos.state = {
    ready: false,
    currentPage: 1,
    listenerAdded: false,
    HANDLER_COUNT: 0,
    TYPING_COUNT: 0
  };

  // Funções utilitárias
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 5000, step = 100 } = {}) {
    console.log('[JCTermos] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) {
          console.log('[JCTermos] Elemento encontrado:', selector);
          return resolve(el);
        }
        if (performance.now() - start >= timeout) {
          console.error('[JCTermos] Timeout aguardando:', selector);
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

  function fromDetail(detail = {}) {
    const sectionId = detail.sectionId || detail.id || window.__currentSectionId;
    const node = detail.node || detail.root || null;
    return { sectionId, node };
  }

  // Função de transição com vídeo
  function playTransitionThen(nextStep) {
    if (document.getElementById('termos-transition-overlay')) return;
    console.log('[JCTermos] Iniciando transição de vídeo: /assets/img/filme-senha.mp4');
    const overlay = document.createElement('div');
    overlay.id = 'termos-transition-overlay';
    overlay.style.cssText = `
      position:fixed; inset:0; background:#000; z-index:999999;
      display:flex; align-items:center; justify-content:center;`;
    const video = document.createElement('video');
    video.src = '/assets/img/filme-senha.mp4';
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.style.cssText = 'width:100%; height:100%; object-fit:cover;';
    overlay.appendChild(video);
    document.body.appendChild(overlay);

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      try { video.pause(); } catch {}
      overlay.remove();
      console.log('[JCTermos] Transição concluída, executando próximo passo.');
      if (typeof nextStep === 'function') nextStep();
      document.dispatchEvent(new CustomEvent('transition:ended'));
    };

    video.addEventListener('ended', () => {
      console.log('[JCTermos] Vídeo terminou, limpando e prosseguindo.');
      cleanup();
    }, { once: true });
    video.addEventListener('error', (e) => {
      console.error('[JCTermos] Erro ao reproduzir vídeo:', e);
      cleanup();
    }, { once: true });
    setTimeout(() => { if (!done) cleanup(); }, 2000); // Timeout reduzido para 3s

    Promise.resolve().then(() => video.play?.()).catch((e) => {
      console.warn('[JCTermos] Erro ao iniciar vídeo:', e);
      cleanup();
    });
  }

  // Handler principal
  const handler = async (evt) => {
    window.JCTermos.state.HANDLER_COUNT++;
    console.log(`[JCTermos] Handler disparado (${window.JCTermos.state.HANDLER_COUNT}x):`, {
      sectionId: evt?.detail?.sectionId,
      node: !!evt?.detail?.node,
      ready: window.JCTermos.state.ready,
      currentPage: window.JCTermos.state.currentPage
    });
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId !== 'section-termos') {
      console.log('[JCTermos] Ignorando, sectionId não é section-termos:', sectionId);
      return;
    }

    if (window.JCTermos.state.ready || (node && node.dataset.termosInitialized)) {
      console.log('[JCTermos] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById('section-termos');
    if (!root) {
      console.log('[JCTermos] Tentando localizar #section-termos...');
      try {
        root = await waitForElement('#section-termos', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 10000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção Termos não carregada.', 'error');
        console.error('[JCTermos] Section not found:', e);
        return;
      }
    }

    console.log('[JCTermos] Root encontrado:', root);
    root.dataset.termosInitialized = 'true';
    root.classList.add('section-termos');

    // Aplicar estilos ao root
    root.style.cssText = `
      background: transparent;
      padding: 24px;
      border-radius: 12px;
      width: 100%;
      max-width: 600px;
      margin: 12px auto;
      text-align: center;
      box-shadow: none;
      border: none;
      display: block;
      opacity: 1;
      visibility: visible;
      position: relative;
      z-index: 2;
      overflow-y: scroll;
      min-height: 80vh;
      height: 80vh;
      box-sizing: border-box;
    `;

    let pg1, pg2, nextBtn, prevBtn, avancarBtn;
    try {
      console.log('[JCTermos] Buscando elementos...');
      pg1 = await waitForElement('#termos-pg1', { within: root, timeout: 5000 });
      pg2 = await waitForElement('#termos-pg2', { within: root, timeout: 5000 });
      nextBtn = await waitForElement('.nextBtn[data-action="termos-next"]', { within: root, timeout: 5000 });
      prevBtn = await waitForElement('.prevBtn[data-action="termos-prev"]', { within: root, timeout: 5000 });
      avancarBtn = await waitForElement('.avancarBtn[data-action="avancar"]', { within: root, timeout: 5000 });
    } catch (e) {
      console.error('[JCTermos] Falha ao carregar elementos:', e);
      window.toast?.('Erro: Elementos da seção Termos não encontrados.', 'error');
      // Fallback: exibir elementos sem datilografia
      if (root) {
        root.querySelectorAll('[data-typing="true"]').forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.display = 'block';
        });
        root.querySelectorAll('.btn').forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        });
      }
      return;
    }

    console.log('[JCTermos] Elementos carregados:', { pg1, pg2, nextBtn, prevBtn, avancarBtn });

    [pg1, pg2].forEach((el, i) => {
      if (el) {
        el.classList.remove('hidden');
        el.style.display = i === 0 ? 'block' : 'none';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        el.style.minHeight = '60vh';
        console.log('[JCTermos] Página inicializada:', el.id);
      }
    });

    [pg1, pg2].forEach(pg => {
      if (pg) {
        pg.querySelectorAll('[data-typing="true"]').forEach(el => {
          el.textContent = '';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.style.display = 'none';
          console.log('[JCTermos] Texto inicializado:', el.id);
        });
      }
    });

    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('btn', 'btn-primary', 'btn-stone');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.style.display = 'inline-block';
        btn.style.margin = '8px';
        btn.style.visibility = 'visible';
        console.log('[JCTermos] Botão inicializado:', btn.className, btn.textContent);
      }
    });

    const runTypingChain = async () => {
      window.JCTermos.state.TYPING_COUNT++;
      console.log(`[JCTermos] runTypingChain chamado (${window.JCTermos.state.TYPING_COUNT}x) na página ${window.JCTermos.state.currentPage}`);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout em runTypingChain')), 15000); // Aumentado para 15s
      });
      try {
        await Promise.race([
          new Promise(async (resolve) => {
            if (window.__typingLock) {
              console.log('[JCTermos] Typing lock ativo, aguardando...');
              await new Promise(resolveLock => {
                const checkLock = () => {
                  if (!window.__typingLock) {
                    console.log('[JCTermos] Lock liberado, prosseguindo...');
                    resolveLock();
                  } else {
                    setTimeout(checkLock, 100);
                  }
                };
                checkLock();
              });
            }

            // Aguardar evento de transição ou timeout
            console.log('[JCTermos] Aguardando conclusão do vídeo de transição...');
            await new Promise(resolve => {
              const onTransitionEnd = () => {
                console.log('[JCTermos] Evento transition:ended recebido');
                document.removeEventListener('transition:ended', onTransitionEnd);
                resolve();
              };
              document.addEventListener('transition:ended', onTransitionEnd, { once: true });
              setTimeout(() => {
                console.log('[JCTermos] Timeout de transição atingido (8000ms)');
                document.removeEventListener('transition:ended', onTransitionEnd);
                resolve();
              }, 8000);
            });

            console.log('[JCTermos] Iniciando datilografia na página atual...');
            const currentPg = window.JCTermos.state.currentPage === 1 ? pg1 : pg2;
            const typingElements = currentPg.querySelectorAll('[data-typing="true"]:not(.typing-done)');
            if (!typingElements.length) {
              console.warn('[JCTermos] Nenhum elemento com data-typing="true" encontrado');
              currentPg.style.opacity = '1';
              currentPg.style.visibility = 'visible';
              [nextBtn, prevBtn, avancarBtn].forEach(btn => {
                if (btn) {
                  btn.disabled = false;
                  btn.style.opacity = '1';
                  btn.style.cursor = 'pointer';
                }
              });
              resolve();
              return;
            }
            for (const el of typingElements) {
              const text = getText(el);
              console.log('[JCTermos] Datilografando:', el.id, text.substring(0, 50));
              el.textContent = '';
              el.classList.add('typing-active', 'lumen-typing');
              el.style.color = '#fff';
              el.style.opacity = '0';
              el.style.display = 'block';
              el.style.visibility = 'hidden';
              currentPg.style.opacity = '1';
              currentPg.style.visibility = 'visible';
              await new Promise(resolve => {
                if (typeof window.runTyping !== 'function') {
                  console.warn('[JCTermos] window.runTyping não encontrado, usando fallback');
                  let i = 0;
                  const type = () => {
                    if (i < text.length) {
                      el.textContent += text.charAt(i++);
                      setTimeout(type, 100);
                    } else {
                      resolve();
                    }
                  };
                  type();
                } else {
                  window.runTyping(el, text, resolve, {
                    speed: Number(el.dataset.speed || 100),
                    cursor: String(el.dataset.cursor || 'true') === 'true'
                  });
                }
              });
              el.classList.add('typing-done');
              el.classList.remove('typing-active');
              el.style.opacity = '1';
              el.style.visibility = 'visible';
              el.style.display = 'block';
            }
            resolve();
          }),
          timeoutPromise
        ]);
        console.log('[JCTermos] Datilografia concluída na página atual');
        [nextBtn, prevBtn, avancarBtn].forEach(btn => {
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        });
      } catch (err) {
        console.error('[JCTermos] Erro em runTypingChain:', err);
        [pg1, pg2].forEach(pg => {
          if (pg) {
            pg.querySelectorAll('[data-typing="true"]').forEach(el => {
              el.textContent = getText(el);
              el.classList.add('typing-done');
              el.style.opacity = '1';
              el.style.visibility = 'visible';
              el.style.display = 'block';
            });
          }
        });
        [nextBtn, prevBtn, avancarBtn].forEach(btn => {
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        });
      }
    };

    once(nextBtn, 'click', async () => {
      speechSynthesis.cancel();
      if (window.JCTermos.state.currentPage === 1 && pg2) {
        pg1.style.display = 'none';
        pg2.style.display = 'block';
        avancarBtn.textContent = 'Aceito e quero continuar';
        window.JCTermos.state.currentPage = 2;
        await runTypingChain();
      }
    });

    once(prevBtn, 'click', async (e) => {
      if (e.isTrusted) {
        speechSynthesis.cancel();
        console.log('[JCTermos] Redirecionando para site fora da jornada');
        window.location.href = '/';
      } else {
        console.log('[JCTermos] Clique simulado ignorado');
      }
    });

    once(avancarBtn, 'click', async (e) => {
  if (e.isTrusted) {
    speechSynthesis.cancel();
    if (window.JCTermos.state.currentPage === 2) {
      console.log('[JCTermos] Avançando para section-senha com transição de vídeo');
      window.JCTermos.destroy();
      const wrapper = document.getElementById('jornada-content-wrapper');
      if (wrapper) wrapper.innerHTML = '';
      playTransitionThen(() => {
        if (typeof window.JC?.show === 'function') {
          window.JC.currentSection = 'section-termos'; // Definir seção atual
          window.JC.show('section-senha');
        } else {
          window.location.href = 'jornada-conhecimento-com-luz1.html#section-senha';
          console.warn('[JCTermos] Fallback navigation to jornada-conhecimento-com-luz1.html#section-senha');
        }
      });
    }
  } else {
    console.log('[JCTermos] Clique simulado ignorado');
  }
});

    window.JCTermos.state.ready = false;
    console.log('[JCTermos] Iniciando runTypingChain na página 1...');
    try {
      await runTypingChain();
      window.JCTermos.state.ready = true;
      console.log('[JCTermos] Inicialização concluída');
    } catch (err) {
      console.error('[JCTermos] Erro na datilografia:', err);
      [pg1, pg2].forEach(pg => {
        if (pg) {
          pg.querySelectorAll('[data-typing="true"]').forEach(el => {
            el.textContent = getText(el);
            el.classList.add('typing-done');
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.display = 'block';
          });
        }
      });
      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        }
      });
    }

    console.log('[JCTermos] Elementos encontrados:', {
      pg1: !!pg1, pg1Id: pg1?.id,
      pg2: !!pg2, pg2Id: pg2?.id,
      nextBtn: !!nextBtn, nextBtnAction: nextBtn?.dataset?.action,
      prevBtn: !!prevBtn, prevBtnAction: prevBtn?.dataset?.action,
      avancarBtn: !!avancarBtn, avancarBtnAction: avancarBtn?.dataset?.action
    });
  };

  // Método para limpar a seção
  window.JCTermos.destroy = () => {
    console.log('[JCTermos] Destruindo seção termos');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    const root = document.getElementById('section-termos');
    if (root) {
      root.dataset.termosInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCTermos.state.ready = false;
    window.JCTermos.state.listenerAdded = false;
    window.JCTermos.state.HANDLER_COUNT = 0;
    window.JCTermos.state.TYPING_COUNT = 0;
    window.__typingLock = false; // Resetar o lock
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  // Registrar handler
  if (!window.JCTermos.state.listenerAdded) {
    console.log('[JCTermos] Registrando listener para sectionLoaded');
    window.addEventListener('sectionLoaded', handler, { once: true });
    window.JCTermos.state.listenerAdded = true;
  }

  // Inicialização manual com tentativas repetidas
  const bind = () => {
    console.log('[JCTermos] Executando bind');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });

    const tryInitialize = (attempt = 1, maxAttempts = 20) => {
      setTimeout(() => {
        const visibleTermos = document.querySelector('#section-termos:not(.hidden)');
        if (visibleTermos && !window.JCTermos.state.ready && !visibleTermos.dataset.termosInitialized) {
          console.log('[JCTermos] Seção visível encontrada, disparando handler');
          handler({ detail: { sectionId: 'section-termos', node: visibleTermos } });
        } else if (document.getElementById('section-termos') && !window.JCTermos.state.ready && !document.getElementById('section-termos').dataset.termosInitialized) {
          console.log('[JCTermos] Forçando inicialização manual (tentativa ' + attempt + ')');
          handler({ detail: { sectionId: 'section-termos', node: document.getElementById('section-termos') } });
        } else if (attempt < maxAttempts) {
          console.log('[JCTermos] Nenhuma seção visível ou já inicializada, tentando novamente...');
          tryInitialize(attempt + 1, maxAttempts);
        } else {
          console.error('[JCTermos] Falha ao inicializar após ' + maxAttempts + ' tentativas');
        }
      }, 1000 * attempt);
    };

    tryInitialize();
  };

  if (document.readyState === 'loading') {
    console.log('[JCTermos] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCTermos] DOM já carregado, chamando bind');
    bind();
  }
})();
