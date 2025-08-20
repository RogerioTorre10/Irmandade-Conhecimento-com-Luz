// Anima apenas variáveis CSS (não mexe em transform direto)
(function(){
  const flames = document.querySelectorAll('.chama-grande, .chama-pequena');
  flames.forEach((el, i)=>{
    let t = Math.random()*200;
    const base = 1.04;                    // base maior
    const ampS = i===0 ? 0.055 : 0.075;   // pulso de escala
    const ampY = i===0 ? 1.6   : 1.3;     // sobe/desce
    const ampR = i===0 ? 0.6   : 1.0;     // rotação bem leve

    (function loop(){
      t += 0.032 + Math.random()*0.008;
      const s   = base + Math.sin(t)*ampS + (Math.random()*0.015 - 0.007);
      const y   = Math.sin(t*1.18)*ampY;
      const rot = Math.sin(t*0.85)*ampR;

      el.style.setProperty('--scale', s.toFixed(3));
      el.style.setProperty('--y',     y.toFixed(2) + 'px');
      el.style.setProperty('--rot',   rot.toFixed(2) + 'deg');
      requestAnimationFrame(loop);
    })();
  });
})();
