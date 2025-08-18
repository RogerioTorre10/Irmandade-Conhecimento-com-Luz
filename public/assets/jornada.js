/*
Pacote Jornada v10 — Entrega Garantida + Validação (PDF+HQ)
Autor: Lumen (GPT-5 Thinking)

O que há aqui:
1) TRECHO HTML — Aviso legal atualizado + botões finais
2) CSS — realce de campos obrigatórios não preenchidos
3) jornada.js (v10) — fluxo completo: intro estável, validação anti-avance, geração e download garantidos (PDF + HQ), limpeza total e redirecionamento

Como usar rapidamente:
- Cole os TRECHOS HTML nas respectivas páginas (intro/final da jornada).
- Inclua o CSS no <head> do HTML ou no seu arquivo de estilos.
- Substitua seu jornada.js atual por este v10 (IDs usados abaixo).
- Ajuste apenas CONFIG.API_BASE e endpoints, se necessário.

====================================================================
1) TRECHO HTML — Aviso legal (atualize sua seção de introdução)
====================================================================

<!-- INTRO / AVISO LEGAL -->
<section id="tela-intro" class="max-w-3xl mx-auto p-6">
  <h1 class="text-3xl font-semibold mb-4">Jornada Conhecimento com Luz — Essencial</h1>
  <div class="space-y-4 text-sm opacity-90">
    <p><strong>Importante:</strong> Ao final, <strong>PDF e HQ</strong> serão gerados e <strong>enviados ao seu dispositivo</strong> para download imediato. <strong>Não haverá backup</strong> nem recuperação posterior. Garanta que seu dispositivo tenha <strong>espaço livre suficiente</strong> antes de iniciar.</p>
    <ul class="list-disc pl-5">
      <li>Suas respostas não são armazenadas após a entrega.</li>
      <li>O acesso é por senha, com prazo para iniciar (15 dias) e concluir (24h) após o primeiro acesso.</li>
      <li>Ao prosseguir, você declara ciência e concordância com estas condições.</li>
    </ul>
  </div>
  <div class="mt-6">
    <button id="btn-iniciar" class="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white">Iniciar</button>
  </div>
</section>

<!-- TELA DE PERGUNTAS (exemplo de estrutura) -->
<section id="tela-perguntas" class="hidden max-w-3xl mx-auto p-6">
  <!-- Cada bloco .step representa uma etapa/página de perguntas -->
  <div class="step" data-step="1">
    <div class="question" data-qid="q1" aria-required="true">
      <label class="block mb-1 font-medium">1) Como você está hoje?</label>
      <textarea name="q1" class="w-full p-3 rounded-lg bg-slate-800" required></textarea>
    </div>
  </div>
  <div class="step hidden" data-step="2">
    <div class="question" data-qid="q2" aria-required="true">
      <label class="block mb-1 font-medium">2) O que deseja transformar?</label>
      <input type="text" name="q2" class="w-full p-3 rounded-lg bg-slate-800" required />
    </div>
  </div>

  <div class="mt-6 flex items-center gap-3">
    <button class="btn-prev px-5 py-3 rounded-xl bg-slate-700 text-white">Voltar</button>
    <button class="btn-next px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white">Avançar</button>
    <button id="btn-ir-final" class="btn-final hidden px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">Concluir</button>
  </div>
</section>

<!-- TELA FINAL -->
<section id="tela-final" class="hidden max-w-3xl mx-auto p-6">
  <div class="text-center">
    <h2 class="text-3xl font-semibold mb-2">Parabéns! 🎉</h2>
    <p class="opacity-90 mb-6">Você finalizou a jornada.</p>

    <div class="flex items-center justify-center gap-3 mb-5">
      <button id="btn-revisar" class="px-5 py-3 rounded-xl bg-slate-700 text-white">Revisar respostas</button>
      <button id="btn-baixar-tudo" class="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white">Baixar Entrega (PDF + HQ)</button>
      <button id="btn-voltar-home" class="px-5 py-3 rounded-xl bg-slate-700 text-white">Voltar ao início</button>
    </div>

    <div id="status-box" class="mx-auto max-w-lg text-left rounded-xl border border-slate-600/60 bg-slate-900/60 p-4 text-sm leading-relaxed hidden">
      <div id="status-lines" class="space-y-1"></div>
    </div>

    <p id="rodape-legal" class="mt-6 text-xs opacity-80">
      Ao clicar em “Baixar Entrega (PDF + HQ)”, os arquivos serão gerados e enviados ao seu dispositivo. Garanta espaço livre e conclua o download imediatamente, pois não há armazenamento posterior.
    </p>
  </div>
</section>

====================================================================
2) CSS — realce de campos obrigatórios não preenchidos
====================================================================

/* Coloque no <head> do HTML ou no seu CSS global */
<style>
  .field-error { outline: 2px solid #ef4444 !important; box-shadow: 0 0 0 2px #ef4444 inset !important; }
  .hidden { display: none; }
</style>

====================================================================
3) jornada.js (v10)
====================================================================
*/

