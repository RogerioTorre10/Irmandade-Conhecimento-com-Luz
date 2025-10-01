// /public/assets/js/jornada-bootstrap.js
import i18n from './i18n.js'
import { loadDynamicBlocks } from './jornada-paper-qa.js'; // Ajuste o caminho

const log = (...args) => console.log('[BOOT]', ...args);

async function startWhenReady() {
  let attempts = 0;
  const maxAttempts = 50;
  const interval = 100;

  while (attempts < maxAttempts) {
    const dependencies = {
      i18n: i18n.ready,
      paperQA: window.JORNADA_BLOCKS?.length > 0 || false
    };

    if (dependencies.i18n && dependencies.paperQA) {
      log('Todas as dependências prontas:', dependencies);
      return true;
    }

    log('Dependências não prontas, retry em', interval, 'ms:', dependencies);
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }

  log('Máximo de tentativas excedido. Dependências:', {
    i18n: i18n.ready,
    paperQA: window.JORNADA_BLOCKS?.length > 0 || false
  });
  throw new Error('Inicialização falhou: máximo de tentativas excedido');
}

async function bootstrap() {
  log('Inicializando jornada...');
  try {
    await i18n.init('pt'); // Inicia com português
    log('i18n inicializado');
    const blocksLoaded = await loadDynamicBlocks();
    if (!blocksLoaded) {
      throw new Error('Falha ao carregar JORNADA_BLOCKS');
    }
    await startWhenReady();
    log('Inicialização concluída 🚀');
    document.dispatchEvent(new CustomEvent('bootstrapComplete'));
  } catch (error) {
    console.error('[BOOT] Erro na inicialização:', error);
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
