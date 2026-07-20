// =====================================================
// JORNADA SESSION ENGINE v2.0 — GUARDIÃO DA CHAMA
// Irmandade Conhecimento com Luz
//
// Responsabilidades:
// - preservar compatibilidade com window.JORNADA_SESSION
// - identidade da Jornada e device hash
// - salvamento serializado com debounce e retry
// - retomada sem queda prematura para a Intro
// - sinalização de reautenticação necessária
// - proteção das seções públicas
// - restauração do snapshot remoto
// - preservação do prazo original de 72 horas
// =====================================================

(function () {
  'use strict';

  if (window.JORNADA_SESSION?.__guardianV2) {
    console.log('[GUARDIÃO] jornada-session.js v2 já carregado');
    return;
  }

  const API =
    window.APP_CONFIG?.API_BASE ||
    'https://lumen-backend-api.onrender.com/api';

  const PUBLIC_SECTIONS = new Set([
    'section-intro',
    'section-termos1',
    'section-termos2',
    'section-senha'
  ]);

  const STORAGE = Object.freeze({
    EMAIL: 'jornada_email',
    CODIGO: 'jornada_codigo',
    DEVICE: 'jornada_device_hash',
    AUTH_OK: 'jornada_auth_ok',
    LAST_SECTION: 'jornada_last_section',
    LAST_BLOCK: 'jornada_last_block',
    LAST_QUESTION: 'jornada_last_question',
    LAST_SAVE: 'jornada_last_save',
    STARTED_AT: 'jornada_started_at',
    DEADLINE_AT: 'jornada_deadline_at',
    PENDING_SAVE: 'jornada_pending_save',
    REAUTH: 'jornada_reauth_required',
    STATE_CACHE: 'JORNADA_STATE_CACHE'
  });

  const state = {
    initialized: false,
    activated: false,
    authenticated: false,
    restoring: false,
    restored: false,
    reauthRequired: false,
    online: navigator.onLine !== false,
    saving: false,
    dirty: false,
    saveReason: null,
    saveTimer: null,
    retryTimer: null,
    retryCount: 0,
    saveChain: Promise.resolve(),
    lastRemoteSnapshot: null,
    lastError: null
  };

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  function emit(name, detail = {}) {
    try {
      document.dispatchEvent(
        new CustomEvent(name, {
          detail
        })
      );
    } catch (_) {}
  }

  function safeJsonParse(raw, fallback = {}) {
    try {
      if (!raw) return fallback;

      const parsed = JSON.parse(raw);

      return parsed == null
        ? fallback
        : parsed;

    } catch (_) {
      return fallback;
    }
  }

  function normalizeSection(sectionId) {
    const value = String(sectionId || '').trim();

    return value || 'section-intro';
  }

  function toIntSafe(value) {
    if (value == null || value === '') {
      return 0;
    }

    const first = String(value)
      .split('/')[0]
      .replace(/[^\d]/g, '');

    return Number(first) || 0;
  }

  function isPublicSection(sectionId) {
    return PUBLIC_SECTIONS.has(
      normalizeSection(sectionId)
    );
  }

  function getEmail() {
    return (
      localStorage.getItem(STORAGE.EMAIL) ||
      sessionStorage.getItem('jornada.email') ||
      ''
    ).trim();
  }

  function getCodigo() {
    return (
      localStorage.getItem(STORAGE.CODIGO) ||
      ''
    ).trim();
  }

  function isAuthenticated() {
    return (
      localStorage.getItem(STORAGE.AUTH_OK) === '1'
    );
  }

  function isActivated() {
    const auth = isAuthenticated();
    const email = !!getEmail();

    const section =
      localStorage.getItem(STORAGE.LAST_SECTION);

    return (
      auth &&
      email &&
      !!section &&
      !isPublicSection(section)
    );
  }

  function persistStateCache(extra = {}) {
    const cache = {
      activated: state.activated,
      authenticated: state.authenticated,
      reauthRequired: state.reauthRequired,
      online: state.online,
      dirty: state.dirty,
      savedAt: Date.now(),
      ...extra
    };

    try {
      sessionStorage.setItem(
        STORAGE.STATE_CACHE,
        JSON.stringify(cache)
      );
    } catch (_) {}
  }

  function setReauthRequired(flag, meta = {}) {
    state.reauthRequired = !!flag;

    try {
      if (flag) {
        localStorage.setItem(
          STORAGE.REAUTH,
          '1'
        );
      } else {
        localStorage.removeItem(
          STORAGE.REAUTH
        );
      }
    } catch (_) {}

    persistStateCache({
      reauthMeta: meta
    });

    emit(
      flag
        ? 'jornada:reauth-required'
        : 'jornada:reauth-cleared',
      {
        required: !!flag,
        ...meta
      }
    );
  }

  function getRemainingMs() {
    const deadlineRaw =
      localStorage.getItem(STORAGE.DEADLINE_AT);

    if (!deadlineRaw) {
      return null;
    }

    const numeric = Number(deadlineRaw);

    const deadline = Number.isFinite(numeric)
      ? numeric
      : Date.parse(deadlineRaw);

    if (!Number.isFinite(deadline)) {
      return null;
    }

    return Math.max(
      0,
      deadline - Date.now()
    );
  }

  function isExpired() {
    const remaining = getRemainingMs();

    return (
      remaining != null &&
      remaining <= 0
    );
  }

  // =====================================================
  // DEVICE HASH
  // =====================================================

  async function sha256(text) {
    const enc =
      new TextEncoder().encode(text);

    const hash =
      await crypto.subtle.digest(
        'SHA-256',
        enc
      );

    return Array
      .from(new Uint8Array(hash))
      .map((b) =>
        b.toString(16).padStart(2, '0')
      )
      .join('');
  }

  async function generateDeviceHash() {
    const existing =
      localStorage.getItem(STORAGE.DEVICE);

    if (existing) {
      return existing;
    }

    const raw = [
      navigator.userAgent || '',
      navigator.language || '',
      screen.width || 0,
      screen.height || 0,
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone || '',
      navigator.platform || ''
    ].join('|');

    let hash;

    try {
      hash = await sha256(raw);

    } catch (_) {
      hash =
        'browser-' +
        btoa(
          unescape(
            encodeURIComponent(raw)
          )
        )
          .replace(
            /[^a-zA-Z0-9]/g,
            ''
          )
          .slice(0, 48);
    }

    localStorage.setItem(
      STORAGE.DEVICE,
      hash
    );

    return hash;
  }

   // =====================================================
  // SNAPSHOT / PAYLOAD
  // =====================================================

  function buildSnapshot(extra = {}) {

    const progressObj = safeJsonParse(
      sessionStorage.getItem('JORNADA_PROGRESS'),
      {}
    );

    if (progressObj.total) {
      progressObj.total = toIntSafe(progressObj.total);
    }

    if (progressObj.pergunta) {
      progressObj.pergunta = toIntSafe(progressObj.pergunta);
    }

    return {

      guia:
        sessionStorage.getItem('jornada.guia'),

      idioma:
        localStorage.getItem('i18n_lang') ||
        window.i18n?.lang ||
        'pt-BR',

      respostas:
        safeJsonParse(
          sessionStorage.getItem('JORNADA_RESPOSTAS'),
          {}
        ),

      progresso:
        progressObj,

      dados:
        safeJsonParse(
          sessionStorage.getItem('JORNADA_DADOS'),
          {}
        ),

      estado_tela:
        extra.estado_tela ??
        sessionStorage.getItem('jornada.estadoTela') ??
        '',

      resposta_confirmada:
        !!extra.resposta_confirmada,

      devolutiva_concluida:
        !!extra.devolutiva_concluida,

      transicao_pendente:
        !!extra.transicao_pendente,

      started_at:
        localStorage.getItem(STORAGE.STARTED_AT),

      deadline_at:
        localStorage.getItem(STORAGE.DEADLINE_AT)
    };

  }

  function buildPayload(extra = {}) {

    return {

      email:
        getEmail(),

      codigo_jornada:
        getCodigo(),

      last_section:
        normalizeSection(
          extra.last_section ??
          localStorage.getItem(STORAGE.LAST_SECTION)
        ),

      last_block:
        extra.last_block ??
        localStorage.getItem(STORAGE.LAST_BLOCK),

      last_question:
        toIntSafe(
          extra.last_question ??
          localStorage.getItem(STORAGE.LAST_QUESTION)
        ),

      progresso_json_temp:
        buildSnapshot(extra),

      device_hash:
        extra.device_hash,

      ...extra

    };

  }

  // =====================================================
  // FILA SERIAL DE SALVAMENTO
  // =====================================================

  function enqueueSave(fn) {

    state.saveChain =
      state.saveChain
        .then(fn)
        .catch((err) => {

          console.error(
            '[GUARDIÃO][QUEUE]',
            err
          );

        });

    return state.saveChain;

  }

  // =====================================================
  // RETRY
  // =====================================================

  function scheduleRetry() {

    clearTimeout(state.retryTimer);

    state.retryCount++;

    const delay =
      Math.min(
        30000,
        1500 * state.retryCount
      );

    console.warn(
      '[GUARDIÃO] novo salvamento em',
      delay,
      'ms'
    );

    state.retryTimer =
      setTimeout(() => {

        if (!state.online) return;

        salvar({
          reason: 'retry'
        });

      }, delay);

  }

  // =====================================================
  // SAVE
  // =====================================================

  async function salvar(extra = {}) {

    if (!isAuthenticated()) {

      console.log(
        '[GUARDIÃO] ignorando save (não autenticado)'
      );

      return;

    }

    const currentSection =
      normalizeSection(
        extra.last_section ??
        localStorage.getItem(STORAGE.LAST_SECTION)
      );

    if (isPublicSection(currentSection)) {

      console.log(
        '[GUARDIÃO] seção pública, snapshot não enviado'
      );

      return;

    }

    return enqueueSave(
      async () => {

        state.saving = true;

        try {

          const deviceHash =
            await generateDeviceHash();

          const payload =
            buildPayload({

              ...extra,

              device_hash:
                deviceHash

            });

          if (!payload.email) {

            console.warn(
              '[GUARDIÃO] email ausente'
            );

            return;

          }

          console.log(
            '[GUARDIÃO][SAVE]',
            payload
          );

          const response =
            await fetch(

              `${API}/jornada/progresso/salvar`,

              {

                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify(payload)

              }

            );

          const data =
            await response.json();

          if (!response.ok) {

            throw new Error(
              data?.detail ||
              data?.message ||
              'Falha ao salvar'
            );

          }

          state.retryCount = 0;
          state.dirty = false;

          localStorage.removeItem(
            STORAGE.PENDING_SAVE
          );

          localStorage.setItem(
            STORAGE.LAST_SAVE,
            String(Date.now())
          );

          if (data.codigo_jornada) {

            localStorage.setItem(
              STORAGE.CODIGO,
              data.codigo_jornada
            );

          }

          state.lastRemoteSnapshot =
            data;

          persistStateCache();

          emit(
            'jornada:save-success',
            data
          );

          return data;

        }

        catch (err) {

          console.error(
            '[GUARDIÃO][SAVE]',
            err
          );

          state.lastError =
            err;

          state.dirty = true;

          localStorage.setItem(
            STORAGE.PENDING_SAVE,
            '1'
          );

          emit(
            'jornada:save-error',
            {
              error: err
            }
          );

          if (state.online) {
            scheduleRetry();
          }

          return null;

        }

        finally {

          state.saving = false;

        }

      }

    );

  }

  // =====================================================
  // AUTO SAVE
  // =====================================================

  function autoSave(extra = {}) {

    state.dirty = true;

    clearTimeout(
      state.saveTimer
    );

    state.saveTimer =
      setTimeout(() => {

        salvar({

          ...extra,

          reason: 'debounce'

        });

      }, 1500);

  }

   // =====================================================
  // RESTAURAÇÃO DO SNAPSHOT
  // =====================================================

  function restoreStorageFromSnapshot(data = {}) {
    if (!data || typeof data !== 'object') return;

    if (data.codigo_jornada) {
      localStorage.setItem(
        STORAGE.CODIGO,
        String(data.codigo_jornada)
      );
    }

    if (data.last_section) {
      localStorage.setItem(
        STORAGE.LAST_SECTION,
        normalizeSection(data.last_section)
      );
    }

    if (data.last_block != null && data.last_block !== '') {
      localStorage.setItem(
        STORAGE.LAST_BLOCK,
        String(data.last_block)
      );
    }

    if (data.last_question != null) {
      localStorage.setItem(
        STORAGE.LAST_QUESTION,
        String(toIntSafe(data.last_question))
      );
    }

    const snapshot =
      data.progresso_json_temp || {};

    if (snapshot.respostas) {
      sessionStorage.setItem(
        'JORNADA_RESPOSTAS',
        JSON.stringify(snapshot.respostas)
      );
    }

    if (snapshot.progresso) {
      sessionStorage.setItem(
        'JORNADA_PROGRESS',
        JSON.stringify(snapshot.progresso)
      );
    }

    if (snapshot.dados) {
      sessionStorage.setItem(
        'JORNADA_DADOS',
        JSON.stringify(snapshot.dados)
      );
    }

    if (snapshot.guia) {
      sessionStorage.setItem(
        'jornada.guia',
        String(snapshot.guia)
      );

      try {
        document.body.dataset.guia =
          String(snapshot.guia).toLowerCase();
      } catch (_) {}
    }

    if (snapshot.idioma) {
      try {
        localStorage.setItem(
          'i18n_lang',
          String(snapshot.idioma)
        );

        sessionStorage.setItem(
          'i18n_lang',
          String(snapshot.idioma)
        );
      } catch (_) {}
    }

    if (snapshot.estado_tela != null) {
      sessionStorage.setItem(
        'jornada.estadoTela',
        String(snapshot.estado_tela)
      );
    }

    if (snapshot.started_at) {
      localStorage.setItem(
        STORAGE.STARTED_AT,
        String(snapshot.started_at)
      );
    }

    if (snapshot.deadline_at) {
      localStorage.setItem(
        STORAGE.DEADLINE_AT,
        String(snapshot.deadline_at)
      );
    }

    if (data.started_at) {
      localStorage.setItem(
        STORAGE.STARTED_AT,
        String(data.started_at)
      );
    }

    if (data.deadline_at) {
      localStorage.setItem(
        STORAGE.DEADLINE_AT,
        String(data.deadline_at)
      );
    }

    if (data.expires_at) {
      localStorage.setItem(
        STORAGE.DEADLINE_AT,
        String(data.expires_at)
      );
    }

    state.lastRemoteSnapshot = data;
    state.restored = true;

    persistStateCache({
      restoredAt: Date.now()
    });
  }

  // =====================================================
  // CLASSIFICAÇÃO DA RESPOSTA DE RETOMADA
  // =====================================================

  function normalizeReason(data = {}, responseOk = true) {
    const raw = String(
      data.reason ||
      data.status ||
      data.detail ||
      data.message ||
      ''
    ).toLowerCase();

    if (
      raw.includes('reaut') ||
      raw.includes('outro dispositivo') ||
      raw.includes('device') ||
      raw.includes('nova sessão') ||
      raw.includes('nova sessao')
    ) {
      return 'reautenticacao_necessaria';
    }

    if (
      raw.includes('expir') ||
      raw.includes('72 hora') ||
      raw.includes('prazo encerrado')
    ) {
      return 'jornada_expirada';
    }

    if (
      raw.includes('conclu') ||
      raw.includes('finaliz') ||
      raw.includes('já foi processada') ||
      raw.includes('ja foi processada')
    ) {
      return 'jornada_concluida';
    }

    if (
      raw.includes('não encontr') ||
      raw.includes('nao encontr') ||
      raw.includes('sem progresso') ||
      raw.includes('inexistente')
    ) {
      return 'progresso_nao_encontrado';
    }

    if (!responseOk) {
      return 'erro_temporario';
    }

    return (
      data.retomar === true
        ? 'retomada_disponivel'
        : 'progresso_nao_encontrado'
    );
  }

  // =====================================================
  // RETOMADA
  // =====================================================

  async function retomar(options = {}) {
    if (state.restoring) {
      console.log(
        '[GUARDIÃO][RETOMAR] restauração já em andamento'
      );

      return state.lastRemoteSnapshot;
    }

    const email = getEmail();
    const codigo = getCodigo();

    if (!email) {
      return {
        retomar: false,
        reason: 'email_ausente'
      };
    }

    state.restoring = true;
    state.lastError = null;

    emit('jornada:restore-start', {
      email,
      codigo_jornada: codigo
    });

    try {
      const deviceHash =
        await generateDeviceHash();

      const response =
        await fetch(
          `${API}/jornada/progresso/retomar`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              codigo_jornada: codigo,
              device_hash: deviceHash
            })
          }
        );

      let data = {};

      try {
        data = await response.json();
      } catch (_) {
        data = {};
      }

      const reason =
        normalizeReason(data, response.ok);

      const normalized = {
        ...data,
        reason
      };

      console.log(
        '[GUARDIÃO][RETOMAR]',
        normalized
      );

      if (reason === 'reautenticacao_necessaria') {
        if (data.codigo_jornada) {
          localStorage.setItem(
            STORAGE.CODIGO,
            String(data.codigo_jornada)
          );
        }

        if (data.expires_at || data.deadline_at) {
          localStorage.setItem(
            STORAGE.DEADLINE_AT,
            String(
              data.expires_at ||
              data.deadline_at
            )
          );
        }

        setReauthRequired(true, normalized);

        state.restored = false;

        return {
          ...normalized,
          retomar: false,
          reautenticacao_necessaria: true,
          preserve_progress: true
        };
      }

      if (reason === 'jornada_expirada') {
        localStorage.setItem(
          STORAGE.AUTH_OK,
          '0'
        );

        state.authenticated = false;
        state.activated = false;

        emit('jornada:expired', normalized);

        return {
          ...normalized,
          retomar: false,
          expirada: true
        };
      }

      if (reason === 'jornada_concluida') {
        emit('jornada:completed', normalized);

        return {
          ...normalized,
          retomar: false,
          concluida: true
        };
      }

      if (
        response.ok &&
        data?.retomar === true
      ) {
        restoreStorageFromSnapshot(data);

        localStorage.setItem(
          STORAGE.AUTH_OK,
          '1'
        );

        state.authenticated = true;
        state.activated = true;
        state.reauthRequired = false;

        setReauthRequired(false);

        emit(
          'jornada:restore-success',
          data
        );

        return {
          ...data,
          retomar: true,
          reason: 'retomada_disponivel'
        };
      }

      if (reason === 'progresso_nao_encontrado') {
        state.restored = false;

        emit(
          'jornada:restore-empty',
          normalized
        );

        return {
          ...normalized,
          retomar: false
        };
      }

      throw new Error(
        data?.detail ||
        data?.message ||
        `Falha temporária na retomada: HTTP ${response.status}`
      );

    } catch (err) {
      console.error(
        '[GUARDIÃO][RETOMAR][ERRO]',
        err
      );

      state.lastError = err;

      emit(
        'jornada:restore-error',
        {
          error: err,
          reason: 'erro_temporario'
        }
      );

      const localSection =
        normalizeSection(
          localStorage.getItem(
            STORAGE.LAST_SECTION
          )
        );

      const canUseLocalFallback =
        isAuthenticated() &&
        !!getCodigo() &&
        !isPublicSection(localSection) &&
        !isExpired();

      return {
        retomar: false,
        reason: 'erro_temporario',
        fallback_local: canUseLocalFallback,
        last_section:
          canUseLocalFallback
            ? localSection
            : null,
        error: err
      };

    } finally {
      state.restoring = false;
    }
  }

  // =====================================================
  // ATIVAÇÃO APÓS O 2FA
  // =====================================================

  async function registrarAtivacao(payload = {}) {
    const email =
      String(
        payload.email ||
        getEmail() ||
        ''
      ).trim();

    if (!email) {
      throw new Error(
        'Não foi possível ativar a Jornada sem e-mail.'
      );
    }

    localStorage.setItem(
      STORAGE.EMAIL,
      email
    );

    localStorage.setItem(
      STORAGE.AUTH_OK,
      '1'
    );

    if (payload.codigo_jornada) {
      localStorage.setItem(
        STORAGE.CODIGO,
        String(payload.codigo_jornada)
      );
    }

    const currentStartedAt =
      localStorage.getItem(STORAGE.STARTED_AT);

    const currentDeadlineAt =
      localStorage.getItem(STORAGE.DEADLINE_AT);

    const startedAt =
      currentStartedAt ||
      payload.started_at ||
      payload.criado_em ||
      null;

    const deadlineAt =
      currentDeadlineAt ||
      payload.deadline_at ||
      payload.expires_at ||
      null;

    if (startedAt) {
      localStorage.setItem(
        STORAGE.STARTED_AT,
        String(startedAt)
      );
    }

    if (deadlineAt) {
      localStorage.setItem(
        STORAGE.DEADLINE_AT,
        String(deadlineAt)
      );
    }

    const section =
      normalizeSection(
        payload.last_section ||
        'section-guia'
      );

    localStorage.setItem(
      STORAGE.LAST_SECTION,
      section
    );

    state.authenticated = true;
    state.activated = true;
    state.reauthRequired = false;

    setReauthRequired(false);

    persistStateCache({
      activatedAt: Date.now()
    });

    emit(
      'jornada:activated',
      {
        email,
        codigo_jornada: getCodigo(),
        started_at:
          localStorage.getItem(
            STORAGE.STARTED_AT
          ),
        deadline_at:
          localStorage.getItem(
            STORAGE.DEADLINE_AT
          ),
        last_section: section
      }
    );

    const saveResult =
      await salvar({
        last_section: section,
        estado_tela: 'ativada',
        reason: 'ativacao_2fa'
      });

    return {
      ok: true,
      email,
      codigo_jornada:
        getCodigo() ||
        saveResult?.codigo_jornada ||
        null,
      started_at:
        localStorage.getItem(
          STORAGE.STARTED_AT
        ),
      deadline_at:
        localStorage.getItem(
          STORAGE.DEADLINE_AT
        ),
      last_section: section
    };
  }

  // =====================================================
  // REAUTENTICAÇÃO
  // =====================================================

  function exigirReautenticacao(meta = {}) {
    setReauthRequired(true, {
      ...meta,
      preserve_progress: true
    });

    return {
      ok: true,
      reautenticacao_necessaria: true,
      codigo_jornada: getCodigo(),
      last_section:
        localStorage.getItem(
          STORAGE.LAST_SECTION
        ),
      deadline_at:
        localStorage.getItem(
          STORAGE.DEADLINE_AT
        )
    };
  }

  async function concluirReautenticacao(payload = {}) {
    const previousSection =
      localStorage.getItem(
        STORAGE.LAST_SECTION
      );

    const safeResumeSection =
      previousSection &&
      !isPublicSection(previousSection)
        ? previousSection
        : normalizeSection(
            payload.last_section ||
            'section-guia'
          );

    const activation =
      await registrarAtivacao({
        ...payload,
        last_section: safeResumeSection
      });

    setReauthRequired(false);

    emit(
      'jornada:reauth-success',
      {
        ...activation,
        resume_section:
          safeResumeSection
      }
    );

    return {
      ...activation,
      reautenticada: true,
      resume_section:
        safeResumeSection
    };
  }

   // =====================================================
  // ATUALIZAÇÃO DE ESTADO
  // =====================================================

  async function atualizarEstado(
    partial = {},
    options = {}
  ) {

    if (partial.last_section != null) {
      localStorage.setItem(
        STORAGE.LAST_SECTION,
        normalizeSection(partial.last_section)
      );
    }

    if (partial.last_block != null) {
      localStorage.setItem(
        STORAGE.LAST_BLOCK,
        String(partial.last_block)
      );
    }

    if (partial.last_question != null) {
      localStorage.setItem(
        STORAGE.LAST_QUESTION,
        String(
          toIntSafe(
            partial.last_question
          )
        )
      );
    }

    if (partial.estado_tela != null) {
      sessionStorage.setItem(
        'jornada.estadoTela',
        String(partial.estado_tela)
      );
    }

    state.dirty = true;

    persistStateCache({
      updatedAt: Date.now()
    });

    if (
      options.immediate ||
      partial.critical
    ) {
      return salvar({
        ...partial,
        reason:
          options.reason ||
          'critical'
      });
    }

    autoSave(partial);

    return true;
  }

  // =====================================================
  // FINALIZAR
  // =====================================================

  async function finalizar(extra = {}) {

    try {

      const payload = {

        email:
          getEmail(),

        codigo_jornada:
          getCodigo(),

        device_hash:
          await generateDeviceHash(),

        pdf_enviado:
          extra.pdf_enviado ?? true,

        email_enviado:
          extra.email_enviado ?? true,

        ...extra

      };

      const response =
        await fetch(

          `${API}/jornada/progresso/finalizar`,

          {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify(payload)

          }

        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data?.detail ||
          data?.message ||
          'Falha ao finalizar'
        );

      }

      sessionStorage.removeItem(
        'JORNADA_RESPOSTAS'
      );

      sessionStorage.removeItem(
        'JORNADA_PROGRESS'
      );

      sessionStorage.removeItem(
        'JORNADA_DADOS'
      );

      emit(
        'jornada:finished',
        data
      );

      return data;

    }

    catch (err) {

      console.error(
        '[GUARDIÃO][FINALIZAR]',
        err
      );

      throw err;

    }

  }

  // =====================================================
  // QUAL É A PRIMEIRA SECTION?
  // =====================================================

  function getInitialSection() {

    if (
      state.reauthRequired ||
      localStorage.getItem(
        STORAGE.REAUTH
      ) === '1'
    ) {

      return 'section-senha';

    }

    if (
      isAuthenticated() &&
      !isExpired()
    ) {

      const last =
        normalizeSection(
          localStorage.getItem(
            STORAGE.LAST_SECTION
          )
        );

      if (
        last &&
        !isPublicSection(last)
      ) {

        return last;

      }

    }

    return 'section-intro';

  }

  // =====================================================
  // EVENTOS GLOBAIS
  // =====================================================

  window.addEventListener(
    'online',
    () => {

      state.online = true;

      if (
        state.dirty ||
        localStorage.getItem(
          STORAGE.PENDING_SAVE
        ) === '1'
      ) {

        salvar({
          reason:
            'online_retry'
        });

      }

    }
  );

  window.addEventListener(
    'offline',
    () => {

      state.online = false;

    }
  );

  document.addEventListener(
    'visibilitychange',
    () => {

      if (
        document.visibilityState ===
        'hidden'
      ) {

        if (
          state.dirty &&
          isAuthenticated()
        ) {

          salvar({
            reason:
              'visibilitychange'
          });

        }

      }

    }
  );

  window.addEventListener(
    'pagehide',
    () => {

      if (
        state.dirty &&
        isAuthenticated()
      ) {

        salvar({
          reason:
            'pagehide'
        });

      }

    }
  );

  // =====================================================
  // API PÚBLICA
  // =====================================================

  const api = {

    __guardianV2: true,

    salvar,

    autoSave,

    retomar,

    finalizar,

    atualizarEstado,

    registrarAtivacao,

    exigirReautenticacao,

    concluirReautenticacao,

    generateDeviceHash,

    getInitialSection,

    get activated() {
      return state.activated;
    },

    get authenticated() {
      return state.authenticated;
    },

    get dirty() {
      return state.dirty;
    },

    get reauthRequired() {
      return state.reauthRequired;
    },

    get remainingMs() {
      return getRemainingMs();
    }

  };

  state.initialized = true;

  state.authenticated =
    isAuthenticated();

  state.activated =
    isActivated();

  window.JORNADA_GUARDIAN =
    api;

  window.JORNADA_SESSION =
    api;

  console.log(
    '[GUARDIÃO] jornada-session v2 carregado.'
  );

})();
