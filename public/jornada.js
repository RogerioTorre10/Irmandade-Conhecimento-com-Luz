/* ==========================================================================
   jornada.js  —  VERSÃO: 1.0 (25-08-2025)
   - Mantém compatibilidade com páginas existentes
   - Não depende de Tailwind (você pode remover o CDN do Tailwind dos HTMLs)
   - Fallback automático entre BASES de API
   - Aceita diferentes formatos de resposta do backend (PDF/HQ: blob, base64, URLs)
   - Limpeza robusta do estado da jornada
   ==========================================================================/
(() => {
  // =============================
  //  CONFIGURAÇÃO BÁSICA
  // =============================
  const CONFIG = {
    STORAGE_KEY: 'jornada_v1_state',
    // Ordem de tentativa das bases: principal -> backup(s)
    API_BASES: [
      'https://lumen-backend-api.onrender.com',
      'https://conhecimento-com-luz-api.onrender.com',
      'http://localhost:8000'
    ],
    // Caminhos canônicos; se o seu backend usa hífen, tente mapear aqui também
    ENDPOINTS: {
      health: ['/health', '/api/health'],
      submitEssencial: [
        '/jornada/essencial',
        '/jornada-essencial',
        '/api/v1/jornada/essencial'
      ],
      pdfHqCombo: [
        '/jornada/essencial/pdf-hq',
        '/jornada-essencial/pdf-hq',
        '/api/v1/jornada/essencial/pdf-hq'
      ]
    }
  };

  // =============================
  //  PEQUENO UTIL DE ESTADO
  // =============================
  const State = {
    load() {
      try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{}'); }
      catch(_) { return {}; }
    },
    save(data) {
      localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data || {}));
    },
    clear() { localStorage.removeItem(CONFIG.STORAGE_KEY); }
  };

  // =============================
  //  HELPERS DE REDE/FORMATO
  // =============================
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function tryFetch(url, options = {}) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res;
    } catch (e) {
      throw e;
    }
  }

  async function pickWorkingBase() {
    // Tenta bases em sequência, validando /health
    for (const base of CONFIG.API_BASES) {
      for (const hp of CONFIG.ENDPOINTS.health) {
        try {
          const res = await tryFetch(base + hp, { method: 'GET' });
          // se respondeu algo, consideramos ok
          if (res) return base;
        } catch(_) { /* tenta próximo */ }
      }
    }
    throw new Error('Nenhuma API base respondeu ao health.');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }

  function base64ToBlob(base64, mime='application/pdf') {
    const bin = atob(base64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i=0; i<len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function fetchJsonOrBlob(url, options) {
    const res = await tryFetch(url, options);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return { type: 'json', data: await res.json() };
    if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
      const blob = await res.blob();
      return { type: 'blob', data: blob };
    }
    // fallback: tenta como blob
    return { type: 'blob', data: await res.blob() };
  }

  // =============================
  //  ENVIO DA JORNADA (FLEXÍVEL)
  // =============================
  async function submitEssencial(payload, { preferCombo=true } = {}) {
    const base = await pickWorkingBase();

    const tryEndpoints = preferCombo ?
      [...CONFIG.ENDPOINTS.pdfHqCombo, ...CONFIG.ENDPOINTS.submitEssencial] :
      [...CONFIG.ENDPOINTS.submitEssencial, ...CONFIG.ENDPOINTS.pdfHqCombo];

    const opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/pdf'
      },
      body: JSON.stringify(payload)
    };

    let lastErr;
    for (const ep of tryEndpoints) {
      const url = base + ep;
      try {
        const out = await fetchJsonOrBlob(url, opts);
        return { base, ep, ...out };
      } catch (e) {
        lastErr = e; await sleep(150);
      }
    }
    throw lastErr || new Error('Falha em todos endpoints mapeados.');
  }

  // =============================
  //  ORQUESTRAÇÃO DE DOWNLOADS
  // =============================
  async function handlePdfHqResponse(resp) {
    // Formatos aceitos:
    //  A) resp.type === 'blob'  -> arquivo (PDF/ZIP). Baixa com nome padrão.
    //  B) resp.type === 'json'  -> { pdf_url?, hq_url?, pdf_base64?, hq_base64? }
    if (resp.type === 'blob') {
      // tenta deduzir nome; senão usa padrão
      downloadBlob(resp.data, 'jornada_saida.pdf');
      return { pdf: true, hq: false, via: 'blob' };
    }

    const j = resp.data || {};

    // URLs diretas (melhor para memória do cliente)
    if (j.pdf_url) window.open(j.pdf_url, '_blank');
    if (j.hq_url) window.open(j.hq_url, '_blank');

    // Base64 (como fallback)
    if (j.pdf_base64) downloadBlob(base64ToBlob(j.pdf_base64, 'application/pdf'), 'jornada.pdf');
    if (j.hq_base64) {
      // HQ pode vir como PDF/ZIP/PNG — vamos assumir PDF por padrão
      const mime = j.hq_mime || 'application/pdf';
      const name = mime.includes('zip') ? 'jornada_hq.zip' : 'jornada_hq.pdf';
      downloadBlob(base64ToBlob(j.hq_base64, mime), name);
    }

    return {
      pdf: Boolean(j.pdf_url || j.pdf_base64),
      hq: Boolean(j.hq_url || j.hq_base64),
      via: 'json'
    };
  }

  // =============================
  //  GANCHOS DE UI (ids já usados no site)
  // =============================
  async function onClickEnviarRespostas() {
    // Coleta do estado atual
    const st = State.load();
    const answers = st.answers || []; // mantenho compatibilidade

    toggleWorking(true, 'Enviando suas respostas…');
    try {
      const resp = await submitEssencial({ answers });
      await handlePdfHqResponse(resp);
      toast('PDF/HQ gerados com sucesso. Voltando ao início…');
      // Vai para a página principal após alguns segundos
      setTimeout(() => { window.location.href = '/index.html'; }, 1200);
    } catch (e) {
      console.error(e);
      toast('Falha ao gerar PDF/HQ. Tente novamente em instantes.');
    } finally {
      toggleWorking(false);
    }
  }

  function onClickLimparRespostas() {
    State.clear();
    toast('Respostas apagadas desta jornada.');
    // opcional: recarregar página de perguntas
    // window.location.reload();
  }

  // =============================
  //  PEQUENOS WIDGETS
  // =============================
  function ensureEl(id) { return document.getElementById(id); }

  function toast(msg) {
    let el = document.getElementById('toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:10px 16px;border-radius:10px;background:#111;color:#fff;z-index:9999;max-width:90%;text-align:center;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0'; }, 1800);
  }

  function toggleWorking(on, label='Processando…') {
    const btn = ensureEl('btn-enviar');
    const spin = ensureEl('working');
    if (btn) {
      btn.disabled = !!on;
      btn.textContent = on ? label : (btn.dataset.label || 'Enviar respostas');
    }
    if (spin) {
      spin.style.display = on ? 'inline-block' : 'none';
    }
  }

  // =============================
  //  BIND AUTOMÁTICO AOS BOTÕES
  // =============================
  function bindButtons() {
    const enviar = ensureEl('btn-enviar');
    const limpar = ensureEl('btn-limpar');

    if (enviar && !enviar.__bound) {
      enviar.__bound = true;
      enviar.dataset.label = enviar.textContent || 'Enviar respostas';
      enviar.addEventListener('click', onClickEnviarRespostas);
    }
    if (limpar && !limpar.__bound) {
      limpar.__bound = true;
      limpar.addEventListener('click', onClickLimparRespostas);
    }
  }

  // =============================
  //  INICIALIZAÇÃO DISCRETA
  // =============================
  document.addEventListener('DOMContentLoaded', () => {
    try { bindButtons(); } catch(_) {}
  });

})();
```

---

## 2) Patches nos HTMLs (muito leves)

> **Objetivo:** só garantir que o `jornada.js` esteja carregado e que os botões tenham os IDs esperados.

### 2.1) `/public/index.html` — ao final do `<body>`

```html
<!-- … seu HTML … -->
<script src="/jornada.js"></script>
</body>
</html>
```

### 2.2) `/public/jornadas.html` — idem

```html
<!-- … seu HTML … -->
<script src="/jornada.js"></script>
</body>
</html>
```

### 2.3) `/public/jornada-conhecimento-com-luz1.html`

Adicione os botões (ou ajuste os existentes) e o script:

```html
<!-- onde ficam as ações da etapa final -->
<div class="acoes-final">
  <button id="btn-enviar">Enviar respostas</button>
  <button id="btn-limpar">Limpar respostas</button>
  <span id="working" style="display:none">⏳</span>
