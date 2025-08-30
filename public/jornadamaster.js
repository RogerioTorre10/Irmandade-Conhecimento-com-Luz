/* /public/jornadamaster.js
   Hub “mãe”: registra layouts e jornadas baseadas em HTML
   – Layouts: master, plus, junior
   – Jornadas: essencial, olhomagico, barracontador
   – Usa <body data-layout="..."> e <body data-journey="...">
   – Pode sobrepor via query: ?layout=plus&journey=olhomagico
*/
(function (root) {
  "use strict";

  // ========= Utils leves =========
  const JU = root.JU = root.JU || {
    qs:  (s,r=document)=>r.querySelector(s),
    qsa: (s,r=document)=>Array.from(r.querySelectorAll(s)),
    showSection(id){
      this.qsa('section.card').forEach(sec=>{
        if(sec.id===id) sec.classList.remove('hidden');
        else sec.classList.add('hidden');
      });
    },
    err(msg,err){ console.error(`[JORNADA] ${msg}`, err||''); },
    log(...a){ console.log('[JORNADA]', ...a); }
  };

  // ========= Loader de HTML (injeta no #app sem quebrar SPA) =========
  async function loadHtmlIntoApp(file, sectionId, extraClass="") {
    const app = JU.qs('#app') || JU.qs('main') || document.body;
    try {
      const res = await fetch(`/html/${file}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();

      // Oculta outras sections e injeta nova
      JU.qsa('section.card', app).forEach(s=>s.classList.add('hidden'));
      const sec = document.createElement('section');
      sec.id = sectionId;
      sec.className = `card ${extraClass}`.trim();
      sec.innerHTML = html;
      app.appendChild(sec);
      return sec;
    } catch (e) {
      JU.err(`Falha ao carregar /html/${file}`, e);
      alert(`Não foi possível carregar o conteúdo (${file}).`);
      return null;
    }
  }

  // ========= HUB =========
  const HUB = root.JHUB = root.JHUB || { layouts:{}, journeys:{} };

  HUB.registerLayout  = (name, api)=>{ HUB.layouts[name]  = api || {}; };
  HUB.registerJourney = (name, api)=>{ HUB.journeys[name] = api || {}; };

  HUB.getActive = ()=>{
    const q = new URLSearchParams(location.search);
    const body = document.body;
    // Permite sobrepor data-* por querystring
    const layout  = (q.get('layout')  || body.dataset.layout  || 'master').trim();
    const journey = (q.get('journey') || body.dataset.journey || 'essencial').trim();
    return { layout, journey, L: HUB.layouts[layout], J: HUB.journeys[journey] };
  };

  // ========= Jornadas comuns (helpers) =========
  async function commonRenderIntro() {
    if (location.hash !== '#intro') history.replaceState(null,'','#intro');
    await loadHtmlIntoApp('intro.html', 'intro', 'pergaminho pergaminho-v');
  }
  async function commonRenderPerguntas(htmlFile) {
    if (location.hash !== '#perguntas') history.replaceState(null,'','#perguntas');
    await loadHtmlIntoApp(htmlFile, 'perguntas', 'pergaminho pergaminho-h');
  }
  async function commonRenderFinal() {
    if (location.hash !== '#final') history.replaceState(null,'','#final');
    await loadHtmlIntoApp('final.html', 'final', 'pergaminho pergaminho-v');
  }

  // ========= Registros de LAYOUTS =========
  HUB.registerLayout('master', {
    init(){ JU.log('[Layout] master init'); },
    mountShell(){ /* opcional: decorar #app, cabeçalho/rodapé */ }
  });
  HUB.registerLayout('plus', {
    init(){ JU.log('[Layout] plus init'); },
    mountShell(){ /* opcional */ }
  });
  HUB.registerLayout('junior', {
    init(){ JU.log('[Layout] junior init'); },
    mountShell(){ /* opcional */ }
  });

  // ========= Registros de JORNADAS =========
  // Essencial (padrão)
  HUB.registerJourney('essencial', {
    init(){ JU.log('[Jornada] essencial init'); },
    async renderIntro(){ await commonRenderIntro(); },
    async renderPerguntas(){ await commonRenderPerguntas('jornadas.html'); },
    async renderFinal(){ await commonRenderFinal(); }
  });

  // Olho Mágico (diagnóstico/medição)
  HUB.registerJourney('olhomagico', {
    init(){ JU.log('[Jornada] olhomagico init (diagnóstico ON)'); },
    async renderIntro(){ await commonRenderIntro(); },
    async renderPerguntas(){
      // se não tiver um HTML específico ainda, usa o padrão
      const file = 'jornadas_olhomagico.html';
      const res = await fetch(`/html/${file}`, { method:'HEAD' });
      await commonRenderPerguntas(res.ok ? file : 'jornadas.html');
      // Exemplo: logar métricas de tempo
      setTimeout(()=>JU.log('OlhoMágico: intro→perguntas carregado'),0);
    },
    async renderFinal(){ await commonRenderFinal(); }
  });

  // Barra Contador (progresso/steps)
  HUB.registerJourney('barracontador', {
    init(){ JU.log('[Jornada] barracontador init (progresso ON)'); },
    async renderIntro(){ await commonRenderIntro(); },
    async renderPerguntas(){
      const file = 'jornadas_barracontador.html';
      const res = await fetch(`/html/${file}`, { method:'HEAD' });
      await commonRenderPerguntas(res.ok ? file : 'jornadas.html');
      // Hook simples de progresso (exemplo)
      const bar = JU.qs('#progressBar');
      if (bar) bar.style.width = '3%';
    },
    async renderFinal(){ await commonRenderFinal(); }
  });

})(window);
