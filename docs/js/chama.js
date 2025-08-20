// CSS já anima; aqui só damos uma micro-osc ilação para parecer mais viva
(function(){
  const big = document.querySelector('.chama-grande');
  const small = document.querySelector('.chama-pequena');

  function wobble(el, base=1, amp=0.02){
    if(!el) return;
    let t=0;
    (function loop(){
      t+=0.04;
      const s = base + Math.sin(t)*amp + (Math.random()*0.01);
      el.style.transform = `translateY(0) scale(${s.toFixed(3)})`;
      requestAnimationFrame(loop);
    })();
  }
  wobble(big, 1.0, 0.03);
  wobble(small, 1.0, 0.05);
})();

