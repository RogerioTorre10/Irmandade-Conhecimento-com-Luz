# Irmandade Conhecimento com Luz — Site Oficial 🌟

Este é o repositório do site estático que hospeda a **Jornada Conhecimento com Luz**.  
Baseado em **GitHub Pages + Backend Render**.

---

## 📂 Estrutura de Arquivos

/docs
├── index.html → Página inicial (introdução, botão "Explorar Jornadas")
├── intro.html → Tela inicial da jornada (vertical, aviso + senha)
├── jornadas.html → Estrutura da jornada (intro + formulário)
├── jornada.js → Lógica da jornada (intro → perguntas → revisão → PDF+HQ)
├── style.css → Estilo global (inclui tema pergaminho + chama animada)
├── assets/ → Ícones, imagens e a chama.svg

---

## ⚙️ Backend

- API: [`https://conhecimento-com-luz-api.onrender.com`](https://conhecimento-com-luz-api.onrender.com)  
- Responsável por:
  - Gerar **PDF** com as respostas + devolutiva simbólica.
  - Gerar **HQ** final (33 quadros).
- Os endpoints usados pelo `jornada.js`:
  - `POST /gerar-pdf` → retorna PDF
  - `POST /gerar-hq` → retorna PDF da HQ

> ⚠️ Se o PDF ou HQ não baixarem por erro de **CORS**, edite o backend no Render e adicione o domínio do Pages (`https://<seu-usuario>.github.io`) na lista de **allowed origins**.

---

## ✏️ Onde Editar Conteúdo

- **Perguntas da jornada** → no arquivo `jornada.js`, lista `QUESTIONS`.  
  ```js
  const QUESTIONS = [
    { id: 'q1', label: 'Quem é você hoje?', type: 'text' },
    { id: 'q2', label: 'Qual foi a maior superação da sua vida?', type: 'textarea' }
  ];
