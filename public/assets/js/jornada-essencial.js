// Wizard passo a passo – export ES module + compat global (sem botão "Salvar")
import i18n from '/public/assets/js/i18n.js';
const paperLog = (...args) => console.log('[JORNADA_ESSENCIAL]', ...args);
const PERGUNTAS = [
  'Quem é você hoje?',
  'O que a Luz te pede agora?',
  'Qual é o próximo passo concreto?',
  'Qual verdade você precisa admitir para seguir?',
  'O que precisa ser curado neste momento?'
  // 👉 depois trocamos aqui pelas suas 32 oficiais
];

function lerLocal() {
  try { return JSON.parse(localStorage.getItem('respostas_jornada') || '{}'); }
  catch { return {}; }
}
function gravarLocal(obj) { try { localStorage.setItem('respostas_jornada', JSON.stringify(obj)); } catch {} }
function render(root) {
  const respostas = lerLocal();
  let i = 0;

  try { i = parseInt(sessionStorage.getItem('jornada.step') || '0', 10) || 0; } catch {}
  const el = document.createElement('div');
  el.className = 'rounded-xl border border-slate-800 bg-slate-800/40 p-6';
  root.innerHTML = '';
  root.appendChild(el);

  function progresso() {
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

  function autoSalvar() {
    const name = `q${i+1}`;
    const v = el.querySelector('#ans')?.value ?? '';
    respostas[name] = v;
    gravarLocal(respostas);
  }

  function montarTela() {
    const q = PERGUNTAS[i];
    const name = `q${i+1}`;
    const val = respostas[name] || '';

    el.innerHTML = `
      ${progresso()}
      <h2 class="text-xl font-semibold mb-4">Jornada Essencial</h2>
      <div class="mb-2 font-medium">${i+1}. ${q}</div>
      <textarea id="ans" name="${name}" rows="6"
        class="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-3">${val}</textarea>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <button id="btnVoltar" class="px-4 py-2 rounded-lg border border-slate-700 ${i===0?'opacity-40 cursor-not-allowed':''}">Voltar</button>
        <button id="btnAvancar" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">
          ${i === PERGUNTAS.length-1 ? 'Finalizar' : 'Avançar'}
        </button>
      </div>
      <p class="text-xs opacity-70 mt-3">Suas respostas permanecem somente no seu navegador até a geração do PDF.</p>
    `;

    // autosave ao digitar e ao trocar de etapa
    const ans = el.querySelector('#ans');
    ans?.addEventListener('input', () => autoSalvar());

    el.querySelector('#btnAvancar')?.addEventListener('click', () => {
    const txt = (el.querySelector('#ans')?.value || '').trim();
    if (!txt) { el.querySelector('#ans')?.classList.add('field-error'); el.querySelector('#ans')?.focus(); return; }
    autoSalvar();
      try { sessionStorage.setItem('jornada.step', String(i)); } catch {}
      }
    });

    el.querySelector('#btnVoltar')?.addEventListener('click', () => {
      if (i === 0) return;
      autoSalvar();
      i--; montarTela();
      try { sessionStorage.setItem('jornada.step', String(i)); } catch {}

    });
  }

  montarTela();
}

// compat global
if (typeof window !== 'undefined') {
  window.JornadaEssencial = window.JornadaEssencial || {};
  window.JornadaEssencial.render = window.JornadaEssencial.render || render;
}
// (removido: export default) — compat com <script> clássico
