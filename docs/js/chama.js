// Chama mais "viva": oscila escala, leve subida/rotação — sem mexer em estrutura/UX
(function(){
  const flames = document.querySelectorAll('.chama-grande, .chama-pequena');
  flames.forEach((el, i)=>{
    let t = Math.random()*200;
    // grande mais estável, pequena mais “nervosa”
    const base = i===0 ? 1.06 : 1.00;
    const ampS = i===0 ? 0.065 : 0.085;   // amplitude escala
    const ampY = i===0 ? 1.8   : 1.4;     // deslocamento Y (px)
    const ampR = i===0 ? 1.2   : 1.6;     // rotação (graus)

    (function loop(){
      t += 0.035 + Math.random()*0.01;
      const s   = base + Math.sin(t)*ampS + (Math.random()*0.02 - 0.01);
      const y   = Math.sin(t*1.25)*ampY;
      const rot = Math.sin(t*0.9)*ampR;

      el.style.setProperty('--scale', s.toFixed(3));
      el.style.setProperty('--y',     y.toFixed(2) + 'px');
      el.style.setProperty('--rot',   rot.toFixed(2) + 'deg');

      requestAnimationFrame(loop);
    })();
  });
})();