// =============================
// CONFIGURAÇÃO
// =============================
const CONFIG = {
  API_BASE: 'https://conhecimento-com-luz-api.onrender.com', // ajuste se necessário
  ENDPOINTS: {
    PDF: '/gerar-pdf',
    HQ: '/gerar-hq' // se sua HQ for PNG, mantemos como binário
  },
  DOWNLOAD_NAMES: () => {
    const ts = new Date().toISOString().replace(/[:T]/g,'-').split('.')[0];
    return {
      pdf: `Jornada_${ts}.pdf`,
      hq: `Jornada_HQ_${ts}.png` // ajuste para .pdf se o backend gerar PDF
    };
  }
};

// =============================
// UTILS BÁSICOS
// =============================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function show(el){ el?.classList?.remove('hidden'); }
function hide(el){ el?.classList?.add('hidden'); }

function setStatus(msg, ok = null){
  const box = $('#status-box');
  const lines = $('#status-lines');
  if (!box || !lines) return;
  show(box);
  const line = document.createElement('div');
  if (ok === true) line.innerHTML = `${msg} <span class="text-emerald-400">✔</span>`;
  else if (ok === false) line.innerHTML = `${msg} <span class="text-rose-400">✖</span>`;
  else line.textContent = msg;
  lines.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

function triggerDownload(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

async function postBlob(url){
  // Se o backend precisa de corpo com respostas, adapte aqui para enviar JSON
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}

async function withRetry(fn, {retries = 2, delay = 600} = {}){
  let lastErr;
  for (let i = 0; i <= retries; i++){
    try { return await fn(); }
    catch(e){ lastErr = e; if (i < retries) await new Promise(r=>setTimeout(r, delay)); }
  }
  throw lastErr;
}

function limparTudo(){
  try {
    localStorage.removeItem('jornada.answers');
    localStorage.removeItem('jornada.progress');
    sessionStorage.clear();
    $$('input, textarea, select').forEach(el => {
      if (el.type === 'checkbox' || el.type === 'radio') el.checked = false; else el.value = '';
      el.classList.remove('field-error');
    });
  } catch(e){ console.warn('Falha ao limpar:', e); }
}

// =============================
// INTRO ESTÁVEL
// =============================
function mountIntro(){
  const started = sessionStorage.getItem('journey-started') === '1';
  $('#tela-intro') && (started ? hide($('#tela-intro')) : show($('#tela-intro')));
  $('#tela-perguntas') && (started ? show($('#tela-perguntas')) : hide($('#tela-perguntas')));
  $('#tela-final') && hide($('#tela-final'));
}

$('#btn-iniciar')?.addEventListener('click', () => {
  sessionStorage.setItem('journey-started', '1');
  hide($('#tela-intro')); show($('#tela-perguntas'));
});

// =============================
// WIZARD + VALIDAÇÃO
// =============================
let currentStep = 0; // índice baseado no array .step
function steps(){ return $$('#tela-perguntas .step'); }
function showStep(index){
  steps().forEach((s, i) => s.classList.toggle('hidden', i !== index));
  // Mostra/oculta botões adequados
  $('.btn-prev')?.classList.toggle('hidden', index === 0);
  $('.btn-next')?.classList.toggle('hidden', index >= steps().length - 1);
  $('#btn-ir-final')?.classList.toggle('hidden', index < steps().length - 1);
}

function valuePresent(el){
  if (!el) return true;
  if (el.type === 'checkbox' || el.type === 'radio'){
    const group = $$(`input[name="${el.name}"]`);
    return group.some(g => g.checked);
  }
  return !!String(el.value || '').trim();
}

function validateCurrentStep(){
  const s = steps()[currentStep];
  if (!s) return true;
  let ok = true;
  const requiredBlocks = Array.from(s.querySelectorAll('.question[aria-required="true"], .question[required]'));
  requiredBlocks.forEach(block => {
    // Tenta localizar um input principal
    const input = block.querySelector('input, textarea, select');
    const valid = valuePresent(input);
    if (!valid){ ok = false; input?.classList.add('field-error'); }
    else input?.classList.remove('field-error');
  });
  if (!ok) setStatus('Preencha os campos obrigatórios antes de avançar.', false);
  return ok;
}

$('.btn-next')?.addEventListener('click', () => {
  if (!validateCurrentStep()) return;
  currentStep = Math.min(currentStep + 1, steps().length - 1);
  showStep(currentStep);
});

$('.btn-prev')?.addEventListener('click', () => {
  currentStep = Math.max(currentStep - 1, 0);
  showStep(currentStep);
});

$('#btn-ir-final')?.addEventListener('click', () => {
  if (!validateCurrentStep()) return; // última validação
  hide($('#tela-perguntas')); show($('#tela-final'));
});

$('#btn-revisar')?.addEventListener('click', () => {
  hide($('#tela-final')); show($('#tela-perguntas'));
});

$('#btn-voltar-home')?.addEventListener('click', () => { location.href = '/'; });

// =============================
// ENTREGA GARANTIDA (PDF + HQ)
// =============================
async function baixarTudoGarantido(){
  const names = CONFIG.DOWNLOAD_NAMES();
  const pdfURL = CONFIG.API_BASE + CONFIG.ENDPOINTS.PDF;
  const hqURL  = CONFIG.API_BASE + CONFIG.ENDPOINTS.HQ;
  const btn = $('#btn-baixar-tudo');
  btn && (btn.disabled = true);

  $('#status-lines') && ($('#status-lines').innerHTML = '');
  setStatus('Gerando PDF...');

  try {
    const pdfBlob = await withRetry(() => postBlob(pdfURL), {retries: 2, delay: 800});
    triggerDownload(pdfBlob, names.pdf);
    setStatus('PDF baixado', true);
  } catch(e){
    setStatus('Falha ao gerar/baixar o PDF. Tentando abrir em nova aba...', false);
    try{
      const res = await fetch(pdfURL, {method:'POST'}); const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank');
      setStatus('PDF aberto em nova aba (salve manualmente).', true);
    }catch(e2){
      setStatus('Não foi possível entregar o PDF. Tente novamente.', false);
      btn && (btn.disabled = false);
      return; // não prossegue sem PDF
    }
  }

  setStatus('Gerando HQ (imagem)...');
  try {
    const hqBlob = await withRetry(() => postBlob(hqURL), {retries: 2, delay: 800});
    triggerDownload(hqBlob, names.hq);
    setStatus('HQ baixada', true);
  } catch(e){
    setStatus('Falha ao gerar/baixar a HQ. Tentando abrir em nova aba...', false);
    try{
      const res = await fetch(hqURL, {method:'POST'}); const blob = await res.blob();
      window.open(URL.createObjectURL(blob), '_blank');
      setStatus('HQ aberta em nova aba (salve manualmente).', true);
    }catch(e2){
      setStatus('Não foi possível entregar a HQ agora. Clique novamente em "Baixar Entrega (PDF + HQ)" após liberar espaço/conexão.', false);
      btn && (btn.disabled = false);
      return; // não redireciona enquanto HQ não for entregue
    }
  }

  setStatus('Entrega finalizada (PDF + HQ). Redirecionando...');
  limparTudo();
  setTimeout(()=>{ location.href = '/'; }, 1200);
}

$('#btn-baixar-tudo')?.addEventListener('click', baixarTudoGarantido);

// =============================
// INICIALIZAÇÃO
// =============================
window.addEventListener('DOMContentLoaded', () => {
  mountIntro();
  currentStep = 0; showStep(currentStep);
});
