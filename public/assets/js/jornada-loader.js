(function () {
  'use strict';

  const etapas = {
    intro:  '/assets/html/section-intro.html',
    termos: '/assets/html/jornada-termos.html',
    senha:  '/assets/html/jornada-senha.html',
    barra:  '/assets/html/jornada_barracontador.html',
    olho:   '/assets/html/jornada_olhomagico.html',
    final:  '/assets/html/jornada-final.html'
  };

  const JORNADA_CONTAINER_ID = 'jornada-conteudo';

    /**
     * Carrega uma etapa dinamicamente, buscando HTML via Fetch e injetando JS.
     *
     * @param {string} nome O nome da etapa (ex: 'intro').
     * @param {function} callback Função a ser chamada após o carregamento e injeção.
     */
    async function carregarEtapa(nome, callback) {
        const url = etapas[nome];
        const container = document.getElementById(JORNADA_CONTAINER_ID);

        if (!url) {
            console.error(`[carregarEtapa] URL para a etapa '${nome}' não definida.`);
            return;
        }

        if (!container) {
            console.error(`[carregarEtapa] Contêiner #${JORNADA_CONTAINER_ID} não encontrado.`);
            return;
        }

        console.log(`[carregarEtapa] Tentando carregar HTML de: ${url}`);
        
        try {
            // 1. FAZ O FETCH DO HTML
            const response = await fetch(url);

            if (!response.ok) {
                // Se o código for 404, 500, etc., o erro será tratado aqui!
                throw new Error(`HTTP Status ${response.status} - Falha ao buscar o HTML da etapa '${nome}'. Caminho: ${url}`);
            }

            const html = await response.text();
            
            // 2. INJEÇÃO E PROCESSAMENTO DO HTML (SUA LÓGICA EXISTENTE)
            container.innerHTML = ''; // Limpa o contêiner

            const temp = document.createElement('div');
            temp.innerHTML = html;

            // Processar scripts embutidos
            const scripts = temp.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                
                // Trata scripts externos (assíncronos)
                if (script.src) {
                    newScript.src = script.src;
                    newScript.async = true; 
                    document.body.appendChild(newScript);
                } else {
                    // Trata e executa scripts embutidos (sua lógica de eval)
                    try {
                        const scriptContent = script.textContent.trim();
                        if (scriptContent) {
                            // Se for uma arrow function (seu método de execução)
                            if (scriptContent.startsWith('() =>')) {
                                eval(`(${scriptContent})()`);
                            } else {
                                newScript.textContent = scriptContent;
                                document.body.appendChild(newScript);
                            }
                        }
                    } catch (error) {
                        console.error('[carregarEtapa] Erro ao executar script embutido:', error);
                    }
                }
            });
            // Remove as tags <script> do HTML a ser injetado para evitar duplicação/erro
            scripts.forEach(s => s.remove());

            // Transfere o conteúdo para o contêiner (DOM Manipulation)
            while (temp.firstChild) {
                container.appendChild(temp.firstChild);
            }

            // 3. EVENTOS DE FINALIZAÇÃO
           setTimeout(() => {
                // CORREÇÃO APLICADA AQUI:
                // Tenta buscar no container E, se falhar, tenta buscar no documento inteiro (getElementById)
                const sectionId = `section-${nome}`;
                const root = container.querySelector(`#${sectionId}`) || document.getElementById(sectionId);
                
                console.log(`[carregarEtapa] Root encontrado para ${sectionId}:`, root);
                
                if (!root) {
                    // Este erro só ocorrerá se o arquivo HTML carregado não tiver o ID correto
                    console.error(`[carregarEtapa] Elemento #${sectionId} não encontrado dentro do HTML carregado.`);
                }
                
                // Dispara o evento 'sectionLoaded' para o controller
                document.dispatchEvent(new CustomEvent('sectionLoaded', {
                    detail: { sectionId: sectionId, root }
                }));
                
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }, 0);
        } catch (error) {
            console.error(`[carregarEtapa] Erro no FETCH ou processamento da etapa '${nome}':`, error.message);
            // Mensagem clara de erro para o console
            // Se for 404, o erro virá daqui!
        }
    }

    window.carregarEtapa = carregarEtapa;
})();
