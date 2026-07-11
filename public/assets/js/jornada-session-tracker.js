/* ============================================
   jornada-session-tracker.js — v2.0
   Tracker blindado de sessão da Jornada

   ✔ session_token
   ✔ device_hash
   ✔ retomada automática
   ✔ countdown regressivo
   ✔ snapshot incremental
   ✔ antifraude básico
   ✔ sincronização backend
============================================ */

;(function () {
  'use strict';

  const STORAGE_KEY   = 'jornada_session_v2';
  const SNAPSHOT_KEY  = 'jornada_snapshot_v2';
  const AUTH_KEY      = 'jornada_auth';

  const TOTAL_HOURS   = 72;
  const TICK_INTERVAL = 60 * 1000;

  // ============================================
  // UTILITÁRIOS
  // ============================================

  const now = () => Date.now();

  const hToMs = (h) => h * 3600000;

  const msToH = (ms) => ms / 3600000;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function save(v) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v || {}));
  }

  function loadSnapshot() {
    try {
      return JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveSnapshot(v) {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(v || {}));
  }

  // ============================================
  // DEVICE HASH
  // ============================================

  async function gerarDeviceHash() {
    const raw = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      navigator.platform
    ].join('|');

    const enc = new TextEncoder().encode(raw);

    const hashBuffer = await crypto.subtle.digest('SHA-256', enc);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================
  // TOKEN
  // ============================================

  function gerarToken() {
    return (
      Math.random().toString(36).substring(2) +
      Date.now().toString(36)
    );
  }

  // ============================================
  // ID DA JORNADA
  // ============================================

  function gerarJornadaId() {
    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    return 'JRN-' + seq;
  }

  // ============================================
  // INICIAR SESSÃO
  // ============================================

  async function iniciarSessao(opts = {}) {

    const existente = load();

    if (
      existente.jornadaId &&
      existente.deadline_at &&
      existente.deadline_at > now()
    ) {
      return existente;
    }

    const device_hash = await gerarDeviceHash();

    const sessao = {
      jornadaId: gerarJornadaId(),

      session_token: gerarToken(),

      email: opts.email || '',

      criado_em: now(),

      ultimo_acesso: now(),

      deadline_at: now() + hToMs(TOTAL_HOURS),

      horas_totais: TOTAL_HOURS,

      horas_usadas: 0,

      bloco_atual: 0,

      status: 'ativo',

      concluido: false,

      device_hash,

      warned_hours: []
    };

    save(sessao);

    await sincronizar(sessao);

    iniciarContador();

    return sessao;
  }

  // ============================================
  // RETOMAR SESSÃO
  // ============================================

  async function retomarSessao() {

    const st = load();

    if (!st.jornadaId) return null;

    const agora = now();

    if (st.ultimo_acesso) {

      const decorrido = agora - st.ultimo_acesso;

      st.horas_usadas += msToH(decorrido);
    }

    st.ultimo_acesso = agora;

    save(st);

    await sincronizar(st);

    iniciarContador();

    return st;
  }

  // ============================================
  // SALVAR BLOCO
  // ============================================

  async function salvarBloco(numeroBlocoAtual) {

    const st = load();

    if (!st.jornadaId) return;

    st.bloco_atual = numeroBlocoAtual;

    st.ultimo_acesso = now();

    save(st);

    await sincronizar(st);
  }

  // ============================================
  // SNAPSHOT
  // ============================================

  async function salvarSnapshot(chave, dados) {

    const snap = loadSnapshot();

    snap[chave] = dados;

    snap._updated_at = now();

    saveSnapshot(snap);

    const st = load();

    if (st.jornadaId) {
      await sincronizar(st, snap);
    }
  }

  // ============================================
  // CONCLUIR
  // ============================================

  async function concluirJornada() {

    const st = load();

    if (!st.jornadaId) return;

    st.status = 'concluido';

    st.concluido = true;

    st.concluido_em = now();

    save(st);

    await sincronizar(st);

    pararContador();
  }

  // ============================================
  // HORAS RESTANTES
  // ============================================

  function horasRestantes() {

    const st = load();

    if (!st.deadline_at) return TOTAL_HOURS;

    const left = Math.max(0, st.deadline_at - now());

    return Math.floor(msToH(left));
  }

  // ============================================
  // CONTADOR
  // ============================================

  let timer = null;

  function iniciarContador() {

    pararContador();

    tick();

    timer = setInterval(tick, TICK_INTERVAL);
  }

  function pararContador() {

    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function tick() {

    const horas = horasRestantes();

    const el = document.querySelector(
      '#jornada-countdown, .jornada-countdown'
    );

    if (el) {

      if (horas <= 0) {
        el.textContent = 'Prazo encerrado';
      } else {
        el.textContent = `${horas}h restantes`;
      }
    }

    emitirAviso(horas);
  }

  // ============================================
  // AVISOS
  // ============================================

  function emitirAviso(horas) {

    const st = load();

    if (!Array.isArray(st.warned_hours)) {
      st.warned_hours = [];
    }

    const marcos = [48, 24, 12, 6, 2, 1];

    for (const marco of marcos) {

      if (
        horas <= marco &&
        !st.warned_hours.includes(marco)
      ) {

        st.warned_hours.push(marco);

        save(st);

        toast(
          `Você possui ${horas}h restantes para concluir sua jornada.`,
          horas <= 6 ? 'urgente' : 'normal'
        );

        break;
      }
    }
  }

  // ============================================
  // TOAST
  // ============================================

  function toast(msg, tipo = 'normal') {

    const el = document.createElement('div');

    el.textContent = msg;

    el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      background: ${
        tipo === 'urgente'
          ? 'rgba(180,20,20,.95)'
          : 'rgba(20,20,50,.95)'
      };
      color: #fff;
      padding: 14px 22px;
      border-radius: 12px;
      z-index: 999999;
      font-size: 14px;
      box-shadow: 0 4px 18px rgba(0,0,0,.35);
    `;

    document.body.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, 5000);
  }

  // ============================================
  // BACKEND
  // ============================================

  async function sincronizar(sessao, snapshot = null) {

    try {

      const apiBase = (
        window.API_BASE ||
        window.APP_CONFIG?.API_BASE ||
        '/api'
      ).replace(/\/$/, '');

      await fetch(`${apiBase}/session/sync`, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          jornadaId: sessao.jornadaId,

          session_token: sessao.session_token,

          email: sessao.email,

          bloco_atual: sessao.bloco_atual,

          horas_usadas: sessao.horas_usadas,

          deadline_at: sessao.deadline_at,

          status: sessao.status,

          concluido: sessao.concluido,

          device_hash: sessao.device_hash,

          snapshot
        })
      });

    } catch (err) {

      console.warn(
        '[JORNADA_SESSION] Falha silenciosa sync:',
        err
      );
    }
  }

  // ============================================
  // API GLOBAL
  // ============================================

  window.JORNADA_SESSION = {

    iniciarSessao,

    retomarSessao,

    salvarBloco,

    salvarSnapshot,

    concluirJornada,

    horasRestantes
  };

  // ============================================
  // AUTO RETOMADA
  // ============================================

  document.addEventListener('DOMContentLoaded', async () => {

    const st = load();

    if (
      st.jornadaId &&
      st.deadline_at &&
      st.deadline_at > now() &&
      !st.concluido
    ) {

      await retomarSessao();

      toast(
        `Você possui ${horasRestantes()}h restantes para concluir a jornada.`,
        'normal'
      );
    }
  });

})();
