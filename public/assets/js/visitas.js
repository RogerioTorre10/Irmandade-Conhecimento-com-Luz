// /assets/js/visitas.js — contador de visitas da Irmandade (v1)
// Avisa o backend, de forma silenciosa, cada página aberta no site.
// Não grava nome, e-mail, IP nem nada do conteúdo da Jornada.
// Se algo falhar aqui, o site continua normalmente.
;(function () {
  'use strict';
  try {
    var host = location.hostname || '';
    if (!host || host === 'localhost' || host === '127.0.0.1') return;

    // Aparelho marcado como "não contar" (o painel marca o aparelho do administrador).
    var ls = null;
    try { ls = window.localStorage; } catch (_) {}
    try { if (ls && ls.getItem('ICL_NAO_CONTAR') === '1') return; } catch (_) {}

    var isHomolog = /-1\.onrender\.com$|homolog/i.test(host);
    var API = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ||
      (isHomolog ? 'https://lumen-backend-homolog.onrender.com/api'
                 : 'https://lumen-backend-api.onrender.com/api');
    var URL_REG = String(API).replace(/\/+$/, '') + '/visitas/registrar';

    function rid() {
      try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (_) {}
      return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    }
    function pegar(store, chave) {
      try {
        var v = store && store.getItem(chave);
        if (!v) { v = rid(); store && store.setItem(chave, v); }
        return v;
      } catch (_) { return ''; }
    }
    var ss = null;
    try { ss = window.sessionStorage; } catch (_) {}
    var visitante = pegar(ls, 'ICL_VISITANTE');
    var sessao = pegar(ss, 'ICL_SESSAO');

    var dentroHotmart = false;
    try { dentroHotmart = window.top !== window.self; } catch (_) { dentroHotmart = true; }
    if (!dentroHotmart && /hotmart/i.test(document.referrer || '')) dentroHotmart = true;

    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}
    var celular = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');

    function enviar(evento, extra) {
      try {
        var dados = {
          e: evento, p: location.pathname, h: host, v: visitante, s: sessao,
          l: navigator.language || '', tz: tz, m: celular,
          r: document.referrer || '', hm: dentroHotmart, wd: !!navigator.webdriver
        };
        if (extra) for (var k in extra) dados[k] = extra[k];
        var corpo = JSON.stringify(dados);
        // text/plain evita a pré-verificação de CORS e não atrasa a página
        if (navigator.sendBeacon && navigator.sendBeacon(URL_REG, new Blob([corpo], { type: 'text/plain' }))) return;
        fetch(URL_REG, { method: 'POST', body: corpo, keepalive: true, mode: 'cors',
          headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
      } catch (_) {}
    }

    // 1) Página aberta
    enviar('pagina');

    // 2) Cliques em links para fora do site (ex.: loja dos livros, Hotmart)
    document.addEventListener('click', function (ev) {
      try {
        var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
        if (!a) return;
        var u = new URL(a.href, location.href);
        if (u.hostname && u.hostname !== host && /^https?:$/.test(u.protocol)) {
          enviar('clique_externo', { d: u.href });
        }
      } catch (_) {}
    }, true);

    // 3) Etapas da Jornada (cada etapa conta uma vez por sessão)
    var enviadas = {};
    document.addEventListener('section:shown', function (ev) {
      try {
        var id = String((ev.detail && ev.detail.sectionId) || '').slice(0, 60);
        if (!id || enviadas[id]) return;
        enviadas[id] = true;
        var chave = 'ICL_ETAPA_' + id;
        if (ss && ss.getItem(chave) === '1') return;
        ss && ss.setItem(chave, '1');
        enviar('etapa', { et: id });
      } catch (_) {}
    });
  } catch (_) {}
})();
