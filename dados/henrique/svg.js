// Ilustrações do celular de Henrique (galeria, e-mail e cartão-postal).
// Tudo desenhado em SVG, sem fotos reais de ninguém.
const W = 320, H = 220;
const svg = (body, w = W, h = H, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" ${extra}>${body}</svg>`;

// Grão de foto antiga
const grain = (id, op = 0.18) => `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 ${op}"/></feComponentTransfer></filter>`;

// Chalé de dois andares, telhado inclinado, varanda em volta e 12 janelas (6 + 6)
function chale(x, y, s = 1, porta = true) {
  const g = [];
  const w = 170 * s, h = 70 * s;
  g.push(`<polygon points="${x - 14 * s},${y} ${x + w / 2},${y - 52 * s} ${x + w + 14 * s},${y}" fill="#5b3a26"/>`);
  g.push(`<polygon points="${x - 10 * s},${y - 2 * s} ${x + w / 2},${y - 46 * s} ${x + w + 10 * s},${y - 2 * s}" fill="#f4f6f8" opacity=".85"/>`);
  g.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#a0683e"/>`);
  for (let i = 0; i < 14; i++) g.push(`<line x1="${x}" y1="${y + i * 5 * s}" x2="${x + w}" y2="${y + i * 5 * s}" stroke="#8a5632" stroke-width="${0.6 * s}"/>`);
  const wx = (i) => x + 9 * s + i * 26.5 * s;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
    const yy = y + (r ? 40 : 8) * s;
    if (porta && r === 1 && (i === 2 || i === 3)) continue;
    g.push(`<rect x="${wx(i)}" y="${yy}" width="${14 * s}" height="${18 * s}" fill="#ffe7a8" stroke="#3b2416" stroke-width="${1.4 * s}"/><line x1="${wx(i) + 7 * s}" y1="${yy}" x2="${wx(i) + 7 * s}" y2="${yy + 18 * s}" stroke="#3b2416" stroke-width="${s}"/>`);
  }
  if (porta) {
    g.push(`<rect x="${wx(2) + 6 * s}" y="${y + 36 * s}" width="${32 * s}" height="${34 * s}" fill="#3b2416"/>`);
    // as duas janelas do térreo que faltariam viram janelinhas ao lado da porta, para somar 12
    g.push(`<rect x="${wx(2) - 2 * s}" y="${y + 40 * s}" width="${7 * s}" height="${16 * s}" fill="#ffe7a8" stroke="#3b2416" stroke-width="${s}"/>`);
    g.push(`<rect x="${wx(3) + 21 * s}" y="${y + 40 * s}" width="${7 * s}" height="${16 * s}" fill="#ffe7a8" stroke="#3b2416" stroke-width="${s}"/>`);
  }
  g.push(`<rect x="${x - 12 * s}" y="${y + h - 4 * s}" width="${w + 24 * s}" height="${6 * s}" fill="#6e4429"/>`);
  for (let i = 0; i <= 12; i++) g.push(`<rect x="${x - 12 * s + i * (w + 24 * s) / 12}" y="${y + h - 16 * s}" width="${2 * s}" height="${12 * s}" fill="#6e4429"/>`);
  g.push(`<rect x="${x - 12 * s}" y="${y + h - 17 * s}" width="${w + 24 * s}" height="${2.2 * s}" fill="#6e4429"/>`);
  return g.join('');
}

const montanhas = (neveTopo = true) => `
  <linearGradient id="ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb2e5"/><stop offset="1" stop-color="#dcebf7"/></linearGradient>
  <rect width="${W}" height="${H}" fill="url(#ceu)"/>
  <polygon points="0,150 70,60 120,120 175,35 240,115 280,75 320,130 320,${H} 0,${H}" fill="#6f7f93"/>
  ${neveTopo ? `<polygon points="175,35 160,58 168,56 176,66 186,54 193,60" fill="#fff"/><polygon points="70,60 58,78 66,76 74,84 82,74" fill="#fff"/><polygon points="280,75 270,90 279,88 290,92" fill="#fff"/>` : ''}
  <polygon points="0,170 60,120 130,165 200,110 270,160 320,140 320,${H} 0,${H}" fill="#e9eef3"/>`;

