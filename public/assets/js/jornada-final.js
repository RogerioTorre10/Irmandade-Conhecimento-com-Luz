document.addEventListener('sectionLoaded', (e) => {
  if (e.detail.sectionId === 'section-final') {
    const btnRevisar = document.getElementById('btnRevisar');
    const btnLimpar = document.getElementById('btnLimparRespostas');
    const btnPDF = document.getElementById('btnBaixarPDFHQ');
    const btnReiniciar = document.getElementById('btnReiniciar');

    btnRevisar?.addEventListener('click', () => {
      window.JC?.goNext('section-perguntas');
    });

    btnLimpar?.addEventListener('click', () => {
      localStorage.removeItem('jornada_respostas');
      window.toast?.('Respostas apagadas!');
    });

    btnPDF?.addEventListener('click', () => {
      window.toast?.('Função de exportação ainda em desenvolvimento.');
    });

    btnReiniciar?.addEventListener('click', () => {
      window.location.href = '/index.html';
    });
  }
});
