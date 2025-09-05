// /assets/js/config.js — compat + módulos (v1.2)
// Mantém variáveis antigas e fornece window.APP_CONFIG e window.JORNADA_CFG,
// agora com o MAPA DE SEÇÕES padronizado.

// ===== [00-CONFIG] núcleo =====
(function () {
  // >>> Ajuste AQUI se seu backend mudar <<<
  const DEFAULT_API_BASE   = "https://lumen-backend-api.onrender.com/api"; // com /api
  const DEFAULT_STORAGE_KEY = "jornada_essencial_v1";
  const DEFAULT_PASS        = "IRMANDADE"; // Alinhado com jornada-auth.js

  function normalizeBase(u) { return String(u || "").replace(/\/+$/, ""); }

  const baseFromPage  = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || DEFAULT_API_BASE;
  const API_BASE_NORM = normalizeBase(baseFromPage);          // ex.: https://.../api
  const API_URL_NO_API = API_BASE_NORM.replace(/\/api$/, ""); // ex.: https://... (sem /api)

  window.APP_CONFIG = Object.assign(
    {
      ENV: "prod",
      API_BASE: API_BASE_NORM,
      STORAGE_KEY: DEFAULT_STORAGE_KEY,
      PASS: DEFAULT_PASS
    },
    window.APP_CONFIG || {}
  );

  const JORNADA_DEFAULTS = {
    TOTAL_BLOCKS: 5,
    TOTAL_PERGUNTAS: 32,
    TYPING_HEADER: "Irmandade Conhecimento com Luz",
    TYPING_FOOTER: "Para além. E sempre!!",
    BLOCK_VIDEOS: [
      "/assets/img/A-Jornada-Conhecimento-com-Luz1-zip.mp4",
      "/assets/img/Bloco-2.mp4",
      "/assets/img/Bloco-3.mp4",
      "/assets/img/Bloco-4.mp4",
      "/assets/img/Bloco-5.mp4"
    ],
    API_PDF_URL: (API_BASE_NORM + "/jornada/pdf"),
    API_HQ_URL: (API_BASE_NORM + "/jornada/hq"),
    ALLOWED_ORIGINS: [
      "https://irmandade-conhecimento-com-luz.onrender.com",
      "https://irmandade-conhecimento-com-luz-1.onrender.com",
      "http://localhost:3000"
    ],
    SECTIONS: {
      "01-HEADER": "topo, nav, logo",
      "02-CHAMA": "variações sm/md/lg",
      "03-PERGAMINHO": "vertical/horizontal (intro/perguntas/final)",
      "04-DATILOGRAFIA": "Respire…, Bem-vindo, Pergunta 1",
      "05-PERGUNTAS": "layout, textarea, placeholders",
      "06-NAVEGAÇÃO": "Voltar/Próxima + listeners",
      "07-VIDEOS": "vídeo homepage",
      "08-OLHO-MAGICO-E-SENHA": "input senha + eye toggle",
      "09-BARRA-PROGRESSO": "contador e %",
      "10-IDIOMAS": "switch pt/en",
      "11-FONTS": "fontes e @font-face",
      "12-PDF-E-HQ": "geração e download",
      "13-JORNADAS": "Amorosa, Vocacional",
      "08-ESTADO": "localStorage, índice, respostas",
      "09-EXTRAS": "apenas indispensável"
    },
    positiveWords: ['abencoado', 'abencoar', 'abertura', 'abnegacao', 'abraco', 'abrigo', 'absoluto', 'abundancia', 'acao', 'aceitacao', 'aceitar', 'acessivel', 'aclamacao', 'aclamado', 'aconchegante', 'aconchegar', 'aconchego', 'acreditar', 'adaptabilidade', 'adaptavel', 'adequado', 'admiracao', 'admiravel', 'adoracao', 'adorar', 'adoravel', 'afabilidade', 'afavel', 'afirmacao', 'afirmativo', 'agilidade', 'agradar', 'agradavel', 'agradecer', 'agradecimento', 'ajuda', 'ajudar', 'alcancar', 'alegre', 'alegria', 'alicerce', 'alma', 'altruismo', 'altruista', 'amabilidade', 'amar', 'amavel', 'amigo', 'amizade', 'amor', 'amoroso', 'amor-proprio', 'animacao', 'apaixonado', 'aplaudir', 'aplauso', 'apoiar', 'apoio', 'apreciado', 'apreciar', 'aprender', 'aprendizagem', 'aprovacao', 'arte', 'assertividade', 'assertivo', 'astucia', 'astucioso', 'atencao', 'atencioso', 'atitude', 'ativo', 'atracao', 'auspicioso', 'autenticidade', 'autentico', 'autoconfianca', 'autoestima', 'autonomia', 'autonomo', 'aventura', 'balanceado', 'batalhador', 'batalhar', 'beijar', 'beijo', 'beldade', 'beleza', 'belo', 'bem-disposto', 'bem-educado', 'bem-estar', 'bem-humorado', 'bem-vindo', 'bencao', 'bendito', 'beneficencia', 'beneficente', 'beneficio', 'benefico', 'benemerito', 'benevolencia', 'benevolente', 'benfeitor', 'benignidade', 'benzer', 'bom', 'bonanca', 'bondade', 'bondoso', 'bonito', 'bravura', 'brilhante', 'brilhar', 'brilho', 'brincadeira', 'brincalhao', 'brincar', 'brio', 'brioso', 'calma', 'calor', 'camaradagem', 'capacidade', 'caridade', 'carinho', 'carinhoso', 'carismatico', 'caritativo', 'cativar', 'cavalheiro', 'ceder', 'celebracao', 'celestial', 'centrado', 'certeza', 'certo', 'ceu', 'civilidade', 'civilizado', 'clarividencia', 'claro', 'clemencia', 'coerente', 'colaboracao', 'colaborar', 'comemorar', 'compaixao', 'companheirismo', 'companheiro', 'companhia', 'compassivo', 'competencia', 'competente', 'compreender', 'compreensao', 'comprometimento', 'comunhao', 'comunicacao', 'comunidade', 'concentracao', 'concordar', 'conectar', 'conexao', 'confiabilidade', 'confianca', 'confiante', 'confiavel', 'confortavel', 'conforto', 'congruencia', 'conhecimento', 'conquista', 'conquistar', 'consciencia', 'consciente', 'conseguir', 'consideracao', 'consolacao', 'consolo', 'construir', 'construtivo', 'contentamento', 'contente', 'continuidade', 'contribuicao', 'contribuir', 'contributo', 'conviccao', 'cooperacao', 'cooperar', 'coracao', 'coragem', 'corajoso', 'cordial', 'cordialidade', 'cortes', 'cortesia', 'credibilidade', 'crenca', 'crescer', 'crescimento', 'criar', 'criatividade', 'criativo', 'cuidado', 'cuidadoso', 'cuidar', 'cultivar', 'cultura', 'cumpridor', 'cura', 'curiosidade', 'decencia', 'decente', 'decoro', 'dedicacao', 'dedicado', 'deferencia', 'delicadeza', 'delicado', 'delicia', 'delicioso', 'denodo', 'desafio', 'descansar', 'descoberta', 'desejavel', 'desejo', 'desenvoltura', 'desenvolver', 'desenvolvimento', 'deslumbrado', 'deslumbrar', 'destemido', 'destino', 'determinacao', 'determinado', 'deus', 'dever', 'devotado', 'dignidade', 'digno', 'diligencia', 'diligente', 'dinamismo', 'direcao', 'dirigir', 'disciplina', 'disciplinado', 'discrecao', 'disponibilidade', 'disponivel', 'disposicao', 'disposto', 'diversao', 'diversidade', 'divertido', 'divinal', 'divino', 'docilidade', 'educacao', 'educado', 'educar', 'eficacia', 'eficiencia', 'eficiente', 'elegancia', 'elevacao', 'elevado', 'elevar', 'elogio', 'eloquencia', 'emancipacao', 'emancipado', 'embelezar'],
    negativeWords: ['agressivo', 'ansioso', 'antipatico', 'antissocial', 'apatico', 'apressado', 'arrogante', 'atrevido', 'autoritario', 'avarento', 'birrento', 'bisbilhoteiro', 'bruto', 'calculista', 'casmurro', 'chato', 'cinico', 'ciumento', 'colerico', 'comodista', 'covarde', 'critico', 'cruel', 'debochado', 'depressivo', 'desafiador', 'desbocado', 'descarado', 'descomedido', 'desconfiado', 'descortes', 'desequilibrado', 'desleal', 'desleixado', 'desmazelado', 'desmotivado', 'desobediente', 'desonesto', 'desordeiro', 'despotico', 'desumano', 'discriminador', 'dissimulado', 'distraido', 'egoista', 'estourado', 'estressado', 'exigente', 'falso', 'fingido', 'fraco', 'frio', 'frivolo', 'futil', 'ganancioso', 'grosseiro', 'grosso', 'hipocrita', 'ignorante', 'impaciente', 'impertinente', 'impetuoso', 'impiedoso', 'imponderado', 'impostor', 'imprudente', 'impulsivo', 'incompetente', 'inconstante', 'inconveniente', 'incorreto', 'indeciso', 'indecoroso', 'indelicado', 'indiferente', 'infiel', 'inflexivel', 'injusto', 'inseguro', 'insensato', 'insincero', 'instavel', 'insuportavel', 'interesseiro', 'intolerante', 'intransigente', 'irracional', 'irascivel', 'irrequieto', 'irresponsavel', 'irritadico', 'malandro', 'maldoso', 'malicioso', 'malvado', 'mandao', 'manhoso', 'maquiavelico', 'medroso', 'mentiroso', 'mesquinho', 'narcisista', 'negligente', 'nervoso', 'neurotico', 'obcecado', 'odioso', 'oportunista', 'orgulhoso', 'pedante', 'pessimista', 'pe-frio', 'possessivo', 'precipitado', 'preconceituoso', 'preguiçoso', 'prepotente', 'presunçoso', 'problematico', 'quezilento', 'rancoroso', 'relapso', 'rigoroso', 'rabugento', 'rude', 'sarcastico', 'sedentario', 'teimoso', 'timido', 'tirano', 'traicoeiro', 'traidor', 'trapaceiro', 'tendencioso', 'trocista', 'vagabundo', 'vaidoso', 'vulneravel', 'vigarista', 'xenofobo']
  };

  window.JORNADA_CFG = Object.assign({}, JORNADA_DEFAULTS, window.JORNADA_CFG || {});
  window.API_URL = window.API_URL || API_URL_NO_API;
  window.TOKEN_VALIDATION_ENDPOINT = window.TOKEN_VALIDATION_ENDPOINT || "/validate-token";
  window.JOURNEY_START_ENDPOINT = window.JOURNEY_START_ENDPOINT || "/start-journey";
  window.JORNADA_API_BASE = window.JORNADA_API_BASE || API_BASE_NORM;
  window.JORNADA_ENDPOINT_PATH = window.JORNADA_ENDPOINT_PATH || "/jornada";
  window.__API_DEBUG__ = { API_BASE: API_BASE_NORM, API_URL_NO_API };
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