</div>

<script src="/jornada.js"></script>
```

### 2.4) `/public/html/jornada-intro.html` e `/public/html/jornada-final.html`

Também no rodapé de cada arquivo:

```html
<script src="/jornada.js"></script>
```

Se houver botões equivalentes:

```html
<button id="btn-enviar">Enviar respostas</button>
<button id="btn-limpar">Limpar respostas</button>
<span id="working" style="display:none">⏳</span>
```

> **Nota:** Como você vai **remover o Tailwind CDN** por enquanto, os botões podem ficar “crus”. Você pode aplicar estilos do seu `/css/styles.css` depois. O JS acima não depende de Tailwind.

---

## 3) Checklist rápido de CORS no backend principal (Render)

> **Sem tocar no “Lumen backend” antigo.** Ajuste apenas o serviço **`lumen-backend-api`** (principal).

```js
// server.js (exemplo Express)
const cors = require('cors');

const ALLOWED_URLS = [
  'http://localhost:3000',
  'https://irmandade-conhecimento-com-luz-1.onrender.com', // Render Static do site
  'https://irmandade-conhecimento-com-luz.onrender.com'    // se houver outro domínio estático
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_URLS.includes(origin)) return cb(null, true);
    return cb(new Error('Origem não permitida: ' + origin));
  },
  credentials: true
}));
```

* Garanta um **`GET /health`** respondendo `200 OK`.
* Os endpoints de submissão podem ser **qualquer um** dos listados (o frontend tenta vários). Mantenha **um** funcionando e, se possível, crie um alias para outro nome (ex.: com hífen e sem hífen).
* Respostas possíveis do backend (o frontend entende todas):

  * **`Content-Type: application/pdf`** (binário) → baixa direto.
  * **JSON** com `pdf_url`/`hq_url` (links) e/ou `pdf_base64`/`hq_base64` (embutidos).

---

## 4) Como testar (passo-a-passo)

1. Substitua **/public/jornada.js** por esta versão.
2. Nos HTMLs citados, **inclua `<script src="/jornada.js"></script>`** e verifique os IDs `btn-enviar`, `btn-limpar`, `working`.
3. Remova o **Tailwind via CDN** dos HTMLs (se ainda estiver) para evitar interferência.
4. Faça o deploy do site estático.
5. Garanta que o backend **responde `/health`**.
6. Preencha a jornada, clique **Enviar respostas**. Se houver erro, o toast aparecerá; veja o console do navegador para qual base/endpoint falhou.

---

## 5) O que este pacote **não** altera

* Não mexe na sua navegação nem no layout.
* Não cria arquivos novos fora dos já existentes no seu projeto (apenas atualiza `jornada.js`).
* Não força um único endpoint rígido — continua flexível e resiliente, alinhado ao seu histórico de deploys.

---

## 6) Próximos incrementos (quando quiser)

* Estilizar os botões via `/css/styles.css`.
* Adicionar contador de visitas (leve) e manter na página principal.
* Tratar mensagens de erro vindas do backend para feedback mais detalhado (exibir `message` se houver em JSON).
* Opcional: após sucesso, **limpar** as respostas automaticamente (`State.clear()`), se preferir.

---

**Para além. E sempre!!** 🔥
