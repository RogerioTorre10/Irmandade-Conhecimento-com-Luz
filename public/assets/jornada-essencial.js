// ES Module + compat global – exporta e também publica em window
export function render(root) {
  const perguntas = [
    'Quem é você hoje?',
    'O que a Luz te pede agora?',
    'Qual é o próximo passo concreto?',
    'Qual verdade você precisa admitir para seguir?',
    'O que precisa ser curado neste momento?'
  ];

  const html = `
    <div class="rounded-xl border border-slate-800 bg-slate-800/40 p-6">
      <h2 class="text-xl font-semibold mb-4">Jornada Essencial</h2>
      <ol class="list-decimal pl-6 space-y-3">
        ${perguntas.map((q,i)=>`
          <li>
            <label class="block mb-1">${q}</label>
            <textarea class="w-full bg-slate-900/60 border border-slate-700 rounded-lg p-3"
                      rows="3" name="q${i+1}" data-q="${i+1}"></textarea>
          </li>`).join('')}
      </ol>
      <div class="mt-6 flex items-center gap-3">
        <button id="btnSalvar" class="px-4 py-2 rounded-lg border border-slate-700">Salvar</button>
        <a href="/jornada-final.html" id="btnFinalizar" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">Finalizar</a>
      </div>
      <p class="text-xs opacity-70 mt-3">Suas respostas ficam apenas no seu navegador até a geração do PDF.</p>
    </div>`;

  root.innerHTML = html;

  // Restaura se existir
  const salvo = JSON.parse(localStorage.getItem('respostas_jornada') || '{}');
  if (salvo && typeof salvo === 'object') {
    Object.entries(salvo).forEach(([k,v])=>{
      const el = root.querySelector(`[name="${k}"]`);
      if (el) el.value = Array.isArray(v) ? v.join('\n') : v;
    });
  }

  function coletar(){
    const out = {};
    root.querySelectorAll('textarea[name]').forEach(t => out[t.name] = t.value);
    return out;
  }

  function salvar(){
    localStorage.setItem('respostas_jornada', JSON.stringify(coletar()));
  }

  root.querySelector('#btnSalvar')?.addEventListener('click', salvar);
  root.querySelectorAll('textarea').forEach(t => t.addEventListener('change', salvar));
}

// compat global
if (typeof window !== 'undefined') {
  window.JornadaEssencial = window.JornadaEssencial || {};
  window.JornadaEssencial.render = window.JornadaEssencial.render || render;
}
export default render;
