// docs/js/ui.js
(function () {
  // Seletores simples
  function qs(sel, root = document)  { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  // Mostra uma section e esconde as outras (usa classe 'hidden')
  function showSection(id) {
    qsa('section.card').forEach(sec => {
      if (sec.id === id) sec.classList.remove('hidden');
      else sec.classList.add('hidden');
    });
  }

  // Barra de progresso (usa #progressBar)
  function setProgress(percent) {
    const bar = qs('#progressBar');
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  // Atualiza UI da pergunta atual (título e etapa)
  function setPergunta(index, total, perguntas) {
    // index: 0-based. total: inteiro. perguntas: array de strings/objetos
    const titulo = qs('#perguntaTitulo');
    const etapaNum = qs('#etapaNum');
    const etapaTot = qs('#etapaTot');

    if (etapaTot) etapaTot.textContent = String(total || (perguntas?.length || 0));
    if (etapaNum) etapaNum.textContent = String((index ?? 0) + 1);

    if (titulo) {
      if (Array.isArray(perguntas)) {
        const item = perguntas[index] ?? '';
        const texto = typeof item === 'string' ? item : (item?.titulo || item?.texto || '');
        titulo.textContent = texto || 'Pergunta';
      } else {
        titulo.textContent = 'Pergunta';
      }
    }
  }

  window.UI = { qs, qsa, showSection, setProgress, setPergunta };
})();
