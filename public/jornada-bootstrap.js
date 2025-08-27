// jornada-bootstrap.js
import { S } from "./jornada-core.js";
import { render } from "./jornada-render.js";

document.addEventListener("DOMContentLoaded", () => {
  try {
    // restaura estado salvo
    const saved = S.load();
    if (saved && typeof saved === "object") {
      S.state = Object.assign({ auth:false, step:"intro", qIndex:0, respostas:{} }, saved);
    }
    // começa
    render();
  } catch (e) {
    console.error("Erro ao iniciar a jornada:", e);
  }
});
