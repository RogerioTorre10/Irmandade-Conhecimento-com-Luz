"""Monta a capa completa (contracapa + lombada + capa) de O Pleno Existencial
nas medidas da UICLAP: 301 x 220 mm com sangria, 600 DPI (7110 x 5197 px)."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps
import sys, textwrap

S = '/tmp/claude-0/-home-claude/de3db6b6-6c37-53ce-b253-e34cc42fbc3a/scratchpad'
FRONT = sys.argv[1]
FONTS = S + '/fonts/gf/ofl'
MM = 600 / 25.4                       # px por mm
W, H = 7110, 5197
BLEED = 118
PANEL = 3307                          # 140 mm
SPINE = 260                           # 11 mm
SPINE_X = BLEED + PANEL               # 3425
FRONT_X = SPINE_X + SPINE             # 3685
GOLD = (232, 196, 132)
CREAM = (238, 228, 210)
NAVY = (11, 17, 27)

def font(name, size, wght=None):
    f = ImageFont.truetype(f'{FONTS}/{name}', size)
    if wght is not None:
        try:
            f.set_variation_by_axes([wght])
        except Exception:
            pass
    return f

cinzel = lambda s, w=600: font('cinzel/Cinzel[wght].ttf', s, w)
corm = lambda s, w=500: font('cormorantgaramond/CormorantGaramond[wght].ttf', s, w)
cormi = lambda s, w=500: font('cormorantgaramond/CormorantGaramond-Italic[wght].ttf', s, w)

canvas = Image.new('RGB', (W, H), NAVY)

# ---------- capa (frente): imagem original + sangria espelhada ----------
img = Image.open(FRONT).convert('RGB')
assert img.size == (3307, 4961), img.size
fw, fh = img.size
pad = Image.new('RGB', (fw + BLEED, fh + 2 * BLEED))
pad.paste(img, (0, BLEED))
pad.paste(ImageOps.flip(img.crop((0, 0, fw, BLEED))), (0, 0))                 # topo
pad.paste(ImageOps.flip(img.crop((0, fh - BLEED, fw, fh))), (0, fh + BLEED))  # base
right = pad.crop((fw - BLEED, 0, fw, fh + 2 * BLEED))
pad.paste(ImageOps.mirror(right), (fw, 0))                                    # direita
canvas.paste(pad, (FRONT_X, 0))

# ---------- contracapa: a imagem espelhada, desfocada e escurecida ----------
back = ImageOps.mirror(img).resize((PANEL + BLEED, H))
back = back.filter(ImageFilter.GaussianBlur(60))
back = ImageEnhance.Brightness(back).enhance(0.28)
canvas.paste(back, (0, 0))

# ---------- lombada ----------
d = ImageDraw.Draw(canvas)
d.rectangle([SPINE_X, 0, FRONT_X - 1, H], fill=NAVY)
spine_txt = 'O PLENO EXISTENCIAL     ·     ROGÉRIO A S TORRES'
f = cinzel(104, 600)
tw = int(d.textlength(spine_txt, font=f))
strip = Image.new('RGBA', (tw + 40, SPINE), (0, 0, 0, 0))
ds = ImageDraw.Draw(strip)
bbox = ds.textbbox((0, 0), spine_txt, font=f)
th = bbox[3] - bbox[1]
ds.text((20, (SPINE - th) // 2 - bbox[1]), spine_txt, font=f, fill=GOLD)
strip = strip.rotate(270, expand=True)   # lê de cima para baixo
canvas.paste(strip, (SPINE_X + (SPINE - strip.width) // 2, (H - strip.height) // 2), strip)

# ---------- textos da contracapa ----------
x0 = BLEED + int(18 * MM)
x1 = SPINE_X - int(18 * MM)
boxw = x1 - x0

def wrap(text, f, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    lines.append(cur)
    return lines

def para(y, text, f, fill, lh=1.42, align='left'):
    lines = wrap(text, f, boxw)
    size = f.size
    for i, ln in enumerate(lines):
        last = i == len(lines) - 1
        if align == 'justify' and not last and ' ' in ln:
            ws = ln.split(' ')
            total = sum(d.textlength(w, font=f) for w in ws)
            gap = (boxw - total) / (len(ws) - 1)
            x = x0
            for w in ws:
                d.text((x, y), w, font=f, fill=fill)
                x += d.textlength(w, font=f) + gap
        elif align == 'center':
            d.text((x0 + (boxw - d.textlength(ln, font=f)) / 2, y), ln, font=f, fill=fill)
        else:
            d.text((x0, y), ln, font=f, fill=fill)
        y += int(size * lh)
    return y

y = BLEED + int(26 * MM)
y = para(y, 'O pleno não é o cheio.', cormi(190, 500), GOLD, lh=1.2, align='center')
y += int(5 * MM)
d.line([(x0 + boxw / 2 - 160, y), (x0 + boxw / 2 + 160, y)], fill=GOLD, width=4)
y += int(9 * MM)
sinopse = ('Existe em cada ser humano uma energia que o habita desde a origem: o Pleno Existencial. '
           'As feridas da vida podem abafá-la, os excessos podem sufocá-la, mas ela não se apaga. '
           'Neste livro, Rogério A S Torres apresenta a Teoria do Pleno Existencial, uma travessia entre '
           'o vazio e o cheio, da gestação à maturidade, para ajudar o leitor a reconhecer o que o afasta '
           'de si mesmo e reencontrar a medida, a direção e a luz que sempre estiveram lá.')
y = para(y, sinopse, corm(118, 500), CREAM, lh=1.45)
y += int(11 * MM)
d.text((x0, y), 'SOBRE O AUTOR', font=cinzel(70, 600), fill=GOLD)
y += int(8 * MM)
bio = ('Rogério A S Torres é psicólogo, músico, artista e criador de conteúdo, fundador da Irmandade '
       'Conhecimento com Luz, que une autoconhecimento, filosofia, espiritualidade e tecnologia em '
       'jornadas de reflexão.')
y = para(y, bio, corm(100, 500), CREAM, lh=1.45)
bottom_text_limit = y

# selo (canto inferior esquerdo, dentro da margem de segurança)
selo_y = H - BLEED - int(18 * MM)
d.text((x0, selo_y), 'IRMANDADE CONHECIMENTO COM LUZ', font=cinzel(58, 600), fill=GOLD)

# espaço reservado ao código de barras e ISBN da UICLAP (canto inferior direito)
bx1, by1 = x1, H - BLEED - int(12 * MM)
bx0, by0 = bx1 - int(50 * MM), by1 - int(30 * MM)
assert bottom_text_limit < by0, ('texto invade a área do código de barras', bottom_text_limit, by0)

out = S + '/O_PLENO_EXISTENCIAL_capa'
canvas.save(out + '.png', dpi=(600, 600))
canvas.save(out + '.pdf', 'PDF', resolution=600, quality=95)
prev = canvas.resize((W // 6, H // 6), Image.LANCZOS)
pd = ImageDraw.Draw(prev)
for x in (BLEED, SPINE_X, FRONT_X, W - BLEED):
    pd.line([(x // 6, 0), (x // 6, H // 6)], fill=(255, 0, 0), width=1)
for yy in (BLEED, H - BLEED):
    pd.line([(0, yy // 6), (W // 6, yy // 6)], fill=(255, 0, 0), width=1)
pd.rectangle([bx0 // 6, by0 // 6, bx1 // 6, by1 // 6], outline=(0, 200, 255), width=2)
prev.save(out + '_previa.png')
print('ok', canvas.size, 'texto termina em', bottom_text_limit, 'barras começa em', by0)
