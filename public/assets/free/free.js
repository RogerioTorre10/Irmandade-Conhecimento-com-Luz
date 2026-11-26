// /assets/free/free.js — Jornada Free (independente da Jornada Essencial)
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const API = (params.get('api') || 'https://lumen-backend-api.onrender.com').replace(/\/$/, '') + '/api/free';
  const CHAVE = 'jornada_free_v1';
  // Link de compra da Jornada Essencial (Hotmart)
  const LINK_COMPRA = 'https://pay.hotmart.com/H106899850J';
  const NOMES = { lumen: 'Lumen', zion: 'Zion', arian: 'Arian' };
  const ORDEM = ['acesso', 'guia', 'selfie', 'dados', 'perguntas', 'final'];

  let st = carregar();
  const I18N = window.FREE_I18N || {};
  const LANGS = Object.keys(I18N);
  function escolherIdioma() {
    const pedir = (params.get('lang') || st.lang || navigator.language || 'pt-BR').toLowerCase();
    return LANGS.find((l) => l.toLowerCase() === pedir) || LANGS.find((l) => l.slice(0, 2) === pedir.slice(0, 2)) || 'pt-BR';
  }
  let lang = escolherIdioma();
  const T = (k, v) => {
    let s = (I18N[lang] && I18N[lang][k]) ?? (I18N['pt-BR'] || {})[k] ?? k;
    if (v && typeof s === 'string') for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b);
    return s;
  };
  function perguntasAtuais() {
    if (st.perguntas_i18n) return st.perguntas_i18n[lang] || st.perguntas_i18n['pt-BR'] || [];
    return st.perguntas || [];
  }
  let perguntas = perguntasAtuais();

  function aplicarIdioma() {
    document.documentElement.lang = lang;
    document.title = `${T('titulo')} • Irmandade Conhecimento com Luz`;
    $$('[data-t]').forEach((el) => { el.textContent = T(el.dataset.t); });
    $$('[data-th]').forEach((el) => { el.innerHTML = T(el.dataset.th); });
    $$('[data-tp]').forEach((el) => { el.placeholder = T(el.dataset.tp); });
    const tl = T('tr_l');
    $$('[data-tl]').forEach((el, i) => {
      const txt = Array.isArray(tl) ? tl[i] : '';
      if (el.tagName === 'SELECT') el.options[0].textContent = txt; else el.placeholder = txt;
    });
    $$('.digita').forEach((p) => { p.dataset.txt = p.textContent; });
    perguntas = perguntasAtuais();
  }
  const sel = $('#idioma');
  if (sel) {
    sel.innerHTML = LANGS.map((l) => `<option value="${l}">${I18N[l]._nome}</option>`).join('');
    sel.value = lang;
    sel.addEventListener('change', () => {
      lang = sel.value; st.lang = lang; gravar();
      aplicarIdioma();
      if (st.etapa) ir(st.etapa);
    });
  }

  function carregar() {
    try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (_) { return {}; }
  }
  function gravar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(st)); }
    catch (_) { // sem espaço: tira a selfie e tenta de novo
      try { const s = { ...st, selfie: null }; localStorage.setItem(CHAVE, JSON.stringify(s)); } catch (__) {}
    }
  }
  function erro(msg) { $('#erro').textContent = msg || ''; }
  function esperando(on, txt) {
    $('#esperando').hidden = !on;
    if (txt) $('#esperandoTxt').textContent = txt;
  }

  async function api(rota, corpo, binario) {
    let r;
    try {
      r = await fetch(API + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...corpo, idioma: lang }) });
    } catch (_) { throw new Error(T('e_rede')); }
    if (binario && r.ok) return r.blob();
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (!r.ok || j.ok === false) {
      const porStatus = { 401: 'e_sessao', 429: rota === '/solicitar' || rota === '/entrar' ? 'e_muitas' : 'e_limite',
        403: 'e_codigo', 502: rota === '/solicitar' ? 'e_email_envio' : 'e_guia', 500: rota === '/pdf' ? 'e_pdf' : 'e_guia' };
      const chave = porStatus[r.status];
      const msg = lang === 'pt-BR' ? (j.erro || T(chave || 'e_rede')) : T(chave || 'e_rede');
      const e = new Error(msg);
      e.status = r.status; e.usada = j.usada;
      throw e;
    }
    return j;
  }

  // ------------------------------------------------------------ navegação
  function ir(etapa) {
    erro('');
    $$('.etapa').forEach((d) => { d.hidden = d.id !== 'e-' + etapa; });
    const i = ORDEM.indexOf(etapa);
    $$('#trilha li').forEach((li, k) => {
      li.classList.toggle('agora', k === i);
      li.classList.toggle('feito', i > -1 && k < i);
    });
    $('#trilha').hidden = etapa === 'inicio' || etapa === 'usada';
    st.etapa = etapa; gravar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const div = $('#e-' + etapa);
    $$('.digita', div).forEach((p) => digitar(p, p.dataset.txt || (p.dataset.txt = p.textContent)));
    if (etapa === 'perguntas') mostrarPergunta();
    if (etapa === 'final') mostrarFinal();
    if (etapa === 'selfie') prepararSelfie();
    if (etapa === 'dados') preencherDados();
  }

  // ------------------------------------------------------------ datilografia e voz
  const digitando = new WeakMap();
  function digitar(el, texto, vel = 14) {
    return new Promise((ok) => {
      if (digitando.get(el)) clearInterval(digitando.get(el));
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = texto; return ok(); }
      el.textContent = ''; el.classList.add('cursor');
      let i = 0;
      const pular = () => { i = texto.length; };
      el.addEventListener('click', pular, { once: true });
      const t = setInterval(() => {
        i = Math.min(texto.length, i + 2);
        el.textContent = texto.slice(0, i);
        if (i >= texto.length) { clearInterval(t); el.classList.remove('cursor'); ok(); }
      }, vel);
      digitando.set(el, t);
    });
  }
  async function digitarParagrafos(caixa, texto) {
    caixa.innerHTML = '';
    for (const par of String(texto).split(/\n{2,}|\n/).map((s) => s.trim()).filter(Boolean)) {
      const p = document.createElement('p'); caixa.appendChild(p);
      await digitar(p, par, 10);
    }
  }
  function falar(texto) {
    if (!('speechSynthesis' in window)) return;
    if (speechSynthesis.speaking) { speechSynthesis.cancel(); return; }
    const u = new SpeechSynthesisUtterance(texto);
    const voz = T('_voz');
    u.lang = voz; u.rate = 0.98;
    const v = speechSynthesis.getVoices().find((x) => x.lang.replace('_', '-').toLowerCase() === voz.toLowerCase())
      || speechSynthesis.getVoices().find((x) => x.lang.slice(0, 2) === voz.slice(0, 2));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }

  // ------------------------------------------------------------ acesso
  async function pedirCodigo(email) {
    const f = $('#fPedir');
    const bt = $('button[type=submit]', f);
    bt.disabled = true; erro('');
    try {
      await api('/solicitar', { email, aceite: f.aceite.checked, novidades: f.novidades.checked });
      st.email = email; gravar();
      f.hidden = true; $('#fEntrar').hidden = false; $('#jaTenho').parentElement.hidden = true;
      $('#enviadoPara').textContent = T('enviadoPara', { e: email });
      $('#fEntrar').codigo.focus();
    } catch (e) {
      if (e.usada) { st.email = email; ir('usada'); } else erro(e.message);
    } finally { bt.disabled = false; }
  }
  $('#fPedir').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target, email = f.email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return erro(T('e_email'));
    if (!f.aceite.checked) return erro(T('e_aceite'));
    pedirCodigo(email);
  });
  $('#reenviar').addEventListener('click', () => {
    const f = $('#fPedir');
    if (!f.email.value && st.email) f.email.value = st.email;
    if (!f.aceite.checked) { f.hidden = false; $('#fEntrar').hidden = true; return erro(T('e_reconfirme')); }
    pedirCodigo(f.email.value.trim().toLowerCase());
  });
  $('#jaTenho').addEventListener('click', () => {
    const f = $('#fPedir');
    const email = f.email.value.trim().toLowerCase() || st.email || '';
    if (!email) { f.email.focus(); return erro(T('e_semEmail')); }
    st.email = email; gravar();
    f.hidden = true; $('#fEntrar').hidden = false; $('#jaTenho').parentElement.hidden = true;
    $('#enviadoPara').textContent = T('emailLabel', { e: email });
  });
  $('#fEntrar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const bt = $('button[type=submit]', ev.target);
    bt.disabled = true; erro('');
    try {
      const j = await api('/entrar', { email: st.email, codigo: ev.target.codigo.value });
      st.token = j.token; st.perguntas = j.perguntas; st.perguntas_i18n = j.perguntas_i18n || null; perguntas = perguntasAtuais();
      if (j.nome && !(st.dados && st.dados.nome)) st.dados = { ...(st.dados || {}), nome: j.nome };
      gravar(); ir('guia');
    } catch (e) {
      if (e.usada) ir('usada'); else erro(e.message);
    } finally { bt.disabled = false; }
  });
  $('#outroEmail').addEventListener('click', () => { st = {}; gravar(); location.reload(); });

  // ------------------------------------------------------------ guia
  $$('.guia').forEach((b) => b.addEventListener('click', () => { st.guia = b.dataset.guia; gravar(); ir('selfie'); }));

  // ------------------------------------------------------------ selfie
  let stream = null;
  function pararCamera() { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
  function prepararSelfie() {
    const foto = $('#foto');
    if (st.selfie) { foto.src = st.selfie; foto.hidden = false; $('#semFoto').hidden = true; $('#usarFoto').hidden = false; }
  }
  function mostrarFoto(dataUrl) {
    st.selfie = dataUrl; gravar();
    pararCamera();
    $('#video').hidden = true; $('#tirar').hidden = true;
    const foto = $('#foto'); foto.src = dataUrl; foto.hidden = false; $('#semFoto').hidden = true;
    $('#usarFoto').hidden = false; $('#abrirCamera').hidden = false; $('#abrirCamera').textContent = T('tirarOutra');
  }
  function recortar(src, w, h, espelhar) {
    const c = document.createElement('canvas'); c.width = 480; c.height = 640;
    const x = c.getContext('2d');
    const esc = Math.max(c.width / w, c.height / h);
    const dw = w * esc, dh = h * esc;
    if (espelhar) { x.translate(c.width, 0); x.scale(-1, 1); }
    x.drawImage(src, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    return c.toDataURL('image/jpeg', 0.82);
  }
  $('#abrirCamera').addEventListener('click', async () => {
    erro('');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 720 } }, audio: false });
      const v = $('#video'); v.srcObject = stream; v.hidden = false; await v.play();
      $('#foto').hidden = true; $('#semFoto').hidden = true;
      $('#tirar').hidden = false; $('#abrirCamera').hidden = true; $('#usarFoto').hidden = true;
    } catch (_) { erro(T('e_camera')); }
  });
  $('#tirar').addEventListener('click', () => {
    const v = $('#video');
    mostrarFoto(recortar(v, v.videoWidth, v.videoHeight, true));
  });
  $('#arquivo').addEventListener('change', (ev) => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    const img = new Image();
    img.onload = () => { mostrarFoto(recortar(img, img.naturalWidth, img.naturalHeight, false)); URL.revokeObjectURL(img.src); };
    img.onerror = () => erro(T('e_imagem'));
    img.src = URL.createObjectURL(f);
  });
  $('#usarFoto').addEventListener('click', () => { pararCamera(); ir('dados'); });
  $('#semSelfie').addEventListener('click', () => { pararCamera(); st.selfie = null; gravar(); ir('dados'); });

  // ------------------------------------------------------------ dados
  function preencherDados() {
    const f = $('#fDados'), d = st.dados || {};
    ['nome', 'cidade', 'estado', 'profissao'].forEach((k) => { if (d[k] && !f[k].value) f[k].value = d[k]; });
  }
  $('#fDados').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target;
    const d = {};
    ['nome', 'cidade', 'estado', 'profissao'].forEach((k) => { d[k] = f[k].value.trim().slice(0, 120); });
    if (d.nome.length < 2) { f.nome.focus(); return erro(T('e_nome')); }
    st.dados = d; st.itens = st.itens || []; st.idx = st.idx || 0; gravar();
    ir('perguntas');
  });

  // ------------------------------------------------------------ perguntas
  function mostrarPergunta() {
    if (!perguntas.length) return ir('acesso');
    const i = Math.min(st.idx || 0, perguntas.length - 1);
    const p = perguntas[i];
    $('#qBloco').textContent = p.bloco;
    $('#qNum').textContent = T('perguntaN', { i: i + 1, n: perguntas.length });
    digitar($('#qTexto'), p.texto, 16);
    const it = (st.itens || [])[i] || {};
    const f = $('#fResp');
    f.resposta.value = it.resposta || '';
    if (it.devolutiva) {
      f.hidden = true; mostrarDevolutiva(it.devolutiva, false);
    } else {
      f.hidden = false; $('#qDev').hidden = true; $('#qQuadro').hidden = true;
    }
  }
  function mostrarDevolutiva(txt, animar) {
    const nome = NOMES[st.guia] || 'Mentor';
    $('#qQuem').textContent = T('responde', { g: nome });
    const it = (st.itens || [])[st.idx || 0] || {};
    $('#qSua').textContent = it.resposta ? `${T('voceRespondeu')} “${it.resposta}”` : '';
    $('#qDev').hidden = false;
    const caixa = $('#qDevTexto');
    if (animar) digitarParagrafos(caixa, txt);
    else caixa.innerHTML = String(txt).split(/\n+/).filter(Boolean).map((t) => `<p>${t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>`).join('');
    $('#proxima').textContent = (st.idx || 0) >= perguntas.length - 1 ? T('verGeral') : T('proxima');
    mostrarQuadrinho($('#qQuadro'), st.idx || 0);
  }
  $('#fResp').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.target, resposta = f.resposta.value.trim();
    if (resposta.length < 3) return erro(T('e_resposta'));
    const i = st.idx || 0;
    const bt = $('button', f); bt.disabled = true; erro('');
    esperando(true, T('refletindo', { g: NOMES[st.guia] || 'Mentor' }));
    try {
      const j = await api('/devolutiva', { token: st.token, guia: st.guia, nome: st.dados.nome, dadosPessoais: st.dados, indice: i, resposta });
      st.itens = st.itens || [];
      st.itens[i] = { resposta, devolutiva: j.texto }; gravar();
      f.hidden = true; mostrarDevolutiva(j.texto, true);
    } catch (e) {
      if (e.status === 401) { st.token = null; gravar(); ir('acesso'); }
      erro(e.message);
    } finally { bt.disabled = false; esperando(false); }
  });
  $('#proxima').addEventListener('click', () => {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if ((st.idx || 0) >= perguntas.length - 1) return ir('final');
    st.idx = (st.idx || 0) + 1; gravar(); mostrarPergunta(); window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  $('#ouvir').addEventListener('click', () => falar($('#qDevTexto').innerText));

  // ------------------------------------------------------------ quadrinho (um por e-mail)
  // A imagem fica numa chave própria: se não couber no aparelho, vale só nesta visita.
  const CHAVE_Q = 'jornada_free_quadrinho';
  let qImagem = null;
  try { qImagem = localStorage.getItem(CHAVE_Q); } catch (_) {}
  const escHtml = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function figuraQuadrinho(caixa) {
    caixa.innerHTML = `<p class="q-aviso"><b>${escHtml(T('q_titulo'))}</b></p><figure><img alt=""><figcaption></figcaption></figure>
      <div class="acoes"><button type="button" class="botao secundario q-baixar"></button></div>`;
    caixa.querySelector('img').src = qImagem;
    caixa.querySelector('figcaption').textContent = st.quadrinho.legenda || '';
    const b = caixa.querySelector('.q-baixar'); b.textContent = T('q_baixar');
    b.onclick = () => { const a = document.createElement('a'); a.href = qImagem; a.download = 'meu-quadrinho-jornada-free.png'; document.body.appendChild(a); a.click(); a.remove(); };
  }
  function mostrarQuadrinho(caixa, i) {
    if (!caixa) return;
    const q = st.quadrinho;
    caixa.hidden = false;
    if (q && q.imagem && qImagem && (i === null || q.idx === i)) return figuraQuadrinho(caixa);
    if (i === null) { caixa.hidden = true; return; }   // no final, só aparece se houver quadrinho
    if (q) {   // já escolheu outra pergunta (ou já usou neste e-mail)
      caixa.innerHTML = `<p class="q-nota">${T(q.imagem ? 'q_outra' : 'q_usado')}</p>`;
      return;
    }
    caixa.innerHTML = `<p class="q-aviso">${T('q_aviso')}</p>
      <div class="acoes"><button type="button" class="botao q-pedir"></button></div>
      <p class="q-nota"></p>`;
    caixa.querySelector('.q-pedir').textContent = T('q_botao');
    caixa.querySelector('.q-nota').textContent = st.selfie ? T('q_selfie') : T('q_semSelfie');
    caixa.querySelector('.q-pedir').onclick = (ev) => pedirQuadrinho(ev.currentTarget, caixa, i);
  }
  async function pedirQuadrinho(bt, caixa, i) {
    const it = (st.itens || [])[i] || {};
    bt.disabled = true; erro('');
    esperando(true, T('q_desenhando'));
    try {
      const j = await api('/quadrinho', { token: st.token, indice: i, resposta: it.resposta || '', devolutiva: it.devolutiva || '',
        selfie: st.selfie || null, consentimento: !!st.selfie });
      qImagem = j.imagem;
      st.quadrinho = { idx: i, imagem: true, legenda: j.legenda || '' }; gravar();
      try { localStorage.setItem(CHAVE_Q, j.imagem); } catch (_) {}
      figuraQuadrinho(caixa);
    } catch (e) {
      if (e.status === 401) { st.token = null; gravar(); return ir('acesso'); }
      if (e.status === 409) { st.quadrinho = { idx: -1, imagem: false }; gravar(); mostrarQuadrinho(caixa, i); return; }
      erro(e.message); bt.disabled = false;
    } finally { esperando(false); }
  }

  // ------------------------------------------------------------ final
  async function mostrarFinal() {
    mostrarQuadrinho($('#fQuadro'), null);
    $('#fQuem').textContent = T('falaComVoce', { g: NOMES[st.guia] || 'Mentor' });
    if (st.final) {
      $('#fDevTexto').innerHTML = st.final.split(/\n+/).filter(Boolean).map((t) => `<p>${t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>`).join('');
      $('#fimAcoes').hidden = false; $('#ouvirFinal').hidden = false;
      return;
    }
    $('#fDevTexto').innerHTML = '';
    esperando(true, T('reunindo', { g: NOMES[st.guia] || 'Mentor' }));
    try {
      const j = await api('/devolutiva-final', { token: st.token, guia: st.guia, nome: st.dados.nome, dadosPessoais: st.dados, itens: st.itens });
      st.final = j.texto; gravar();
      esperando(false);
      await digitarParagrafos($('#fDevTexto'), j.texto);
      $('#fimAcoes').hidden = false; $('#ouvirFinal').hidden = false;
    } catch (e) {
      esperando(false);
      if (e.status === 401) { st.token = null; gravar(); return ir('acesso'); }
      erro(e.message + ' ');
      const b = document.createElement('button'); b.className = 'link'; b.textContent = T('tentar');
      b.onclick = () => { erro(''); mostrarFinal(); }; $('#erro').appendChild(b);
    }
  }
  $('#ouvirFinal').addEventListener('click', () => falar($('#fDevTexto').innerText));
  $('#gerarPdf').addEventListener('click', async (ev) => {
    const bt = ev.currentTarget; bt.disabled = true; erro('');
    $('#pdfMsg').textContent = T('preparando');
    try {
      const blob = await api('/pdf', { token: st.token, guia: st.guia, nome: st.dados.nome, dadosPessoais: st.dados,
        itens: st.itens, devolutivaFinal: st.final, selfie: st.selfie || null }, true);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${T('titulo').replace(/\s+/g, '-')}-${(st.dados.nome || 'viajante').split(' ')[0]}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      st.concluida = true; st.concluidaEm = Date.now(); gravar();
      $('#pdfMsg').textContent = T('prontoPdf', { e: st.email });
      bt.textContent = T('baixarDeNovo');
    } catch (e) {
      $('#pdfMsg').textContent = '';
      if (e.usada) { encerrar(); return ir('usada'); }
      erro(e.status === 401 ? T('e_sessao') : e.message);
    } finally { bt.disabled = false; }
  });

  // ------------------------------------------------------------ início
  $$('[data-ir]').forEach((b) => b.addEventListener('click', () => ir(b.dataset.ir)));
  $('#recomecar').addEventListener('click', () => {
    if (!confirm(T('confirmRecomecar'))) return;
    try { localStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE_Q); } catch (_) {}
    location.reload();
  });

  // Jornada concluída: ao reabrir a página, o aparelho volta limpo para o começo
  function encerrar() {
    const manter = { lang: st.lang };
    st = manter;
    try { localStorage.setItem(CHAVE, JSON.stringify(manter)); localStorage.removeItem(CHAVE_Q); } catch (_) {}
  }
  if (st.concluida) encerrar();
  $$('a.compra').forEach((a) => { a.href = LINK_COMPRA; });

  aplicarIdioma();
  const etapaSalva = st.etapa;
  if (etapaSalva && etapaSalva !== 'inicio' && (st.token || ['acesso', 'usada'].includes(etapaSalva))) {
    if (etapaSalva === 'acesso' && st.email) $('#fPedir').email.value = st.email;
    ir(etapaSalva);
  } else {
    ir('inicio');
  }
})();
