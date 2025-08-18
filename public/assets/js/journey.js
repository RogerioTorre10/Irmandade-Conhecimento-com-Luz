// journey.js
document.addEventListener("DOMContentLoaded", () => {
  const iniciarBtn = document.getElementById("iniciarBtn");
  const senhaInput = document.getElementById("senha");
  const mensagemDiv = document.getElementById("mensagem");
  const formularioDiv = document.getElementById("formulario");
// Fallbacks de API e guarda de elementos
const API = (typeof API_URL !== 'undefined' && API_URL) || window.JORNADA_API_BASE || window.API_BASE || 'https://conhecimento-com-luz-api.onrender.com';
const TOKEN_EP = (typeof TOKEN_VALIDATION_ENDPOINT !== 'undefined' && TOKEN_VALIDATION_ENDPOINT) || '/validate-token';
const START_EP = (typeof JOURNEY_START_ENDPOINT !== 'undefined' && JOURNEY_START_ENDPOINT) || '/start-journey';
if (!iniciarBtn || !senhaInput || !mensagemDiv || !formularioDiv) return; // nada a fazer nesta página

  iniciarBtn.addEventListener("click", async () => {
    const senha = senhaInput.value.trim();

    if (!senha) {
      mensagemDiv.textContent = "Por favor, digite a senha de acesso.";
      return;
      const response = await fetch(`${API}${TOKEN_EP}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token: senha })
});


    try {
      mensagemDiv.textContent = "Validando senha...";
      const response = await fetch(`${API_URL}${TOKEN_VALIDATION_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: senha })
      });

      const data = await response.json();

      if (!response.ok) {
        mensagemDiv.textContent = data.message || "Senha inválida.";
        return;
      }

      mensagemDiv.textContent = "Senha válida! Iniciando a jornada...";
      await iniciarJornada();
    } catch (error) {
      mensagemDiv.textContent = "Erro ao validar senha. Tente novamente.";
      console.error(error);
     const response = await fetch(`${API}${START_EP}`);   
    }
  });

  async function iniciarJornada() {
    try {
      const response = await fetch(`${API_URL}${JOURNEY_START_ENDPOINT}`);
      const formHtml = await response.text();
      formularioDiv.innerHTML = formHtml;
      mensagemDiv.textContent = "";
    } catch (error) {
      mensagemDiv.textContent = "Erro ao carregar a jornada.";
      console.error(error);
    }
  }
});

