# Monta a capa completa da UICLAP: contracapa + lombada + capa, com sangria.
# Gabarito UICLAP (14x21 cm, 222 páginas, papel creme, sem orelha):
#   largura total 303 mm (7157 px) · altura 220 mm (5197 px) · 600 dpi
#   sangria 5 mm · margem de segurança 10 mm · lombada 13 mm (307 px)
# uso: python3 docs/livro-policial/capa/montar_capa.py
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.abspath(os.path.join(AQUI, '..', '..', '..'))
FONTES = os.path.join(RAIZ, 'public', 'assets', 'fonts')
DPI = 600
mm = lambda v: round(v / 25.4 * DPI)

W, H = 7157, 5197
SANG = mm(5)                  # 118
PAINEL = mm(140)              # 3307
LOMB = W - 2 * SANG - 2 * PAINEL  # 307
SEG = mm(10)                  # 236
X_CONTRA = SANG               # início da contracapa (corte)
X_LOMB = SANG + PAINEL
X_CAPA = X_LOMB + LOMB
Y_CORTE = SANG
ALTURA_CORTE = H - 2 * SANG   # 210 mm

OURO = (232, 196, 120)
OURO_CLARO = (246, 224, 170)
PAPEL = (236, 226, 204)

def fonte(nome, px):
    return ImageFont.truetype(os.path.join(FONTES, nome), px)

frente = Image.open(os.path.join(AQUI, 'capa_frente_300dpi.png')).convert('RGB')

# ---------- fundo: a própria arte, espelhada, desfocada e escurecida, para dar continuidade
base = Image.new('RGB', (W, H), (10, 8, 6))
fundo = frente.transpose(Image.FLIP_LEFT_RIGHT).resize((PAINEL + 2 * SANG + LOMB, H), Image.LANCZOS)
fundo = fundo.filter(ImageFilter.GaussianBlur(mm(6)))
fundo = ImageEnhance.Brightness(fundo).enhance(0.30)
base.paste(fundo, (0, 0))

