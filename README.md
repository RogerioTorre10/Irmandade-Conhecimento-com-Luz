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

## Voz da narração (voz neural)

A narração usa uma voz neural (ElevenLabs) servida por `POST /api/tts` no `server.js`.
Sem configuração, a jornada continua com a voz do navegador, sem mudar o fluxo.

Variáveis de ambiente (painel do Render → Environment):

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `ELEVENLABS_API_KEY` | sim | chave da conta ElevenLabs |
| `ELEVENLABS_VOICE_ID` | sim | voz padrão (ex.: a voz clonada do áudio de referência) |
| `ELEVENLABS_VOICE_LUMEN` / `_ZION` / `_ARIAN` / `_CERIMONIAL` | não | voz específica por guia |
| `ELEVENLABS_MODEL` | não | padrão `eleven_multilingual_v2` (fala todos os idiomas da jornada) |
| `ELEVENLABS_STABILITY` / `_SIMILARITY` / `_STYLE` | não | ajuste fino (padrões 0.55 / 0.85 / 0.3) |

Os áudios gerados ficam em cache no servidor, então cada frase só é cobrada uma vez.
