(function (global) {
    'use strict';

    if (global.__GuiaSelfieReady) {
        console.log('[GuiaSelfie] Já carregado, ignorando');
        return;
    }
    global.__GuiaSelfieReady = true;

    const log = (...args) => console.log('[GuiaSelfie]', ...args);
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);
    
    // Variável para armazenar a lista de guias após o fetch
    let availableGuias = [];

    // =========================================================================
    // FUNÇÕES DE UTILIDADE E RENDERIZAÇÃO
    // =========================================================================

    /**
     * Função principal para injetar o seletor de guias no placeholder.
     * Esta função é chamada pelo section-intro.js após o fetch.
     * @param {HTMLElement} placeholderNode - O elemento #guia-selfie-placeholder
     * @param {Array<Object>} guias - A lista de guias do guias.json
     */
    function renderGuiaSelector(placeholderNode, guias) {
        if (!placeholderNode || !guias || guias.length === 0) {
            log('Não foi possível renderizar o seletor: dados ou placeholder ausentes.');
            return;
        }

        availableGuias = guias;
        log('Renderizando seletor de guias com:', guias.length, 'guias.');

        // 1. Cria o HTML para a escolha do guia
        let html = '<div class="guia-selector-title">Escolha seu Guia:</div>';
        html += '<div class="guia-options-wrap">';
        
        guias.forEach(guia => {
            html += `
                <button 
                    class="btn-guia-select" 
                    data-guia-id="${guia.id}" 
                    data-guia-nome="${guia.nome}"
                    style="background-image: url('${guia.bgImage}');"
                >
                    ${guia.nome}
                </button>
            `;
        });
        html += '</div>';

        // 2. Injeta no placeholder
        placeholderNode.innerHTML = html;

        // 3. Configura o evento de clique
        $$('.btn-guia-select').forEach(button => {
            button.addEventListener('click', handleGuiaSelection);
        });
        
        // Se já houver um guia salvo, pré-seleciona
        const savedGuia = localStorage.getItem('JORNADA_GUIA');
        if (savedGuia) {
            const btn = $(`[data-guia-id="${savedGuia}"]`);
            if (btn) btn.classList.add('selected');
        }

        // Avisa que a renderização do guia terminou (pode ser útil para o intro.js)
        document.dispatchEvent(new CustomEvent('guiaSelectorRendered'));
    }

    /**
     * Trata a seleção de um guia pelo usuário.
     * @param {Event} e 
     */
    function handleGuiaSelection(e) {
        const guiaId = e.currentTarget.dataset.guiaId;
        const guiaNome = e.currentTarget.dataset.guiaNome;

        // Desmarca todos os botões e marca o selecionado
        $$('.btn-guia-select').forEach(btn => btn.classList.remove('selected'));
        e.currentTarget.classList.add('selected');

        // Salva a escolha
        localStorage.setItem('JORNADA_GUIA', guiaId);
        log('Guia selecionado:', guiaNome, 'ID:', guiaId);

        // Dispara um evento para o section-intro.js saber que o guia foi escolhido
        document.dispatchEvent(new CustomEvent('guiaSelected', { detail: { guiaId, guiaNome } }));
        
        // O section-intro.js agora pode habilitar o botão 'Iniciar'
    }

    // =========================================================================
    // FUNÇÕES DE BACKEND (mantidas para o seu chat e selfie)
    // =========================================================================

    // ... (Seu código original das funções loadBg(), updatePreview(), getBgUrl(), initSelfie(), sendChatMessage(), updateProgress(), saveAnswers(), loadAnswers()) ...
    
    // A função getBgUrl() corrigida, pois tinha um erro de sintaxe:
    function getBgUrl() {
        const card = document.getElementById('card-guide');
        const guideNameEl = document.getElementById('guideNameSlot');
        
        const guia = localStorage.getItem('JORNADA_GUIA') || 'zion'; // Fallback
        
        // Ajuste para o ID do elemento correto no index.html
        if (card) card.dataset.guide = guia.toUpperCase();
        if (guideNameEl) guideNameEl.textContent = guia.toUpperCase();
        
        // Lista de URLs, corrigido o erro de sintaxe original:
        const urls = {
            arian: '/assets/img/irmandade-quarteto-bg-arian.png',
            lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
            zion: '/assets/img/irmandade-quarteto-bg-zion.png'
        };

        return urls[guia] || urls['zion']; // fallback seguro
    }
    // ... o restante das suas funções de chat e selfie continuam iguais ...

    // =========================================================================
    // INICIALIZAÇÃO
    // =========================================================================

    function initGuiaSelfie() {
        // Remove a lógica de inicialização da selfie para a introdução,
        // pois a selfie é uma seção posterior.
        
        const chatInput = $('#grok-chat-input');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendChatMessage();
                }
            });
        }
        const chatSendBtn = $('#grok-chat-send');
        if (chatSendBtn) {
            chatSendBtn.addEventListener('click', sendChatMessage);
        }
        
        // Lógica de salvar respostas (geralmente em outras seções)
        $$('.j-pergunta textarea').forEach(input => {
            input.addEventListener('input', () => {
                saveAnswers();
                updateProgress();
            });
        });
        
        // loadAnswers(); // Descomente se necessário carregar o progresso na inicialização
        log('GuiaSelfie (base) inicializado e funções exportadas.');
    }

    // Inicialização da parte mais geral
    document.addEventListener('DOMContentLoaded', initGuiaSelfie);
    
    // Inicialização da selfie/guia em suas respectivas seções (mantido o seu evento)
    document.addEventListener('sectionLoaded', (e) => {
        const id = e.detail.sectionId;
        if (id === 'section-selfie') {
             // Chamada da função que faz a selfie
             // Exemplo: window.JGuiaSelfie?.initSelfieLogic(e.detail.node);
        }
        // As demais lógicas de selfie e guia continuam no seu código original, mas
        // devem ser encapsuladas e chamadas aqui para evitar conflitos de escopo.
    });


    // Expõe a função que o section-intro.js precisa
    global.JornadaGuiaSelfie = {
        renderSelector: renderGuiaSelector, // <<-- FUNÇÃO CHAVE PARA O INTRO.JS
        handleGuiaSelection,
        initSelfie,
        sendChatMessage,
        updateProgress,
        saveAnswers,
        loadAnswers
    };
})(window);
