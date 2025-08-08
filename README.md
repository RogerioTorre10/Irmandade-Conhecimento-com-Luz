# Irmandade Conhecimento com Luz — Site

Pacote completo pronto para deploy no **Render** (plano gratuito).

## Como publicar do celular (super simples)

1. Crie um repositório no **GitHub** (pode chamar `irmandade-site`).
2. Envie **todos os arquivos** deste pacote para o GitHub (pelo app do GitHub ou site).
3. No **Render**, crie um **New + → Web Service** e conecte ao repositório.
4. O Render vai detectar **Node**. Confirme:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Clique **Create Web Service** e aguarde 2–3 minutos.

Pronto! O site ficará disponível em um domínio do Render.

## Estrutura

```
root
├─ render.yaml
├─ package.json
├─ server.js
└─ public/
   ├─ index.html
   ├─ sobre.html
   ├─ jornadas.html
   ├─ jornada-conhecimento.html
   ├─ jornada-vocacional.html
   ├─ jornada-amorosa.html
   ├─ manifesto.html
   ├─ contato.html
   ├─ assets/
   │  ├─ styles.css
   │  ├─ logo.svg
   │  └─ favicon.svg
   └─ js/
      └─ main.js
```

## Personalização rápida
- Troque textos diretamente nos `.html` (estão em português).
- O rodapé já inclui **"PARA ALÉM. E SEMPRE!!"**.
- Ícones via Lucide e estilos via Tailwind CDN (sem build).

Qualquer ajuste me chama que eu edito e mando um novo pacote. PARA ALÉM. E SEMPRE!!