const SVG = {
  neve: svg(`${montanhas()}<polygon points="0,195 90,175 180,190 320,170 320,220 0,220" fill="#fff"/><g fill="#2f4a33"><polygon points="40,200 48,170 56,200"/><polygon points="60,204 69,168 78,204"/><polygon points="250,196 258,166 266,196"/></g>`),
  vale: svg(`<rect width="${W}" height="${H}" fill="#9cc6ec"/><polygon points="0,110 80,40 150,100 230,30 320,95 320,220 0,220" fill="#7d8b98"/><polygon points="230,30 216,52 232,48 244,52" fill="#fff"/><path d="M0 140 Q160 100 320 140 L320 220 L0 220Z" fill="#6ea64f"/><path d="M0 175 Q160 150 320 180 L320 220 L0 220Z" fill="#5a9140"/>
    ${[[60, 150], [100, 142], [190, 146], [235, 155], [140, 165]].map(([a, b]) => `<rect x="${a}" y="${b}" width="22" height="14" fill="#9c6a43"/><polygon points="${a - 3},${b} ${a + 11},${b - 9} ${a + 25},${b}" fill="#5b3a26"/><rect x="${a + 4}" y="${b + 4}" width="5" height="5" fill="#ffe7a8"/><rect x="${a + 13}" y="${b + 4}" width="5" height="5" fill="#ffe7a8"/>`).join('')}`),
  trem: svg(`<rect width="${W}" height="${H}" fill="#a9cdee"/><polygon points="0,120 90,50 170,110 260,45 320,90 320,220 0,220" fill="#7a8794"/><polygon points="260,45 247,64 262,60 272,64" fill="#fff"/><rect y="150" width="${W}" height="70" fill="#4f7d3f"/>
    <path d="M20 150 L300 150 L300 160 L20 160Z" fill="#8d8478"/>${[40, 100, 160, 220, 280].map((a) => `<path d="M${a - 26} 220 L${a - 26} 172 Q${a} 150 ${a + 26} 172 L${a + 26} 220Z" fill="#a1978a" stroke="#7c7366"/>`).join('')}
    <rect x="70" y="128" width="58" height="22" rx="3" fill="#c0262d"/><rect x="132" y="128" width="58" height="22" rx="3" fill="#c0262d"/><rect x="194" y="128" width="46" height="22" rx="3" fill="#c0262d"/>
    ${[78, 96, 112, 140, 158, 174, 202, 220].map((a) => `<rect x="${a}" y="132" width="10" height="8" fill="#fbe9c6"/>`).join('')}<rect x="236" y="120" width="2" height="9" fill="#333"/><line x1="60" y1="119" x2="250" y2="119" stroke="#333" stroke-width=".8"/>`),
  chaleFrente: svg(`${montanhas()}<rect y="185" width="${W}" height="35" fill="#fff"/>${chale(72, 110, 1)}`),
  chaleLado: svg(`${montanhas(false)}<rect y="180" width="${W}" height="40" fill="#f2f5f7"/>${chale(40, 128, 0.75)}<g fill="#2f4a33"><polygon points="230,190 245,120 260,190"/><polygon points="262,192 276,132 290,192"/></g>`),
  chaleVaranda: svg(`<rect width="${W}" height="${H}" fill="#cfe0ee"/><rect y="0" width="${W}" height="130" fill="#a0683e"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${18 + i * 50}" y="30" width="30" height="40" fill="#ffe7a8" stroke="#3b2416" stroke-width="3"/><line x1="${33 + i * 50}" y1="30" x2="${33 + i * 50}" y2="70" stroke="#3b2416" stroke-width="2"/>`).join('')}
    <rect y="130" width="${W}" height="10" fill="#6e4429"/><rect y="168" width="${W}" height="8" fill="#6e4429"/>${Array.from({ length: 17 }, (_, i) => `<rect x="${i * 20}" y="140" width="5" height="30" fill="#6e4429"/>`).join('')}<rect y="176" width="${W}" height="44" fill="#fdfdfd"/>`),
  ubatuba: svg(`<defs>${grain('g1', .25)}</defs><rect width="${W}" height="${H}" fill="#e8d9b8"/><rect x="10" y="10" width="300" height="200" fill="#c9b48a"/>
    <rect x="10" y="10" width="300" height="95" fill="#d9caa4"/><path d="M10 105 Q160 92 310 108 L310 140 L10 140Z" fill="#a89a7c"/><rect x="10" y="140" width="300" height="70" fill="#dccaa0"/>
    <path d="M200 110 Q240 60 300 70 L310 105Z" fill="#9b8f74"/>
    ${[[110, '#7a6448'], [160, '#6c573e'], [210, '#806a4d']].map(([cx, c]) => `<circle cx="${cx}" cy="96" r="12" fill="${c}"/><rect x="${cx - 14}" y="108" width="28" height="44" rx="10" fill="${c}"/><rect x="${cx - 12}" y="146" width="24" height="12" fill="#3f3528"/><rect x="${cx - 10}" y="158" width="8" height="34" fill="${c}"/><rect x="${cx + 2}" y="158" width="8" height="34" fill="${c}"/>`).join('')}
    <path d="M96 118 L232 118" stroke="#6c573e" stroke-width="7" stroke-linecap="round"/>
    <rect x="40" y="150" width="46" height="9" rx="4" fill="#efe7d3" transform="rotate(-12 63 154)"/>
    <text x="300" y="203" font-family="Georgia,serif" font-size="11" fill="#6a5a40" text-anchor="end">Ubatuba · 1971</text>
    <rect x="10" y="10" width="300" height="200" filter="url(#g1)"/>`),
  cida: svg(`<rect width="${W}" height="${H}" fill="#f2e6d6"/><rect x="0" y="150" width="${W}" height="70" fill="#d8c3a5"/><circle cx="160" cy="62" r="24" fill="#8a5a3c"/><path d="M136 60 Q160 28 184 60" fill="#3a2a22"/><rect x="122" y="86" width="76" height="80" rx="18" fill="#3e7bb6"/><rect x="112" y="128" width="96" height="10" fill="#fff" opacity=".9"/>
    <ellipse cx="160" cy="150" rx="54" ry="10" fill="#fff"/><rect x="118" y="124" width="84" height="26" fill="#f7c6d0"/><ellipse cx="160" cy="124" rx="42" ry="8" fill="#fbe0e6"/>${[138, 152, 166, 180].map((a) => `<rect x="${a}" y="104" width="3" height="18" fill="#f4e04d"/><circle cx="${a + 1.5}" cy="101" r="3" fill="#ff9d2e"/>`).join('')}`),
  vistoria: svg(`<rect width="${W}" height="${H}" fill="#7a6a58"/><g transform="rotate(-4 160 110)"><rect x="70" y="18" width="180" height="190" fill="#fbfaf6"/><text x="84" y="44" font-family="Arial" font-size="10" font-weight="700" fill="#222">ANEXO DE VISTORIA</text><text x="84" y="58" font-family="Arial" font-size="7" fill="#555">Loteamento Cajamar · laudo de solo · drenagem</text>${Array.from({ length: 12 }, (_, i) => `<rect x="84" y="${72 + i * 10}" width="${120 + (i * 37) % 30}" height="3" fill="#c9c6bc"/>`).join('')}</g>`),
  placa: svg(`<rect width="${W}" height="${H}" fill="#9cc3e6"/><rect y="150" width="${W}" height="70" fill="#b4562f"/><rect x="152" y="96" width="6" height="64" fill="#555"/><rect x="60" y="40" width="200" height="70" fill="#fff" stroke="#1d4f8c" stroke-width="5"/><text x="160" y="66" font-family="Arial" font-size="13" font-weight="700" fill="#1d4f8c" text-anchor="middle">LOTEAMENTO</text><text x="160" y="84" font-family="Arial" font-size="10" fill="#1d4f8c" text-anchor="middle">CAJAMAR · VENDAS NO LOCAL</text><text x="160" y="100" font-family="Arial" font-size="8" fill="#555" text-anchor="middle">8.000 empregos</text>`),
  voo: svg(`<rect width="${W}" height="${H}" fill="#e9edf2"/><rect width="${W}" height="26" fill="#2b4a73"/><text x="12" y="17" font-family="Arial" font-size="11" fill="#fff" font-weight="700">Flight search</text>
    <rect x="12" y="38" width="296" height="88" rx="4" fill="#fff" stroke="#c7cfd9"/>
    <text x="24" y="58" font-family="Arial" font-size="9" fill="#6b7685">FROM</text><text x="24" y="74" font-family="Arial" font-size="13" fill="#1a2533" font-weight="700">São Paulo (GRU)</text>
    <text x="180" y="58" font-family="Arial" font-size="9" fill="#6b7685">TO</text><text x="180" y="74" font-family="Arial" font-size="13" fill="#1a2533" font-weight="700">Zurich (ZRH)</text>
    <text x="24" y="98" font-family="Arial" font-size="9" fill="#6b7685">DEPART</text><text x="24" y="114" font-family="Arial" font-size="12" fill="#1a2533">Fri, 8 Oct 2010</text>
    <text x="180" y="98" font-family="Arial" font-size="9" fill="#6b7685">TRIP</text><text x="180" y="114" font-family="Arial" font-size="12" fill="#1a2533" font-weight="700">One way</text>
    <rect x="12" y="136" width="296" height="30" rx="4" fill="#fff" stroke="#c7cfd9"/><text x="24" y="155" font-family="Arial" font-size="10" fill="#1a2533">1 adult · Economy</text>
    <rect x="200" y="176" width="108" height="28" rx="4" fill="#e37b22"/><text x="254" y="194" font-family="Arial" font-size="11" fill="#fff" font-weight="700" text-anchor="middle">Search</text>`),
  // e-mail de 21/09: Helena de lado, foco no queixo e na pinta
  helenaPerfil: svg(`<rect width="${W}" height="${H}" fill="#3a2e28"/><rect x="0" y="0" width="${W}" height="${H}" fill="#6b4f3f" opacity=".5"/>
    <path d="M40 0 L230 0 Q262 40 255 92 Q250 132 222 160 Q190 190 150 196 Q110 200 80 186 L40 186Z" fill="#e5b896"/>
    <path d="M150 132 Q190 128 214 116" stroke="#b5625a" stroke-width="7" fill="none" stroke-linecap="round"/>
    <path d="M40 186 Q100 210 170 200 L170 ${H} L40 ${H}Z" fill="#d8a985"/>
    <circle cx="186" cy="168" r="4.2" fill="#3b2219"/>
    <rect x="0" y="0" width="${W}" height="${H}" fill="#000" opacity=".06"/>`),
  // foto da foto: inauguração da Têxtil Ferraz
  inauguracao: svg(`<defs>${grain('g2', .22)}</defs><rect width="${W}" height="${H}" fill="#4b3a2c"/><g transform="rotate(2 160 110)"><rect x="34" y="14" width="252" height="192" fill="#f1e7d2"/><rect x="44" y="24" width="232" height="160" fill="#d9c49d"/>
    <rect x="44" y="24" width="232" height="70" fill="#cdb48a"/><text x="160" y="50" font-family="Georgia,serif" font-size="12" fill="#6b4f2e" text-anchor="middle">TÊXTIL FERRAZ</text>
    <circle cx="110" cy="80" r="11" fill="#7d6142"/><rect x="96" y="91" width="28" height="60" rx="8" fill="#5b4a37"/>
    <circle cx="206" cy="82" r="10" fill="#8a6c4a"/><path d="M190 92 L222 92 L230 150 L182 150Z" fill="#b98e74"/>${[196, 208, 220].map((a) => `<circle cx="${a}" cy="${110 + (a % 3) * 8}" r="3" fill="#e9d6b8"/>`).join('')}
    <line x1="60" y1="118" x2="260" y2="118" stroke="#a3262a" stroke-width="4"/>
    <circle cx="158" cy="118" r="9" fill="#8a6a4c"/><path d="M149 114 Q158 102 167 114" fill="#3d2d20"/><circle cx="154.5" cy="123" r="1.3" fill="#2b1d14"/><rect x="148" y="127" width="20" height="40" rx="6" fill="#efe2c8"/>
    <path d="M140 118 L152 132 M146 132 L156 118" stroke="#777" stroke-width="2"/>
    <rect x="44" y="24" width="232" height="160" filter="url(#g2)"/></g>`),
};

// Frente do cartão-postal
SVG.postalFrente = svg(`${montanhas()}<rect y="180" width="${W}" height="40" fill="#fff"/>${chale(82, 112, 0.92)}<text x="14" y="206" font-family="Georgia,serif" font-size="12" font-style="italic" fill="#2b4a73">Valais · Schweiz</text>`);

// Fotos de feira da Dona Cida (pequenas)
SVG.feira = svg(`<rect width="${W}" height="${H}" fill="#f6efe2"/><rect y="120" width="${W}" height="100" fill="#c49a6c"/>${[[60, '#f2c230'], [110, '#e9442e'], [160, '#7bb34a'], [210, '#f28c28'], [260, '#7a3c8c']].map(([x, c]) => `<ellipse cx="${x}" cy="130" rx="24" ry="16" fill="${c}"/><ellipse cx="${x - 10}" cy="118" rx="18" ry="12" fill="${c}"/>`).join('')}<text x="160" y="196" font-family="Arial" font-size="12" fill="#5b3a26" text-anchor="middle">banana-prata · tomate · caqui</text>`);

module.exports = SVG;
