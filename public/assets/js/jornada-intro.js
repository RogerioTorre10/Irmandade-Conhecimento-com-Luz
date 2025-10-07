document.addEventListener('sectionLoaded', (e) => {
  if (e.detail.sectionId === 'section-intro') {
    console.log('[jornada-intro.js] Ativando intro');

    const el1 = document.getElementById('intro-p1');
    const el2 = document.getElementById('intro-p2');
    const btn = document.getElementById('btn-avancar');

    if (el1 && el2 && btn) {
      btn.classList.add('hidd');
      window.runTyping?.(el1, el1.dataset.text, () => {
        window.runTyping?.(el2, el2.dataset.text, () => {
          btn.classList.remove('hidd');
        });
      });

      btn.addEventListener('click', () => {
        window.JC?.goNext('section-termos');
      });
    }
  }
}, 300);
