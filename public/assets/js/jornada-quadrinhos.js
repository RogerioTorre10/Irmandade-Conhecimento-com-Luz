/* /assets/js/jornada-quadrinhos.js — "A sua história em quadrinhos" (Jornada Essencial)
 *
 * Camada visual OPCIONAL por cima da Jornada. Não substitui nada:
 *  - selfie  -> personagem ilustrado (só com o consentimento do participante);
 *  - cada devolutiva -> um quadro com legenda (desenhado em segundo plano);
 *  - fim de bloco -> a página do capítulo aparece sob a devolutiva do bloco;
 *  - tela final -> mini filme narrado pelo Guia + páginas em quadrinhos para baixar.
 * Se algo falhar (servidor desligado, IA recusou, sem selfie), a Jornada segue
 * exatamente como antes. As imagens ficam guardadas só neste aparelho (IndexedDB).
 */
(function () {
  'use strict';
  if (window.__ICL_QUADRINHOS__) return;
  window.__ICL_QUADRINHOS__ = true;

  const IS_HOMOLOG = location.hostname.includes('homolog');
  const API = String(window.APP_CONFIG?.API_BASE ||
    (IS_HOMOLOG ? 'https://lumen-backend-homolog.onrender.com/api' : 'https://lumen-backend-api.onrender.com/api')
  ).replace(/\/$/, '');
  const TOTAL = 50;
  const PARALELO = 2;

  // ---------------- textos (7 idiomas) ----------------
  const T = {
    pt: { pergunta: 'Quer que a sua Jornada vire uma história em quadrinhos?', expl: 'Com a sua selfie, desenhamos um personagem seu. Cada resposta vira um quadro, e no final você assiste ao filme da sua Jornada. A selfie é usada só para isso, e as imagens ficam apenas neste aparelho.', sim: 'Sim, quero', nao: 'Agora não', desenhando: 'Desenhando o seu personagem…', pronto: 'O seu personagem está pronto!', capitulo: 'O seu capítulo em quadrinhos', titulo: 'A sua história em quadrinhos', filme: 'Assistir ao filme da Jornada', baixar: 'Baixar Filme', pagina: 'Baixar página', completando: 'Completando a sua história', inicio: 'Esta é a sua história.', fim: 'Para além. E sempre!!', abertura: 'A sua Jornada', sou: 'Este sou eu nesta história.', preparando: 'Preparando a narração…' },
    en: { pergunta: 'Would you like your Journey to become a comic story?', expl: 'From your selfie we draw your own character. Each answer becomes a panel, and at the end you watch the film of your Journey. The selfie is used only for this, and the images stay only on this device.', sim: 'Yes, please', nao: 'Not now', desenhando: 'Drawing your character…', pronto: 'Your character is ready!', capitulo: 'Your chapter in comics', titulo: 'Your story in comics', filme: 'Watch the film of your Journey', baixar: 'Download the film', pagina: 'Download page', completando: 'Completing your story', inicio: 'This is your story.', fim: 'Beyond. And always!!', abertura: 'Your Journey', sou: 'This is me in this story.', preparando: 'Preparing the narration…' },
    es: { pergunta: '¿Quieres que tu Jornada se convierta en un cómic?', expl: 'Con tu selfie dibujamos tu propio personaje. Cada respuesta se convierte en una viñeta y al final ves la película de tu Jornada. La selfie se usa solo para esto y las imágenes quedan solo en este dispositivo.', sim: 'Sí, quiero', nao: 'Ahora no', desenhando: 'Dibujando tu personaje…', pronto: '¡Tu personaje está listo!', capitulo: 'Tu capítulo en cómic', titulo: 'Tu historia en cómic', filme: 'Ver la película de la Jornada', baixar: 'Descargar la película', pagina: 'Descargar página', completando: 'Completando tu historia', inicio: 'Esta es tu historia.', fim: 'Más allá. ¡¡Y siempre!!', abertura: 'Tu Jornada', sou: 'Este soy yo en esta historia.', preparando: 'Preparando la narración…' },
    fr: { pergunta: 'Voulez-vous que votre Parcours devienne une bande dessinée ?', expl: 'À partir de votre selfie, nous dessinons votre personnage. Chaque réponse devient une case et, à la fin, vous regardez le film de votre Parcours. Le selfie sert uniquement à cela et les images restent sur cet appareil.', sim: 'Oui', nao: 'Pas maintenant', desenhando: 'Dessin de votre personnage…', pronto: 'Votre personnage est prêt !', capitulo: 'Votre chapitre en BD', titulo: 'Votre histoire en BD', filme: 'Regarder le film du Parcours', baixar: 'Télécharger le film', pagina: 'Télécharger la page', completando: 'Votre histoire se complète', inicio: 'Voici votre histoire.', fim: 'Au-delà. Et toujours !!', abertura: 'Votre Parcours', sou: 'Me voici dans cette histoire.', preparando: 'Préparation de la narration…' },
    de: { pergunta: 'Soll Ihre Reise zu einem Comic werden?', expl: 'Aus Ihrem Selfie zeichnen wir Ihre eigene Figur. Jede Antwort wird zu einem Bild, und am Ende sehen Sie den Film Ihrer Reise. Das Selfie wird nur dafür verwendet, die Bilder bleiben nur auf diesem Gerät.', sim: 'Ja, gerne', nao: 'Jetzt nicht', desenhando: 'Ihre Figur wird gezeichnet…', pronto: 'Ihre Figur ist fertig!', capitulo: 'Ihr Kapitel als Comic', titulo: 'Ihre Geschichte als Comic', filme: 'Den Film der Reise ansehen', baixar: 'Film herunterladen', pagina: 'Seite herunterladen', completando: 'Ihre Geschichte wird vervollständigt', inicio: 'Das ist Ihre Geschichte.', fim: 'Darüber hinaus. Und immer!!', abertura: 'Ihre Reise', sou: 'Das bin ich in dieser Geschichte.', preparando: 'Erzählung wird vorbereitet…' },
    ja: { pergunta: 'あなたの旅をマンガにしますか？', expl: 'セルフィーからあなたのキャラクターを描きます。答えごとに1コマが生まれ、最後に旅の映画を観られます。セルフィーはこのためだけに使われ、画像はこの端末にのみ保存されます。', sim: 'はい', nao: '今はしない', desenhando: 'キャラクターを描いています…', pronto: 'キャラクターができました！', capitulo: 'マンガで見るこの章', titulo: 'マンガで見るあなたの物語', filme: '旅の映画を観る', baixar: '映画をダウンロード', pagina: 'ページをダウンロード', completando: '物語を仕上げています', inicio: 'これはあなたの物語です。', fim: 'その先へ。いつまでも！！', abertura: 'あなたの旅', sou: 'この物語の私です。', preparando: 'ナレーションを準備中…' },
    zh: { pergunta: '要把你的旅程变成漫画吗？', expl: '我们会根据你的自拍画出你的角色。每个回答都会成为一格漫画，最后你可以观看旅程电影。自拍只用于此，图片只保存在本设备上。', sim: '好的', nao: '暂不', desenhando: '正在绘制你的角色…', pronto: '你的角色完成了！', capitulo: '本章漫画', titulo: '你的漫画故事', filme: '观看旅程电影', baixar: '下载电影', pagina: '下载页面', completando: '正在完成你的故事', inicio: '这是你的故事。', fim: '超越。永远！！', abertura: '你的旅程', sou: '这是故事里的我。', preparando: '正在准备旁白…' },
  };
  function lang() {
    return String(window.i18n?.lang || window.i18n?.currentLang || document.documentElement.lang ||
      sessionStorage.getItem('jornada.lang') || localStorage.getItem('JORNADA_LANG') || 'pt-BR');
  }
  const t = (k) => (T[lang().slice(0, 2).toLowerCase()] || T.pt)[k] || T.pt[k];

  // ---------------- identidade / estado ----------------
  function ident() {
    let p = {};
    try { p = JSON.parse(sessionStorage.getItem('JORNADA_PROGRESS') || '{}') || {}; } catch (_) {}
    return {
      email: String(localStorage.getItem('jornada_email') || sessionStorage.getItem('jornada.email') || p.email || '').trim().toLowerCase(),
      codigo: String(localStorage.getItem('jornada_codigo') || p.codigo_jornada || p.codigoJornada || '').trim().toUpperCase(),
    };
  }
  function guia() {
    const g = String(sessionStorage.getItem('jornada.guia') || localStorage.getItem('JORNADA_GUIA') || localStorage.getItem('jornada.guia') || '').toLowerCase();
    return g.includes('arian') ? 'arian' : g.includes('zion') ? 'zion' : 'lumen';
  }
  const chaveConsent = () => 'ICL_QUADRINHOS_CONSENT_' + (ident().codigo || 'semcodigo');
  const consentiu = () => { try { return localStorage.getItem(chaveConsent()) === 'sim'; } catch (_) { return false; } };
  let ATIVO = false;

  // ---------------- IndexedDB ----------------
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((ok, erro) => {
      const r = indexedDB.open('icl-quadrinhos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('itens');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
    return dbp;
  }
  async function guardar(chave, valor) {
    try { const d = await db(); await new Promise((ok, e) => { const tx = d.transaction('itens', 'readwrite'); tx.objectStore('itens').put(valor, ident().codigo + '|' + chave); tx.oncomplete = ok; tx.onerror = () => e(tx.error); }); } catch (e) { console.warn('[QUADRINHOS] não guardou', e); }
  }
  async function ler(chave) {
    try { const d = await db(); return await new Promise((ok) => { const r = d.transaction('itens').objectStore('itens').get(ident().codigo + '|' + chave); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch (_) { return null; }
  }
  async function todos() {
    try {
      const d = await db(); const pre = ident().codigo + '|q|';
      return await new Promise((ok) => {
        const out = []; const r = d.transaction('itens').objectStore('itens').openCursor();
        r.onsuccess = () => { const c = r.result; if (!c) return ok(out); if (String(c.key).startsWith(pre)) out.push(c.value); c.continue(); };
        r.onerror = () => ok(out);
      });
    } catch (_) { return []; }
  }

  // ---------------- API ----------------
  async function post(rota, corpo) {
    const id = ident();
    const r = await fetch(API + '/quadrinhos' + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...corpo, codigo_jornada: id.codigo, email: id.email }) });
    let d = {}; try { d = await r.json(); } catch (_) {}
    if (!r.ok) { const e = new Error(d.detail || ('HTTP ' + r.status)); e.status = r.status; throw e; }
    return d;
  }

  // ---------------- estilos ----------------
  function estilos() {
    if (document.getElementById('icl-q-css')) return;
    const s = document.createElement('style'); s.id = 'icl-q-css';
    s.textContent = `
      .iclq-modal{position:fixed;inset:0;z-index:99999;background:rgba(5,8,16,.72);display:grid;place-items:center;padding:18px}
      .iclq-caixa{max-width:460px;background:#f6ecd6;color:#2b2116;border-radius:16px;padding:22px;font-family:Georgia,serif;box-shadow:0 20px 60px #000a}
      .iclq-caixa h3{margin:0 0 10px;font-size:21px}.iclq-caixa p{line-height:1.5;margin:0 0 14px;font-size:15px}
      .iclq-bt{appearance:none;border:0;border-radius:999px;background:#e0a84a;color:#22170a;font:700 15px system-ui,sans-serif;padding:11px 20px;cursor:pointer;margin:4px 6px 0 0}
      .iclq-bt.sec{background:transparent;border:1px solid #2b2116;color:#2b2116}.iclq-bt:disabled{opacity:.5;cursor:wait}
      .iclq-aviso{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:99998;background:#1d2c4a;color:#fdf3dc;padding:10px 16px;border-radius:999px;font:14px system-ui,sans-serif;box-shadow:0 8px 30px #0008;display:flex;gap:10px;align-items:center}
      .iclq-aviso img{width:34px;height:34px;border-radius:50%;object-fit:cover}
      .iclq-quadro{margin:14px auto 0;max-width:520px;background:transparent;border:1px solid rgba(224,168,74,.55);border-radius:12px;overflow:hidden;box-shadow:0 0 18px rgba(224,168,74,.18);animation:iclqIn .8s ease}
      .iclq-quadro img{width:100%;display:block;aspect-ratio:4/3;object-fit:cover;-webkit-mask-image:linear-gradient(#000 82%,transparent);mask-image:linear-gradient(#000 82%,transparent)}
      .iclq-quadro .leg{margin-top:-28px;position:relative;padding:6px 14px 10px;font:italic 15px Georgia,serif;color:inherit;opacity:.95;background:transparent;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.7)}
      .iclq-pagina{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-top:14px}
      .iclq-pagina img{width:100%;aspect-ratio:4/3;object-fit:cover;border:1px solid rgba(224,168,74,.55);border-radius:8px;background:transparent;box-shadow:0 0 10px rgba(224,168,74,.15)}
      .iclq-tit{font:700 13px system-ui,sans-serif;letter-spacing:.8px;text-transform:uppercase;color:inherit;opacity:.85;margin-top:16px}
      .iclq-final{margin:18px 0;padding:16px;border:1px solid rgba(224,168,74,.6);border-radius:14px;background:rgba(255,248,230,.6);color:#2b2116}
      .iclq-final h3{margin:0 0 6px;font-family:Georgia,serif}
      .iclq-tela{position:fixed;inset:0;z-index:100000;background:#000;display:grid;place-items:center}
      .iclq-tela canvas{width:min(100vw,177.8vh);height:auto;max-height:100vh}
      .iclq-tela .fechar{position:absolute;top:14px;right:16px;background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:999px;width:40px;height:40px;font-size:20px;cursor:pointer}
      @keyframes iclqIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`;
    document.head.appendChild(s);
  }
  function aviso(txt, img, ms = 4000) {
    estilos();
    const a = document.createElement('div'); a.className = 'iclq-aviso';
    a.innerHTML = (img ? `<img alt="">` : '') + `<span></span>`;
    if (img) a.querySelector('img').src = img;
    a.querySelector('span').textContent = txt;
    document.body.appendChild(a);
    if (ms) setTimeout(() => a.remove(), ms);
    return a;
  }

  // ---------------- consentimento + personagem ----------------
  function perguntarConsentimento() {
    return new Promise((ok) => {
      estilos();
      const m = document.createElement('div'); m.className = 'iclq-modal';
      m.innerHTML = `<div class="iclq-caixa"><h3></h3><p></p><button class="iclq-bt" data-r="sim"></button><button class="iclq-bt sec" data-r="nao"></button></div>`;
      m.querySelector('h3').textContent = t('pergunta');
      m.querySelector('p').textContent = t('expl');
      m.querySelector('[data-r=sim]').textContent = t('sim');
      m.querySelector('[data-r=nao]').textContent = t('nao');
      m.addEventListener('click', (e) => { const r = e.target?.dataset?.r; if (!r) return; m.remove(); ok(r === 'sim'); });
      document.body.appendChild(m);
    });
  }
  function reduzir(dataUrl, max = 768) {
    return new Promise((ok) => {
      const im = new Image();
      im.onload = () => { const k = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); ok(c.toDataURL('image/jpeg', 0.86)); };
      im.onerror = () => ok(dataUrl); im.src = dataUrl;
    });
  }
  let avatarPromise = null;
  async function criarAvatar(selfie) {
    const av = aviso(t('desenhando'), null, 0);
    try {
      const d = await post('/jornada/avatar', { selfie: await reduzir(selfie), consentimento: true });
      await guardar('avatar', d.imagem);
      av.remove(); aviso(t('pronto'), d.imagem, 5000);
      return d.imagem;
    } catch (e) {
      av.remove(); console.warn('[QUADRINHOS] personagem não criado:', e.message);
      return null;
    }
  }
  async function avatar() {
    const salvo = await ler('avatar');
    if (salvo) return salvo;
    if (avatarPromise) return avatarPromise;
    return null;
  }
  window.addEventListener('selfie:captured', async (e) => {
    if (!ATIVO) return;
    const selfie = e.detail?.dataUrl; if (!selfie) return;
    let ok = consentiu();
    if (!ok) {
      ok = await perguntarConsentimento();
      try { localStorage.setItem(chaveConsent(), ok ? 'sim' : 'nao'); } catch (_) {}
    }
    if (!ok) return;
    avatarPromise = criarAvatar(selfie);
  });

  // ---------------- fila de quadros ----------------
  const fila = []; let rodando = 0; const pendentes = new Map();
  function chaveQ(blocoId, qIndex) { return 'q|' + blocoId + '|' + String(qIndex).padStart(3, '0'); }
  async function desenhar(item) {
    const av = await avatar(); if (!av) return null;
    const ja = await ler(chaveQ(item.blocoId, item.qIndex)); if (ja) return ja;
    const n = (await todos()).length + 1;
    const d = await post('/jornada/cena', { avatar: av, pergunta: item.pergunta.slice(0, 600), resposta: item.resposta.slice(0, 2000), devolutiva: item.devolutiva.slice(0, 1500), bloco: item.blocoTitulo || '', idioma: lang(), indice: Math.min(n, TOTAL), total: TOTAL });
    const q = { blocoId: item.blocoId, blocoTitulo: item.blocoTitulo, qIndex: item.qIndex, ordem: item.ordem || Date.now(), imagem: d.imagem, legenda: d.legenda || '' };
    await guardar(chaveQ(item.blocoId, item.qIndex), q);
    return q;
  }
  function enfileirar(item) {
    const k = chaveQ(item.blocoId, item.qIndex);
    if (pendentes.has(k)) return pendentes.get(k);
    const p = new Promise((ok) => { fila.push({ item, ok }); proximo(); });
    pendentes.set(k, p); p.finally(() => pendentes.delete(k));
    return p;
  }
  function proximo() {
    while (rodando < PARALELO && fila.length) {
      const { item, ok } = fila.shift(); rodando++;
      desenhar(item).then(ok, (e) => { console.warn('[QUADRINHOS] quadro não desenhado:', e.message); ok(null); })
        .finally(() => { rodando--; proximo(); });
    }
  }
  function caixaResposta() { return document.getElementById('jp-ai-response-wrap') || document.getElementById('jp-ai-response'); }
  function mostrarQuadro(q) {
    const wrap = caixaResposta(); if (!wrap || !q) return;
    wrap.querySelectorAll('.iclq-quadro').forEach((el) => el.remove());
    estilos();
    const el = document.createElement('figure'); el.className = 'iclq-quadro';
    el.innerHTML = '<img alt=""><figcaption class="leg"></figcaption>';
    el.querySelector('img').src = q.imagem; el.querySelector('.leg').textContent = q.legenda;
    wrap.appendChild(el);
  }
  document.addEventListener('jornada:devolutiva', async (e) => {
    if (!ATIVO || !consentiu()) return;
    const d = e.detail || {}; if (!d.blocoId) return;
    const meu = chaveQ(d.blocoId, d.qIndex);
    window.__iclqUltimo = meu;
    const q = await enfileirar({ ...d, ordem: Date.now() });
    if (q && window.__iclqUltimo === meu) mostrarQuadro(q);
  });
  document.addEventListener('jornada:devolutiva-bloco', async (e) => {
    if (!ATIVO || !consentiu()) return;
    const bid = e.detail?.blocoId; if (!bid) return;
    await Promise.all([...pendentes.values()]);
    const qs = (await todos()).filter((q) => q.blocoId === bid).sort((a, b) => a.qIndex - b.qIndex);
    const wrap = caixaResposta(); if (!wrap || !qs.length) return;
    wrap.querySelectorAll('.iclq-quadro,.iclq-capitulo').forEach((el) => el.remove());
    estilos();
    const box = document.createElement('div'); box.className = 'iclq-capitulo';
    box.innerHTML = `<div class="iclq-tit"></div><div class="iclq-pagina"></div>`;
    box.querySelector('.iclq-tit').textContent = t('capitulo');
    qs.forEach((q) => { const im = document.createElement('img'); im.src = q.imagem; im.alt = q.legenda; im.title = q.legenda; box.querySelector('.iclq-pagina').appendChild(im); });
    wrap.appendChild(box);
  });

  // ---------------- completar o que faltou (troca de aparelho, recarga) ----------------
  function respostasGuardadas() {
    let lista = [];
    try { lista = JSON.parse(localStorage.getItem('JORNADA_DEVOLUTIVAS_BLOCO') || sessionStorage.getItem('JORNADA_DEVOLUTIVAS_BLOCO') || '[]') || []; } catch (_) {}
    const out = [];
    lista.forEach((b, bi) => (b?.perguntas || []).forEach((p, qi) => {
      if (p && p.resposta && p.devolutiva) out.push({ blocoId: b.blocoId, blocoTitulo: b.blocoTitulo, qIndex: qi, pergunta: String(p.pergunta || ''), resposta: String(p.resposta), devolutiva: String(p.devolutiva), ordem: bi * 1000 + qi });
    }));
    return out;
  }
  async function completar(onProgresso) {
    const feitos = new Set((await todos()).map((q) => chaveQ(q.blocoId, q.qIndex)));
    const falta = respostasGuardadas().filter((r) => !feitos.has(chaveQ(r.blocoId, r.qIndex)));
    let n = 0;
    await Promise.all(falta.map((r) => enfileirar(r).then(() => onProgresso?.(++n, falta.length))));
  }
  async function quadrosEmOrdem() {
    const ordemBlocos = []; respostasGuardadas().forEach((r) => { if (!ordemBlocos.includes(r.blocoId)) ordemBlocos.push(r.blocoId); });
    return (await todos()).sort((a, b) => {
      const ia = ordemBlocos.indexOf(a.blocoId), ib = ordemBlocos.indexOf(b.blocoId);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.qIndex - b.qIndex;
    });
  }

  // ---------------- mini filme ----------------
  function carregar(src) { return new Promise((ok, e) => { const im = new Image(); im.onload = () => ok(im); im.onerror = e; im.src = src; }); }
  async function voz(ctx, texto) {
    if (!texto) return null;
    try {
      const r = await fetch(API + '/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: texto, guide: guia(), lang: lang() }) });
      if (!r.ok) return null;
      return await ctx.decodeAudioData(await r.arrayBuffer());
    } catch (_) { return null; }
  }
  async function filme(gravar, botoes) {
    const av = await avatar(); const qs = await quadrosEmOrdem(); if (!av && !qs.length) return;
    botoes.forEach((b) => (b.disabled = true));
    const tela = document.createElement('div'); tela.className = 'iclq-tela';
    tela.innerHTML = '<canvas width="1280" height="720"></canvas><button class="fechar" aria-label="Fechar">✕</button>';
    document.body.appendChild(tela);
    const cv = tela.querySelector('canvas'), cx = cv.getContext('2d'), W = 1280, H = 720;
    let parar = false; tela.querySelector('.fechar').onclick = () => { parar = true; };
    const texto = (t1, t2, a) => { cx.globalAlpha = 1; cx.fillStyle = '#070b14'; cx.fillRect(0, 0, W, H); cx.globalAlpha = a; cx.textAlign = 'center'; cx.fillStyle = '#e0a84a'; cx.font = 'bold 56px Georgia, serif'; cx.fillText(t1, W / 2, H / 2 - 10); cx.fillStyle = '#cfd6e6'; cx.font = 'italic 30px Georgia, serif'; cx.fillText(t2, W / 2, H / 2 + 50); cx.globalAlpha = 1; };
    texto(t('preparando'), '', 1);
    const ctx = new (window.AudioContext || window.webkitAudioContext)(); const destino = ctx.createMediaStreamDestination();
    const cenas = []; if (av) cenas.push({ im: await carregar(av), leg: t('inicio') });
    for (const q of qs) { try { cenas.push({ im: await carregar(q.imagem), leg: q.legenda }); } catch (_) {} }
    const vozes = []; for (let i = 0; i < cenas.length; i += 6) vozes.push(...(await Promise.all(cenas.slice(i, i + 6).map((c) => voz(ctx, c.leg)))));
    const quebra = (s, larg) => { const l = []; let a = ''; for (const w of String(s || '').split(' ')) { const n = a ? a + ' ' + w : w; if (cx.measureText(n).width > larg && a) { l.push(a); a = w; } else a = n; } if (a) l.push(a); return l; };
    const quadro = (im, p, leg, a) => {
      cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
      const k = 1.02 + 0.12 * p, r = Math.max(W / im.width, H / im.height) * k, w = im.width * r, h = im.height * r;
      cx.globalAlpha = a; cx.drawImage(im, (W - w) / 2 + (p - 0.5) * 40, (H - h) / 2 - (p - 0.5) * 20, w, h);
      if (leg) { cx.font = 'italic 38px Georgia, serif'; const ls = quebra(leg, W - 200), bh = ls.length * 50 + 40; cx.fillStyle = 'rgba(10,14,26,.62)'; cx.fillRect(0, H - bh - 30, W, bh); cx.fillStyle = '#fdf3dc'; cx.textAlign = 'center'; ls.forEach((l, i) => cx.fillText(l, W / 2, H - bh - 30 + 58 + i * 50)); }
      cx.globalAlpha = 1;
    };
    const anima = (dur, f) => new Promise((ok) => { const t0 = performance.now(); (function g() { const p = Math.min(1, (performance.now() - t0) / dur); f(p, Math.max(0, Math.min(1, p * dur / 700, (1 - p) * dur / 700))); if (p < 1 && !parar) requestAnimationFrame(g); else ok(); })(); });
    let rec = null; const partes = [];
    if (gravar && window.MediaRecorder) {
      const fluxo = new MediaStream([...cv.captureStream(30).getVideoTracks(), ...destino.stream.getAudioTracks()]);
      const tipo = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((x) => MediaRecorder.isTypeSupported(x)) || '';
      rec = new MediaRecorder(fluxo, tipo ? { mimeType: tipo } : undefined); rec.ondataavailable = (e) => e.data.size && partes.push(e.data); rec.start();
    }
    await anima(2600, (p, a) => texto(t('abertura'), 'Irmandade Conhecimento com Luz', a));
    for (let i = 0; i < cenas.length && !parar; i++) {
      const b = vozes[i]; let dur = 5500;
      if (b) { dur = Math.max(5000, b.duration * 1000 + 1300); const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.connect(destino); setTimeout(() => { try { s.start(); } catch (_) {} }, 450); }
      await anima(dur, (p, a) => quadro(cenas[i].im, p, cenas[i].leg, a));
    }
    if (!parar) await anima(3000, (p, a) => texto(t('fim'), 'Irmandade Conhecimento com Luz', a));
    if (rec) { await new Promise((ok) => { rec.onstop = ok; rec.stop(); }); if (!parar) { const blob = new Blob(partes, { type: rec.mimeType || 'video/webm' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'filme-da-minha-jornada.' + ((rec.mimeType || '').includes('mp4') ? 'mp4' : 'webm'); a.click(); } }
    try { ctx.close(); } catch (_) {}
    tela.remove(); botoes.forEach((b) => (b.disabled = false));
  }

  // ---------------- páginas (uma por bloco) ----------------
  async function baixarPagina(titulo, itens) {
    const W = 1240, M = 40, G = 22, cw = (W - 2 * M - G) / 2, ch = cw * 0.75, lh = 86;
    const H = 170 + Math.ceil(itens.length / 2) * (ch + lh + G) + M;
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = '#f6ecd6'; g.fillRect(0, 0, W, H); g.fillStyle = '#2b2116'; g.textAlign = 'center';
    g.font = 'bold 44px Georgia, serif'; g.fillText(titulo, W / 2, 86); g.font = 'italic 22px Georgia, serif'; g.fillText('Irmandade Conhecimento com Luz', W / 2, 124);
    for (let i = 0; i < itens.length; i++) {
      const x = M + (i % 2) * (cw + G), y = 160 + Math.floor(i / 2) * (ch + lh + G);
      try { const im = await carregar(itens[i].imagem); const r = Math.max(cw / im.width, ch / im.height); g.save(); g.beginPath(); g.rect(x, y, cw, ch); g.clip(); g.drawImage(im, x + (cw - im.width * r) / 2, y + (ch - im.height * r) / 2, im.width * r, im.height * r); g.restore(); } catch (_) {}
      g.fillStyle = '#fff8e6'; g.fillRect(x, y + ch, cw, lh); g.lineWidth = 5; g.strokeStyle = '#1a1410'; g.strokeRect(x, y, cw, ch + lh); g.beginPath(); g.moveTo(x, y + ch); g.lineTo(x + cw, y + ch); g.stroke();
      g.fillStyle = '#2b2116'; g.font = 'italic 20px Georgia, serif'; g.textAlign = 'left';
      let l = '', yy = y + ch + 32; for (const p of String(itens[i].legenda || '').split(' ')) { const n = l ? l + ' ' + p : p; if (g.measureText(n).width > cw - 26 && l) { g.fillText(l, x + 13, yy); yy += 25; l = p; } else l = n; } g.fillText(l, x + 13, yy);
    }
    const a = document.createElement('a'); a.href = c.toDataURL('image/jpeg', 0.9); a.download = titulo.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() + '.jpg'; a.click();
  }

  // ---------------- tela final: um botão junto do PDF e do SelfieCard ----------------
  async function montarFinal() {
    if (!ATIVO || !consentiu()) return;
    const sec = document.getElementById('section-final'); if (!sec || sec.querySelector('#btnFilmeJornada')) return;
    if (!(await avatar())) return;
    const acoes = sec.querySelector('.final-acoes'); if (!acoes) return;
    const modelo = acoes.querySelector('#btnBaixarSelfie') || acoes.querySelector('button');
    const bt = document.createElement('button');
    bt.id = 'btnFilmeJornada'; bt.type = 'button';
    if (modelo) bt.className = modelo.className;
    bt.textContent = t('baixar');
    const ref = acoes.querySelector('#btnVoltarPortal');
    acoes.insertBefore(bt, ref || null);
    bt.onclick = async () => {
      const rotulo = t('baixar');
      bt.disabled = true;
      try {
        await completar((n, tot) => { bt.textContent = `${t('completando')} ${n}/${tot}`; });
      } finally { bt.textContent = rotulo; }
      await filme(true, [bt]);   // passa o filme e, no fim, baixa o arquivo
    };
  }
  document.addEventListener('section:shown', (e) => { const id = e.detail?.sectionId || e.detail; if (id === 'section-final') setTimeout(montarFinal, 1500); });

  // ---------------- liga/desliga ----------------
  fetch(API + '/quadrinhos/ativo', { cache: 'no-store' }).then((r) => r.json()).then((d) => { ATIVO = !!d?.ativo; }).catch(() => { ATIVO = false; });
  window.ICLQuadrinhos = { completar, quadrosEmOrdem, filme: () => filme(false, []) };
})();
