/* jornada-bootstrap.js — com fallback e logs */
(function () {
  function ready(fn){ document.readyState==='loading' ? document.addEventListener('DOMContentLoaded',fn) : fn(); }
  ready(() => {
    const params   = new URLSearchParams(location.search);
    const layout   = params.get("layout")  || document.body.dataset.layout  || "master";
    const journey  = params.get("journey") || document.body.dataset.journey || "essencial";
    const autostart = params.get("autostart")==="1";

    const JRmap = window.JRENDER || {};
    window.JR = JRmap[layout] || JRmap.master;
    console.log("[BOOT] layout=", layout, "JR?", !!window.JR);

    const HUB = window.JHUB || {};
    let Journey = null;
    try { if (typeof HUB.get === "function") Journey = HUB.get(journey); }
    catch(e){ console.warn("[BOOT] HUB.get indisponível", e); }
    console.log("[BOOT] journey=", journey, "Journey?", !!Journey);

    const btn = document.getElementById("btnComecar");
    if (btn) btn.addEventListener("click", (e)=>{ e.preventDefault(); console.log("[BOOT] btnComecar -> iniciar");
      (Journey?.renderIntro || JR?.renderIntro || (()=>console.warn("Sem renderIntro")))();
    });

    const goHash=()=>{
      switch(location.hash){
        case "#intro":     (Journey?.renderIntro     || JR?.renderIntro    )?.(); break;
        case "#perguntas": (Journey?.renderPerguntas || JR?.renderPerguntas)?.(); break;
        case "#final":     (Journey?.renderFinal     || JR?.renderFinal    )?.(); break;
        default: if (autostart) (Journey?.renderIntro || JR?.renderIntro)?.();
      }
    };
    window.addEventListener("hashchange", goHash);
    goHash();

    console.log("[BOOT] pronto");
  });
})();
