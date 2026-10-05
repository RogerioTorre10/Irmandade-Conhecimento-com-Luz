// Gera o livro em .docx a partir de blocks.json (e toc.json, se existir).
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber,
  LineRuleType, TabStopType, Tab,
} = require('docx');

const blocks = JSON.parse(fs.readFileSync('blocks.json', 'utf8'));
const toc = fs.existsSync('toc.json') ? JSON.parse(fs.readFileSync('toc.json', 'utf8')) : {};
const META = JSON.parse(fs.readFileSync('meta.json', 'utf8'));

const FONT = 'Times New Roman';
const cm = (v) => Math.round(v * 567);
const BODY = 24; // 12 pt (half-points)
const LINE = { line: 330, lineRule: LineRuleType.EXACT }; // 16,5 pt

function runs(text, base = {}) {
  // **negrito** inline
  return text.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((s) =>
    s.startsWith('**') ? new TextRun({ ...base, text: s.slice(2, -2), bold: true })
                       : new TextRun({ ...base, text: s }));
}

const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [] }));
const centered = (text, opts = {}, pOpts = {}) => new Paragraph({
  alignment: AlignmentType.CENTER, ...pOpts,
  children: [new TextRun({ text, font: FONT, ...opts })],
});

// ---------- páginas iniciais ----------
const front = [
  ...blank(6),
  centered(META.titulo, { size: 52, bold: true, characterSpacing: 40 }),
  centered(META.subtitulo, { size: 26, italics: true }, { spacing: { before: 360 } }),
  ...blank(8),
  centered(META.autor, { size: 28 }),
  centered(META.selo, { size: 20, color: '555555' }, { spacing: { before: 2400 } }),

  centered('', {}, { pageBreakBefore: true }),
  ...blank(18),
  ...META.creditos.map((t) => new Paragraph({ spacing: { after: 120 },
    children: [new TextRun({ text: t, size: 18, font: FONT })] })),

  new Paragraph({ pageBreakBefore: true, children: [] }),
  ...blank(10),
  new Paragraph({ alignment: AlignmentType.RIGHT, indent: { left: cm(3) }, spacing: { after: 160 },
    children: [new TextRun({ text: META.epigrafe, italics: true, size: 24, font: FONT })] }),
  new Paragraph({ alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: META.epigrafeAutor, size: 20, font: FONT })] }),
];

// ---------- sumário ----------
const tocLines = [centered('SUMÁRIO', { size: 28, bold: true, characterSpacing: 60 },
  { pageBreakBefore: true, spacing: { before: 600, after: 480 } })];
for (const b of blocks) {
  if (b.t !== 'part' && b.t !== 'chap') continue;
  const isPart = b.t === 'part';
  const label = isPart ? `${b.label.toUpperCase()} — ${b.title}`
                       : (b.label ? `${b.label.replace('Capítulo ', '')}. ${b.title}` : b.title);
  const pg = String(toc[label] ?? '00');
  tocLines.push(new Paragraph({
    spacing: { before: isPart ? 200 : 40, after: 40 },
    indent: isPart ? {} : { left: cm(0.9), hanging: cm(0.5) },
    keepNext: isPart,
    tabStops: [{ type: TabStopType.RIGHT, position: cm(10), leader: 'dot' }],
    children: isPart
      ? [new TextRun({ text: label, font: FONT, size: 20, bold: true })]
      : [new TextRun({ text: label, font: FONT, size: 20 }),
         new TextRun({ font: FONT, size: 20, children: [new Tab(), pg] })],
  }));
}

// ---------- corpo ----------
const body = [];
let afterHeading = true;
let firstBody = true;
for (const b of blocks) {
  if (b.t === 'part') {
    body.push(new Paragraph({ pageBreakBefore: !firstBody, spacing: { after: cm(5) }, children: [] }));
    body.push(new Paragraph({ spacing: { after: 360 },
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: b.label.toUpperCase(), font: FONT, size: 24, characterSpacing: 80, color: '555555' })] }));
    body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
      children: [new TextRun({ text: b.title, font: FONT, size: 34, italics: true })] }));
    body.push(centered('❧', { size: 28, color: '777777' }));
    afterHeading = true; firstBody = false;
  } else if (b.t === 'chap') {
    body.push(new Paragraph({ pageBreakBefore: true, spacing: { after: cm(2) }, children: [] }));
    if (b.label) {
      body.push(new Paragraph({ alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: b.label.toUpperCase(), font: FONT, size: 20, characterSpacing: 80, color: '555555' })] }));
    }
    body.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 720 }, keepNext: true,
      children: [new TextRun({ text: b.title, font: FONT, size: 34, bold: true })] }));
    afterHeading = true; firstBody = false;
  } else if (b.t === 'sub') {
    body.push(new Paragraph({ spacing: { before: 400, after: 160 }, keepNext: true, keepLines: true,
      children: [new TextRun({ text: b.text, font: FONT, size: 24, bold: true, smallCaps: true })] }));
    afterHeading = true;
  } else if (b.t === 'quote') {
    body.push(new Paragraph({ alignment: AlignmentType.CENTER,
      indent: { left: cm(0.8), right: cm(0.8) }, spacing: { before: 280, after: 280, ...LINE },
      children: [new TextRun({ text: b.text, font: FONT, size: 24, italics: true })] }));
    afterHeading = true;
  } else {
    body.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      indent: { firstLine: afterHeading ? 0 : cm(0.6) },
      spacing: { after: 0, ...LINE },
      widowControl: true,
      children: runs(b.text, { font: FONT, size: BODY }),
    }));
    afterHeading = false;
  }
}

const page = {
  size: { width: cm(14), height: cm(21) },
  margin: { top: cm(2), bottom: cm(2.2), left: cm(2.1), right: cm(1.9), footer: cm(1) },
};

const doc = new Document({
  creator: 'Rogério Aparecido da Silva Torres', title: META.titulo, language: 'pt-BR',
  styles: { default: { document: { run: { font: FONT, size: BODY } } } },
  sections: [
    { properties: { page }, children: [...front, ...tocLines] },
    {
      properties: { page: { ...page, pageNumbers: { start: 1 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 20 })] })] }) },
      children: body,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(process.argv[2] || 'O_PLENO_EXISTENCIAL.docx', buf);
  console.log('ok');
});
