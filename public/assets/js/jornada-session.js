// =====================================================
// JORNADA SESSION ENGINE v1.0
// Irmandade Conhecimento com Luz
// =====================================================

(function () {
  'use strict';

  const API =
    window.APP_CONFIG?.API_BASE ||
    'https://lumen-backend-api.onrender.com/api';

  const STORAGE = {
    EMAIL: 'jornada_email',
    CODIGO: 'jornada_codigo',
    DEVICE: 'jornada_device_hash',
    LAST_SAVE: 'jornada_last_save'
  };

  // =====================================================
  // HASH DEVICE
  // =====================================================

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest('SHA-256', enc);

    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function generateDeviceHash() {
    const existing = localStorage.getItem(STORAGE.DEVICE);
    if (existing) return existing;

    const raw = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join('|');

    const hash = await sha256(raw);

    localStorage.setItem(STORAGE.DEVICE, hash);

    return hash;
  }

  function toIntSafe(value) {
  if (value == null) return 0;

  const first =
    String(value)
      .split('/')[0]
      .replace(/[^\d]/g, '');

  return Number(first) || 0;
}

  // =====================================================
  // PAYLOAD
  // =====================================================

  function buildPayload(extra = {}) {
  const progressObj =
    JSON.parse(
      sessionStorage.getItem('JORNADA_PROGRESS') || '{}'
    );

  if (progressObj.total) {
    progressObj.total = toIntSafe(progressObj.total);
  }

  if (progressObj.pergunta) {
    progressObj.pergunta = toIntSafe(progressObj.pergunta);
  }

  return {
    email:
      localStorage.getItem(STORAGE.EMAIL) ||
      localStorage.getItem('jornada_email') ||
      '',

    codigo_jornada:
      localStorage.getItem(STORAGE.CODIGO) || '',

    last_section:
      localStorage.getItem('jornada_last_section') ||
      'section-intro',

    last_block:
      localStorage.getItem('jornada_last_block') || '',

    last_question:
      toIntSafe(
        extra.last_question ||
        localStorage.getItem('jornada_last_question')
      ),

    progresso_json_temp: {
      guia: sessionStorage.getItem('jornada.guia'),

      idioma:
        localStorage.getItem('i18n_lang') ||
        window.i18n?.lang ||
        'pt-BR',

      respostas:
        JSON.parse(
          sessionStorage.getItem('JORNADA_RESPOSTAS') || '{}'
        ),

      progresso: progressObj,

      dados:
        JSON.parse(
          sessionStorage.getItem('JORNADA_DADOS') || '{}'
        )
    },

    ...extra
  };
}

  // =====================================================
  // SAVE
  // =====================================================

  async function salvar(extra = {}) {
    try {
      const deviceHash = await generateDeviceHash();

      const payload = buildPayload({
        device_hash: deviceHash,
        ...extra
      });

      if (!payload.email) {
        console.warn('[SESSION] email ausente');
        return;
      }

      const res = await fetch(
        `${API}/jornada/progresso/salvar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      console.log('[SESSION][SAVE]', data);

      if (data?.codigo_jornada) {
        localStorage.setItem(
          STORAGE.CODIGO,
          data.codigo_jornada
        );
      }

      localStorage.setItem(
        STORAGE.LAST_SAVE,
        String(Date.now())
      );

      return data;

    } catch (err) {
      console.error('[SESSION][SAVE][ERRO]', err);
    }
  }

  // =====================================================
  // RETOMAR
  // =====================================================

  async function retomar() {
    try {
      const email =
        localStorage.getItem(STORAGE.EMAIL);

      if (!email) return null;

      const deviceHash =
        await generateDeviceHash();

      const payload = {
        email,
        codigo_jornada:
          localStorage.getItem(STORAGE.CODIGO) || '',
        device_hash: deviceHash
      };

      const res = await fetch(
        `${API}/jornada/progresso/retomar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      console.log('[SESSION][RETOMAR]', data);

      if (!data?.retomar) {
        return null;
      }

      // =====================================================
      // RESTORE STORAGE
      // =====================================================

      if (data.codigo_jornada) {
        localStorage.setItem(
          STORAGE.CODIGO,
          data.codigo_jornada
        );
      }

      if (data.last_section) {
        localStorage.setItem(
          'jornada_last_section',
          data.last_section
        );
      }

      if (data.last_block) {
        localStorage.setItem(
          'jornada_last_block',
          data.last_block
        );
      }

      if (data.last_question != null) {
        localStorage.setItem(
          'jornada_last_question',
          String(data.last_question)
        );
      }

      const p =
        data.progresso_json_temp || {};

      if (p.respostas) {
        sessionStorage.setItem(
          'JORNADA_RESPOSTAS',
          JSON.stringify(p.respostas)
        );
      }

      if (p.progresso) {
        sessionStorage.setItem(
          'JORNADA_PROGRESS',
          JSON.stringify(p.progresso)
        );
      }

      if (p.dados) {
        sessionStorage.setItem(
          'JORNADA_DADOS',
          JSON.stringify(p.dados)
        );
      }

      if (p.guia) {
        sessionStorage.setItem(
          'jornada.guia',
          p.guia
        );
      }

      return data;

    } catch (err) {
      console.error('[SESSION][RETOMAR][ERRO]', err);
      return null;
    }
  }

  // =====================================================
  // FINALIZAR
  // =====================================================

  async function finalizar(extra = {}) {
    try {
      const deviceHash =
        await generateDeviceHash();

      const payload = {
        email:
          localStorage.getItem(STORAGE.EMAIL),

        codigo_jornada:
          localStorage.getItem(STORAGE.CODIGO),

        device_hash: deviceHash,

        pdf_enviado: true,
        email_enviado: true,

        ...extra
      };

      const res = await fetch(
        `${API}/jornada/progresso/finalizar`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      console.log('[SESSION][FINALIZAR]', data);

      // limpa apenas temporários
      sessionStorage.removeItem('JORNADA_RESPOSTAS');
      sessionStorage.removeItem('JORNADA_PROGRESS');
      sessionStorage.removeItem('JORNADA_DADOS');

      return data;

    } catch (err) {
      console.error('[SESSION][FINALIZAR][ERRO]', err);
    }
  }

  // =====================================================
  // AUTO SAVE
  // =====================================================

  let saveTimer = null;

  function autoSave() {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      salvar();
    }, 1500);
  }

  // =====================================================
  // PUBLIC API
  // =====================================================

  window.JORNADA_SESSION = {
    salvar,
    retomar,
    finalizar,
    autoSave,
    generateDeviceHash
  };

  console.log(
    '[SESSION] jornada-session.js carregado'
  );

})();
