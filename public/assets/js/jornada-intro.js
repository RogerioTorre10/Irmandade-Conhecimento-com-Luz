 setTimeout(() => {
  const el1 = document.getElementById('intro-p1');
  const el2 = document.getElementById('intro-p2');
  const btn = document.getElementById('btn-avancar');

  if (el1 && el2 && btn) {
    btn.classList.add('hidd'); // esconde o botão

    window.runTyping?.(el1, el1.dataset.text, () => {
      window.runTyping?.(el2, el2.dataset.text, () => {
        btn.classList.remove('hidd'); // exibe o botão após o segundo texto
      });
    });

    document.getElementById('btn-avancar')?.addEventListener('click', () => {
      window.JC?.goNext('section-senha');
    });
  }
  });

