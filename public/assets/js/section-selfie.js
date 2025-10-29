/* /assets/js/section-selfie.js — FASE 3.3
   - Garante render de controles e botões mesmo com TTS ativo
   - Ordem fixa e compacta (Header → Texto → Controles → Botões → Prévia)
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase33_bound) return;
  NS.__phase33_bound = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------- Nome ----------
  function getUpperName() {
    const jc = (global.JC && global.JC.data) ? global.JC.data : {};
    let name = jc.nome || jc.participantName;
    if (!name) {
      try {
        const ls = localStorage.getItem('jc.nome') || localStorage.getItem('jc.participantName');
        if (ls) name = ls;
      } catch {}
    }
    if (!name || typeof name !== 'string') name = 'AMOR';
    const upper = name.toUpperCase().trim();
    try {
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
      global.JC.data.nome = upper; global.JC.data.participantName = upper;
      try { localStorage.setItem('jc.nome', upper); } catch {}
    } catch {}
    return upper;
  }

  // ---------- Utils ----------
  const waitForElement = (sel, opt={}) => new Promise((res,rej)=>{
    let t=0; const i=setInterval(()=>{
      const e=document.querySelector(sel);
      if(e){clearInterval(i);res(e);}else if(++t>60){clearInterval(i);rej();}
    }, opt.interval||100);
  });
  const placeAfter=(ref,node)=>{if(!ref||!ref.parentElement)return;
    ref.nextSibling?ref.parentElement.insertBefore(node,ref.nextSibling):ref.parentElement.appendChild(node);
  };
  const toast=msg=>{ if(global.toast) return global.toast(msg); console.log('[Toast]',msg); alert(msg); };

  // ---------- Typing + TTS ----------
  async function runTyping(el){
    if(!el)return;
    const txt=(el.dataset.text||el.textContent||'').trim();
    const spd=+el.dataset.speed||28;
    el.textContent=''; let i=0;
    const chars=[...txt];
    const interval=setInterval(()=>{el.textContent+=chars[i++];if(i>=chars.length)clearInterval(interval);},spd);
  }

  // ---------- Header ----------
  function ensureHeader(section){
    let head=section.querySelector('.selfie-header');
    if(!head){
      head=document.createElement('header');
      head.className='selfie-header';
      head.style.cssText='display:flex;align-items:center;justify-content:space-between;margin:-6px 0 4px;';
      head.innerHTML=`<h2 data-text="Tirar sua Foto ✨" data-typing="true" data-speed="40">Tirar sua Foto ✨</h2>
      <button id="btn-skip-selfie" class="btn btn-stone-espinhos">Não quero foto / Iniciar</button>`;
      head.querySelector('#btn-skip-selfie').onclick=()=>onSkip();
      section.prepend(head);
    }
    return head;
  }

  // ---------- Texto orientação ----------
  function ensureTexto(section){
    const upper=getUpperName();
    let wrap=section.querySelector('#selfieOrientWrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='selfieOrientWrap';
      wrap.style.cssText='display:flex;justify-content:center;margin:6px 0 8px;';
      section.appendChild(wrap);
    }
    let p=section.querySelector('#selfieTexto');
    if(!p){
      p=document.createElement('p');
      p.id='selfieTexto';
      p.style.cssText='background:rgba(0,0,0,.35);color:#f9e7c2;padding:10px 14px;border-radius:12px;text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto;width:92%;max-width:820px;';
      p.dataset.text=`${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
      wrap.appendChild(p);
    }
    return p;
  }

  // ---------- Controles ----------
  function ensureControls(section){
    if(section.querySelector('#selfieControls'))return;
    const style=document.createElement('style');
    style.textContent=`
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);
      border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;
      font-family:Cardo,serif;font-size:14px}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px}
    `;
    document.head.appendChild(style);

    const c=document.createElement('div');
    c.id='selfieControls';
    c.innerHTML=`
      <div class="row"><label>Zoom Geral</label><input id="zoomAll" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomAllVal">1.00×</span></div>
      <div class="row"><label>Zoom Horizontal</label><input id="zoomX" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomXVal">1.00×</span></div>
      <div class="row"><label>Zoom Vertical</label><input id="zoomY" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomYVal">1.00×</span></div>`;
    section.appendChild(c);

    const upd=()=>{const a=+zoomAll.value,x=+zoomX.value,y=+zoomY.value;
      zoomAllVal.textContent=a.toFixed(2)+'×';zoomXVal.textContent=x.toFixed(2)+'×';zoomYVal.textContent=y.toFixed(2)+'×';
    };
    zoomAll.oninput=upd;zoomX.oninput=upd;zoomY.oninput=upd;
  }

  // ---------- Botões ----------
  function ensureButtons(section){
    if(section.querySelector('#selfieButtons'))return;
    const css=document.createElement('style');
    css.textContent=`
      #selfieButtons{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
      gap:8px;margin:8px auto;width:92%;max-width:820px}
      #selfieButtons .btn{height:36px;line-height:36px;padding:0 10px;font-size:14px;border-radius:10px;
      box-shadow:0 2px 8px rgba(0,0,0,.25)}
    `;
    document.head.appendChild(css);
    const div=document.createElement('div');
    div.id='selfieButtons';
    div.innerHTML=`
      <button id="btn-prev" class="btn btn-stone-espinhos">Prévia</button>
      <button id="btn-retake" class="btn btn-stone-espinhos" disabled>Tirar outra</button>
      <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Confirmar / Iniciar</button>`;
    section.appendChild(div);
  }

  function onSkip(){
    if(global.JC?.show) global.JC.show('section-card');
    else if(global.showSection) global.showSection('section-card');
  }

  // ---------- Ordem ----------
  function enforceOrder(section){
    const head=section.querySelector('.selfie-header');
    const txt=section.querySelector('#selfieOrientWrap');
    const ctr=section.querySelector('#selfieControls');
    const btn=section.querySelector('#selfieButtons');
    if(head && txt && txt.previousElementSibling!==head){txt.remove();placeAfter(head,txt);}
    if(txt && ctr && ctr.previousElementSibling!==txt){ctr.remove();placeAfter(txt,ctr);}
    if(ctr && btn && btn.previousElementSibling!==ctr){btn.remove();placeAfter(ctr,btn);}
  }

  // ---------- Init ----------
  async function play(section){
    ensureHeader(section);
    const p=ensureTexto(section);
    runTyping(p);
    await sleep(300); // deixa o texto começar antes de carregar o resto
    ensureControls(section);
    ensureButtons(section);
    enforceOrder(section);
  }

  async function init(){
    const s=await waitForElement('#section-selfie');
    play(s);
  }
  document.addEventListener('sectionLoaded',e=>{
    if(e?.detail?.sectionId==='section-selfie') init();
  });
  if(document.readyState!=='loading')init();
  else document.addEventListener('DOMContentLoaded',init);

})(window);
