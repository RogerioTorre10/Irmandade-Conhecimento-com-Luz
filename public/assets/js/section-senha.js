// section-senha.js — v15 (datilografia+leitura, botões OK, transição de vídeo)
// - Reativa datilografia (local) + leitura (c/ teto) p/ p1..p4
// - Prev/Next: volta p/ termos e avança p/ vídeo de transição => selfie
// - Chute apenas quando a seção realmente aparece (section:shown) + fallback
// - Anti-invasão: aborta sequência se trocar de seção

(function () {
  'use strict';

  // Evita dupla carga
  if (window.JCSenha?.__bound_v15) {
    window.JCSenha.__kick?.(true);
    return;
  }

  // ===== Config finos =====
  const TYPE_MS = 34;             // velocidade de datilografia (ms/char)
  const PAUSE_BETWEEN_P = 60;     // pausa mínima entre parágrafos
  const SPEAK_HARD_CAP_MS = 1700; // teto de fala por parágrafo
  const RE
