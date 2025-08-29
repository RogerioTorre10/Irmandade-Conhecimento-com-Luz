(function (global) {
  'use strict';

  const CFG = Object.assign({
    CANVAS_ID: "jornada-canvas",
    CONTENT_ID: "jornada-conteudo",
    PERG_V: "/assets/img/pergaminho-rasgado-vert.png",
    PERG_H: "/assets/img/pergaminho-rasgado-horiz.png",
    START: "home",
  }, global.JORNADA_CFG || {});

  function setPergaminho(mode) {
    try { global.JORNADA_PAPEL?.set?.(mode); } catch (_) {}
    const { root } = ensureCanvas();
    root.classList.remove("pergaminho-v", "pergaminho-h");
    root.classList.add(`pergaminho-${mode}`);
    root.style.backgroundImage = `url("${mode === 'v' ? CFG.PERG_V : CFG.PERG_H}")`;
    root.style.backgroundRepeat = "no-repeat";
    root.style.backgroundPosition = "center";
    root.style.backgroundSize = "cover";
  }

  function ensureCanvas() {
    const el = document.getElementById(CFG.CANVAS_ID) || document.createElement("section");
    if (!el.id) {
      el.id = CFG.CANVAS_ID;
      el.className = "card pergaminho";
      document.body.appendChild(el);
    }
    const content = el.querySelector(`#${CFG.CONTENT_ID}`) || document.createElement("div");
    if (!content.id) {
      content.id = CFG.CONTENT_ID;
      content.className = "conteudo-pergaminho";
      el.innerHTML = "";
      el.appendChild(content);
    }
    return { root: el, content };
  }

  function ensureEl(sel) {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
    return el;
  }

  function renderPerguntas() {
    setPergaminho('h');
    const PERGUNTAS = global.DEFAULT_QUESTIONS || [
      { name: 'q1', label: 'Quem é você neste momento da jornada?' },
      { name: 'q2', label: 'Qual foi o maior desafio hoje?' },
      { name: 'q3', label: 'Qual pequeno passo você pode dar hoje?' },
      { name: 'q4', label: 'O que você quer agradecer agora?' },
    ];
    const { content } = ensureCanvas();
    const form = document.createElement('form');
    form.className = 'form-perguntas';
    // ... (mesma lógica de criação de formulário da nova versão)
    content.appendChild(form);
    // progresso e submit como na nova versão
  }

  function renderIntro() {
    setPergaminho('v');
    const { content } = ensureCanvas();
    content.innerHTML = `<div class="intro"><h2>Bem-vindo à Jornada</h2><p>Respire...</p><div id="flame"></div><button id="btn-iniciar" class="btn-primary mt-4">Iniciar</button><button id="btn-voltar-home" class="btn-secondary">Voltar ao Início</button></div>`;
    try { global.JORNADA_CHAMA?.makeChama('#flame'); } catch (_) {}
    document.getElementById('btn-iniciar')?.addEventListener('click', () => renderPerguntas());
    document.getElementById('btn-voltar-home')?.addEventListener('click', () => goHome());
  }

  function renderFinal() {
    setPergaminho('v');
    const { content } = ensureCanvas();
    content.innerHTML = `<h2>Conclusão da Jornada</h2><p>Seu caminho foi registrado...</p><button id="btn-download" class="btn-primary">Baixar PDF + HQ</button><button id="btn-voltar" class="btn-secondary">Voltar ao Início</button>`;
    // ... (lógica de download da versão atual)
  }

  function playTransitionVideoForBlock(nextIndex, callback) {
    // ... (lógica da versão atual)
  }

  global.JORNADA_RENDER = { mount, setPergaminho, renderHome, renderIntro, renderPerguntas, renderFinal };
  global.renderPerguntas = renderPerguntas; // aliases
  document.addEventListener('DOMContentLoaded', () => renderIntro());
})(window);
