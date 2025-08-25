/* jornada.js — VERSÃO ESTÁVEL: 1.1 (print fallback)
   Estrutura (public/):
   ├─ index.html
   ├─ jornadas.html
   ├─ jornada-conhecimento-com-luz1.html
   ├─ jornada.js
   ├─ styles.css
   └─ assets/...
*/
const JORNADA_CFG = {
  STORAGE_KEY: "jornada-essencial-v1",
  API_BASE: "", // deixe vazio enquanto a API não tiver CORS
  ENDPOINTS: { PDF: "/jornada/essencial/pdf", HQ: "/jornada/essencial/hq" },
  SENHA_FIXA: "iniciar"
};
window.JORNADA_CFG = JORNADA_CFG;

// ===== STATE (localStorage) ==================================================
const S = {
  load() {
    try { return JSON.parse(localStorage.getItem(JORNADA_CFG.STORAGE_KEY) || "{}"); }
    catch(_) { return {}; }
  },
  save(data) {
    localStorage.setItem(JORNADA_CFG.STORAGE_KEY, JSON.stringify(data || {}));
  },
  clear() { localStorage.removeItem(JORNADA_CFG.STORAGE_KEY); }
};

// ===== HELPERS ===============================================================
function el(html){ const d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstElementChild; }
function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 800);
}
async function postBinary(url, payload){
  const resp = await fetch(url, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "Accept":"application/pdf, application/zip, application/octet-stream" },
    body: JSON.stringify(payload||{})
  });
  if(!resp.ok) throw new Error("API HTTP " + resp.status);
  return await resp.blob();
}
function setStatus(msg){ const s=document.getElementById("status"); if(s) s.textContent = msg || ""; }
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ===== PÁGINAS ===============================================================
function onIndex(){}
function onJornadas(){}

function onJornadaEssencial(){
  const root = document.getElementById("app");
  if(!root) return;

  const st = Object.assign({ step:"senha", respostas:{}, idx:0 }, S.load());
  render();

  function statusByStep(step){
    return ({
      senha: "Digite a senha para iniciar",
      intro: "Boas-vindas e instruções",
      perguntas: "Responda às reflexões com calma",
      final: "Parabéns! Você concluiu a jornada"
    })[step] || "";
  }

  function render(){
    setStatus(statusByStep(st.step));
    if(st.step==="senha") return renderSenha();
    if(st.step==="intro") return renderIntro();
    if(st.step==="perguntas") return renderPerguntas();
    if(st.step==="final") return renderFinal();
  }

  function renderSenha(){
    root.innerHTML = "";
    const view = el(`
      <section class="card">
        <h2 class="center">Acesso</h2>
        <p class="small center">Use a senha para começar (para testes: <span class="badge">${JORNADA_CFG.SENHA_FIXA}</span>).</p>
        <label for="senha">Senha</label>
        <input id="senha" class="input" type="password" autocomplete="off" placeholder="Digite a senha">
        <div class="footer-actions">
          <button class="btn primary" id="btnIniciar">Iniciar</button>
        </div>
      </section>
    `);
    view.querySelector("#btnIniciar").addEventListener("click", ()=>{
      const v = (view.querySelector("#senha").value||"").trim().toLowerCase();
      if(v === JORNADA_CFG.SENHA_FIXA){ st.step="intro"; S.save(st); render(); }
      else { alert("Senha inválida. Tente novamente."); }
    });
    root.appendChild(view);
  }

  function renderIntro(){
    root.innerHTML = "";
    const view = el(`
      <section class="card pergaminho">
        <h2 class="center">Bem-vindo(a) à Jornada Essencial</h2>
        <p class="info">Aqui você encontrará 32 reflexões para iluminar sua história, raízes e propósito. Responda com sinceridade. Você poderá revisar antes de concluir.</p>
        <div class="footer-actions">
          <button class="btn" id="btnVoltarSenha">Voltar</button>
          <button class="btn primary" id="btnComecar">Começar</button>
        </div>
      </section>
    `);
    view.querySelector("#btnVoltarSenha").addEventListener("click", ()=>{ st.step="senha"; S.save(st); render(); });
    view.querySelector("#btnComecar").addEventListener("click", ()=>{ st.step="perguntas"; st.idx=0; S.save(st); render(); });
    root.appendChild(view);
  }

  // Placeholder de perguntas (substitua pela lista real quando quiser)
  const PERGUNTAS = Array.from({length: 8}).map((_,i)=> ({
    id: "q"+(i+1),
    texto: `Pergunta ${i+1}: escreva sua reflexão com liberdade.`
  }));

  function renderPerguntas(){
    root.innerHTML = "";
    const idx = Math.max(0, Math.min(st.idx||0, PERGUNTAS.length-1));
    const q = PERGUNTAS[idx];
    const val = (st.respostas[q.id]||"");

    const view = el(`
      <section class="card">
        <div class="small">Questão ${idx+1} de ${PERGUNTAS.length}</div>
        <h3>${q.texto}</h3>
        <label for="resp">Sua resposta</label>
        <textarea id="resp" rows="6" class="input" placeholder="Escreva aqui..."></textarea>
        <div class="footer-actions">
          <button class="btn" id="btnIn
