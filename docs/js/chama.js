// Anima a chama ajustando apenas a variável CSS --scale (não encosta em transform)
(function(){
  const big = document.querySelectorAll('.chama-grande');
  const small = document.querySelectorAll('.chama-pequena');

  function wobble(nodeList, base=1, amp=0.03, speed=0.04){
    nodeList.forEach(el=>{
      let t = 0;
      (function loop(){
        t += speed;
        const s = base + Math.sin(t)*amp + (Math.random()*0.01);
        el.style.setProperty('--scale', s.toFixed(3));
        requestAnimationFrame(loop);
      })();
    });
  }

  wobble(big,   1.00, 0.03, 0.04);
  wobble(small, 1.00, 0.05, 0.05);
})();
