<script>
(function() {
  const VIDEO_BASE = '/assets/img/';
  window.JORNADA_VIDEOS = {
    intro: VIDEO_BASE + 'filme-0-ao-encontro-da-jornada.mp4',
    afterBlocks: {
      0: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4',
      1: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4',
      2: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4',
      3: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4'
    },
    final: VIDEO_BASE + 'filme-5-fim-da-jornada.mp4'
  };
  window.JORNADA_FINAL_VIDEO = window.JORNADA_VIDEOS.final;

  const blockTranslations = {
    'pt-BR': [
      { title: 'Bloco 1 — Raízes', questions: [{ label: 'Quem é você hoje?' }, { label: 'O que te trouxe até esta jornada?' }, { label: 'Qual é o seu maior sonho espiritual?' }], video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4' },
      { title: 'Bloco 2 — Reflexões', questions: [{ label: 'Quais são seus maiores desafios atuais?' }, { label: 'Como você lida com o medo ou a dúvida?' }, { label: 'O que a "luz" significa para você?' }], video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4' },
      { title: 'Bloco 3 — Crescimento', questions: [{ label: 'O que você quer mudar na sua vida?' }, { label: 'Quem inspira você e por quê?' }, { label: 'Como você pratica gratidão no dia a dia?' }], video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4' },
      { title: 'Bloco 4 — Integração', questions: [{ label: 'Qual lição você leva dessa jornada?' }, { label: 'Como vai aplicar isso no futuro?' }, { label: 'Uma mensagem para seu eu futuro.' }], video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4' }
    ],
    'en-US': [
      { title: 'Block 1 — Roots', questions: [{ label: 'Who are you today?' }, { label: 'What brought you to this journey?' }, { label: 'What is your greatest spiritual dream?' }], video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4' },
      { title: 'Block 2 — Reflections', questions: [{ label: 'What are your biggest current challenges?' }, { label: 'How do you deal with fear or doubt?' }, { label: 'What does "light" mean to you?' }], video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4' },
      { title: 'Block 3 — Growth', questions: [{ label: 'What do you want to change in your life?' }, { label: 'Who inspires you and why?' }, { label: 'How do you practice gratitude in your daily life?' }], video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4' },
      { title: 'Block 4 — Integration', questions: [{ label: 'What lesson do you take from this journey?' }, { label: 'How will you apply this in the future?' }, { label: 'A message to your future self.' }], video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4' }
    ],
    'es-ES': [
      { title: 'Bloque 1 — Raíces', questions: [{ label: '¿Quién eres hoy?' }, { label: '¿Qué te trajo a este viaje?' }, { label: '¿Cuál es tu mayor sueño espiritual?' }], video_after: VIDEO_BASE + 'filme-1-entrando-na-jornada.mp4' },
      { title: 'Bloque 2 — Reflexiones', questions: [{ label: '¿Cuáles son tus mayores desafíos actuales?' }, { label: '¿Cómo lidias con el miedo o la duda?' }, { label: '¿Qué significa la "luz" para ti?' }], video_after: VIDEO_BASE + 'filme-2-dentro-da-jornada.mp4' },
      { title: 'Bloque 3 — Crecimiento', questions: [{ label: '¿Qué quieres cambiar en tu vida?' }, { label: '¿Quién te inspira y por qué?' }, { label: '¿Cómo practicas la gratitud en el día a dia?' }], video_after: VIDEO_BASE + 'filme-3-traumas-na-jornada.mp4' },
      { title: 'Bloque 4 — Integración', questions: [{ label: '¿Qué lección te llevas de este viaje?' }, { label: '¿Cómo lo aplicarás en el futuro?' }, { label: 'Un mensaje para tu yo futuro.' }], video_after: VIDEO_BASE + 'filme-4-aproximando-do-final.mp4' }
    ]
  };

  function updateBlocks() {
    const currentLang = document.getElementById('language-select')?.value || 'pt-BR';
    window.JORNADA_BLOCKS = blockTranslations[currentLang] || blockTranslations['pt-BR'];
    console.log('[loadDynamicBlocks] Blocos atualizados para idioma:', currentLang);
  }

  window.loadDynamicBlocks = function() {
    updateBlocks();
    const content = document.getElementById('perguntas-container');
    if (!content) {
      console.error('[loadDynamicBlocks] Container de perguntas não encontrado');
      window.toast && window.toast('Erro ao carregar perguntas.');
      return;
    }

    const blocks = window.JORNADA_BLOCKS || [];
    if (!blocks.length) {
      console.error('[loadDynamicBlocks] JORNADA_BLOCKS não definido ou vazio');
      window.toast && window.toast('Nenhum bloco de perguntas encontrado.');
      return;
    }

    content.innerHTML = '';
    content.classList.remove('hidden');
    blocks.forEach((block, bIdx) => {
      const bloco = document.createElement('div');
      bloco.className = 'j-bloco';
      bloco.dataset.bloco = bIdx;
      bloco.dataset.video = block.video_after || '';
      bloco.style.display = bIdx === 0 ? 'block' : 'none';

      if (block.title) {
        const title = document.createElement('h3');
        title.className = 'pergunta-enunciado text';
        title.dataset.typing = 'true';
        title.dataset.text = block.title;
        title.dataset.speed = '36';
        title.dataset.cursor = 'true';
        bloco.appendChild(title);
      }

      (block.questions || []).forEach((q, qIdx) => {
        const label = typeof q === 'string' ? q : (q.label || q.text || '');
        const div = document.createElement('div');
        div.className = 'j-pergunta';
        div.dataset.pergunta = qIdx;
        div.style.display = bIdx === 0 && qIdx === 0 ? 'block' : 'none';

        div.innerHTML = `
          <label class="pergunta-enunciado text" 
                 data-typing="true" 
                 data-text="Pergunta ${qIdx + 1}: ${label}" 
                 data-speed="36" 
                 data-cursor="true"></label>
          <textarea rows="4" class="input" placeholder="Digite sua resposta..."></textarea>
          <div class="accessibility-controls">
            <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
            <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
            <button class="btn btn-avancar" data-action="avancar">Avançar</button>
          </div>
        `;
        bloco.appendChild(div);
      });

      content.appendChild(bloco);
    });

    const firstBloco = content.querySelector('.j-bloco');
    if (firstBloco) {
      firstBloco.style.display = 'block';
      window.JC.currentBloco = 0;
      window.JC.currentPergunta = 0;
      const firstPergunta = firstBloco.querySelector('.j-pergunta');
      if (firstPergunta) {
        firstPergunta.style.display = 'block';
        firstPergunta.classList.add('active');
        setTimeout(() => {
          console.log('[loadDynamicBlocks] Iniciando runTyping para primeira pergunta');
          window.runTyping && window.runTyping(firstPergunta);
        }, 100);
      } else {
        console.error('[loadDynamicBlocks] Nenhuma pergunta encontrada no primeiro bloco');
      }
    } else {
      console.error('[loadDynamicBlocks] Nenhum bloco criado');
      window.toast && window.toast('Erro ao criar blocos de perguntas.');
    }

    if (window.loadAnswers) window.loadAnswers();
    const firstTa = document.querySelector('.j-bloco .j-pergunta textarea');
    if (firstTa && window.handleInput) window.handleInput(firstTa);
    console.log('[loadDynamicBlocks] Blocos carregados com sucesso');
    console.log('[loadDynamicBlocks] DOM do perguntas-container:', document.getElementById('perguntas-container').outerHTML);
  };

  document.addEventListener('change', (e) => {
    if (e.target.id === 'language-select') {
      updateBlocks();
      window.loadDynamicBlocks();
      console.log('[loadDynamicBlocks] Idioma alterado, blocos recarregados');
    }
  });

  console.log('[loadDynamicBlocks] Bloco carregado');
})();
</script>
