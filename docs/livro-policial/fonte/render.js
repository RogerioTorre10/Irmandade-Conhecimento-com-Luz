// Gera o DOCX de "Todo crime tem um autor?" a partir dos capítulos em fonte/cap*.txt
// Marcação: CAP|Capítulo N|Título  ·  SEP|  (quebra de cena)  ·  CEL|texto (chamada para o celular virtual)  ·  outra linha = parágrafo
// Páginas iniciais e finais vêm de meta.json; números do sumário de toc.json (gerado por paginate.py).
// uso: NODE_PATH=$(npm root -g) node render.js [saida.docx]
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ShadingType,
  Footer, PageNumber, LineRuleType, TabStopType, Tab } = require('docx');

const cm = (v) => Math.round(v * 567);
const FONT = 'Times New Roman';
const BODY = 22; // 11 pt
const LINE = { line: 300, lineRule: LineRuleType.EXACT }; // 15 pt
const dir = __dirname;
const META = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
const tocFile = path.join(dir, 'toc.json');
const toc = fs.existsSync(tocFile) ? JSON.parse(fs.readFileSync(tocFile, 'utf8')) : {};
const files = fs.readdirSync(dir).filter((f) => /^cap\d+\.txt$/.test(f)).sort();

const blank = (n = 1) => Array.from({ length: n }, () => new Paragraph({ children: [] }));
const centered = (text, opts = {}, pOpts = {}) => new Paragraph({ alignment: AlignmentType.CENTER, ...pOpts,
  children: [new TextRun({ text, font: FONT, ...opts })] });
const box = { style: BorderStyle.SINGLE, size: 6, color: '555555', space: 6 };
const celCommon = { border: { top: box, bottom: box, left: box, right: box },
  shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'EFEFEF' }, indent: { left: cm(0.4), right: cm(0.4) } };
const celBox = (text) => [
  new Paragraph({ ...celCommon, alignment: AlignmentType.CENTER, spacing: { before: 240, after: 0 }, keepNext: true, keepLines: true,
    children: [new TextRun({ text: 'NO CELULAR DE HENRIQUE', font: FONT, size: 17, bold: true, characterSpacing: 30 })] }),
  new Paragraph({ ...celCommon, alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240, line: 270 }, keepLines: true,
    children: [new TextRun({ text, font: FONT, size: 19, italics: true })] }),
];

// ---------- capítulos ----------
const chapters = [];
for (const f of files) {
  for (const raw of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('CAP|')) { const [, label, title] = line.split('|'); chapters.push({ label, title, lines: [] }); }
    else chapters[chapters.length - 1].lines.push(line);
  }
}

function celularPage() {
  const T = META.celular.texto;
  const para = (text, italics = false) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: cm(0.6) },
    spacing: { after: 120, ...LINE }, children: [new TextRun({ text, font: FONT, size: BODY, italics })] });
  const strong = (text) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, font: FONT, size: 22, bold: true })] });
  return [para(T[0]), para(T[1]), ...celBox('Exemplo: digite 4821 somado ao seu código pessoal.'), para(T[2]),
    strong(T[3]), strong(T[4]), new Paragraph({ spacing: { before: 240 }, alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: T[5], font: FONT, size: BODY, italics: true })] })];
}

// ---------- páginas iniciais ----------
const front = [
  ...blank(5),
  centered(META.titulo, { size: 40, bold: true, characterSpacing: 30 }),
  centered(META.frase, { size: 24, italics: true }, { spacing: { before: 360 } }),
  centered(META.genero, { size: 20, color: '555555', characterSpacing: 60 }, { spacing: { before: 1200 } }),
  ...blank(6),
  centered(META.autor, { size: 28, characterSpacing: 40 }),
  centered(META.selo, { size: 18, color: '555555' }, { spacing: { before: 2000 } }),

  new Paragraph({ pageBreakBefore: true, children: [] }),
  ...blank(13),
  ...META.creditos.map((t) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 240 },
    children: [new TextRun({ text: t, size: 17, font: FONT })] })),

  new Paragraph({ pageBreakBefore: true, children: [] }),
  ...blank(6),
  ...META.dedicatoria.map((t) => new Paragraph({ alignment: AlignmentType.RIGHT, indent: { left: cm(2.5) },
    spacing: { after: 220, line: 290 }, children: [new TextRun({ text: t, italics: true, size: 21, font: FONT })] })),

  centered(META.celular.titulo, { size: 26, bold: true, characterSpacing: 40 }, { pageBreakBefore: true, spacing: { before: 600, after: 480 } }),
  ...celularPage(),
];

// ---------- sumário ----------
const tocLines = [centered('SUMÁRIO', { size: 26, bold: true, characterSpacing: 60 }, { pageBreakBefore: true, spacing: { before: 400, after: 400 } })];
for (const c of chapters) {
  const key = `${c.label.replace('Capítulo ', '')}. ${c.title}`;
  tocLines.push(new Paragraph({ spacing: { before: 20, after: 20 }, indent: { left: cm(0.7), hanging: cm(0.7) },
    tabStops: [{ type: TabStopType.RIGHT, position: cm(10), leader: 'dot' }],
    children: [new TextRun({ text: key, font: FONT, size: 19 }), new TextRun({ font: FONT, size: 19, children: [new Tab(), String(toc[key] ?? '00')] })] }));
}

// ---------- corpo ----------
const body = [];
let first = true;
for (const c of chapters) {
  body.push(new Paragraph({ pageBreakBefore: !first, spacing: { before: 1600, after: 160 }, alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: c.label.toUpperCase(), font: FONT, size: 20, characterSpacing: 60, color: '555555' })] }));
  body.push(new Paragraph({ spacing: { after: 720 }, alignment: AlignmentType.CENTER, keepNext: true,
    children: [new TextRun({ text: c.title, font: FONT, size: 32, bold: true })] }));
  first = false;
  let afterHeading = true;
  for (const line of c.lines) {
    if (line.startsWith('CEL|')) { body.push(...celBox(line.slice(4))); afterHeading = true; }
    else if (line.startsWith('SEP|')) {
      body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 160 }, keepNext: true,
        children: [new TextRun({ text: '*', font: FONT, size: 22 })] }));
      afterHeading = true;
    } else {
      body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: afterHeading ? 0 : cm(0.6) },
        spacing: { after: 0, ...LINE }, widowControl: true, children: [new TextRun({ text: line, font: FONT, size: BODY })] }));
      afterHeading = false;
    }
  }
}

// ---------- sobre o autor ----------
body.push(centered('SOBRE O AUTOR', { size: 24, bold: true, characterSpacing: 60 }, { pageBreakBefore: true, spacing: { before: 1600, after: 480 } }));
for (const t of META.sobre) {
  body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: cm(0.6) }, spacing: { after: 120, ...LINE },
    children: [new TextRun({ text: t, font: FONT, size: BODY })] }));
}

const page = { size: { width: cm(14), height: cm(21) },
  margin: { top: cm(2), bottom: cm(2.2), left: cm(2.1), right: cm(1.9), footer: cm(1) } };

const doc = new Document({
  creator: 'Rogério Aparecido da Silva Torres', title: 'Todo crime tem um autor?', language: 'pt-BR',
  styles: { default: { document: { run: { font: FONT, size: BODY } } } },
  sections: [
    { properties: { page }, children: [...front, ...tocLines] },
    { properties: { page: { ...page, pageNumbers: { start: 1 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 })] })] }) },
      children: body },
  ],
});

const out = process.argv[2] || path.join(dir, '..', 'TODO_CRIME_TEM_UM_AUTOR.docx');
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log('ok', chapters.length, 'capítulos'); });
