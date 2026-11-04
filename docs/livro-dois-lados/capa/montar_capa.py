# Monta a capa completa da UICLAP: contracapa + lombada + capa, com 5 mm de sangria.
# Uso: python3 montar_capa.py capa_frente.png [lombada_mm]
import sys, textwrap
from PIL import Image, ImageDraw, ImageFont, ImageFilter

DPI = 600
mm = lambda v: round(v * DPI / 25.4)
FRENTE = sys.argv[1]
LOMBADA = float(sys.argv[2]) if len(sys.argv) > 2 else 10.0
SANG, LARG, ALT = 5, 140, 210

W, H = mm(SANG * 2 + LARG * 2 + LOMBADA), mm(SANG * 2 + ALT)
AMARELO, AZUL, MARINHO = (248, 188, 49), (1, 77, 177), (14, 28, 66)
dobra_esq, dobra_dir = mm(SANG + LARG), mm(SANG + LARG + LOMBADA)

_f = Image.open(FRENTE).convert('RGB')
_b = _f.crop((0, 0, 30, _f.height)).resize((1, 1), Image.BOX).getpixel((0, 0))
AMARELO = _b  # o mesmo amarelo da borda da imagem
capa = Image.new('RGB', (W, H), AMARELO)

# ---- frente: imagem ampliada, costura azul/amarelo no centro da página ----
f = Image.open(FRENTE).convert('RGB')
esc = H / f.height
f = f.resize((round(f.width * esc), H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))
centro = dobra_dir + mm(LARG / 2)
x0 = centro - f.width // 2
ImageDraw.Draw(capa).rectangle([centro, 0, W, H], fill=AZUL)  # garante azul até a borda
# máscara com borda esquerda suave, para não marcar a emenda com o amarelo de fundo
mask = Image.new('L', f.size, 255)
md = ImageDraw.Draw(mask)
for i in range(mm(4)):
    md.line([(i, 0), (i, f.height)], fill=round(255 * i / mm(4)))
capa.paste(f, (x0, 0), mask)

d = ImageDraw.Draw(capa)
SERIF = '/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
SERIF_B = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
SERIF_I = '/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf'
pt = lambda p: round(p * DPI / 72)

# ---- contracapa ----
linhas = open(sys.argv[3] if len(sys.argv) > 3 else '../contracapa.txt', encoding='utf-8').read().strip().split('\n')
titulo, paragrafos = linhas[0], [l for l in linhas[1:] if l.strip()]
margem = mm(SANG + 18)
largura_txt = mm(LARG - 36)
y = mm(SANG + 30)

fT = ImageFont.truetype(SERIF_B, pt(15))
tw = d.textlength(titulo, font=fT)
d.text((mm(SANG) + (mm(LARG) - tw) / 2, y), titulo, font=fT, fill=MARINHO)
y += pt(15) + mm(9)

fP = ImageFont.truetype(SERIF, pt(10.5))
entre = round(pt(10.5) * 1.45)

def justificar(texto):
    global y
    palavras, linha = texto.split(), []
    def largura(ws): return d.textlength(' '.join(ws), font=fP)
    linhas = []
    for p in palavras:
        if linha and largura(linha + [p]) > largura_txt:
            linhas.append(linha); linha = [p]
        else:
            linha.append(p)
    linhas.append(linha)
    for i, ws in enumerate(linhas):
        if i < len(linhas) - 1 and len(ws) > 1:
            livre = largura_txt - sum(d.textlength(w, font=fP) for w in ws)
            gap, x = livre / (len(ws) - 1), margem
            for w in ws:
                d.text((x, y), w, font=fP, fill=MARINHO); x += d.textlength(w, font=fP) + gap
        else:
            d.text((margem, y), ' '.join(ws), font=fP, fill=MARINHO)
        y += entre
    y += round(entre * 0.6)

for p in paragrafos:
    justificar(p)

# assinatura discreta ao pé da contracapa (fica longe do canto do código de barras)
fS = ImageFont.truetype(SERIF_I, pt(9))
for i, t in enumerate(['Irmandade Conhecimento com Luz', 'irmandade-conhecimento-com-luz.onrender.com']):
    d.text((margem, mm(SANG + ALT - 30) + i * round(pt(9) * 1.5)), t, font=fS, fill=MARINHO)


# ---- lombada: texto de cima para baixo ----
fL = ImageFont.truetype(SERIF_B, pt(min(11, LOMBADA * 0.95)))
lomb = 'OS DOIS LADOS DO MESMO PENSAMENTO     ·     ROGÉRIO A S TORRES'
tw = round(d.textlength(lomb, font=fL)); th = pt(min(11, LOMBADA * 0.95)) * 2
faixa = Image.new('RGBA', (tw + 20, th), (0, 0, 0, 0))
ImageDraw.Draw(faixa).text(((tw + 20) / 2, th / 2), lomb, font=fL, fill=MARINHO, anchor='mm')
faixa = faixa.rotate(-90, expand=True)
capa.paste(faixa, ((dobra_esq + dobra_dir) // 2 - faixa.width // 2, H // 2 - faixa.height // 2), faixa)

capa.save('capa_completa_uiclap.png', dpi=(DPI, DPI))
capa.save('capa_completa_uiclap.pdf', resolution=DPI)
f_crop = capa.crop((dobra_dir, mm(SANG), dobra_dir + mm(LARG), mm(SANG + ALT)))
f_crop.save('capa_frente_600dpi.png', dpi=(DPI, DPI))
print('capa', W, 'x', H, 'px =', SANG * 2 + LARG * 2 + LOMBADA, 'x', SANG * 2 + ALT, 'mm; lombada', LOMBADA, 'mm')
