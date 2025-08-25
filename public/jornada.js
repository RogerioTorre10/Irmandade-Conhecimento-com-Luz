/* jornada.js — VERSÃO ESTÁVEL: 1.0 (25-08-2025)
   Irmandade Conhecimento com Luz
   Estrutura oficial (persistir):
   /public
     ├─ index.html
     ├─ jornadas.html
     ├─ jornada-conhecimento-com-luz1.html
     ├─ jornada.js
     ├─ /assets/img
     └─ /css/styles.css
   Regras:
   - Sem Tailwind CDN
   - Referências absolutas: /jornada.js, /css/styles.css, /assets/img/...
*/
// ==== CONFIG ================================================================
const JORNADA_CFG = {
  STORAGE_KEY: "jornada-essencial-v1",
  API_BASE: "https://conhecimento-com-luz-api.onrender.com",
  ENDPOINTS: { PDF: "/jornada/essencial/pdf", HQ: "/jornada/essencial/hq" },
  SENHA_FIXA: "iniciar"
};
window.JORNADA_CFG = JORNADA_CFG;

// ==== STATE (localStorage) ==================================================
const S = {
  load() { try { return JSON.parse(localStorage.getItem(JORNADA_CFG.STORAGE_KEY) || "{}"); } catch(_) { return {}; } },
  save(data) { localStorage.setItem(JORNADA_CFG.STORAGE_KEY, JSON.stringify(data || {})); },
  clear() { localStorage.removeItem(JORNADA_CFG.STORAGE_KEY); }
};

// ==== HELPERS ===============================================================
function el(html){ const d=document.createElement("div"); d.innerHTML=html.trim(); return d.firstElementChild; }
function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1000);
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

// ==== APP FLOW ==============================================================
function onIndex(){}
function onJornadas(){}
function onJornadaEssencial(){
  const root = document.getElementById("app");
  if(!root) return;

  const st = Object.assign({ step:"senha", respostas:{}, idx:0 }, S.load());
  render();

  function render(){
    setStatus(stepLabel(st.step));
    if(st.step==="senha") return renderSenha();
    if(st.step==="intro") return renderIntro();
    if(st.step==="perguntas") return renderPerguntas();
    if(st.step==="final") return renderFinal();
  }

  function stepLabel(step){
    return ({
      senha: "Digite a senha para iniciar",
      intro: "Boas-vindas e instruções",
      perguntas: "Responda às reflexões com calma",
      final: "Parabéns! Você concluiu a jornada"
    })[step] || "";
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
      else{ alert("Senha inválida. Tente novamente."); }
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

  const PERGUNTAS = Array.from({length: 8}).map((_,i)=> ({ id: "q"+(i+1), texto: `Pergunta ${i+1}: escreva sua reflexão com liberdade.` }));

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
          <button class="btn" id="btnIntro">Instruções</button>
          <button class="btn" id="btnLimpar">Apagar respostas</button>
          <button class="btn" id="btnVoltar" ${idx===0?"disabled":""}>Voltar</button>
          <button class="btn primary" id="btnAvancar">${idx===PERGUNTAS.length-1? "Finalizar" : "Avançar"}</button>
        </div>
      </section>
    `);
    const ta = view.querySelector("#resp");
    ta.value = val;
    ta.addEventListener("input", ()=>{ st.respostas[q.id] = ta.value; S.save(st); });
    view.querySelector("#btnIntro").addEventListener("click", ()=>{ st.step="intro"; S.save(st); render(); });
    view.querySelector("#btnLimpar").addEventListener("click", ()=>{
      if(confirm("Tem certeza que deseja apagar TODAS as respostas?")){ st.respostas = {}; st.idx = 0; S.save(st); render(); }
    });
    view.querySelector("#btnVoltar").addEventListener("click", ()=>{ if(idx>0){ st.idx = idx-1; S.save(st); render(); } });
    view.querySelector("#btnAvancar").addEventListener("click", ()=>{
      if(idx < PERGUNTAS.length-1){ st.idx = idx+1; S.save(st); render(); }
      else { st.step="final"; S.save(st); render(); }
    });
    root.appendChild(view);
  }

  function renderFinal(){
    root.innerHTML = "";
    const respostas = st.respostas || {};

    const view = el(`
      <section class="card pergaminho">
        <h2 class="center">Parabéns! Você finalizou a Jornada.</h2>
        <p class="center small">Você pode revisar, baixar o PDF/HQ e retornar ao início.</p>
        <hr>
        <div class="footer-actions">
          <button class="btn" id="btnRevisar">Revisar respostas</button>
          <button class="btn" id="btnPDF">Baixar PDF</button>
          <button class="btn" id="btnHQ">Baixar HQ</button>
          <button class="btn primary" id="btnPrincipal">Concluir</button>
        </div>
      </section>
    `);
    view.querySelector("#btnRevisar").addEventListener("click", ()=>{ st.step="perguntas"; st.idx=0; S.save(st); render(); });
    view.querySelector("#btnPrincipal").addEventListener("click", ()=>{ S.clear(); location.href = "/index.html"; });
    view.querySelector("#btnPDF").addEventListener("click", async ()=>{
      try{ setStatus("Gerando PDF..."); const blob = await tentarGerar("PDF", respostas); downloadBlob(blob, "jornada-essencial.pdf"); setStatus("PDF pronto!"); }
      catch(err){ console.error(err); alert("Falha ao gerar PDF. Ajuste a API_BASE ou tente novamente."); setStatus(""); }
    });
    view.querySelector("#btnHQ").addEventListener("click", async ()=>{
      try{ setStatus("Gerando HQ..."); const blob = await tentarGerar("HQ", respostas); downloadBlob(blob, "jornada-essencial-hq.zip"); setStatus("HQ pronta!"); }
      catch(err){ console.error(err); alert("Falha ao gerar HQ. Ajuste a API_BASE ou tente novamente."); setStatus(""); }
    });
    root.appendChild(view);
  }

  async function tentarGerar(tipo, respostas){
    const ep = (tipo==="PDF") ? JORNADA_CFG.ENDPOINTS.PDF : JORNADA_CFG.ENDPOINTS.HQ;
    const url = JORNADA_CFG.API_BASE ? (JORNADA_CFG.API_BASE + ep) : "";
    const payload = { respostas, meta:{ versao:"1.0", quando:new Date().toISOString() } };
    if(url){ try{ return await postBinary(url, payload); } catch(e){ console.warn("Falhou API, usando fallback local", e); } }
    const content = (tipo==="PDF" ? "PDF de teste — ajuste a API_BASE" : "HQ de teste — ajuste a API_BASE");
    return new Blob([content], { type: "application/octet-stream" });
  }
}

// ==== BOOT ==================================================================
document.addEventListener("DOMContentLoaded", () => {
  const p = location.pathname;
  try {
    if (p.endsWith("/index.html") || p === "/") onIndex();
    else if (p.endsWith("/jornadas.html")) onJornadas();
    else if (p.endsWith("/jornada-conhecimento-com-luz1.html")) onJornadaEssencial();
  } catch (e) {
    console.error("Erro ao iniciar a página:", e);
  }
});
