# Capa completa da UICLAP para O Pleno Existencial: contracapa + lombada + capa, 5 mm de sangria.
# Uso: python3 montar_capa.py capa_frente.jpg lombada_mm
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

DPI = 300
mm = lambda v: round(v * DPI / 25.4)
pt = lambda p: round(p * DPI / 72)
FRENTE, LOMBADA = sys.argv[1], float(sys.argv[2])
SANG, LARG, ALT = 5, 140, 210
W, H = mm(SANG * 2 + LARG * 2 + LOMBADA), mm(SANG * 2 + ALT)
dobra_esq, dobra_dir = mm(SANG + LARG), mm(SANG + LARG + LOMBADA)
DOURADO, CLARO = (226, 190, 120), (236, 226, 205)

f = Image.open(FRENTE).convert('RGB')

# ---- fundo da contracapa e da lombada: a metade escura da arte, espelhada, desfocada e escurecida ----
esq = f.crop((0, 0, round(f.width * 0.07), f.height))  # faixa da borda esquerda, sem letras
fundo = esq.resize((dobra_dir, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(mm(6)))
fundo = ImageEnhance.Brightness(fundo).enhance(0.55)
capa = Image.new('RGB', (W, H), (2, 6, 12))
capa.paste(fundo, (0, 0))

# ---- frente: arte ampliada, centrada na página; borda esquerda suavizada sobre o fundo ----
esc = H / f.height
fr = f.resize((round(f.width * esc), H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.5, percent=50, threshold=2))
x0 = dobra_dir + mm(LARG / 2) - fr.width // 2
mask = Image.new('L', fr.size, 255)
md = ImageDraw.Draw(mask)
for i in range(mm(6)):
    md.line([(i, 0), (i, fr.height)], fill=round(255 * i / mm(6)))
capa.paste(fr, (x0, 0), mask)
if x0 + fr.width < W:  # completa a sangria da direita, se faltar
    capa.paste(fr.crop((fr.width - (W - x0 - fr.width), 0, fr.width, H)).transpose(Image.FLIP_LEFT_RIGHT), (x0 + fr.width, 0))

d = ImageDraw.Draw(capa)
SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
SERIF_B = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SERIF_I = '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'

# ---- contracapa ----
linhas = [l.strip() for l in open(sys.argv[3] if len(sys.argv) > 3 else '../contracapa.txt', encoding='utf-8') if l.strip()]
titulo, paragrafos = linhas[0], linhas[1:]
margem, largura = mm(SANG + 18), mm(LARG - 36)
y = mm(SANG + 32)
fT = ImageFont.truetype(SERIF_B, pt(14))
d.text((mm(SANG) + mm(LARG) / 2, y), titulo, font=fT, fill=DOURADO, anchor='mt')
y += pt(14) + mm(4)
d.line([(mm(SANG) + mm(LARG) / 2 - mm(14), y), (mm(SANG) + mm(LARG) / 2 + mm(14), y)], fill=DOURADO, width=2)
y += mm(8)
fP = ImageFont.truetype(SERIF, pt(10.5))
entre = round(pt(10.5) * 1.5)

def bloco(texto):
    global y
    palavras, linha, out = texto.split(), [], []
    larg = lambda ws: d.textlength(' '.join(ws), font=fP)
    for p in palavras:
        if linha and larg(linha + [p]) > largura:
            out.append(linha); linha = [p]
        else:
            linha.append(p)
    out.append(linha)
    for i, ws in enumerate(out):
        if i < len(out) - 1 and len(ws) > 1:
            livre = largura - sum(d.textlength(w, font=fP) for w in ws)
            gap, x = livre / (len(ws) - 1), margem
            for w in ws:
                d.text((x, y), w, font=fP, fill=CLARO); x += d.textlength(w, font=fP) + gap
        else:
            d.text((margem, y), ' '.join(ws), font=fP, fill=CLARO)
        y += entre
    y += round(entre * 0.6)

for p in paragrafos:
    bloco(p)

fS = ImageFont.truetype(SERIF_I, pt(9))
for i, t in enumerate(['Irmandade Conhecimento com Luz', 'irmandade-conhecimento-com-luz.onrender.com']):
    d.text((margem, mm(SANG + ALT - 30) + i * round(pt(9) * 1.5)), t, font=fS, fill=DOURADO)

# ---- lombada, de cima para baixo ----
tam = min(11, LOMBADA * 0.9)
fL = ImageFont.truetype(SERIF_B, pt(tam))
txt = 'O PLENO EXISTENCIAL     ·     ROGÉRIO A S TORRES'
tw, th = round(d.textlength(txt, font=fL)) + 20, pt(tam) * 2
faixa = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
ImageDraw.Draw(faixa).text((tw / 2, th / 2), txt, font=fL, fill=DOURADO, anchor='mm')
faixa = faixa.rotate(-90, expand=True)
capa.paste(faixa, ((dobra_esq + dobra_dir) // 2 - faixa.width // 2, H // 2 - faixa.height // 2), faixa)

capa.save('capa_completa_uiclap.png', dpi=(DPI, DPI))
capa.convert('RGB').save('capa_completa_uiclap.jpg', quality=95, dpi=(DPI, DPI))
print('capa', W, 'x', H, 'px =', SANG * 2 + LARG * 2 + LOMBADA, 'x', SANG * 2 + ALT, 'mm; lombada', LOMBADA, 'mm')
