/* /assets/js/journey.js */
;(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const iniciarBtn   = document.getElementById('iniciarBtn');
    const senhaInput   = document.getElementById('senha');
    const mensagemDiv  = document.getElementById('mensagem');
    const formularioDiv= document.getElementById('formulario');

    // Se a página não tiver esses elementos, sai sem erro
    if (!iniciarBtn || !senhaInput || !mensagemDiv || !formularioDiv) return;

    // Descobre a base da API (usa config.local.js se estiver em dev)
    const API =
      window.API_URL ||
      window.API_BASE ||
      (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
      (window.JORNADA_CFG && window.JORNADA_CFG.API_BASE) ||
      'https://conhecimento-com-luz-api.onrender.com';

    // Endpoints (podem vir do config.local.js / config.js)
    const TOKEN_EP = window.TOKEN_VALIDATION_ENDPOINT || '/validate-token';
    const START_EP = window.JOURNEY_START_ENDPOINT    || '/start-journey';

    function setBusy(busy) {
      iniciarBtn.disabled = !!busy;
      iniciarBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
    }

    function setMsg(texto) {
      mensagemDiv.textContent = texto || '';
    }

    async function validarToken(token) {
      const res = await fetch(API + TOKEN_EP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Senha inválida.');
      return data;
    }

    async function iniciarJornada() {
      const res = await fetch(API + START_EP, { method: 'GET' });
      if (!res.ok) {
        const tx = await res.text().catch(() => '');
        throw new Error(tx || 'Erro ao carregar a jornada.');
      }
      const html = await res.text();
      formularioDiv.innerHTML = html;
      setMsg('');
    }

    async function onStart() {
      const senha = (senhaInput.value || '').trim();
      if (!senha) {
        setMsg('Por favor, digite a senha de acesso.');
        senhaInput.focus();
        return;
      }

      setBusy(true);
      try {
        setMsg('Validando senha...');
        await validarToken(senha);
        setMsg('Senha válida! Iniciando a jornada...');
        await iniciarJornada();
      } catch (err) {
        setMsg(err.message || 'Erro ao validar senha. Tente novamente.');
        console.error('[journey] erro:', err);
      } finally {
        setBusy(false);
      }
    }

    iniciarBtn.addEventListener('click', onStart);
    senhaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') onStart();
    });
  });
})();
