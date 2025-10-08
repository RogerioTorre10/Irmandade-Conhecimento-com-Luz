( () => {
  if (window.__senhaBound) return;
  window.__senhaBound = true;

  const senhaHtml = `
    <section id="section-senha" class="section bloco bloco-intro hidden">
      <div class="bloco-conteudo">
        <h1>Insira a Senha</h1>
        <p id="senha-p1" data-typing="true" data-text="Digite a senha para continuar a jornada." data-speed="36" data-cursor="true"></p>
        <input id="senha-input" type="password" placeholder="Senha">
        <button id="btn-senha-avancar" class="btn btn-primary hidd" disabled>Iniciar</button>
      </div>
    </section>
  `;

  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  const handler = async (e) => {
    console.log('[jornada-senha.js] Evento recebido:', e?.detail);
    const id = e?.detail?.sectionId || e?.detail?.id;
    if (id !== 'section-senha') return;

    const container = document.getElementById('jornada-conteudo');
    container.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = senhaHtml;
    while (temp.firstChild) {
      container.appendChild(temp.firstChild);
    }

    const root = document.getElementById('section-senha');
    if (!root) {
      console.warn('[jornada-senha.js] Root da senha não encontrado');
      return;
    }

    const p1 = root.querySelector('#senha-p1');
    const input = root.querySelector('#senha-input');
    const btn = root.querySelector('#btn-senha-avancar');
    console.log('[jornada-senha.js] Elementos encontrados:', { p1, input, btn });

    btn.classList.remove('hidd');
    btn.style.display = 'inline-block';

    if (typeof window.runTyping === 'function') {
      window.runTyping(p1, p1.dataset.text, () => {
        console.log('[jornada-senha.js] Typing concluído');
      }, { speed: 36, cursor: true });
    } else {
      p1.textContent = p1.dataset.text;
    }

    input.addEventListener('input', () => {
      btn.disabled = !input.value.trim();
    });

    once(btn, 'click', () => {
      console.log('[jornada-senha.js] Botão clicado');
      window.JC?.goNext('section-termos'); // Ajuste pra próxima seção
    });
  };

  document.addEventListener('sectionLoaded', handler);
  document.addEventListener('section:shown', handler);
})();
