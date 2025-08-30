# 📂 Mapa de Pastas — Irmandade Conhecimento com Luz

Este documento serve como **referência única** para os caminhos corretos dos arquivos.  
⚠️ Use sempre esses caminhos absolutos ao incluir `<script>`, `<img>` ou carregar conteúdos por JS.

---

## 🌍 Estrutura de diretórios
/public
/assets
/fonts → Cardo-Bold.ttf, Cardo-Italic.ttf, Cardo-Regular.ttf, ManufacturingConsent-Regular.ttf
/img → imagens, ícones, vídeos (pergaminhos, favicon, filmes .mp4, etc.)
/js → scripts JS do front (api.js, chama.js, config.js, main.js, questions.js, state.js, ui.js, etc.)
/html → arquivos de conteúdo (intro.html, jornadas.html, jornadas_olhomagico.html, jornadas_barracontador.html, jornada-final.html, jornada-intro.html, etc.)
/i18n → internacionalização (pt.json, en.json, es.json, i18n.js)


---

## 🔑 Regras de ouro

1. **Sempre usar caminho absoluto começando com `/`**  
   - Scripts: `<script src="/assets/js/main.js"></script>`  
   - Imagens: `<img src="/assets/img/pergaminho-rasgado-horiz.png">`  
   - Fonts: `url('/assets/fonts/Cardo-Regular.ttf')`  
   - Conteúdo HTML: carregado por fetch → `/html/jornada-intro.html`

2. **Separação rígida de função**  
   - `/html/` → só conteúdo estático (intro, perguntas, final, etc.)  
   - `/assets/js/` → só scripts JS  
   - `/assets/img/` → só imagens/vídeos  
   - `/assets/fonts/` → só fontes

3. **Teste antes de commitar**  
   - `/html/jornada-intro.html` → deve abrir HTML  
   - `/assets/js/main.js` → deve abrir código JS (não HTML!)  
   - `/assets/img/pergaminho-rasgado-horiz.png` → deve abrir imagem  

   ⚠️ Se o console avisar **MIME type text/html** para CSS/JS → o caminho está errado (provavelmente retornou um 404).

4. **Fallback de Jornadas**  
   - Se `jornadas_olhomagico.html` ou `jornadas_barracontador.html` não existirem, o hub (`jornadamaster.js`) cai de volta para `jornadas.html`.

---

## 🧩 Exemplo de uso correto

```html
<body data-layout="master" data-journey="essencial">
  <main id="app"></main>
  <button id="btnComecar">Iniciar Jornada</button>

  <script defer src="/jornadamaster.js"></script>
  <script defer src="/jornada-bootstrap.js"></script>

## 📊 Fluxo visual das pastas

```mermaid
flowchart TD
    A[public/] --> B[assets/]
    A --> C[html/]
    A --> D[i18n/]

    B --> B1[fonts/]
    B --> B2[img/]
    B --> B3[js/]

    B1 --> F1[Cardo-Regular.ttf]
    B1 --> F2[Cardo-Bold.ttf]
    B1 --> F3[Cardo-Italic.ttf]
    B1 --> F4[ManufacturingConsent-Regular.ttf]

    B2 --> I1[pergaminho-rasgado-horiz.png]
    B2 --> I2[pergaminho-rasgado-vert.png]
    B2 --> I3[favicon.svg]
    B2 --> I4[vídeos .mp4]

    B3 --> J1[api.js]
    B3 --> J2[chama.js]
    B3 --> J3[config.js]
    B3 --> J4[main.js]
    B3 --> J5[questions.js]
    B3 --> J6[state.js]
    B3 --> J7[ui.js]

    C --> H1[intro.html]
    C --> H2[jornadas.html]
    C --> H3[jornadas_olhomagico.html]
    C --> H4[jornadas_barracontador.html]
    C --> H5[jornada-final.html]

    D --> L1[pt.json]
    D --> L2[en.json]
    D --> L3[es.json]
    D --> L4[i18n.js]

</body>
