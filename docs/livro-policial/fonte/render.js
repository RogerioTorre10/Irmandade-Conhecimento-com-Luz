// Gera o DOCX de "Todo crime tem um autor?" a partir dos capítulos em fonte/cap*.txt
// Marcação: CAP|Capítulo N|Título  ·  SEP|  (quebra de cena)  ·  outra linha = parágrafo
// uso: NODE_PATH=$(npm root -g) node render.js [saida.docx]
const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun, AlignmentType } = require('docx');

const cm = (v) => Math.round(v * 567);
const FONT = 'Georgia';
const dir = __dirname;
const files = fs.readdirSync(dir).filter((f) => /^cap\d+\.txt$/.test(f)).sort();

const children = [];
let first = true;
for (const f of files) {
  for (const raw of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('CAP|')) {
      const [, label, title] = line.split('|');
      children.push(new Paragraph({ pageBreakBefore: !first, spacing: { before: 1800, after: 120 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: label.toUpperCase(), font: FONT, size: 20, characterSpacing: 40 })] }));
      children.push(new Paragraph({ spacing: { after: 720 }, alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: title, font: FONT, size: 32, bold: true })] }));
      first = false;
    } else if (line.startsWith('SEP|')) {
      children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 200 },
        children: [new TextRun({ text: '*', font: FONT, size: 22 })] }));
    } else {
      children.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, indent: { firstLine: cm(0.6) }, spacing: { after: 0, line: 312 },
        children: [new TextRun({ text: line, font: FONT, size: 21 })] }));
    }
  }
}

const doc = new Document({
  creator: 'Rogério A S Torres',
  title: 'Todo crime tem um autor?',
  sections: [{
    properties: { page: { size: { width: cm(14), height: cm(21) }, margin: { top: cm(2), bottom: cm(2), left: cm(2), right: cm(1.6) } } },
    children,
  }],
});
const out = process.argv[2] || path.join(dir, '..', 'TODO_CRIME_TEM_UM_AUTOR.docx');
Packer.toBuffer(doc).then((b) => { fs.writeFileSync(out, b); console.log('ok', out); });
