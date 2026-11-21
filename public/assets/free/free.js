// /assets/free/free.js — Jornada Free (independente da Jornada Essencial)
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const params = new URLSearchParams(location.search);
  const API = (params.get('api') || 'https://lumen-backend-api.onrender.com').replace(/\/$/, '') + '/api/free';
  const CHAVE = 'jornada_free_v1';
  const NOMES = { lumen: 'Lumen', zion: 'Zion', arian: 'Arian' };
  const ORDEM = ['acesso', 'guia', 'selfie', 'dados', 'perguntas', 'final'];

  let st = carregar();
  let perguntas = st.perguntas || [];

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
    const r = await fetch(API + rota, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
    if (binario && r.ok) return r.blob();
    let j = {};
    try { j = await r.json(); } catch (_) {}
    if (!r.ok || j.ok === false) {
      const e = new Error(j.erro || 'Não foi possível falar com a Irmandade agora. Tente de novo.');
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
    u.lang = 'pt-BR'; u.rate = 0.98;
    const v = speechSynthesis.getVoices().find((x) => /pt(-|_)BR/i.test(x.lang));
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
      $('#enviadoPara').textContent = `✉️ Enviamos o seu código para ${email}.`;
      $('#fEntrar').codigo.focus();
    } catch (e) {
      if (e.usada) { st.email = email; ir('usada'); } else erro(e.message);
    } finally { bt.disabled = false; }
  }
  $('#fPedir').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = ev.target, email = f.email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return erro('Confira o seu e-mail.');
    if (!f.aceite.checked) return erro('Para continuar, aceite os termos e a política de privacidade.');
    pedirCodigo(email);
  });
  $('#reenviar').addEventListener('click', () => {
    const f = $('#fPedir');
    if (!f.email.value && st.email) f.email.value = st.email;
    if (!f.aceite.checked) { f.hidden = false; $('#fEntrar').hidden = true; return erro('Confirme o aceite e peça o código de novo.'); }
    pedirCodigo(f.email.value.trim().toLowerCase());
  });
  $('#jaTenho').addEventListener('click', () => {
    const f = $('#fPedir');
    const email = f.email.value.trim().toLowerCase() || st.email || '';
    if (!email) { f.email.focus(); return erro('Escreva primeiro o seu e-mail.'); }
    st.email = email; gravar();
    f.hidden = true; $('#fEntrar').hidden = false; $('#jaTenho').parentElement.hidden = true;
    $('#enviadoPara').textContent = `E-mail: ${email}`;
  });
  $('#fEntrar').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const bt = $('button[type=submit]', ev.target);
    bt.disabled = true; erro('');
    try {
      const j = await api('/entrar', { email: st.email, codigo: ev.target.codigo.value });
      st.token = j.token; st.perguntas = perguntas = j.perguntas;
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
    $('#usarFoto').hidden = false; $('#abrirCamera').hidden = false; $('#abrirCamera').textContent = 'Tirar outra';
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
    } catch (_) { erro('Não foi possível abrir a câmera. Você pode escolher uma foto ou seguir sem foto.'); }
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
    img.onerror = () => erro('Não consegui abrir essa imagem.');
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
    if (d.nome.length < 2) { f.nome.focus(); return erro('Escreva o seu nome.'); }
    st.dados = d; st.itens = st.itens || []; st.idx = st.idx || 0; gravar();
    ir('perguntas');
  });

  // ------------------------------------------------------------ perguntas
  function mostrarPergunta() {
    if (!perguntas.length) return ir('acesso');
    const i = Math.min(st.idx || 0, perguntas.length - 1);
    const p = perguntas[i];
    $('#qBloco').textContent = p.bloco;
    $('#qNum').textContent = `Pergunta ${i + 1} de ${perguntas.length}`;
    digitar($('#qTexto'), p.texto, 16);
    const it = (st.itens || [])[i] || {};
    const f = $('#fResp');
    f.resposta.value = it.resposta || '';
    if (it.devolutiva) {
      f.hidden = true; mostrarDevolutiva(it.devolutiva, false);
    } else {
      f.hidden = false; $('#qDev').hidden = true;
    }
  }
  function mostrarDevolutiva(txt, animar) {
    const nome = NOMES[st.guia] || 'Guia';
    $('#qQuem').textContent = `${nome} responde:`;
    const it = (st.itens || [])[st.idx || 0] || {};
    $('#qSua').textContent = it.resposta ? `Você respondeu: “${it.resposta}”` : '';
    $('#qDev').hidden = false;
    const caixa = $('#qDevTexto');
    if (animar) digitarParagrafos(caixa, txt);
    else caixa.innerHTML = String(txt).split(/\n+/).filter(Boolean).map((t) => `<p>${t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>`).join('');
    $('#proxima').textContent = (st.idx || 0) >= perguntas.length - 1 ? 'Ver a devolutiva geral' : 'Próxima pergunta';
  }
  $('#fResp').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const f = ev.target, resposta = f.resposta.value.trim();
    if (resposta.length < 3) return erro('Escreva a sua resposta antes de enviar.');
    const i = st.idx || 0;
    const bt = $('button', f); bt.disabled = true; erro('');
    esperando(true, `${NOMES[st.guia] || 'O Guia'} está refletindo sobre a sua resposta…`);
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

  // ------------------------------------------------------------ final
  async function mostrarFinal() {
    $('#fQuem').textContent = `${NOMES[st.guia] || 'O Guia'} fala com você:`;
    if (st.final) {
      $('#fDevTexto').innerHTML = st.final.split(/\n+/).filter(Boolean).map((t) => `<p>${t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</p>`).join('');
      $('#fimAcoes').hidden = false; $('#ouvirFinal').hidden = false;
      return;
    }
    $('#fDevTexto').innerHTML = '';
    esperando(true, `${NOMES[st.guia] || 'O Guia'} está reunindo as suas três respostas…`);
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
      const b = document.createElement('button'); b.className = 'link'; b.textContent = 'Tentar de novo';
      b.onclick = () => { erro(''); mostrarFinal(); }; $('#erro').appendChild(b);
    }
  }
  $('#ouvirFinal').addEventListener('click', () => falar($('#fDevTexto').innerText));
  $('#gerarPdf').addEventListener('click', async (ev) => {
    const bt = ev.currentTarget; bt.disabled = true; erro('');
    $('#pdfMsg').textContent = 'Preparando o seu pergaminho…';
    try {
      const blob = await api('/pdf', { token: st.token, guia: st.guia, nome: st.dados.nome, dadosPessoais: st.dados,
        itens: st.itens, devolutivaFinal: st.final, selfie: st.selfie || null }, true);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `Pergaminho-Jornada-Free-${(st.dados.nome || 'viajante').split(' ')[0]}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      st.concluida = true; gravar();
      $('#pdfMsg').textContent = `Pronto! O pergaminho foi baixado e também enviado para ${st.email}.`;
      bt.textContent = '📜 Baixar de novo';
    } catch (e) {
      $('#pdfMsg').textContent = '';
      erro(e.status === 401 ? 'Sessão expirada. Entre de novo com o seu código.' : e.message);
    } finally { bt.disabled = false; }
  });

  // ------------------------------------------------------------ início
  $$('[data-ir]').forEach((b) => b.addEventListener('click', () => ir(b.dataset.ir)));
  $('#recomecar').addEventListener('click', () => {
    if (!confirm('Recomeçar apaga as respostas guardadas neste aparelho. Continuar?')) return;
    try { localStorage.removeItem(CHAVE); } catch (_) {}
    location.reload();
  });

  const etapaSalva = st.etapa;
  if (etapaSalva && etapaSalva !== 'inicio' && (st.token || ['acesso', 'usada'].includes(etapaSalva))) {
    if (etapaSalva === 'acesso' && st.email) $('#fPedir').email.value = st.email;
    ir(etapaSalva);
  } else {
    ir('inicio');
  }
})();
