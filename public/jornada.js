/* jornada.js — VERSÃO ESTÁVEL: 1.1 (revisado)
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
  save(data) { localStorage.setItem(JORNADA_CFG.STORAGE_KEY, JSON.stringify(data || {})); },
  clear() { localStorage.removeItem(JORNADA_CFG.STORAGE_KEY); }
};

// ===== HELPERS ===============================================================
const Root = {
  get(id="app"){ return document.getElementById(id); },
  clear(id="app"){ const el=this.get(id); if(!el) return null; el.innerHTML=""; return el; }
};
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
  const st = Object.assign({ step:"senha", respostas:{}, idx:0 }, S.load());

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
    if(st.step==="senha")      return renderSenha();
    if(st.step==="intro")      return renderIntro();
    if(st.step==="perguntas")  return renderPerguntas();
    if(st.step==="final")      return renderFinal();
  }

  function renderSenha(){
    const root = Root.clear(); if(!root) return;

    const v = el(`
      <section class="card">
        <h2 class="center">Acesso</h2>
        <p class="small center">
          Use a senha para começar (para testes:
          <span class="badge">${JORNADA_CFG.SENHA_FIXA}</span>).
        </p>

        <label for="senha">Senha</label>
        <div class="senha-wrap">
          <input id="senha" class="input" type="password" autocomplete="off" placeholder="Digite a senha">
          <button type="button" class="senha-eye" id="toggleSenha"
                  aria-label="Mostrar/ocultar senha" title="Mostrar/ocultar senha"></button>
        </div>

        <div class="footer-actions">
          <button class="btn primary" id="btnIniciar">Iniciar</button>
        </div>
      </section>
    `);

    // Olho mágico (mostrar/ocultar senha)
    const eyeSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
      <circle cx="12" cy="12" r="3.5"></circle>
    </svg>`;
    const eyeOffSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.64 20.64 0 0 1 5.06-5.94"></path>
      <path d="M1 1l22 22"></path>
      <path d="M14.12 14.12A3.5 3.5 0 0 1 9.88 9.88"></path>
    </svg>`;
    const inputSenha = v.querySelector("#senha");
    const btnEye     = v.querySelector("#toggleSenha");
    let visivel = false;
    function atualizarOlho(){
      if(!inputSenha || !btnEye) return;
      inputSenha.type = visivel ? "text" : "password";
      btnEye.innerHTML = visivel ? eyeOffSVG : eyeSVG;
      btnEye.setAttribute("aria-pressed", visivel ? "true" : "false");
    }
    if(btnEye && inputSenha){
      btnEye.addEventListener("click", ()=>{ visivel = !visivel; atualizarOlho(); inputSenha.focus(); });
      btnEye.addEventListener("keydown", (e)=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); btnEye.click(); }});
      atualizarOlho();
    }

    v.querySelector("#btnIniciar").addEventListener("click", ()=>{
      const x = (v.querySelector("#senha").value||"").trim().toLowerCase();
      if(x === JORNADA_CFG.SENHA_FIXA){ st.step="intro"; S.save(st); render(); }
      else { alert("Senha inválida. Tente novamente."); }
    });

    root.appendChild(v);
  }

  function renderIntro(){
    const root = Root.clear(); if(!root) return;

    const v = el(`
      <section class="card pergaminho">
        <h2 class="center">Bem-vindo(a) à Jornada Essencial</h2>
        <p class="info">Aqui você encontrará 32 reflexões para iluminar sua história, raízes e propósito.
        Responda com sinceridade. Você poderá revisar antes de concluir.</p>
        <div class="footer-actions">
          <button class="btn" id="btnVoltarSenha">Voltar</button>
          <button class="btn primary" id="btnComecar">Começar</button>
        </div>
      </section>
    `);

    v.querySelector("#btnVoltarSenha").addEventListener("click", ()=>{ st.step="senha"; S.save(st); render(); });
    v.querySelector("#btnComecar").addEventListener("click", ()=>{ st.step="perguntas"; st.idx=0; S.save(st); render(); });

    root.appendChild(v);
  }

  // Perguntas placeholder (substitua pela lista oficial quando quiser)
  const PERGUNTAS = Array.from({length: 8}).map((_,i)=> ({
    id: "q"+(i+1),
    texto: `Pergunta ${i+1}: escreva sua reflexão com liberdade.`
  }));
  window.__JORNADA_TOTAL = PERGUNTAS.length;

  function renderPerguntas(){
    const root = Root.clear(); if(!root) return;

    const idx = Math.max(0, Math.min(st.idx||0, PERGUNTAS.length-1));
    const q = PERGUNTAS[idx];
    const val = (st.respostas[q.id]||"");

    const v = el(`
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

    const ta = v.querySelector("#resp");
    ta.value = val;
    ta.addEventListener("input", ()=>{
      st.respostas[q.id] = ta.value;
      S.save(st);
    });

    v.querySelector("#btnIntro").addEventListener("click", ()=>{ st.step="intro"; S.save(st); render(); });
    v.querySelector("#btnLimpar").addEventListener("click", ()=>{
      if(confirm("Tem certeza que deseja apagar TODAS as respostas?")){
        st.respostas = {}; st.idx = 0; S.save(st); render();
      }
    });
    v.querySelector("#btnVoltar").addEventListener("click", ()=>{
      if(idx>0){ st.idx = idx-1; S.save(st); render(); }
    });
    v.querySelector("#btnAvancar").addEventListener("click", ()=>{
      const respAtual = (v.querySelector("#resp").value || "").trim();
      if(!respAtual){
        alert("Por favor, preencha a resposta antes de avançar.");
        return;
      }
      st.respostas[q.id] = respAtual;
      S.save(st);

      if(idx < PERGUNTAS.length-1){ st.idx = idx+1; S.save(st); render(); }
      else { st.step="final"; S.save(st); render(); }
    });

    root.appendChild(v);
  }

  function renderFinal(){
    const root = Root.clear(); if(!root) return;

    const respostas = st.respostas || {};

    const v = el(`
      <section class="card pergaminho">
        <h2 class="center">Parabéns! Você finalizou a Jornada.</h2>
        <p class="center small">Você pode revisar, baixar o PDF/HQ e retornar ao início.</p>
        <hr>
        <div class="footer-actions">
          <button class="btn" id="btnRevisar">Revisar respostas</button>
          <button class="btn" id="btnPDF">Baixar PDF</button>
          <button class="btn" id="btnHQ">Baixar HQ (teste)</button>
          <button class="btn primary" id="btnPrincipal">Concluir</button>
        </div>
      </section>
    `);

    v.querySelector("#btnRevisar").addEventListener("click", ()=>{ st.step="perguntas"; st.idx=0; S.save(st); render(); });
    v.querySelector("#btnPrincipal").addEventListener("click", ()=>{ S.clear(); location.href = "/index.html"; });

    v.querySelector("#btnPDF").addEventListener("click", async ()=>{
      try{
        setStatus("Gerando PDF...");
        const r = await tentarGerar("PDF", respostas);
        if(r.kind==="blob") downloadBlob(r.blob, r.name || "jornada-essencial.pdf");
        else setStatus("Janela de impressão aberta. Use 'Salvar como PDF'.");
        setStatus("PDF pronto!");
      }catch(err){
        console.error(err); alert("Falha ao gerar PDF."); setStatus("");
      }
    });

    v.querySelector("#btnHQ").addEventListener("click", async ()=>{
      try{
        setStatus("Gerando HQ...");
        const r = await tentarGerar("HQ", respostas);
        if(r.kind==="blob") downloadBlob(r.blob, r.name || "jornada-essencial-hq.txt");
        setStatus("HQ pronta!");
      }catch(err){
        console.error(err); alert("Falha ao gerar HQ."); setStatus("");
      }
    });

    root.appendChild(v);
  }

  // ===== GERADOR (API ou FALLBACK) ==========================================
  async function tentarGerar(tipo, respostas){
    const payload = { respostas, meta:{ versao:"1.1", quando:new Date().toISOString() } };

    if(!!JORNADA_CFG.API_BASE){
      try{
        const ep = (tipo==="PDF") ? JORNADA_CFG.ENDPOINTS.PDF : JORNADA_CFG.ENDPOINTS.HQ;
        const blob = await postBinary(JORNADA_CFG.API_BASE + ep, payload);
        return { kind:"blob", blob, name: (tipo==="PDF" ? "jornada-essencial.pdf" : "jornada-essencial-hq.zip") };
      }catch(e){
        console.warn("Falhou API, usando fallback local", e);
        const msg = String(e?.message || "");
        if (/CORS|Failed to fetch|preflight/i.test(msg)) {
          alert("Erro de CORS: libere o acesso para " + location.origin + " no backend (ou deixe API_BASE vazio para usar modo offline).");
        } else {
          alert("Falha ao gerar " + tipo + ". Tente novamente.");
        }
        // segue para fallback
      }
    }

    // === FALLBACK 100% FRONTEND ===
    if (tipo === "PDF") {
      const w = window.open("", "_blank");
      const respostasHtml = Object.entries(respostas||{}).map(([k,v],i)=>
        `<h3>${i+1}. ${escapeHtml(k)}</h3><p>${escapeHtml(v)}</p>`
      ).join("");

      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Jornada Essencial — PDF</title>
        <style>
          body{font-family:Arial,system-ui;margin:40px;line-height:1.5}
          h1{font-size:22px;margin:0 0 12px}
          h3{font-size:16px;margin:16px 0 6px}
          p{margin:0 0 8px;white-space:pre-wrap}
        </style>
      </head><body>
        <h1>Jornada Essencial — PDF (teste)</h1>
        <div>${respostasHtml || "<p><em>Sem respostas preenchidas.</em></p>"}</div>
      </body></html>`;

      w.document.open(); w.document.write(html); w.document.close();
      w.focus(); setTimeout(()=> w.print(), 400);
      return { kind:"printed" };
    } else {
      const txt = new Blob(["HQ (teste): gere via API quando habilitar CORS."], { type:"text/plain" });
      return { kind:"blob", blob: txt, name: "jornada-essencial-hq.txt" };
    }
  }

  // chama o primeiro render no fim
  render();
}

// ===== BOOT =================================================================
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
