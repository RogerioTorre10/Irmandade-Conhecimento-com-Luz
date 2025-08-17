// Wizard passo a passo – export ES module + compat global
const PERGUNTAS = [
  'Quem é você hoje?',
  'O que a Luz te pede agora?',
  'Qual é o próximo passo concreto?',
  'Qual verdade você precisa admitir para seguir?',
  'O que precisa ser curado neste momento?'
];

function getSalvo() {
  try { return JSON.parse(localStorage.getItem('respostas_jornada') || '{}'); } catch { return {}; }
}
function salva(obj) { localStorage.setItem('respostas_jornada', JSON.stringify(obj)); }

export function render(root) {
  const respostas = getSalvo();
  let i = 0;

  const el = document.createElement('div');
  el.className = 'rounded-xl border border-slate-800 bg-slate-800/40 p-6';
  root.innerHTML = '';
  root.appendChild(el);

  function progHTML() {
    const pct = Math.round(((i+1)/PERGUNTAS.length)*100);
    return `
      <div class="mb-4">
        <div class="flex justify-between text-xs opacity-70">
          <span>Etapa ${i+1}/${PERGUNTAS.length}</span><span>${pct}%</span>
        </div>
        <div class="h-2 bg-slate-700/50 rounded-full mt-1">
          <div class="h-2 bg-indigo-500 rounded-full" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }

  function tela() {
    const q = PERGUNTAS[i];
    const name = `q${i+1}`;
    const val = respostas[name] || '';

    el.innerHTML = `
      ${progHTML()}
      <h2 class="text-xl font-semibold mb-4">Jornada Essencial</h2>
      <div class="mb-2 font-medium">${i+1}. ${q}</div>
      <textarea id="ans" name="${name}" rows="6"
        class="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-3">${val}</textarea>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button id="btnVoltar" class="px-4 py-2 rounded-lg border border-slate-700 ${i===0?'opacity-40 cursor-not-allowed':''}">Voltar</button>
        <button id="btnSalvar" class="px-4 py-2 rounded-lg border border-slate-700">Salvar</button>
        <button id="btnAvancar" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">
          ${i === PERGUNTAS.length-1 ? 'Finalizar' : 'Avançar'}
        </button>
      </div>
      <p class="text-xs opacity-70 mt-3">Suas respostas ficam apenas no seu navegador até a geração do PDF.</p>
    `;

    function save() {
      const v = el.querySelector('#ans').value;
      respostas[name] = v;
      salva(respostas);
    }

    el.querySelector('#btnSalvar').addEventListener('click', save);
    el.querySelector('#btnAvancar').addEventListener('click', () => {
      save();
      if (i < PERGUNTAS.length - 1) {
        i++; tela();
      } else {
        // fim
        location.href = '/jornada-final.html';
      }
    });
    const voltar = el.querySelector('#btnVoltar');
    voltar.addEventListener('click', () => {
      if (i === 0) return;
      const v = el.querySelector('#ans').value;
      respostas[name] = v; salva(respostas);
      i--; tela();
    });
  }

  tela();
}

// compat global
if (typeof window !== 'undefined') {
  window.JornadaEssencial = window.JornadaEssencial || {};
  window.JornadaEssencial.render = window.JornadaEssencial.render || render;
}
export default render;