# ---------- capa (frente): arte no tamanho exato do corte; a sangria é a borda da arte estendida
arte = frente.resize((PAINEL, ALTURA_CORTE), Image.LANCZOS)
arte = arte.filter(ImageFilter.UnsharpMask(radius=2, percent=50, threshold=3))
estendida = arte.resize((PAINEL + SANG, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(mm(1.5)))
base.paste(estendida, (X_CAPA, 0))
base.paste(arte, (X_CAPA, Y_CORTE))

# ---------- lombada: faixa preta com o título e o autor em ouro, lidos de cima para baixo
lomb = Image.new('RGB', (H, LOMB), (12, 10, 8))
d = ImageDraw.Draw(lomb)
f_tit = fonte('Cardo-Bold.ttf', mm(5.2))
f_aut = fonte('Cardo-Regular.ttf', mm(4.0))
cy = LOMB // 2
tit = 'TODO CRIME TEM UM AUTOR?'
aut = 'ROGÉRIO A S TORRES'
x0 = SANG + mm(16)
d.text((x0, cy), tit, font=f_tit, fill=OURO, anchor='lm')
d.text((H - SANG - mm(16), cy), aut, font=f_aut, fill=OURO_CLARO, anchor='rm')
d.line([(SANG, mm(1.2)), (H - SANG, mm(1.2))], fill=(120, 96, 52), width=4)
d.line([(SANG, LOMB - mm(1.2)), (H - SANG, LOMB - mm(1.2))], fill=(120, 96, 52), width=4)
base.paste(lomb.rotate(-90, expand=True), (X_LOMB, 0))

# ---------- contracapa: a sinopse
d = ImageDraw.Draw(base)
texto = open(os.path.join(AQUI, '..', 'contracapa.txt'), encoding='utf-8').read().strip().split('\n')
paras = [p.strip() for p in texto if p.strip()]
# aspas tipográficas
def aspas(s):
    out, abre = [], True
    for ch in s:
        if ch == '"':
            out.append('“' if abre else '”'); abre = not abre
        else:
            out.append(ch)
    return ''.join(out)
paras = [aspas(p) for p in paras]

esq = X_CONTRA + SEG + mm(6)
dir_ = X_CONTRA + PAINEL - SEG - mm(6)
larg = dir_ - esq
y = Y_CORTE + SEG + mm(10)

f_chamada = fonte('Cardo-Bold.ttf', mm(6.4))
d.text((esq + larg // 2, y), paras[0], font=f_chamada, fill=OURO, anchor='mt')
y += mm(6.4) + mm(5)
d.line([(esq + larg // 2 - mm(18), y), (esq + larg // 2 + mm(18), y)], fill=(150, 118, 62), width=5)
y += mm(8)

f_corpo = fonte('Cardo-Regular.ttf', mm(4.05))
f_ital = fonte('Cardo-Italic.ttf', mm(4.05))
entre = round(mm(4.05) * 1.45)

def quebra(txt, f):
    linhas, atual = [], ''
    for p in txt.split():
        teste = (atual + ' ' + p).strip()
        if d.textlength(teste, font=f) <= larg:
            atual = teste
        else:
            linhas.append(atual); atual = p
    if atual:
        linhas.append(atual)
    return linhas

def justificada(linha, f, y, ultima):
    palavras = linha.split()
    if ultima or len(palavras) == 1:
        d.text((esq, y), linha, font=f, fill=PAPEL); return
    total = sum(d.textlength(p, font=f) for p in palavras)
    esp = (larg - total) / (len(palavras) - 1)
    x = esq
    for p in palavras:
        d.text((x, y), p, font=f, fill=PAPEL)
        x += d.textlength(p, font=f) + esp

for i, p in enumerate(paras[1:]):
    f = f_ital if i == len(paras) - 2 else f_corpo   # o último parágrafo (o do celular) em itálico
    linhas = quebra(p, f)
    for j, l in enumerate(linhas):
        justificada(l, f, y, j == len(linhas) - 1)
        y += entre
    y += round(entre * 0.55)

limite_texto = y
# rodapé: site da Irmandade; o canto inferior fica livre para o código de barras e o ISBN
f_site = fonte('Cardo-Regular.ttf', mm(3.2))
d.text((esq, Y_CORTE + ALTURA_CORTE - SEG - mm(2)), 'irmandade-conhecimento-com-luz.onrender.com',
       font=f_site, fill=(190, 170, 130), anchor='ls')

out_png = os.path.join(AQUI, 'capa_completa_uiclap.png')
base.save(out_png, dpi=(DPI, DPI), optimize=True)
base.save(os.path.join(AQUI, 'capa_completa_uiclap.pdf'), 'PDF', resolution=DPI)

# prova com as linhas do gabarito (não enviar à UICLAP)
prova = base.copy()
dp = ImageDraw.Draw(prova)
for x in (X_CONTRA, X_LOMB, X_CAPA, X_CAPA + PAINEL):
    dp.line([(x, 0), (x, H)], fill=(255, 0, 0), width=6)
dp.rectangle([X_CONTRA, Y_CORTE, X_CAPA + PAINEL, Y_CORTE + ALTURA_CORTE], outline=(255, 0, 0), width=6)
for x0 in (X_CONTRA, X_CAPA):
    dp.rectangle([x0 + SEG, Y_CORTE + SEG, x0 + PAINEL - SEG, Y_CORTE + ALTURA_CORTE - SEG], outline=(0, 200, 255), width=6)
prova.resize((W // 4, H // 4), Image.LANCZOS).save(os.path.join(AQUI, 'prova_gabarito.png'))
print('ok', base.size, 'lombada', LOMB, 'px; texto termina a', round((Y_CORTE + ALTURA_CORTE - limite_texto) / DPI * 25.4), 'mm do pé')
