// journey.js
document.addEventListener("DOMContentLoaded", () => {
  const iniciarBtn = document.getElementById("iniciarBtn");
  const senhaInput = document.getElementById("senha");
  const mensagemDiv = document.getElementById("mensagem");
  const formularioDiv = document.getElementById("formulario");

  iniciarBtn.addEventListener("click", async () => {
    const senha = senhaInput.value.trim();

    if (!senha) {
      mensagemDiv.textContent = "Por favor, digite a senha de acesso.";
      return;
    }

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

