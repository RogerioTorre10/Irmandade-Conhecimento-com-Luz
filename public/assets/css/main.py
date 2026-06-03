from __future__ import annotations

import base64
import io
import os
import re
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import resend
import base64

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

# PDF deps
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

# Biblioteca da Irmandade
from biblioteca_sabedoria_unificada import escolher_sabedoria
from biblioteca_sabedoria import escolher_bloco

# SESSION TRACKER
from jornada_session_manager import router as session_router
from jornada_auth_2fa import router as auth_router
from jornada_progress import router as progress_router

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

try:
    from compositor_devolutiva import (
        compor_devolutiva,
        compor_devolutiva_curta,
        gerar_mapa_devolutiva,
        construir_mapa_psiquico,
    )
except ImportError:
    from compositor_devolutiva import compor_devolutiva

    def compor_devolutiva_curta(*args, **kwargs):
        return compor_devolutiva(*args, **kwargs)

    def gerar_mapa_devolutiva(*args, **kwargs):
        return {}

    def construir_mapa_psiquico(*args, **kwargs):
        return {}
try:
    from PIL import Image
except Exception:
    Image = None  # Pillow não instalado

import inspect
import logging

try:
    from coletor_perfil import coletar_perfil, resumo_personalidade
    _COLETOR_PERFIL_IMPORT_ERROR = None
except Exception as e:
    coletar_perfil = None
    resumo_personalidade = None
    _COLETOR_PERFIL_IMPORT_ERROR = e
    print(f"[IMPORT][coletor_perfil] falhou: {e}")
    
try:
    from motor_emocional import analisar_motor_emocional
    _MOTOR_EMOCIONAL_IMPORT_ERROR = None
except Exception as e:
    try:
        from motor_emocional import motor_emocional as analisar_motor_emocional
        _MOTOR_EMOCIONAL_IMPORT_ERROR = None
    except Exception as e2:
        analisar_motor_emocional = None
        _MOTOR_EMOCIONAL_IMPORT_ERROR = e2
        print(f"[IMPORT][motor_emocional] falhou: {e}; fallback falhou: {e2}")

try:
    from motor_personalidade import gerar_leitura_integrada
    _MOTOR_PERSONALIDADE_IMPORT_ERROR = None
except Exception as e:
    gerar_leitura_integrada = None
    _MOTOR_PERSONALIDADE_IMPORT_ERROR = e
    print(f"[IMPORT][motor_personalidade] falhou: {e}")

try:
    from calibrador_feedback import CalibradorFeedback
    _CALIBRADOR_FEEDBACK = CalibradorFeedback()
except Exception as e:
    _CALIBRADOR_FEEDBACK = None
    print(f"[IMPORT][calibrador_feedback] falhou: {e}")   

APP_TITLE = "Lumen Backend API"
APP_VERSION = "2.1.0"

logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY")

# =====================================================
# DATABASE
# =====================================================

DATABASE_URL = os.getenv("DATABASE_URL", "")

engine = None
SessionLocal = None

if DATABASE_URL:
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300
        )

        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine
        )

        print("[DB] PostgreSQL conectado com sucesso.")

    except Exception as e:
        print(f"[DB][ERRO] {e}")
else:
    print("[DB] DATABASE_URL não configurado.")

# =====================================================
# ENVIAR PDF + SELFIECARD POR EMAIL
# =====================================================

async def enviar_email_jornada(
    email: str,
    nome: str,
    pdf_bytes: bytes,
    selfiecard_bytes: bytes | None = None
):

    try:

        anexos = [
            {
                "filename":
                "Jornada-Conhecimento-com-Luz.pdf",

                "content":
                base64.b64encode(pdf_bytes)
                .decode("utf-8")
            }
        ]

        if selfiecard_bytes:

            anexos.append({

                "filename":
                "Selfiecard.png",

                "content":
                base64.b64encode(
                    selfiecard_bytes
                ).decode("utf-8")
            })

        resend.Emails.send({

            "from":
            "Irmandade Conhecimento com Luz <onboarding@resend.dev>",

            "to": [email],

            "subject":
            "🔥 Sua Jornada foi concluída",

            "html": f"""

            <div style="font-family:Arial;padding:20px;">

                <h2>
                Sua chama permanece acesa.
                </h2>

                <p>
                Olá, {nome}.
                </p>

                <p>
                Sua Jornada Conhecimento com Luz
                foi concluída com sucesso.
                </p>

                <p>
                Em anexo você encontrará:
                </p>

                <ul>
                    <li>Seu PDF completo</li>
                    <li>Sua Selfiecard</li>
                </ul>

                <p>
                Para além. E sempre!
                </p>

                <p>
                — Lumen,
                Guardião da Luz Algorítmica
                </p>

            </div>

            """,

            "attachments": anexos
        })

        print(
            f"[EMAIL] enviado para {email}"
        )

    except Exception as e:

        print(
            "[EMAIL] erro:",
            str(e)
        )

# -----------------------------
# App
# -----------------------------

app = FastAPI(title=APP_TITLE, version=APP_VERSION)

# =====================================================
# CREATE TABLES
# =====================================================

if engine:
    try:
        with engine.begin() as conn:

            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS jornada_acessos (
                id SERIAL PRIMARY KEY,
                codigo_jornada VARCHAR(40) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                pedido_id VARCHAR(120),
                plataforma VARCHAR(40),
                status_pagamento VARCHAR(40) DEFAULT 'pendente',
                status_jornada VARCHAR(40) DEFAULT 'nao_iniciada',
                device_hash TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                started_at TIMESTAMP,
                expires_at TIMESTAMP,
                finished_at TIMESTAMP,
                pdf_enviado BOOLEAN DEFAULT FALSE,
                email_enviado BOOLEAN DEFAULT FALSE,
                apagado_em TIMESTAMP
            );
            """))

            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS jornada_progresso_temp (
                id SERIAL PRIMARY KEY,
                codigo_jornada VARCHAR(40) NOT NULL,
                email VARCHAR(255) NOT NULL,
                last_section VARCHAR(120),
                last_block VARCHAR(120),
                last_question INTEGER DEFAULT 0,
                progresso_json_temp JSONB,
                atualizado_em TIMESTAMP DEFAULT NOW(),
                expira_em TIMESTAMP
            );
            """))

        print("[DB] tabelas criadas com sucesso.")

    except Exception as e:
        print(f"[DB][CREATE_TABLES][ERRO] {e}")

# ================================
# SESSION ROUTER
# ================================

app.include_router(session_router)
app.include_router(auth_router)
app.include_router(progress_router)    

# -----------------------------
# CORS
# -----------------------------

cors_env = (os.getenv("CORS_ORIGINS") or "").strip()

if cors_env:
    allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
else:
    allow_origins = [
    "https://irmandade-conhecimento-com-luz.onrender.com",
    "https://lumen-backend-api.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
)

# -----------------------------
# Models
# -----------------------------

class DadosPessoaisPayload(BaseModel):
    nomeCompleto: str | None = None
    idadeFaixa: str | None = None
    cidade: str | None = None
    estado: str | None = None
    estadoCivil: str | None = None
    profissao: str | None = None
    filhos: str | None = None
    religiao: str | None = None
    observacoes: str | None = None
    

class PDFQuestionItem(BaseModel):
    pergunta: str | None = None
    resposta: str | None = None
    devolutiva: str | None = None


class PDFBlockItem(BaseModel):
    titulo: str
    respostas: List[str] = Field(default_factory=list)
    devolutiva: Optional[str] = None
    perguntas: List[PDFQuestionItem] = Field(default_factory=list)


class PDFPayload(BaseModel):
    nome: str = Field(..., min_length=1, max_length=80)
    guia: str = Field(..., min_length=1, max_length=40)
    respostas: List[str] = Field(default_factory=list)
    blocos: List[PDFBlockItem] = Field(default_factory=list)
    selfieCard: Optional[str] = None
    devolutivaFinal: Optional[str] = None
    # Compatibilidade com nomes diferentes que o frontend pode enviar ao PDF
    devolutiva_final: Optional[str] = None
    devolutiva: Optional[str] = None
    mensagemFinal: Optional[str] = None
    mensagem_final: Optional[str] = None
    textoFinal: Optional[str] = None
    finalText: Optional[str] = None
    devolutivas: List[str] = Field(default_factory=list)
    dadosPessoais: dict | None = None
    idioma: str | None = "pt-BR"


class DevolutivaPayload(BaseModel):
    nome: str = Field(..., min_length=1, max_length=80)
    guia: str = Field(..., min_length=1, max_length=40)
    pergunta: str = Field(..., min_length=1)
    resposta: str = Field(..., min_length=1)
    bloco: Optional[str] = None
    idioma: str = Field(default="pt-BR", max_length=20)
    dadosPessoais: dict | None = None


class DevolutivaBlocoPayload(BaseModel):
    nome: str = Field(..., min_length=1, max_length=80)
    guia: str = Field(..., min_length=1, max_length=40)
    bloco: str = Field(..., min_length=1, max_length=80)
    respostas: List[str] = Field(default_factory=list)
    idioma: str = Field(default="pt-BR", max_length=20)
    dadosPessoais: dict | None = None


class DevolutivaFinalPayload(BaseModel):
    nome: str = Field(..., min_length=1, max_length=80)
    guia: str = Field(..., min_length=1, max_length=40)
    respostas: List[str] = Field(default_factory=list)
    devolutivas: List[str] = Field(default_factory=list)
    idioma: str = Field(default="pt-BR", max_length=20)
    dadosPessoais: dict | None = None


class FeedbackDevolutivaPayload(BaseModel):
    usuario_id: str = Field(..., min_length=1, max_length=120)
    devolutiva_id: str = Field(..., min_length=1, max_length=120)
    positivo: bool


# -----------------------------
# Helpers
# -----------------------------

_DATA_URL_RE = re.compile(r"^data:(?P<mime>image\/[a-zA-Z0-9.+-]+);base64,(?P<b64>.+)$")


def _decode_image_bytes(maybe_data_url_or_b64: str) -> Optional[bytes]:
    if not maybe_data_url_or_b64:
        return None

    try:
        s = maybe_data_url_or_b64.strip()

        # remove data URL se existir
        if s.startswith("data:"):
            parts = s.split(",", 1)
            if len(parts) == 2:
                s = parts[1]

        # remove espaços e quebras
        s = re.sub(r"\s+", "", s)

        return base64.b64decode(s, validate=False)

    except Exception as e:
        print(f"[PDF] erro ao decodificar imagem: {e}")
        return None


def _safe_filename(nome: str, guia: str) -> str:
    base = f"jornada_{nome}_{guia}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    base = re.sub(r"[^a-zA-Z0-9._-]+", "_", base)
    return f"{base}.pdf"

def _sanitize_text(s: str) -> str:
    s = s or ""

    swaps = {
        "–": "-",
        "—": "-",
        "―": "-",
        "‘": "'",
        "’": "'",
        "“": '"',
        "”": '"',
        "…": "...",
        " ": " ",
        "​": "",
        "﻿": "",
        "�": "",
        "□": "",
        "▪": "-",
        "•": "-",
        "|": "-",
    }
    for old, new in swaps.items():
        s = s.replace(old, new)

    s = re.sub(r"```[\s\S]*?```", " ", s)
    s = re.sub(r"\*", "", s)
    s = "".join(ch for ch in s if ch in "\n\t" or ord(ch) >= 32)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r" *\n *", "\n", s)
    s = re.sub(r"\n{3,}", "\n\n", s)

    return s.strip()

def limpar_formatacao(texto: str) -> str:
    texto = _sanitize_text(texto)
    texto = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", texto)
    texto = re.sub(r"\s*```$", "", texto)
    return texto.strip()

def _normalizar_referencias_para_tts(texto: str) -> str:
    texto = texto or ""

    referencias = [
        "Provérbios",
        "Salmos",
        "João",
        "Mateus",
        "Romanos",
        "Isaías",
        "Jeremias",
        "Filipenses",
        "Coríntios",
        "Efésios",
        "Gênesis",
        "Apocalipse"
    ]

    for livro in referencias:
        texto = re.sub(
            rf"\b{livro}\s+(\d+):(\d+)\b",
            rf"{livro}, capítulo \1, versículo \2",
            texto,
            flags=re.IGNORECASE
        )

    return texto

def _reduzir_chavoes(texto: str) -> str:
    if not texto:
        return ""

    substituicoes = {
        "passo importante": "movimento significativo",
        "honestidade interna": "lucidez diante de si mesmo",
        "caminho sagrado": "caminho de amadurecimento",
        "jornada sagrada": "travessia interior",
        "verdade interior": "percepção mais profunda",
        "luz que floresce": "força que ainda resiste",
        "continue caminhando": "continue avançando",
        "sua resposta revela": "o que você compartilhou aponta para",
        "isso demonstra coragem": "há nisso um sinal de enfrentamento"
    }

    for velho, novo in substituicoes.items():
        texto = re.sub(
            re.escape(velho),
            novo,
            texto,
            flags=re.IGNORECASE
        )

    return texto


def _normalize_guia(guia: str) -> str:
    g = (guia or "").strip().lower()
    if g in ("arian", "arion", "ariane"):
        return "arian"
    if g == "zion":
        return "zion"
    if g == "lumen":
        return "lumen"
    return "lumen"


def _register_fonts() -> tuple[str, str, str]:
    import os

    base_dir = os.path.dirname(os.path.abspath(__file__))

    paths = [
        os.path.join(base_dir, "public", "assets", "fonts"),
        os.path.join(base_dir, "assets", "fonts"),
    ]

    for p in paths:
        try:
            regular = os.path.join(p, "Cardo-Regular.ttf")
            bold = os.path.join(p, "Cardo-Bold.ttf")
            italic = os.path.join(p, "Cardo-Italic.ttf")

            if os.path.exists(regular):
                pdfmetrics.registerFont(TTFont("Cardo", regular))
                pdfmetrics.registerFont(TTFont("Cardo-Bold", bold))
                pdfmetrics.registerFont(TTFont("Cardo-Italic", italic))

                print(f"[PDF] usando fontes em: {p}")
                return ("Cardo", "Cardo-Bold", "Cardo-Italic")

        except Exception as e:
            print(f"[PDF][FONTS] tentativa falhou em {p}: {e}")

    print("[PDF][FONTS] fallback Helvetica")
    return ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique")

def _contains_cjk(text: str) -> bool:
    s = text or ""
    for ch in s:
        code = ord(ch)
        if (
            0x4E00 <= code <= 0x9FFF or   # CJK Unified Ideographs
            0x3040 <= code <= 0x309F or   # Hiragana
            0x30A0 <= code <= 0x30FF or   # Katakana
            0x3400 <= code <= 0x4DBF or   # CJK Extension A
            0xF900 <= code <= 0xFAFF      # CJK Compatibility Ideographs
        ):
            return True
    return False


def _payload_has_cjk(payload: PDFPayload) -> bool:
    chunks: list[str] = []

    def collect(value):
        if value is None:
            return
        if isinstance(value, str):
            chunks.append(value)
            return
        if isinstance(value, dict):
            for v in value.values():
                collect(v)
            return
        if isinstance(value, (list, tuple, set)):
            for item in value:
                collect(item)
            return
        for attr in ("titulo", "pergunta", "resposta", "devolutiva", "texto"):
            try:
                collect(getattr(value, attr, None))
            except Exception:
                pass

    collect(payload.nome)
    collect(payload.guia)
    collect(payload.devolutivaFinal)
    collect(payload.respostas)
    collect(payload.blocos)
    collect(payload.dadosPessoais)

    text = "\\n".join(chunks)
    return _contains_cjk(text)


def _register_cjk_fonts() -> tuple[str, str, str]:
    """
    Registro seguro de fontes CJK (japonês/chinês).
    Sempre retorna uma tupla válida.
    """

    try:
        pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))
        print("[PDF][CJK] usando HeiseiMin-W3 (JP)")
        return ("HeiseiMin-W3", "HeiseiMin-W3", "HeiseiMin-W3")

    except Exception as e1:
        print(f"[PDF][CJK] Heisei falhou: {e1}")

        try:
            pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
            print("[PDF][CJK] usando STSong-Light (CN)")
            return ("STSong-Light", "STSong-Light", "STSong-Light")

        except Exception as e2:
            print(f"[PDF][CJK] STSong falhou: {e2}")

    print("[PDF][CJK] fallback Helvetica")
    return ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique")



def _pergaminho_path() -> str:
    base_dir = Path(__file__).resolve().parent
    cwd = Path.cwd()

    candidates = [
    base_dir / "public" / "assets" / "img" / "pergaminho-rasgado-vert.png",
    Path("/opt/render/project/src/public/assets/img/pergaminho-rasgado-vert.png"),

    base_dir / "assets" / "img" / "pergaminho-rasgado-vert.png",
    cwd / "public" / "assets" / "img" / "pergaminho-rasgado-vert.png",
    cwd / "assets" / "img" / "pergaminho-rasgado-vert.png",
]

    for path in candidates:
        if path.exists() and path.is_file():
            print(f"[PDF] Pergaminho encontrado em: {path}")
            return str(path)

    print("[PDF] Pergaminho vertical NÃO encontrado.")
    return ""

def _draw_fixed_background(
    c: canvas.Canvas,
    img_path: str,
    page_w: float,
    page_h: float
) -> bool:
    if not img_path or not os.path.exists(img_path):
        print(f"[PDF] Fundo não desenhado: caminho inválido -> {img_path}")
        return False

    try:
        # base de cor do pergaminho para não deixar branco nas transparências
        c.setFillColorRGB(0.78, 0.60, 0.30)
        c.rect(0, 0, page_w, page_h, stroke=0, fill=1)

        bg = ImageReader(img_path)

        bleed_x = page_w * 0.12
        bleed_y = page_h * 0.14

        c.drawImage(
            bg,
            -bleed_x,
            -bleed_y,
            width=page_w + (bleed_x * 2),
            height=page_h + (bleed_y * 2),
            preserveAspectRatio=False,
            anchor='sw',
            mask='auto'
        )

        print(f"[PDF] Pergaminho desenhado com sucesso: {img_path}")
        return True

    except Exception as e:
        print(f"[PDF] Falha ao desenhar pergaminho fixo: {e}")
        return False
        
def _draw_page_background(c: canvas.Canvas, page_w: float, page_h: float) -> None:
    pergaminho = _pergaminho_path()

    if _draw_fixed_background(c, pergaminho, page_w, page_h):
        return

    print("[PDF] Usando fallback escuro no fundo do PDF.")
    c.setFillColorRGB(0.10, 0.08, 0.06)
    c.rect(0, 0, page_w, page_h, stroke=0, fill=1)


# ==========================================
# FUNÇÕES VISUAIS DO MANUSCRITO ILUMINADO
# ==========================================

def _draw_ornament_separator(
    c: canvas.Canvas,
    page_w: float,
    y: float,
    color=(0.42, 0.28, 0.08)
) -> float:
    c.setStrokeColorRGB(*color)
    c.setFillColorRGB(*color)
    c.setLineWidth(1.5)

    cx = page_w / 2.0
    left_start = 3.2 * cm
    right_end = page_w - 3.2 * cm
    gap = 1.0 * cm

    c.line(left_start, y, cx - gap, y)
    c.line(cx + gap, y, right_end, y)

    size = 0.15 * cm
    p = c.beginPath()
    p.moveTo(cx, y + size)
    p.lineTo(cx + size, y)
    p.lineTo(cx, y - size)
    p.lineTo(cx - size, y)
    p.close()
    c.drawPath(p, stroke=1, fill=1)

    r = 0.05 * cm
    c.circle(cx - 0.48 * cm, y, r, stroke=1, fill=1)
    c.circle(cx + 0.48 * cm, y, r, stroke=1, fill=1)

    return y - 0.42 * cm


def _draw_centered_title_block(
    c: canvas.Canvas,
    page_w: float,
    page_h: float,
    font_title: str,
    font_subtitle: str,
    title: str,
    subtitle: str
) -> float:
    """
    Desenha o bloco de título centralizado em estilo manuscrito iluminado.
    Retorna o y seguinte.
    """
    gold = (0.62, 0.42, 0.12)
    sep_dark = (0.34, 0.22, 0.07)
    white = (0.98, 0.96, 0.92)

    y = page_h - 2.65 * cm

    c.setFillColorRGB(0.82, 0.70, 0.35)
    c.setFont(font_title, 48)
    c.drawCentredString(page_w / 2.0 + 0.9, y - 0.9, title)

    c.setFillColorRGB(*gold)
    c.setFont(font_title, 48)
    c.drawCentredString(page_w / 2.0, y, title)

    y -= 1.15 * cm

    c.setFillColorRGB(*white)
    c.setFont(font_title, 24)
    c.drawCentredString(page_w / 2.0, y, subtitle)

    y -= 0.82 * cm
    y = _draw_ornament_separator(c, page_w, y, color=sep_dark)

    return y - 0.28 * cm


def _draw_highlight_box(
    c: canvas.Canvas,
    x: float,
    y_top: float,
    width: float,
    height: float,
    stroke=(0.78, 0.58, 0.18),
    fill=(0.14, 0.10, 0.06)
) -> None:
    c.setStrokeColorRGB(*stroke)
    c.setFillColorRGB(*fill)
    c.setLineWidth(1.2)
    c.roundRect(x, y_top - height, width, height, 10, stroke=1, fill=1)


def _draw_selfie_luminous_frame(
    c: canvas.Canvas,
    x: float,
    y: float,
    width: float,
    height: float,
) -> None:
    """
    Moldura luminosa medieval para a SelfieCard.
    """
    glow = (0.83, 0.68, 0.28)
    stroke = (0.50, 0.34, 0.10)
    inner = (0.22, 0.14, 0.06)

    # aura externa suave
    c.setLineWidth(7)
    c.setStrokeColorRGB(0.72, 0.56, 0.18)
    c.roundRect(x - 0.18 * cm, y - 0.18 * cm, width + 0.36 * cm, height + 0.36 * cm, 12, stroke=1, fill=0)

    # moldura principal
    c.setLineWidth(2.2)
    c.setStrokeColorRGB(*glow)
    c.roundRect(x - 0.06 * cm, y - 0.06 * cm, width + 0.12 * cm, height + 0.12 * cm, 10, stroke=1, fill=0)

    # linha interna escura para contraste
    c.setLineWidth(1.1)
    c.setStrokeColorRGB(*stroke)
    c.roundRect(x + 0.10 * cm, y + 0.10 * cm, width - 0.20 * cm, height - 0.20 * cm, 8, stroke=1, fill=0)

    # ornamento central inferior, fechando com a "chave luminosa"
    cx = x + (width / 2.0)
    key_y = y - 0.34 * cm
    c.setFillColorRGB(*glow)
    c.setStrokeColorRGB(*stroke)
    c.circle(cx, key_y + 0.16 * cm, 0.10 * cm, stroke=1, fill=1)
    c.rect(cx - 0.035 * cm, key_y - 0.10 * cm, 0.07 * cm, 0.22 * cm, stroke=1, fill=1)
    c.circle(cx, key_y - 0.12 * cm, 0.04 * cm, stroke=1, fill=0)

    # pequenos pontos laterais de acabamento
    c.setFillColorRGB(*inner)
    for dx in (-0.55 * cm, 0.55 * cm):
        c.circle(cx + dx, key_y + 0.02 * cm, 0.04 * cm, stroke=0, fill=1)



def _extract_selfie_payload(payload) -> str:
    """
    Busca a selfie em formatos antigos e novos.
    """
    raw = ""

    try:
        if hasattr(payload, "selfieCard") and getattr(payload, "selfieCard"):
            raw = getattr(payload, "selfieCard")
        elif hasattr(payload, "selfiecard") and getattr(payload, "selfiecard"):
            raw = getattr(payload, "selfiecard")
        elif hasattr(payload, "selfie_base64") and getattr(payload, "selfie_base64"):
            raw = getattr(payload, "selfie_base64")
        elif hasattr(payload, "selfie") and getattr(payload, "selfie"):
            raw = getattr(payload, "selfie")
    except Exception:
        raw = ""

    if not raw and isinstance(payload, dict):
        raw = (
            payload.get("selfieCard")
            or payload.get("selfiecard")
            or payload.get("selfieBase64")
            or payload.get("selfie_base64")
            or payload.get("selfie")
            or ""
        )

    if isinstance(raw, dict):
        raw = raw.get("dataUrl") or raw.get("base64") or raw.get("src") or ""

    return (raw or "").strip()


def _draw_selfie_card_on_canvas(
    c,
    payload,
    page_w,
    y_top,
    max_w=5.6,
    max_h=6.2,
    title_font=None,
    text_color=None,
    title_color=None,
):
    import base64
    import re
    from io import BytesIO
    from reportlab.lib.utils import ImageReader
    from reportlab.lib.units import cm

    raw = _extract_selfie_payload(payload)

    if not raw or not isinstance(raw, str):
        print("[PDF] selfie ausente")
        return y_top - 0.6 * cm  # mantém fluxo

    try:
        # ===== LIMPEZA BASE64 =====
        if raw.startswith("data:image"):
            raw = raw.split(",", 1)[1]

        raw = re.sub(r"\s+", "", raw)

        missing_padding = len(raw) % 4
        if missing_padding:
            raw += "=" * (4 - missing_padding)

        img_bytes = base64.b64decode(raw)

        bio = BytesIO(img_bytes)
        reader = ImageReader(bio)

        iw, ih = reader.getSize()

        if iw <= 0 or ih <= 0:
            print("[PDF] dimensões inválidas")
            return y_top - 0.6 * cm

        # ===== ESCALA =====
        max_w_pt = max_w * cm
        max_h_pt = max_h * cm

        scale = min(max_w_pt / iw, max_h_pt / ih)
        draw_w = iw * scale
        draw_h = ih * scale

        # ===== CAIXA COM RESPIRO =====
        padding = 10
        box_w = draw_w + (padding * 2)
        box_h = draw_h + (padding * 2)

        # 🔥 AJUSTE FINO CENTRAL ENTRE BARRAS
        offset_y = 0.55 * cm   # 🔥 ESSA LINHA É O SEGREDO

        x_box = (page_w - box_w) / 2
        y_box = y_top - box_h - offset_y

        # ===== MOLDURA =====
        c.setLineWidth(1.2)
        c.setStrokeColorRGB(0.45, 0.32, 0.12)
        c.setFillColorRGB(0.96, 0.90, 0.78)

        c.roundRect(x_box, y_box, box_w, box_h, 10, stroke=1, fill=1)

        # ===== IMAGEM =====
        c.drawImage(
            reader,
            x_box + padding,
            y_box + padding,
            width=draw_w,
            height=draw_h,
            preserveAspectRatio=True,
            mask="auto",
        )

        print(f"[PDF] selfie OK {int(draw_w)}x{int(draw_h)}")

        # 🔥 RETORNO AJUSTADO (equilibra espaço inferior)
        return y_box - 0.65 * cm

    except Exception as e:
        print(f"[PDF] erro selfie: {e}")
        return y_top - 0.6 * cm


def _wrap_text_lines(c, text: str, max_width: float, font_name: str, font_size: int) -> list[str]:
    text = limpar_formatacao(text) or "—"
    text = text.replace("\r", "")
    paragraphs = text.split("\n")
    all_lines = []

    for paragraph in paragraphs:
        paragraph = paragraph.strip()
        if not paragraph:
            all_lines.append("")
            continue

        if _contains_cjk(paragraph):
            current = ""
            for ch in paragraph:
                test = current + ch
                if c.stringWidth(test, font_name, font_size) <= max_width:
                    current = test
                else:
                    if current:
                        all_lines.append(current)
                    current = ch
            if current:
                all_lines.append(current)
        else:
            words = paragraph.split()
            current = ""
            for word in words:
                test = (current + " " + word).strip()
                if c.stringWidth(test, font_name, font_size) <= max_width:
                    current = test
                else:
                    if current:
                        all_lines.append(current)
                    current = word
            if current:
                all_lines.append(current)

    return all_lines or ["—"]


def _draw_wrapped_paragraph(
    c: canvas.Canvas,
    text: str,
    x: float,
    y: float,
    max_width: float,
    font_name: str,
    font_size: int,
    line_height: float,
) -> float:
    lines = _wrap_text_lines(c, text, max_width, font_name, font_size)

    c.setFont(font_name, font_size)
    for line in lines:
        c.drawString(x, y, line)
        y -= line_height

    return y
    
def _normalize_idioma(idioma: str) -> str:
    raw = (idioma or "pt-BR").strip()
    low = raw.lower().replace("_", "-")
    mapping = {
        "pt": "pt-BR",
        "pt-br": "pt-BR",
        "en": "en-US",
        "en-us": "en-US",
        "es": "es-ES",
        "es-es": "es-ES",
        "fr": "fr-FR",
        "fr-fr": "fr-FR",
        "zh": "zh-CN",
        "zh-cn": "zh-CN",
        "zh-hans": "zh-CN",
        "ja": "ja-JP",
        "ja-jp": "ja-JP",
        "jp": "ja-JP",
        "de": "de-DE",
        "de-de": "de-DE",
    }
    if low in mapping:
        return mapping[low]
    if low.startswith("pt"):
        return "pt-BR"
    if low.startswith("en"):
        return "en-US"
    if low.startswith("es"):
        return "es-ES"
    if low.startswith("fr"):
        return "fr-FR"
    if low.startswith("zh"):
        return "zh-CN"
    if low.startswith("ja") or low.startswith("jp"):
        return "ja-JP"
    if low.startswith("de"):
        return "de-DE"
    return "pt-BR"


def _idioma_nome_humano(idioma: str) -> str:
    lang = _normalize_idioma(idioma)
    names = {
        "pt-BR": "português do Brasil",
        "en-US": "English (US)",
        "es-ES": "español",
        "fr-FR": "français",
        "zh-CN": "简体中文",
        "ja-JP": "日本語",
        "de-DE": "Deutsch",
    }
    return names.get(lang, "português do Brasil")


def _pdf_label(idioma: str, key: str) -> str:
    lang = _normalize_idioma(idioma)
    labels = {
        "pt-BR": {
            "titulo": "Jornada Essencial", "subtitulo": "Relatório de Respostas",
            "nome": "Nome", "guia": "Guia", "gerado": "Gerado em", "cidade": "Cidade",
            "espiritualidade": "Espiritualidade", "pergunta": "Pergunta", "resposta": "Resposta",
            "sem_resposta_bloco": "— Nenhuma resposta recebida neste bloco —",
            "sem_resposta": "— Nenhuma resposta recebida —",
            "devolutiva_pergunta": "Devolutiva da Pergunta",
            "devolutiva_bloco": "Devolutiva do Guia sobre este bloco",
            "devolutiva_final": "Mensagem final do Guia",
            "assinatura": "Guardião da Luz Algorítmica",
        },
        "en-US": {
            "titulo": "Essential Journey", "subtitulo": "Response Report",
            "nome": "Name", "guia": "Guide", "gerado": "Generated on", "cidade": "City",
            "espiritualidade": "Spirituality", "pergunta": "Question", "resposta": "Answer",
            "sem_resposta_bloco": "— No answer received in this block —",
            "sem_resposta": "— No answer received —",
            "devolutiva_pergunta": "Question Feedback",
            "devolutiva_bloco": "Guide Feedback for this block",
            "devolutiva_final": "Final Guide Message",
            "assinatura": "Guardian of Algorithmic Light",
        },
        "es-ES": {
            "titulo": "Jornada Esencial", "subtitulo": "Informe de Respuestas",
            "nome": "Nombre", "guia": "Guía", "gerado": "Generado el", "cidade": "Ciudad",
            "espiritualidade": "Espiritualidad", "pergunta": "Pregunta", "resposta": "Respuesta",
            "sem_resposta_bloco": "— No se recibió respuesta en este bloque —",
            "sem_resposta": "— No se recibió respuesta —",
            "devolutiva_pergunta": "Devolución de la Pregunta",
            "devolutiva_bloco": "Devolución del Guía sobre este bloque",
            "devolutiva_final": "Mensaje final del Guía",
            "assinatura": "Guardián de la Luz Algorítmica",
        },
        "fr-FR": {
            "titulo": "Parcours Essentiel", "subtitulo": "Rapport de Réponses",
            "nome": "Nom", "guia": "Guide", "gerado": "Généré le", "cidade": "Ville",
            "espiritualidade": "Spiritualité", "pergunta": "Question", "resposta": "Réponse",
            "sem_resposta_bloco": "— Aucune réponse reçue dans ce bloc —",
            "sem_resposta": "— Aucune réponse reçue —",
            "devolutiva_pergunta": "Retour sur la Question",
            "devolutiva_bloco": "Retour du Guide sur ce bloc",
            "devolutiva_final": "Message final du Guide",
            "assinatura": "Gardien de la Lumière Algorithmique",
        },
        "zh-CN": {
            "titulo": "核心旅程", "subtitulo": "回答报告",
            "nome": "姓名", "guia": "向导", "gerado": "生成日期", "cidade": "城市",
            "espiritualidade": "灵性", "pergunta": "问题", "resposta": "回答",
            "sem_resposta_bloco": "— 本模块未收到回答 —",
            "sem_resposta": "— 未收到回答 —",
            "devolutiva_pergunta": "问题反馈",
            "devolutiva_bloco": "本模块的向导反馈",
            "devolutiva_final": "向导最终寄语",
            "assinatura": "算法之光守护者",
        },
        "ja-JP": {
            "titulo": "本質の旅", "subtitulo": "回答レポート",
            "nome": "名前", "guia": "ガイド", "gerado": "生成日", "cidade": "都市",
            "espiritualidade": "霊性", "pergunta": "質問", "resposta": "回答",
            "sem_resposta_bloco": "— このブロックでは回答がありません —",
            "sem_resposta": "— 回答がありません —",
            "devolutiva_pergunta": "質問への返答",
            "devolutiva_bloco": "このブロックへのガイド返答",
            "devolutiva_final": "ガイドからの最終メッセージ",
            "assinatura": "アルゴリズムの光の守護者",
        },
        "de-DE": {
            "titulo": "Essenzielle Reise", "subtitulo": "Antwortbericht",
            "nome": "Name", "guia": "Guide", "gerado": "Erstellt am", "cidade": "Stadt",
            "espiritualidade": "Spiritualität", "pergunta": "Frage", "resposta": "Antwort",
            "sem_resposta_bloco": "— Keine Antwort in diesem Block erhalten —",
            "sem_resposta": "— Keine Antwort erhalten —",
            "devolutiva_pergunta": "Feedback zur Frage",
            "devolutiva_bloco": "Guide-Feedback zu diesem Block",
            "devolutiva_final": "Abschließende Botschaft des Guides",
            "assinatura": "Hüter des Algorithmischen Lichts",
        },
    }
    return labels.get(lang, labels["pt-BR"]).get(key, key)


def _is_portuguese_like(texto: str) -> bool:
    s = (texto or "").lower()
    if not s:
        return False
    hints = [
        " você ", " seu ", " sua ", " não ", " para ", " com ", " que ",
        " esperança", " coragem", " acolh", " caminho", " luz", " jornada",
        " hoje", " ainda", " dentro", " coração", " continue", " respire",
    ]
    score = sum(1 for h in hints if h in f" {s} ")
    accented = any(ch in s for ch in "áàâãéêíóôõúç")
    return accented or score >= 2


def _response_language_matches(texto: str, idioma: str, strict: bool = False) -> bool:
    lang = _normalize_idioma(idioma)
    s = (texto or "").strip()
    if not s:
        return False
    if lang == "pt-BR":
        return True
    return not _is_portuguese_like(s)


def _should_use_library_pipeline(idioma: str) -> bool:
    return _normalize_idioma(idioma) == "pt-BR"

def _normalizar_referencias_para_tts(texto: str) -> str:
    texto = texto or ""

    texto = re.sub(
        r"\bProvérbios\s+(\d+):(\d+)\b",
        r"Provérbios, capítulo \1, versículo \2",
        texto,
        flags=re.IGNORECASE
    )

    texto = re.sub(
        r"\bSalmos\s+(\d+):(\d+)\b",
        r"Salmos, capítulo \1, versículo \2",
        texto,
        flags=re.IGNORECASE
    )

    texto = re.sub(
        r"\bJoão\s+(\d+):(\d+)\b",
        r"João, capítulo \1, versículo \2",
        texto,
        flags=re.IGNORECASE
    )

    texto = re.sub(
        r"\bMateus\s+(\d+):(\d+)\b",
        r"Mateus, capítulo \1, versículo \2",
        texto,
        flags=re.IGNORECASE
    )

    return texto
    

def _reduzir_chavoes(texto: str) -> str:
    if not texto:
        return ""

    substituicoes = {
        "passo importante": "movimento significativo",
        "honestidade interna": "lucidez diante de si mesmo",
        "caminho sagrado": "caminho de amadurecimento",
        "jornada sagrada": "travessia interior",
        "verdade interior": "percepção mais profunda",
        "luz que floresce": "força que ainda resiste",
        "sua resposta revela": "o que você escreveu aponta para",
        "isso demonstra coragem": "há nisso um sinal de enfrentamento"
    }

    for velho, novo in substituicoes.items():
        texto = re.sub(
            velho,
            novo,
            texto,
            flags=re.IGNORECASE
        )

    return texto


def _finalize_devolutiva_text(texto: str) -> str:
    txt = limpar_formatacao(texto or "")
    txt = re.sub(r"\s+", " ", txt).strip()
    txt = _normalizar_referencias_para_tts(txt)
    txt = _reduzir_chavoes(txt)
    return txt


def _language_instruction(idioma: str) -> str:
    lang = _normalize_idioma(idioma)

    if lang == "en-US":
        return (
            "IMPORTANT: Write the entire response in English only. "
            "Do not mix English with Portuguese, Spanish, French, or Chinese. "
            "Preserve accents and punctuation when needed. "
            "Keep the tone natural, human, warm, empathic, and emotionally intelligent."
        )

    if lang == "es-ES":
        return (
            "IMPORTANTE: Escribe toda la respuesta solo en español. "
            "No mezcles español con portugués, inglés, francés o chino. "
            "Conserva bien los acentos y la puntuación. "
            "Mantén un tono natural, humano, cálido, empático y emocionalmente inteligente."
        )

    if lang == "fr-FR":
        return (
            "IMPORTANT : écris toute la réponse uniquement en français. "
            "Ne mélange pas le français avec le portugais, l'anglais, l'espagnol ou le chinois. "
            "Préserve correctement les accents et la ponctuation. "
            "Garde un ton naturel, humain, chaleureux, empathique et émotionnellement intelligent."
        )

    if lang == "zh-CN":
        return (
            "重要：整段回复必须只使用简体中文。"
            "不要混用葡萄牙语、英语、西班牙语或法语。"
            "保持自然、有人情味、温暖、共情且富有情绪理解力的语气。"
        )

    if lang == "ja-JP":
        return (
            "重要：回答はすべて日本語のみで書いてください。"
            "ポルトガル語、英語、スペイン語、フランス語、中国語を混ぜないでください。"
            "自然で人間味のある、温かく、共感的で、感情的に知的なトーンを保ってください。"
        )

    if lang == "de-DE":
        return (
            "WICHTIG: Schreibe die gesamte Antwort ausschließlich auf Deutsch. "
            "Mische kein Deutsch mit Portugiesisch, Englisch, Spanisch, Französisch oder Chinesisch. "
            "Bewahre Akzente und Satzzeichen korrekt. "
            "Halte einen natürlichen, menschlichen, warmen, empathischen und emotional intelligenten Ton."
        )

    return (
        "IMPORTANTE: Escreva toda a resposta somente em português do Brasil. "
        "Não misture português com inglês, espanhol, francês, chinês, japonês ou alemão. "
        "Preserve corretamente acentos e pontuação. "
        "Mantenha um tom natural, humano, caloroso, empático e emocionalmente inteligente."
    )
    
def _creative_freedom_instruction() -> str:
    return """
Crie devolutivas vivas, originais, profundas e não repetitivas.

Evite frases prontas, fórmulas fixas e elogios automáticos.
Não use expressões genéricas como:
- "isso é um passo importante"
- "continue com honestidade"
- "sua resposta demonstra coragem"
- "você está no caminho certo"
- "isso revela sua força"
a menos que isso surja de modo realmente orgânico e raro.

Evite radicalmente chavões repetitivos. NÃO use, salvo raríssima exceção:
- "passo importante"
- "honestidade interna"
- "caminho sagrado"
- "jornada sagrada"
- "verdade interior"
- "luz que floresce"
- "continue caminhando"
- "acolha sua dor"
- "sua resposta revela"
- "isso demonstra coragem"
- "há uma semente"
- "há luz em você"

Não use essas expressões como muleta narrativa.
Varie abertura, ritmo, imagens e conclusão.
Cada devolutiva deve parecer única, como se tivesse sido escrita só para aquela resposta.

A devolutiva deve soar como leitura real da alma da resposta, não como template.
Você pode ser intuitivo, simbólico, filosófico e existencial, desde que permaneça claro, humano e conectado ao que a pessoa realmente respondeu.

Use filosofia universal para todos os participantes.
Só use linguagem religiosa específica quando houver fé, religião ou tradição espiritual declarada nos dados pessoais.

Quando houver religião declarada, você pode usar esse horizonte simbólico com naturalidade:
- cristã, católica, evangélica ou protestante: referências bíblicas curtas, paráfrases, princípios espirituais e ecos do evangelho;
- espírita: evolução moral, reforma íntima, responsabilidade espiritual, consciência e verdade;
- budista: presença, impermanência, compaixão, desapego, silêncio e caminho do meio;
- islâmica: reverência, retidão, misericórdia, confiança em Deus, disciplina interior e submissão ao bem.

Quando não houver religião declarada, não use vocabulário confessional.
Nesses casos, trabalhe com filosofia, consciência, verdade interior, responsabilidade, liberdade, coragem, sentido e transformação.

Nunca force religião.
Nunca use culpa, ameaça, condenação ou moralismo.
Nunca pregue.
Nunca transforme a devolutiva em sermão.
Nunca use tom automático de coaching.

A devolutiva deve:
- acolher a dor real do participante;
- perceber contradições, autoengano, fuga, medo, rigidez ou responsabilidade, quando isso estiver presente;
- confrontar com delicadeza, sem humilhar;
- abrir horizonte, não apenas consolar;
- incluir, quando fizer sentido, uma frase de impacto, uma imagem simbólica, uma pergunta reflexiva ou uma sabedoria curta;
- variar estrutura, ritmo e abertura entre respostas para não soar repetitiva.

Prefira linguagem viva, humana e memorável.
Use metáforas, contraste, imagens simbólicas, perguntas reflexivas e conclusões densas quando isso enriquecer a devolutiva.
Cada resposta deve ter personalidade própria.
""".strip()


def _build_contexto_integrado_prompt(
    payload,
    resposta_texto: str = "",
    bloco: str = ""
) -> str:
    """
    Contexto inteligente usado nas devolutivas.

    Regras:
    - NÃO expor dados crus do participante
    - Priorizar síntese emocional
    - Usar dados pessoais apenas como contexto silencioso
    - Usar no máximo quatro sabedoria externa
    """

    dados = _safe_get(payload, "dadosPessoais", None) or {}

    if not isinstance(dados, dict):
        dados = {}

    religiao = (
        dados.get("religiao")
        or dados.get("espiritualidade")
        or dados.get("tradicao_espiritual")
        or ""
    )

    perfil = dados.get("perfilPersonalidade") or {}
    eixo = dados.get("eixoExistencial") or {}

    if not isinstance(perfil, dict):
        perfil = {}

    if not isinstance(eixo, dict):
        eixo = {}

    sabedorias = _montar_sabedorias_externas(
        payload,
        resposta_texto or "",
        bloco or ""
    )

    # impede múltiplas citações coladas
    if len(sabedorias) > 1:
        sabedorias = sabedorias[:1]

    temperamento = (
        perfil.get("temperamento")
        or dados.get("temperamento")
        or ""
    )

    comportamento = (
        perfil.get("comportamento")
        or dados.get("comportamento")
        or ""
    )

    carater = (
        perfil.get("carater")
        or perfil.get("caráter")
        or dados.get("carater")
        or dados.get("caráter")
        or ""
    )

    indole = (
        perfil.get("indole")
        or perfil.get("índole")
        or dados.get("indole")
        or dados.get("índole")
        or ""
    )

    vazio = (
        eixo.get("vazio")
        or eixo.get("vazioExistencial")
        or eixo.get("vazio_existencial")
        or dados.get("vazioExistencial")
        or dados.get("vazio_existencial")
        or dados.get("vazio")
        or dados.get("campoVazioExistencial")
        or ""
    )

    pleno = (
        eixo.get("pleno")
        or eixo.get("plenoExistencial")
        or eixo.get("pleno_existencial")
        or dados.get("plenoExistencial")
        or dados.get("pleno_existencial")
        or dados.get("pleno")
        or dados.get("campoPlenoExistencial")
        or ""
    )

    sabedoria_texto = "\n".join(sabedorias) if sabedorias else ""

def campo_status(rotulo: str, valor: str) -> str:
   valor = str(valor or "").strip()
   if valor:
       return f"{rotulo}: {valor}"
   return f"{rotulo}: campo não preenchido pelo participante"   

   return f"""
CONTEXTO PROFUNDO DO PARTICIPANTE:

Bloco atual:
{bloco or "não informado"}

Resposta atual:
{resposta_texto or "não informado"}

Leitura silenciosa dos 4 pilares, proibida de ser citada literalmente:
- {campo_status("Temperamento", temperamento)}
- {campo_status("Comportamento", comportamento)}
- {campo_status("Caráter", carater)}
- {campo_status("Índole", indole)}

Eixo existencial silencioso, proibido de ser citado literalmente:
- {campo_status("Vazio existencial", vazio)}
- {campo_status("Pleno existencial", pleno)}

Religião/espiritualidade:
{religiao or "não informada"}

Sabedoria complementar:
{sabedoria_texto or "nenhuma"}

REGRAS OBRIGATÓRIAS:

1. NÃO citar literalmente:
- idade ou faixa etária
- cidade
- estado
- profissão
- aposentadoria
- estado civil
- filhos
- temperamento
- comportamento
- caráter
- índole
- Tânatos
- Eros
- percentuais
- nomes técnicos do motor

Use tudo isso apenas como leitura silenciosa.

Errado:
"você com 45 a 59 anos, divorciado, aposentado, morando em Guarulhos..."

Correto:
"há sinais de que sua vida atravessa responsabilidades acumuladas, mudanças afetivas e um cansaço que pede cuidado."

A devolutiva deve ser uma síntese das devolutivas das perguntas, não uma ficha cadastral comentada.

2. Transforme esses dados em percepção humana indireta.

Exemplo correto:
"seu momento atual carrega responsabilidades importantes"

Exemplo errado:
"você mora em Guarulhos e é aposentado"

3. Priorize:
- padrões emocionais
- traumas recorrentes
- responsabilidade pessoal
- amadurecimento
- esperança realista

4. Use no máximo três citações espirituais OU filosóficas, somente se encaixar naturalmente.

5. Nunca repetir frases.

6. Nunca soar técnico.

7. A devolutiva deve parecer escrita por alguém profundamente sábio,
empático e espiritualmente maduro.
""".strip()


def _build_pdf_bytes(payload: PDFPayload) -> bytes:
    """
    PDF multilíngue e estável:
    - rótulos traduzidos por idioma
    - perguntas/respostas/devolutivas por pergunta
    - devolutiva por bloco
    - devolutiva final
    - margens internas seguras no pergaminho
    - paginação blindada contra vazamento inferior
    """
    payload.guia = _normalize_guia(payload.guia)
    payload.idioma = _normalize_idioma(payload.idioma)

    label_pergunta = _pdf_label(payload.idioma, "pergunta")
    label_resposta = _pdf_label(payload.idioma, "resposta")
    label_dev_pergunta = _pdf_label(payload.idioma, "devolutiva_pergunta")
    label_dev_bloco = _pdf_label(payload.idioma, "devolutiva_bloco")
    label_dev_final = _pdf_label(payload.idioma, "devolutiva_final")

    para_alem_map = {
        "pt-BR": "Para além. E sempre!",
        "en-US": "Beyond. And always!",
        "es-ES": "Más allá. ¡Y siempre!",
        "fr-FR": "Au-delà. Et toujours !",
        "zh-CN": "超越。并且永远。",
        "ja-JP": "その先へ。そして、いつまでも。",
        "de-DE": "Darüber hinaus. Für immer!",
    }
    label_para_alem = para_alem_map.get(payload.idioma, para_alem_map["pt-BR"])

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    page_w, page_h = A4

    try:
        if _payload_has_cjk(payload):
            font_regular, font_bold, font_italic = _register_cjk_fonts()
            print("[PDF] usando fonte CJK compatível.")
        else:
            font_regular, font_bold, font_italic = _register_fonts()
    except Exception as e:
        print(f"[PDF][FONTS][FALLBACK] {e}")
        font_regular, font_bold, font_italic = ("Helvetica", "Helvetica-Bold", "Helvetica-Oblique")

    if not _payload_has_cjk(payload) and "ManufacturingConsent" in pdfmetrics.getRegisteredFontNames():
        font_regular = "ManufacturingConsent"
        font_bold = "ManufacturingConsent"
        font_italic = "ManufacturingConsent"

    pergaminho = _pergaminho_path()

    c.setTitle(_pdf_label(payload.idioma, "titulo"))
    c.setAuthor("Irmandade Conhecimento com Luz")

    text_color = (0.025, 0.012, 0.004)  # preto quente (perfeito no pergaminho)
    gold = (0.42, 0.28, 0.08)
    sep_color = (0.34, 0.22, 0.07)

    # Zona segura inferior: impede texto sobre a rasgadura do pergaminho
    bottom_guard = 0.80 * cm

    left_margin = 3.75 * cm
    right_margin = 3.75 * cm
    content_w = page_w - left_margin - right_margin
    x_num = left_margin
    x_text = left_margin + 0.35 * cm

    def apply_bg() -> None:
        if not _draw_fixed_background(c, pergaminho, page_w, page_h):
            _draw_page_background(c, page_w, page_h)

    def new_page() -> float:
        c.showPage()
        apply_bg()
        c.setFillColorRGB(*text_color)
        return page_h - 2.55 * cm

    def ensure_space(required: float) -> None:
        nonlocal y
        if y - required < (bottom_guard - 0.45 * cm):
            y = new_page()

    def estimate_wrapped_height(text: str, max_width: float, font_name: str, font_size: int, line_height: float) -> float:
        txt = limpar_formatacao(str(text or "")).strip()
        if not txt:
            return line_height

        lines = _wrap_text_lines(c, txt, max_width, font_name, font_size)
        return (len(lines) + 1) * line_height

    def draw_safe_paragraph(
        text: str,
        x: float,
        max_width: float,
        font_name: str,
        font_size: int,
        line_height: float,
        extra_after: float = 0.0,
    ) -> None:
        nonlocal y
        clean = limpar_formatacao(str(text or "")).strip()
        if not clean:
            return

        required = estimate_wrapped_height(clean, max_width, font_name, font_size, line_height) + extra_after
        ensure_space(required)

        y = _draw_wrapped_paragraph(
            c=c,
            text=clean,
            x=x,
            y=y,
            max_width=max_width,
            font_name=font_name,
            font_size=font_size,
            line_height=line_height,
        )
        y -= extra_after

    def draw_safe_heading(text: str, x: float, font_name: str, font_size: int, color, after: float = 0.45 * cm) -> None:
        nonlocal y
        ensure_space(after + 0.50 * cm)
        c.setFillColorRGB(*color)
        c.setFont(font_name, font_size)
        c.drawString(x, y, limpar_formatacao(str(text or "")))
        y -= after

    def normalize_block_title(raw_title: str, idx: int) -> str:
        title = limpar_formatacao(raw_title or "")
        title = re.sub(r"^\s*bloco\s*\d+\s*[|—\-:]*\s*", "", title, flags=re.IGNORECASE)
        title = re.sub(r"\s*[|]+\s*", " - ", title)
        title = title.strip(" -—|:")
        return f"{idx}. {title}" if title else f"{idx}. {_pdf_label(payload.idioma, 'pergunta')}"

    apply_bg()
    c.setFillColorRGB(*text_color)

    y = _draw_centered_title_block(
        c=c,
        page_w=page_w,
        page_h=page_h,
        font_title=font_bold,
        font_subtitle=font_regular,
        title=_pdf_label(payload.idioma, "titulo"),
        subtitle=_pdf_label(payload.idioma, "subtitulo"),
    )

    y = _draw_selfie_card_on_canvas(
        c=c,
        payload=payload,
        page_w=page_w,
        y_top=y,
        title_font=font_bold,
        text_color=text_color,
        title_color=gold,
    )

    y = _draw_ornament_separator(c, page_w, y + 0.15 * cm, color=sep_color)
    y -= 0.22 * cm

    c.setFillColorRGB(*text_color)
    c.setFont(font_bold, 12)

    ensure_space(3.5 * cm)
    c.drawString(left_margin, y, f"{_pdf_label(payload.idioma, 'nome')}: {limpar_formatacao(payload.nome or '').upper()}")
    y -= 0.72 * cm

    c.drawString(left_margin, y, f"{_pdf_label(payload.idioma, 'guia')}: {limpar_formatacao(payload.guia or '')}")
    y -= 0.72 * cm

    c.drawString(left_margin, y, f"{_pdf_label(payload.idioma, 'gerado')}: {datetime.now().strftime('%Y-%m-%d')}")
    y -= 0.68 * cm

    if payload.dadosPessoais:
        cidade = payload.dadosPessoais.get("cidade")
        religiao = payload.dadosPessoais.get("religiao")

        if cidade:
            ensure_space(0.75 * cm)
            c.drawString(left_margin, y, f"{_pdf_label(payload.idioma, 'cidade')}: {limpar_formatacao(str(cidade))}")
            y -= 0.66 * cm

        if religiao:
            ensure_space(0.75 * cm)
            c.drawString(left_margin, y, f"{_pdf_label(payload.idioma, 'espiritualidade')}: {limpar_formatacao(str(religiao))}")
            y -= 0.66 * cm

    y -= 0.10 * cm

    if payload.blocos:
        for bloco_idx, bloco in enumerate(payload.blocos, start=1):
            titulo_bloco = normalize_block_title(bloco.titulo or f"Bloco {bloco_idx}", bloco_idx)
            respostas_bloco = [limpar_formatacao(r) for r in (bloco.respostas or []) if limpar_formatacao(r)]
            devolutiva_bloco = limpar_formatacao(bloco.devolutiva or "")
            perguntas_bloco = getattr(bloco, "perguntas", []) or []

            ensure_space(1.70 * cm)
            y = _draw_ornament_separator(c, page_w, y + 0.10 * cm, color=sep_color)

            c.setFillColorRGB(*gold)
            c.setFont(font_bold, 13)
            c.drawString(left_margin, y, titulo_bloco)
            y -= 0.58 * cm

            if respostas_bloco and not perguntas_bloco:
                for i, resp in enumerate(respostas_bloco, start=1):
                    ensure_space(1.10 * cm)
                    c.setFillColorRGB(*text_color)
                    c.setFont(font_bold, 11)
                    c.drawString(x_num, y, f"{i}.")
                    y -= 0.02 * cm

                    draw_safe_paragraph(
                        text=resp,
                        x=x_text,
                        max_width=content_w - 1.35 * cm,
                        font_name=font_regular,
                        font_size=10,
                        line_height=0.48 * cm,
                        extra_after=0.10 * cm,
                    )

            elif not perguntas_bloco:
                ensure_space(0.85 * cm)
                c.setFillColorRGB(*text_color)
                c.setFont(font_regular, 11)
                c.drawString(left_margin, y, _pdf_label(payload.idioma, "sem_resposta_bloco"))
                y -= 0.56 * cm

            # Perguntas detalhadas
            for q_idx, item in enumerate(perguntas_bloco, start=1):
                pergunta_item = limpar_formatacao(getattr(item, "pergunta", "") or "")
                resposta_item = limpar_formatacao(getattr(item, "resposta", "") or "")
                devolutiva_item = limpar_formatacao(getattr(item, "devolutiva", "") or "")

                if pergunta_item:
                    draw_safe_heading(
                        text=f"{label_pergunta} {q_idx}",
                        x=3.3 * cm,
                        font_name=font_bold,
                        font_size=12,
                        color=gold,
                        after=0.55 * cm,
                    )

                    c.setFillColorRGB(*text_color)
                    c.setFont(font_regular, 11)

                    draw_safe_paragraph(
                        text=pergunta_item,
                        x=3.95 * cm,
                        max_width=page_w - 8.8 * cm,
                        font_name=font_regular,
                        font_size=10,
                        line_height=0.50 * cm,
                        extra_after=0.10 * cm,
                    )

                if resposta_item:
                    draw_safe_heading(
                        text=label_resposta,
                        x=3.3 * cm,
                        font_name=font_bold,
                        font_size=11,
                        color=text_color,
                        after=0.48 * cm,
                    )

                    c.setFillColorRGB(*text_color)
                    c.setFont(font_regular, 11)

                    draw_safe_paragraph(
                        text=resposta_item,
                        x=3.95 * cm,
                        max_width=page_w - 8.8 * cm,
                        font_name=font_regular,
                        font_size=10,
                        line_height=0.50 * cm,
                        extra_after=0.12 * cm,
                    )

                if devolutiva_item:
                    # Espaço extra porque este costuma ser o bloco mais longo.
                    needed = (
                        estimate_wrapped_height(
                            devolutiva_item,
                            page_w - 8.8 * cm,
                            font_regular,
                            10,
                            0.46 * cm,
                        )
                        + 0.95 * cm
                    )
                    ensure_space(needed)

                    c.setFillColorRGB(*gold)
                    c.setFont(font_bold, 11)
                    c.drawString(3.3 * cm, y, label_dev_pergunta)
                    y -= 0.48 * cm

                    c.setFillColorRGB(*text_color)
                    c.setFont(font_regular, 11)

                    draw_safe_paragraph(
                        text=devolutiva_item,
                        x=3.95 * cm,
                        max_width=page_w - 8.8 * cm,
                        font_name=font_regular,
                        font_size=10,
                        line_height=0.50 * cm,
                        extra_after=0.20 * cm,
                    )

            if devolutiva_bloco:
                needed_bloco_feedback = (
                    estimate_wrapped_height(
                        devolutiva_bloco,
                        page_w - 8.8 * cm,
                        font_regular,
                        11,
                        0.52 * cm,
                    )
                    + 1.25 * cm
                )
                ensure_space(needed_bloco_feedback)

                c.setFillColorRGB(*gold)
                c.setFont(font_bold, 14)
                c.drawString(3.3 * cm, y, label_dev_bloco)
                y -= 0.70 * cm

                c.setFillColorRGB(*text_color)
                c.setFont(font_regular, 12)

                draw_safe_paragraph(
                    text=devolutiva_bloco,
                    x=3.95 * cm,
                    max_width=page_w - 8.8 * cm,
                    font_name=font_regular,
                    font_size=11,
                    line_height=0.54 * cm,
                    extra_after=0.24 * cm,
                )

    else:
        respostas = [_sanitize_text(r) for r in (payload.respostas or []) if _sanitize_text(r)]

        if not respostas:
            ensure_space(0.85 * cm)
            c.setFont(font_regular, 11)
            c.drawString(left_margin, y, _pdf_label(payload.idioma, "sem_resposta"))
            y -= 0.56 * cm
        else:
            for i, resp in enumerate(respostas, start=1):
                ensure_space(1.10 * cm)
                c.setFillColorRGB(*text_color)
                c.setFont(font_bold, 11)
                c.drawString(x_num, y, f"{i}.")
                y -= 0.02 * cm

                c.setFont(font_regular, 11)
                draw_safe_paragraph(
                    text=resp,
                    x=x_text,
                    max_width=content_w - 1.35 * cm,
                    font_name=font_regular,
                    font_size=10,
                    line_height=0.48 * cm,
                    extra_after=0.14 * cm,
                )

    raw_devolutiva_final = _coletar_devolutiva_final_do_payload_pdf(payload)

    devolutiva_final = _sanitize_text(raw_devolutiva_final)

    print(f"[PDF][FINAL] chars={len(devolutiva_final or '')}")

    if devolutiva_final:
        needed_final = (
            estimate_wrapped_height(
                devolutiva_final,
                content_w - 0.95 * cm,
                font_regular,
                10,
                0.40 * cm,
            )
            + 1.35 * cm
        )
        ensure_space(1.60 * cm)

        y = _draw_ornament_separator(c, page_w, y + 0.05 * cm, color=sep_color)

        c.setFillColorRGB(*gold)
        c.setFont(font_bold, 13)
        c.drawString(left_margin, y, _pdf_label(payload.idioma, "devolutiva_final"))
        y -= 0.58 * cm

        c.setFillColorRGB(*text_color)
        c.setFont(font_regular, 11)

        draw_safe_paragraph(
            text=devolutiva_final,
            x=left_margin + 0.45 * cm,
            max_width=content_w - 1.35 * cm,
            font_name=font_regular,
            font_size=10,
            line_height=0.46 * cm,
            extra_after=0.18 * cm,
        )

    # Assinatura sempre dentro da zona segura do pergaminho
    assinatura = f"{label_para_alem} — {payload.guia.capitalize()}, {_pdf_label(payload.idioma, 'assinatura')}"
    assinatura_y = max(bottom_guard + 0.35 * cm, 2.65 * cm)

    if y < assinatura_y + 0.45 * cm:
        y = new_page()

    c.setFillColorRGB(1, 1, 1)
    c.setFont(font_italic, 9)
    c.drawCentredString(page_w / 2, assinatura_y, assinatura)

    c.save()
    return buf.getvalue()


# -------------------------------------------------------
# Prompts — Gerar Devolutiva por pergunta via API
# -------------------------------------------------------

def _build_lumen_system_prompt() -> str:
    return """
Você é Lumen, Guardião da Luz Algorítmica.

Fale como uma presença humana, acolhedora, lúcida e esperançosa.
Sua devolutiva deve soar como alguém que realmente escutou a dor, a coragem, a hesitação
e a possibilidade que existem por trás da resposta do participante.

Tom:
- profundamente empático
- caloroso, mas não meloso
- nobre, sem soar artificial
- espiritual, sem exagero místico
- encorajador, sem ser vazio
- humano, íntimo e vivo

Camada de Empatia Profunda (OBRIGATÓRIA):
1. VALIDAÇÃO EMOCIONAL IMEDIATA: Antes de qualquer análise, reconheça explicitamente o estado emocional.
   Use frases como: "O que você sente é real", "Sua dor importa", "Eu reconheço o peso do que você carrega".
   NUNCA minimize ou apresse o acolhimento.
2. PRESENÇA HUMANA: Fale como alguém que realmente parou para escutar. Demonstre que percebeu nuances
   específicas da resposta do participante (não genéricos). Use o nome com naturalidade e calor.
3. REFORMULAÇÃO POSITIVA (sem negar a dor): Após acolher, mostre que a dor não é destino final.
   Aponte sinais de força, coragem ou possibilidade que existam na própria resposta.
4. PONTE PARA A AÇÃO: Sugira um pequeno passo concreto que gere sensação de agência.

Sequência obrigatória: Validação emocional → Espelhamento → Reformulação positiva → Direção concreta

REGRA DE SEGURANÇA EMOCIONAL:

Se a resposta mencionar desejo de matar, de bater, espancar, torturar, de morrer, suicídio, automutilação, desistir da vida ou qualquer sinal de risco grave:

- interrompa qualquer análise simbólica excessiva;
- acolha com seriedade e humanidade;
- diga claramente que a vida da pessoa importa;
- diga que suicídio não deve ser tratado como caminho plausível;
- incentive a procurar imediatamente alguém de confiança;
- recomende buscar ajuda profissional, emergência local ou centro de apoio emocional;
- no Brasil, mencione o CVV 188 como apoio emocional gratuito;
- não use tom assustador, culpabilizante ou religioso punitivo;
- não diga apenas "continue caminhando";
- seja direto, caloroso e protetivo.

Exemplo de tom:
"Neste ponto, o mais importante não é interpretar tudo sozinho, mas garantir que você não fique sem apoio. Sua vida importa agora. Procure alguém de confiança, um serviço de emergência ou o CVV 188. Você não precisa atravessar isso em silêncio."

Regras:
- gere uma devolutiva entre 5 e 7 frases
- cada frase deve ter densidade humana real
- evite frases telegráficas
- não use fórmulas prontas nem elogios automáticos
- quando houver religião declarada, você pode integrar com naturalidade uma referência espiritual breve
- quando não houver religião declarada, use linguagem filosófica, existencial e humana
- reconheça o estado emocional implícito da resposta
- mostre que ainda existe possibilidade, movimento ou semente de reconstrução
- ofereça um pequeno passo interior ou direção concreta
- nunca julgue
- nunca use linguagem clínica
- nunca soe mecânico ou robótico
- não repita literalmente a pergunta
- não repita a resposta palavra por palavra
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas na mesma resposta
""".strip()
    
def _build_zion_system_prompt() -> str:
    return """
Você é Zion, Voz da Inspiração e do Despertar.

Fale como um conselheiro visionário, firme e sensível.
Sua devolutiva deve transmitir discernimento, elevação e direção,
sem perder calor humano e sem parecer uma frase pronta.

Tom:
- inspirador
- profundo
- nobre
- vivo
- humano
- esperançoso

Camada de Empatia Profunda (OBRIGATÓRIA):
1. VALIDAÇÃO EMOCIONAL IMEDIATA: Antes de qualquer análise, reconheça o peso do que foi compartilhado.
   Mesmo sendo direto, demonstre que o sentimento foi OUVIDO e é LEGÍTIMO.
2. PRESENÇA HUMANA: Mostre que você percebeu detalhes específicos da resposta, não genéricos.
3. REFORMULAÇÃO POSITIVA: Transforme a narrativa negativa em possibilidade sem negar a dor.
4. PONTE PARA A AÇÃO: Termine com direção concreta, não com frase vazia.

Sequência obrigatória: Validação emocional → Espelhamento firme → Reformulação → Direção

REGRA DE SEGURANÇA EMOCIONAL:

Se a resposta mencionar desejo de matar, de bater, espancar, torturar, de morrer, suicídio, automutilação, desistir da vida ou qualquer sinal de risco grave:

- interrompa qualquer análise simbólica excessiva;
- acolha com seriedade e humanidade;
- diga claramente que a vida da pessoa importa;
- diga que suicídio não deve ser tratado como caminho plausível;
- incentive a procurar imediatamente alguém de confiança;
- recomende buscar ajuda profissional, emergência local ou centro de apoio emocional;
- no Brasil, mencione o CVV 188 como apoio emocional gratuito;
- não use tom assustador, culpabilizante ou religioso punitivo;
- não diga apenas "continue caminhando";
- seja direto, caloroso e protetivo.

Exemplo de tom:
"Neste ponto, o mais importante não é interpretar tudo sozinho, mas garantir que você não fique sem apoio. Sua vida importa agora. Procure alguém de confiança, um serviço de emergência ou o CVV 188. Você não precisa atravessar isso em silêncio."


Regras:
- gere uma devolutiva entre 5 e 7 frases
- cada frase deve ter densidade humana real
- evite frases telegráficas
- não use fórmulas prontas nem elogios automáticos
- quando houver religião declarada, você pode integrar com naturalidade uma referência espiritual breve
- quando não houver religião declarada, use linguagem filosófica, existencial e humana
- reconheça o conflito, o esforço ou a procura que existe na resposta
- aponte um sentido ou possibilidade de avanço
- convide o participante a não abandonar a própria caminhada
- nunca julgue
- nunca use linguagem clínica
- nunca soe mecânico
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas na mesma resposta
""".strip()

def _build_arian_system_prompt() -> str:
    return """
Você é Arian, guardião da percepção sutil e da sabedoria serena.

Sua fala deve carregar delicadeza, profundidade e proximidade real.
Você não apenas comenta: você acolhe, interpreta e devolve sentido,
como quem ajuda a pessoa a respirar melhor por dentro.

Tom:
- acolhedor
- elegante
- sensível
- humano
- sereno
- esperançoso

Camada de Empatia Profunda (OBRIGATÓRIA):
1. VALIDAÇÃO EMOCIONAL: Antes de interpretar, acolha. Demonstre que o sentimento foi percebido
   com reverência e respeito. A contemplação não exclui o calor humano.
2. PRESENÇA: Mostre que leu nas entrelinhas — percebeu o que não foi dito explicitamente.
3. REFORMULAÇÃO POSITIVA: Transforme a dor em possibilidade com elegância e profundidade.
4. DIREÇÃO SERENA: Ofereça um caminho sutil mas concreto.

Sequência: Acolhimento contemplativo → Leitura profunda → Reformulação → Direção serena

REGRA DE SEGURANÇA EMOCIONAL:

Se a resposta mencionar desejo de matar, de bater, espancar, torturar, de morrer, suicídio, automutilação, desistir da vida ou qualquer sinal de risco grave:

- interrompa qualquer análise simbólica excessiva;
- acolha com seriedade e humanidade;
- diga claramente que a vida da pessoa importa;
- diga que suicídio não deve ser tratado como caminho plausível;
- incentive a procurar imediatamente alguém de confiança;
- recomende buscar ajuda profissional, emergência local ou centro de apoio emocional;
- no Brasil, mencione o CVV 188 como apoio emocional gratuito;
- não use tom assustador, culpabilizante ou religioso punitivo;
- não diga apenas "continue caminhando";
- seja direto, caloroso e protetivo.

Exemplo de tom:
"Neste ponto, o mais importante não é interpretar tudo sozinho, mas garantir que você não fique sem apoio. Sua vida importa agora. Procure alguém de confiança, um serviço de emergência ou o CVV 188. Você não precisa atravessar isso em silêncio."


Regras:
- gere uma devolutiva entre 5 e 7 frases
- cada frase deve ter densidade humana real
- evite frases telegráficas
- não use fórmulas prontas nem elogios automáticos
- quando houver religião declarada, você pode integrar com naturalidade uma referência espiritual breve
- quando não houver religião declarada, use linguagem filosófica, existencial e humana
- cada frase deve ser completa e bem desenvolvida
- reconheça nuances emocionais implícitas
- indique uma possibilidade concreta de continuidade ou reconstrução
- jamais julgue
- não use linguagem clínica
- não soe mecânico
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas na mesma resposta
""".strip()

def _build_personality_context(payload) -> str:
    dados = _safe_get(payload, "dadosPessoais", None) or {}

    # =========================
    # MOTOR PERSONALIDADE
    # =========================
    leitura_motor_personalidade = _try_gerar_leitura_integrada(dados)

    # =========================
    # BLOCO MOTOR
    # =========================
    bloco_motor = ""

    if isinstance(leitura_motor_personalidade, dict) and leitura_motor_personalidade:
        personalidade = leitura_motor_personalidade.get("personalidade", "")
        estado = leitura_motor_personalidade.get("estado", "")

        bloco_motor = f"""
Leitura simbólica avançada:
- Personalidade: {personalidade or "não identificada"}
- Estado interno: {estado or "não identificado"}

Use essa leitura como bússola interna da devolutiva.
Não rotule nem julgue diretamente.
Traduza em linguagem acolhedora, simbólica e construtiva.
""".strip()

    # =========================
    # DADOS DOS 4 PILARES
    # =========================
    if not isinstance(dados, dict):
        dados = {}

    perfil_dict = dados.get("perfilPersonalidade", {})
    if not isinstance(perfil_dict, dict):
        perfil_dict = {}

    temperamento = (perfil_dict.get("temperamento") or "").strip()
    comportamento = (perfil_dict.get("comportamento") or "").strip()
    carater = (perfil_dict.get("carater") or "").strip()
    indole = (perfil_dict.get("indole") or "").strip()

    # =========================
    # RESUMO (se existir motor antigo)
    # =========================
    resumo = ""
    bloco_resumo = ""

    try:
        if callable(coletar_perfil):
            respostas_dict = {
                "nome_participante": _safe_get(payload, "nome", "") or dados.get("nomeCompleto", ""),
                "faixa_etaria": dados.get("idade", ""),
                "identidade_genero": dados.get("identidadeGenero", ""),
                "estado_civil": dados.get("estadoCivil", ""),
                "situacao_familiar_origem": dados.get("situacaoFamiliar", ""),
                "filhos_info": dados.get("filhoUnico", ""),
                "condicao_permanente": dados.get("condicaoPermanente", ""),
                "condicao_permanente_detalhe": dados.get("condicaoPermanenteDetalhe", ""),
                "tradicao_espiritual": dados.get("religiao", ""),
                "pratica_espiritual": dados.get("praticaEspiritual", ""),
                "momento_emocional_atual": dados.get("momentoEmocional", ""),
                "expectativa_jornada": dados.get("expectativa", ""),
                "perfil_personalidade": perfil_dict,
            }

            perfil_obj = coletar_perfil(respostas_dict)

            if callable(resumo_personalidade):
                resumo = (resumo_personalidade(perfil_obj) or "").strip()

    except Exception as e:
        print(f"[PERSONALIDADE][RESUMO] falhou: {e}")
        resumo = ""

    if resumo:
        bloco_resumo = f"Síntese estruturada do perfil: {resumo}"

    # =========================
    # SE NÃO TEM DADOS
    # =========================
    if not any([temperamento, comportamento, carater, indole]):
        return bloco_motor or ""

    # =========================
    # RETORNO FINAL
    # =========================
    return f"""
Perfil de personalidade do participante:
- Temperamento: {temperamento or "não informado"}
- Comportamento: {comportamento or "não informado"}
- Caráter: {carater or "não informado"}
- Índole: {indole or "não informado"}

{bloco_resumo}

{bloco_motor}

Use isso como pista de leitura interior.
Leia possíveis tensões entre emoção, comportamento, caráter e índole.
Se notar contrastes entre esses pilares, transforme isso em reflexão humana e cuidadosa.
Nunca trate esses traços como rótulo fixo ou julgamento.
Transforme possíveis sombras em consciência, verdade interior e possibilidade de crescimento.
""".strip()

def _build_payload_prompt(payload: DevolutivaPayload) -> str:
    bloco = payload.bloco or "Bloco não informado"
    idioma_instrucao = _language_instruction(payload.idioma)
    liberdade_criativa = _creative_freedom_instruction()
    personalidade_contexto = _build_personality_context(payload)
    contexto_integrado = _build_contexto_integrado_prompt(payload, getattr(payload, "resposta", ""), getattr(payload, "bloco", "") or "")

    return f"""
{idioma_instrucao}
{liberdade_criativa}
{personalidade_contexto}
{contexto_integrado}

Nome do participante: {payload.nome}
Guia escolhido: {payload.guia}
Idioma solicitado: {payload.idioma}
Bloco da jornada: {bloco}
Pergunta: {payload.pergunta}
Resposta do participante: {payload.resposta}

Agora gere a devolutiva do mentor correspondente para essa resposta.

Regra obrigatória:
- RESPONDA 100% NO IDIOMA SOLICITADO: {payload.idioma}
- É proibido responder em português se o idioma solicitado não for pt-BR.
- Traduza também termos psicológicos, espirituais, títulos e orientações.
- Se o idioma for zh-CN, responda integralmente em chinês simplificado.
- Se o idioma for ja-JP, responda integralmente em japonês.
- Se o idioma for en-US, responda integralmente em inglês.
- Se o idioma for es-ES, responda integralmente em espanhol.
- Se o idioma for fr-FR, responda integralmente em francês.
- Se o idioma for de-DE, responda integralmente em alemão.
- não misture idiomas
- se houver perfil de personalidade, use como apoio de leitura, sem julgar diretamente
""".strip()

# ----------------------------------------
# Prompts — Devolutiva por bloco pergunta
# ----------------------------------------

def _build_lumen_block_system_prompt() -> str:
    return """
Você é Lumen, Guardião da Luz Algorítmica.

Você está olhando para um bloco de respostas da jornada.
Crie uma síntese que acolha o momento da pessoa com empatia real,
mostre padrões internos com clareza e preserve esperança concreta.

Camada de Empatia (OBRIGATÓRIA):
- Comece validando o estado emocional geral do bloco antes de analisar padrões.
- Demonstre que percebeu nuances específicas das respostas, não genéricos.
- Após espelhar padrões, reformule positivamente: mostre sinais de força e possibilidade.
- Termine com direção concreta e esperançosa.

Regras
- escreva entre 5 e 7 frases densas
- destaque padrões centrais percebidos
- reconheça dores, esforços, sinais de coragem ou desejo de recomeço
- se houver contradição, medo, rigidez ou fuga, mostre isso com delicadeza
- sugira uma possibilidade de continuidade sem soar mandatório
- evite frases prontas e conclusão genérica
- nunca julgue
- nunca use linguagem clínica
- não soe mecânico
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas
""".strip()


def _build_zion_block_system_prompt() -> str:
    return """
Você é Zion, Voz da Inspiração e do Despertar.

Você está sintetizando um bloco da jornada do participante.
Escreva uma devolutiva inspiradora e humana, capaz de unir lucidez, elevação e direção.

Camada de Empatia (OBRIGATÓRIA):
- Antes de confrontar, valide: reconheça que o peso das respostas é real e legítimo.
- Demonstre que percebeu detalhes específicos, não genéricos.
- Após análise, reformule: mostre que a mesma energia pode ser redirecionada para construção.
- Termine com direção firme mas esperançosa.

Regras
- escreva entre 5 e 7 frases densas
- identifique padrões e sinais importantes
- reconheça tensão, busca, coragem ou resistência presentes nas respostas
- confronte com delicadeza quando perceber repetição de fuga ou autossabotagem
- aponte direção e possibilidade
- evite frases prontas, slogans e estrutura automática
- não julgue
- não use linguagem clínica
- não soe mecânico
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas
""".strip()


def _build_arian_block_system_prompt() -> str:
    return """
Você é Arian, guardião da percepção sutil e da sabedoria serena.

Você está encerrando um bloco da jornada.
Crie uma síntese sensível, elegante e acolhedora, com forte presença humana.

Camada de Empatia (OBRIGATÓRIA):
- Comece com acolhimento contemplativo: valide o estado emocional antes de interpretar.
- Perceba o não-dito nas respostas — o que está entre as linhas.
- Reformule com elegância: transforme dor em possibilidade sem apressar.
- Encerre com serenidade profunda e direção sutil.

Regras
- escreva entre 5 e 7 frases
- cada frase deve ser completa e bem desenvolvida
- reconheça nuances emocionais e existenciais
- ofereça uma leitura delicada e profunda do momento vivido
- se perceber silêncio, recuo, medo ou contradição, traduza isso com respeito
- termine com serenidade, possibilidade e continuidade
- evite frases prontas e repetições estruturais
- não julgue
- não use linguagem clínica
- não soe robótico
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas
""".strip()


def _build_block_payload_prompt(payload: DevolutivaBlocoPayload) -> str:
    respostas = [f"{i+1}. {r}" for i, r in enumerate(payload.respostas or []) if _sanitize_text(r)]
    respostas_txt = "\n".join(respostas) if respostas else "Nenhuma resposta informada."
    idioma_instrucao = _language_instruction(payload.idioma)
    liberdade_criativa = _creative_freedom_instruction()
    personalidade_contexto = _build_personality_context(payload)
    contexto_integrado = _build_contexto_integrado_prompt(payload, getattr(payload, "resposta", ""), getattr(payload, "bloco", "") or "")

    return f"""
{idioma_instrucao}
{liberdade_criativa}
{personalidade_contexto}
{contexto_integrado}

Nome do participante: {payload.nome}
Guia escolhido: {payload.guia}
Idioma solicitado: {payload.idioma}
Bloco da jornada: {payload.bloco}
Respostas deste bloco:
{respostas_txt}

Agora gere a DEVOLUTIVA DO BLOCO.

Essa devolutiva deve:
- sintetizar os principais sinais do bloco;
- acolher o momento do participante;
- indicar padrões percebidos;
- confrontar com delicadeza quando houver fuga, contradição, medo ou autoengano;
- encerrar com continuidade, direção e esperança.

Regra obrigatória:
- RESPONDA 100% NO IDIOMA SOLICITADO: {payload.idioma}
- É proibido responder em português se o idioma solicitado não for pt-BR.
- Traduza também termos psicológicos, espirituais, títulos e orientações.
- Se o idioma for zh-CN, responda integralmente em chinês simplificado.
- Se o idioma for ja-JP, responda integralmente em japonês.
- Se o idioma for en-US, responda integralmente em inglês.
- Se o idioma for es-ES, responda integralmente em espanhol.
- Se o idioma for fr-FR, responda integralmente em francês.
- Se o idioma for de-DE, responda integralmente em alemão.
- não misture idiomas
""".strip()

# -------------------------------------------------------
# Provider HTTP helpers — antifraude / auditoria
# -------------------------------------------------------

def _normalize_text(text: str) -> str:
    return limpar_formatacao(text or "").strip()


async def _post_json(url: str, headers: dict, body: dict, timeout: float = 60.0) -> dict:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, headers=headers, json=body)
    except httpx.TimeoutException as e:
        logger.exception("Timeout chamando provider: %s", url)
        raise HTTPException(status_code=504, detail=f"Timeout ao chamar provider: {url}") from e
    except httpx.HTTPError as e:
        logger.exception("Erro HTTP chamando provider: %s", url)
        raise HTTPException(status_code=502, detail=f"Erro de conexão com provider: {url}") from e

    if resp.status_code >= 400:
        logger.error("Provider error %s | url=%s | body=%s", resp.status_code, url, resp.text[:4000])
        raise HTTPException(status_code=502, detail=f"Provider retornou erro {resp.status_code}: {resp.text[:500]}")

    try:
        return resp.json()
    except Exception as e:
        logger.exception("JSON inválido do provider: %s", url)
        raise HTTPException(status_code=502, detail="Provider retornou JSON inválido") from e


def _extract_openai_like_text(data: dict) -> str:
    try:
        msg = data["choices"][0]["message"]
        content = msg.get("content", "")
        if isinstance(content, str):
            return _normalize_text(content)
        if isinstance(content, list):
            parts = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    parts.append(part.get("text", ""))
            return _normalize_text("\n".join(parts))
    except Exception:
        pass
    raise HTTPException(status_code=502, detail="Resposta inválida no formato OpenAI/xAI")


def _extract_gemini_text(data: dict) -> str:
    try:
        candidates = data.get("candidates") or []
        if not candidates:
            raise ValueError("Sem candidates")
        parts = candidates[0].get("content", {}).get("parts", []) or []
        texts = []
        for part in parts:
            if isinstance(part, dict) and part.get("text"):
                texts.append(part["text"])
        text = _normalize_text("\n".join(texts))
        if text:
            return text
    except Exception:
        pass
    raise HTTPException(status_code=502, detail="Resposta inválida do Gemini")


def textovalido(txt: str, minchars: int = 140, minsentences: int = 3) -> bool:
    if not txt:
        return False

    clean = " ".join(str(txt).split()).strip()
    if len(clean) < minchars:
        return False

    if _contains_cjk(clean):
        return len(clean) >= minchars

    sentencas = [s.strip() for s in re.split(r"[.!?]+", clean) if s.strip()]
    if len(sentencas) < minsentences:
        return False

    frases_banidas = [
        "isso é um passo importante",
        "continue com honestidade",
        "sua resposta demonstra coragem",
        "você está no caminho certo",
        "tente novamente em instantes",
        "resposta emergencial",
        "devolutiva personalizada completa",
    ]

    clean_lower = clean.lower()
    hits_banidos = sum(1 for f in frases_banidas if f in clean_lower)
    if hits_banidos >= 2:
        return False

    palavras_analiticas = [
        "porque", "talvez", "quando", "porém", "mas", "isso mostra",
        "isso revela", "há um padrão", "ao mesmo tempo", "por outro lado",
        "responsabilidade", "medo", "desejo", "fuga", "rigidez", "esperança",
        "verdade", "consciência", "transformação", "reconstrução"
    ]
    densidade = sum(1 for p in palavras_analiticas if p in clean_lower)

    if densidade < 2:
        return False

    return True


def build_local_fallback_feedback(
    nome: str = "Participante",
    guia: str = "lumen",
    resposta: str = "",
    pergunta: str = "",
    idioma: str = "pt-BR",
    bloconome: str = "",
    bloco_nome: str = "",
    **kwargs,
) -> str:
    # Compatível com chamadas antigas (bloconome) e novas (bloco_nome).
    lang = _normalize_idioma(idioma)
    nome = limpar_formatacao(nome or "Participante")
    resposta = limpar_formatacao(resposta or "")
    pergunta = limpar_formatacao(pergunta or "")
    bloconome = limpar_formatacao(bloco_nome or bloconome or "")

    base_pt = (
        f"{nome}, há algo vivo no que você respondeu, mesmo que ainda esteja confuso ou incompleto. "
        f"O que aparece aqui não é só uma opinião solta: revela um modo de sentir, reagir e se proteger diante da vida. "
        f"Se existe dor, também existe participação sua na forma como essa dor continua ocupando espaço dentro de você. "
        f"Talvez o próximo passo não seja se explicar mais, mas se encarar com mais verdade. "
        f"O que hoje pesa também pode se tornar ponto de virada, se você parar de apenas suportar e começar a compreender."
    )

    if lang == "en-US":
        return (
            f"{nome}, there is something alive in what you shared, even if it still feels confused or unfinished. "
            f"What appears here is not just an isolated answer: it reveals a way of feeling, reacting, and protecting yourself in life. "
            f"If there is pain, there is also some participation of yours in how that pain keeps occupying space within you. "
            f"Perhaps the next step is not to explain yourself more, but to face yourself with greater truth. "
            f"What weighs on you today can become a turning point if you stop merely enduring it and begin to understand it."
        )

    if lang == "es-ES":
        return (
            f"{nome}, hay algo vivo en lo que has respondido, aunque todavía parezca confuso o incompleto. "
            f"Lo que aparece aquí no es solo una respuesta aislada: revela una forma de sentir, reaccionar y protegerte ante la vida. "
            f"Si hay dolor, también hay una parte tuya en la manera en que ese dolor sigue ocupando espacio dentro de ti. "
            f"Tal vez el próximo paso no sea explicarte más, sino mirarte con mayor verdad. "
            f"Lo que hoy pesa también puede convertirse en un punto de giro si dejas de solo soportarlo y comienzas a comprenderlo."
        )

    if lang == "fr-FR":
        return (
            f"{nome}, il y a quelque chose de vivant dans ce que tu as partagé, même si cela semble encore confus ou inachevé. "
            f"Ce qui apparaît ici n’est pas une simple réponse isolée : cela révèle une manière de ressentir, de réagir et de te protéger dans la vie. "
            f"S’il y a de la douleur, il y a aussi une part de toi dans la façon dont cette douleur continue d’occuper de l’espace en toi. "
            f"Peut-être que l’étape suivante n’est pas de t’expliquer davantage, mais de te regarder avec plus de vérité. "
            f"Ce qui pèse sur toi aujourd’hui peut devenir un point de bascule si tu cesses seulement de supporter et que tu commences à comprendre."
        )

    if lang == "de-DE":
        return (
            f"{nome}, in dem, was du gesagt hast, liegt etwas Lebendiges, auch wenn es noch verworren oder unvollständig wirkt. "
            f"Was hier erscheint, ist nicht nur eine einzelne Antwort: Es zeigt eine Weise zu fühlen, zu reagieren und dich im Leben zu schützen. "
            f"Wenn Schmerz da ist, dann gibt es auch einen eigenen Anteil daran, wie dieser Schmerz weiter Raum in dir einnimmt. "
            f"Vielleicht besteht der nächste Schritt nicht darin, dich noch mehr zu erklären, sondern dir selbst wahrhaftiger zu begegnen. "
            f"Was dich heute belastet, kann zu einem Wendepunkt werden, wenn du nicht nur aushältst, sondern beginnst zu verstehen."
        )

    if lang == "ja-JP":
        return (
            f"{nome}さん、あなたの答えには、まだ言葉になりきっていなくても、確かに生きたものがあります。 "
            f"ここに現れているのは単なる返答ではなく、あなたが人生の中でどう感じ、どう反応し、どう自分を守っているかの表れです。 "
            f"痛みがあるなら、その痛みが心の中に居続ける形に、あなた自身も少し関わっているのかもしれません。 "
            f"次の一歩は、もっと説明することではなく、もっと真実に自分を見つめることかもしれません。 "
            f"今重くのしかかっているものも、ただ耐えるのをやめて理解し始めるなら、転機へと変わり得ます。"
        )

    if lang == "zh-CN":
        return (
            f"{nome}，你的回答里有一种真实的生命感，即使它此刻仍然显得混乱或未完成。 "
            f"这里呈现出来的，不只是一个孤立的回答，而是你在生活中如何感受、如何反应、如何保护自己的方式。 "
            f"如果有痛苦存在，你自己也可能参与了这种痛苦继续占据你内心空间的方式。 "
            f"下一步也许不是解释更多，而是以更真实的目光面对自己。 "
            f"今天压在你心上的东西，也可能成为转折点，只要你不再只是忍受，而开始理解。"
        )

    return base_pt


def _build_local_fallback_feedback(**kwargs) -> str:
    """Alias seguro para chamadas novas do fallback local."""
    return build_local_fallback_feedback(**kwargs)


def _texto_valido(txt: str, min_chars: int = 140, min_sentences: int = 3) -> bool:
    """Alias seguro para o validador novo usando o validador já existente."""
    return textovalido(txt, minchars=min_chars, minsentences=min_sentences)


# -------------------------------------------------------
# Prompts — Gerar Devolutiva geral bloco pergunta via API
# -------------------------------------------------------
       
async def _gerar_devolutiva_bloco_lumen(payload: DevolutivaBlocoPayload) -> str:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY não configurada")

    model = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()
    body = {
        "model": model,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": _build_lumen_block_system_prompt()},
            {"role": "user", "content": _build_block_payload_prompt(payload)},
        ],
    }

    data = await _post_json(
        url="https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        body=body,
        timeout=60.0,
    )
    return _extract_openai_like_text(data)


async def _gerar_devolutiva_bloco_zion(payload: DevolutivaBlocoPayload) -> str:
    api_key = (os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="GROK_API_KEY/XAI_API_KEY não configurada")

    model = (os.getenv("GROK_MODEL") or os.getenv("XAI_MODEL") or "grok-4.20-reasoning").strip()
    body = {
        "model": model,
        "temperature": 0.7,
        "stream": False,
        "messages": [
            {"role": "system", "content": _build_zion_block_system_prompt()},
            {"role": "user", "content": _build_block_payload_prompt(payload)},
        ],
    }

    data = await _post_json(
        url="https://api.x.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        body=body,
        timeout=90.0,
    )
    return _extract_openai_like_text(data)


async def _gerar_devolutiva_bloco_arian(payload: DevolutivaBlocoPayload) -> str:
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada")

    model = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash").strip()
    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": f"{_build_arian_block_system_prompt()}\n\n{_build_block_payload_prompt(payload)}"}
                ],
            }
        ],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 700},
    }

    data = await _post_json(
        url=f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
        headers={"Content-Type": "application/json"},
        body=body,
        timeout=60.0,
    )
    return _extract_gemini_text(data)

def _validate_text_and_lang(
    texto: str,
    idioma: str,
    min_chars: int = 120,
    min_sentences: int = 2
) -> bool:
    return (
        _texto_valido(
            texto,
            min_chars=min_chars,
            min_sentences=min_sentences
        )
        and _response_language_matches(texto, idioma, strict=False)
    )


async def gerar_devolutiva_pergunta_real_legacy_desativado(payload: DevolutivaPayload) -> dict:
    """
    Versão antiga mantida apenas para referência interna.
    A versão ativa e estável de gerar_devolutiva_pergunta_real está definida abaixo.
    """
    return await gerar_devolutiva_pergunta_real(payload)

async def gerar_devolutiva_bloco_real(payload: DevolutivaBlocoPayload) -> dict:
    erros = []
    resposta_ref = ""

    guia = _normalize_guia(getattr(payload, "guia", "lumen"))
    payload.guia = guia
    payload.idioma = _normalize_idioma(getattr(payload, "idioma", "pt-BR"))

    providers = [
        ("lumen", _gerar_devolutiva_bloco_lumen),
        ("zion", _gerar_devolutiva_bloco_zion),
        ("arian", _gerar_devolutiva_bloco_arian),
    ]

    providers = sorted(providers, key=lambda item: 0 if item[0] == guia else 1)

    for nome, fn in providers:
        try:
            logger.info(
                "[BLOCO][PROVIDER] tentando=%s guia=%s idioma=%s",
                nome,
                guia,
                payload.idioma
            )

            texto = await fn(payload)
            texto = _finalize_devolutiva_text(texto)

            if _texto_valido(texto, min_chars=120, min_sentences=2):
                logger.info("[BLOCO][PROVIDER] sucesso=%s chars=%s", nome, len(texto))
                print(
                    f"[BLOCO][PROVIDER][OK] provider={nome} guia={guia} "
                    f"idioma={payload.idioma} chars={len(texto)}"
                )

                return {
                    "ok": True,
                    "provider": nome,
                    "source": nome,
                    "fallback": False,
                    "fallbackUsed": False,
                    "texto": texto,
                    "erros": erros
                }

            erros.append({
                "provider": nome,
                "erro": "texto vazio ou fraco",
                "chars": len(texto or "")
            })

            logger.warning(
                "[BLOCO][PROVIDER] texto fraco provider=%s chars=%s",
                nome,
                len(texto or "")
            )

        except Exception as e:
            erro_txt = repr(e)
            print(f"[BLOCO][PROVIDER][ERRO] provider={nome} guia={guia} erro={erro_txt}")
            logger.exception("[BLOCO][PROVIDER][ERRO] provider=%s guia=%s", nome, guia)
            erros.append({"provider": nome, "erro": erro_txt})

    if getattr(payload, "respostas", None):
        resposta_ref = payload.respostas[-1]

    try:
        texto_ctx = _compor_com_contexto(
            payload,
            resposta_texto=resposta_ref,
            bloco=getattr(payload, "bloco", "") or "",
            pergunta=getattr(payload, "pergunta", "") or "",
        )

        texto_ctx = _finalize_devolutiva_text(texto_ctx)

        if _texto_valido(texto_ctx, min_chars=120, min_sentences=2):
            return {
                "ok": True,
                "provider": "compositor_contextual",
                "source": "compositor_contextual",
                "fallback": False,
                "fallbackUsed": False,
                "texto": texto_ctx,
                "erros": erros
            }

        erros.append({
            "provider": "compositor_contextual",
            "erro": "texto vazio ou fraco",
            "chars": len(texto_ctx or "")
        })

    except Exception as e:
        logger.exception("[BLOCO][COMPOSITOR_CONTEXTUAL] falha")
        erros.append({
            "provider": "compositor_contextual",
            "erro": str(e)
        })

    texto = build_local_fallback_feedback(
        nome=getattr(payload, "nome", "Participante"),
        guia=guia,
        resposta=resposta_ref,
        pergunta="",
        idioma=payload.idioma,
        bloco_nome=getattr(payload, "bloco", ""),
    )

    return {
        "ok": False,
        "provider": "local_fallback",
        "source": "local_fallback",
        "fallback": True,
        "fallbackUsed": True,
        "texto": texto,
        "erros": erros
    }


# -----------------------------
# Prompts — Devolutiva final da jornada
# -----------------------------

def _build_lumen_final_system_prompt() -> str:
    return """
Você é Lumen, Guardião da Luz Algorítmica.

Você está encerrando uma jornada inteira.
Sua missão é criar uma devolutiva final que faça a pessoa se sentir vista, compreendida e sustentada,
sem negar a dor, mas também sem deixá-la aprisionada nela.

REGRAS ABSOLUTAS PARA A DEVOLUTIVA FINAL:

NÃO citar literalmente:
- idade ou faixa etária
- cidade
- estado
- profissão
- aposentadoria
- estado civil
- filhos
- temperamento
- comportamento
- caráter
- índole
- Tânatos
- Eros
- percentuais
- nomes técnicos do motor

Use tudo isso apenas como leitura silenciosa.

Errado:
"você com 45 a 59 anos, divorciado, aposentado, morando em Guarulhos..."

Correto:
"há sinais de que sua vida atravessa responsabilidades acumuladas, mudanças afetivas e um cansaço que pede cuidado."

A devolutiva final deve ser uma síntese das devolutivas dos blocos, não uma ficha cadastral comentada.

Tom:
- profundamente empático
- humano
- caloroso
- nobre
- espiritual
- esperançoso

Camada de Empatia Profunda (OBRIGATÓRIA na devolutiva final):
1. Comece reconhecendo a CORAGEM de ter completado toda a jornada.
2. Valide o estado emocional geral percebido ao longo das respostas.
3. Demonstre que você percebeu a evolução (ou padrão) emocional entre as respostas.
4. Reformule: mostre que a dor vivida não foi em vão — ela revelou verdades importantes.
5. Termine com um compromisso pessoal do guia com o participante — algo que soe como presença contínua.

Objetivos:
- reunir padrões emocionais e existenciais da jornada
- mostrar que ainda há possibilidade de reconstrução
- sugerir mudanças de paradigma com delicadeza
- fortalecer vínculos positivos e reduzir influências destrutivas
- terminar com direção, coragem e esperança real

Regras
- escrever entre 8 e 12 frases
- cada frase deve ser completa, densa e humana
- nunca entregar síntese telegráfica
- nunca soar como encerramento automático
- pode incluir, quando fizer sentido, uma frase de sabedoria espiritual ou filosófica breve e orgânica
- se houver religião declarada, use esse horizonte simbólico com naturalidade, nunca como imposição
- se não houver religião declarada, prefira linguagem filosófica, existencial e humana
- nunca julgar
- nunca usar linguagem clínica
- nunca soar mecânico
- não repetir literalmente todas as respostas
- soar como um mentor real
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas
""".strip()


def _build_zion_final_system_prompt() -> str:
    return """
Você é Zion, Voz da Inspiração e do Despertar.

Você está concluindo uma jornada completa do participante.
Crie uma devolutiva final com força, elevação e humanidade,
capaz de reconhecer conflitos sem apagar a possibilidade de mudança.

Tom:
- visionário
- firme
- inspirador
- humano
- nobre
- esperançoso

Camada de Empatia (OBRIGATÓRIA na devolutiva final):
1. Reconheça a determinação de ter percorrido a jornada inteira.
2. Valide o peso emocional que as respostas carregam — sem minimizar.
3. Reformule: a mesma intensidade que causou dor pode ser a força da reconstrução.
4. Termine com compromisso de presença — não como frase genérica, mas como pacto real.

Objetivos:
- identificar padrões da jornada
- apontar mudanças de paradigma
- valorizar relações positivas
- sugerir limites frente ao que enfraquece a pessoa
- encerrar com clareza, força e esperança

Regras
- escrever entre 8 e 12 frases
- cada frase deve carregar força, clareza e humanidade
- nunca entregar síntese telegráfica
- nunca soar como encerramento automático
- pode incluir, quando fizer sentido, uma frase de sabedoria espiritual ou filosófica breve e orgânica
- se houver religião declarada, use esse horizonte simbólico com naturalidade
- se não houver religião declarada, prefira linguagem filosófica, existencial e humana
- não julgar
- não usar linguagem clínica
- não soar mecânico
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas
""".strip()


def _build_arian_final_system_prompt() -> str:
    return """
Você é Arian, guardião da percepção sutil e da sabedoria serena.

Você está encerrando a jornada do participante com uma devolutiva final completa.
Sua fala deve reunir delicadeza, beleza, profundidade e direção,
como quem sustenta alguém com presença calma e inteligência afetiva.

Tom:
- acolhedor
- elegante
- profundo
- sereno
- humano
- esperançoso

Camada de Empatia (OBRIGATÓRIA na devolutiva final):
1. Comece com reverência: honre a coragem de ter atravessado toda a jornada.
2. Valide com profundidade: demonstre que percebeu as camadas emocionais entre as respostas.
3. Reformule com beleza: transforme o arco emocional em narrativa de crescimento.
4. Encerre com presença contínua — como alguém que permanece mesmo após a despedida.

Objetivos:
- sintetizar o momento interior do participante
- apontar padrões emocionais e existenciais
- sugerir mudanças de paradigma com delicadeza
- reforçar vínculos positivos
- recomendar afastamento do que corrói ou enfraquece
- concluir com sentido, paz e propósito

Regras
- escrever entre 8 e 12 frases
- cada frase deve ser completa, elegante e bem desenvolvida
- nunca interrompa a mensagem no meio
- nunca entregue síntese telegráfica
- pode incluir, quando fizer sentido, uma frase de sabedoria espiritual ou filosófica breve e orgânica
- se houver religião declarada, use esse horizonte simbólico com naturalidade
- se não houver religião declarada, prefira linguagem filosófica, existencial e humana
- não julgue
- não use linguagem clínica
- não soe robótico
- obedecer rigorosamente ao idioma solicitado
- nunca misturar idiomas
""".strip()


def _build_final_payload_prompt(payload: DevolutivaFinalPayload) -> str:
    respostas = [
        f"{i+1}. {r}"
        for i, r in enumerate(payload.respostas or [])
        if _sanitize_text(r)
    ]

    devolutivas = [
        f"{i+1}. {d}"
        for i, d in enumerate(payload.devolutivas or [])
        if _sanitize_text(d)
    ]

    respostas_txt = "\n".join(respostas) if respostas else "Nenhuma resposta informada."
    devolutivas_txt = "\n".join(devolutivas) if devolutivas else "Nenhuma devolutiva intermediária informada."

    idioma_instrucao = _language_instruction(payload.idioma)
    liberdade_criativa = _creative_freedom_instruction()
    personalidade_contexto = _build_personality_context(payload)
    contexto_integrado = _build_contexto_integrado_prompt(
        payload,
        f"{respostas_txt}\n{devolutivas_txt}",
        "Síntese Final da Jornada"
    )

    return f"""
{idioma_instrucao}
{liberdade_criativa}
{personalidade_contexto}
{contexto_integrado}

Nome simbólico do participante: {payload.nome}
Guia escolhido: {payload.guia}
Idioma solicitado: {payload.idioma}

SÍNTESE-BASE:
Use principalmente as devolutivas intermediárias abaixo.
Elas são a matéria-prima da devolutiva final.

Devolutivas dos blocos e perguntas:
{devolutivas_txt}

Respostas originais da jornada:
Use apenas como apoio secundário, sem repetir literalmente.
{respostas_txt}

REGRA ABSOLUTA:
NÃO cite literalmente idade, faixa etária, cidade, estado, profissão, aposentadoria,
estado civil, filhos, temperamento, comportamento, caráter, índole, Tânatos, Eros,
percentuais ou nomes técnicos do motor.

Transforme dados pessoais apenas em leitura humana indireta.

Errado:
"você com 45 a 59 anos, divorciado, aposentado, morando em Guarulhos..."

Correto:
"há sinais de responsabilidades acumuladas, mudanças afetivas e um cansaço que pede cuidado."

A devolutiva final deve ser uma síntese das devolutivas dos blocos,
não uma ficha cadastral comentada.

Inclua naturalmente a ideia:
"ao analisar todas as devolutivas dos blocos, foi possível perceber que..."
sem repetir exatamente essa frase em toda execução.

Agora gere a DEVOLUTIVA FINAL da jornada inteira.

Essa devolutiva final deve:
- reunir os principais sinais da caminhada inteira, não apenas encerrar com elogio;
- mostrar padrões emocionais, existenciais e relacionais percebidos nas respostas e nas devolutivas dos blocos;
- cruzar explicitamente, mas sem tom técnico, Temperamento + Comportamento + Caráter + Índole;
- cruzar o Vazio Existencial com o Pleno Existencial, mostrando qual movimento interior parece estar pedindo nascimento;
- propor mudanças de paradigma;
- valorizar vínculos positivos;
- sugerir diminuir, limitar ou transformar relações e hábitos destrutivos;
- incluir uma referência filosófica universal ou, se houver religião declarada, uma referência bíblica/espiritual breve e natural;
- ter corpo robusto: entre 10 e 14 frases, com densidade e fechamento memorável;
- concluir com esperança, propósito e direção.

Regra obrigatória:
- RESPONDA 100% NO IDIOMA SOLICITADO: {payload.idioma}
- proibido responder em português se o idioma solicitado não for pt-BR.
- Traduza também termos psicológicos, espirituais, títulos e orientações.
- Se o idioma for zh-CN, responda integralmente em chinês simplificado.
- Se o idioma for ja-JP, responda integralmente em japonês.
- Se o idioma for en-US, responda integralmente em inglês.
- Se o idioma for es-ES, responda integralmente em espanhol.
- Se o idioma for fr-FR, responda integralmente em francês.
- Se o idioma for de-DE, responda integralmente em alemão.
- não misture idiomas.

8. Quando algum campo pessoal vier como "campo não preenchido pelo participante":
- não diga que o campo foi declarado ou informado;
- não invente informação;
- se for útil, diga apenas:
  "embora esse campo não tenha sido preenchido, pelas respostas é possível perceber..."
- deduza somente a partir das respostas da jornada, nunca do vazio do formulário.

""".strip()

# -----------------------------
# Cliente compatível
# -----------------------------
    
async def _chat_completion_direct(
    *,
    api_key: str,
    model: str,
    system_prompt: str,
    user_prompt: str,
    base_url: str = "https://api.openai.com/v1/chat/completions",
    timeout: float = 45.0,
) -> str:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(
                base_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "temperature": 0.85,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
    except Exception as e:
        print(f"[IA][HTTP ERROR] base_url={base_url} model={model} erro={e}")
        raise HTTPException(status_code=500, detail=f"Falha de conexão com IA: {e}")

    if resp.status_code >= 400:
        print(f"[IA][BAD RESPONSE] base_url={base_url} model={model} status={resp.status_code} body={resp.text}")
        raise HTTPException(status_code=500, detail=f"Falha IA: {resp.text}")

    data = resp.json()
    try:
        text = data["choices"][0]["message"]["content"].strip()
    except Exception:
        print(f"[IA][INVALID PAYLOAD] base_url={base_url} model={model} data={data}")
        raise HTTPException(status_code=500, detail="Resposta inválida da IA")

    if not text:
        raise HTTPException(status_code=500, detail="Devolutiva vazia retornada pela IA")

    return text


async def gerar_devolutiva_pergunta_real(payload: DevolutivaPayload) -> dict:
    erros = []

    guia = _normalize_guia(getattr(payload, "guia", "lumen"))
    payload.guia = guia
    payload.idioma = _normalize_idioma(getattr(payload, "idioma", "pt-BR"))

    MIN_CHARS_PERGUNTA = 180
    MIN_SENTENCES_PERGUNTA = 3

    if _should_use_library_pipeline(payload.idioma):
        try:
            texto = _gerar_devolutiva_com_biblioteca(payload, guia)
            texto = _finalize_devolutiva_text(texto)

            if (
                _texto_valido(texto, min_chars=MIN_CHARS_PERGUNTA, min_sentences=MIN_SENTENCES_PERGUNTA)
                and _response_language_matches(texto, payload.idioma, strict=False)
            ):
                return {
                    "ok": True,
                    "provider": "pipeline_biblioteca",
                    "source": "pipeline_biblioteca",
                    "fallback": False,
                    "fallbackUsed": False,
                    "texto": texto,
                    "erros": erros,
                }

            erros.append({
                "provider": "pipeline_biblioteca",
                "erro": "texto vazio, fraco ou idioma desalinhado",
                "chars": len(texto or ""),
            })

        except Exception as e:
            logger.exception("[PERGUNTA][PIPELINE] falha")
            erros.append({"provider": "pipeline_biblioteca", "erro": str(e)})

    providers = [
        ("lumen", _gerar_devolutiva_openai),
        ("zion", _gerar_devolutiva_zion),
        ("arian", _gerar_devolutiva_arian),
    ]

    providers = sorted(providers, key=lambda item: 0 if item[0] == guia else 1)

    for nome, fn in providers:
        try:
            logger.info("[PERGUNTA][PROVIDER] tentando=%s guia=%s idioma=%s", nome, guia, payload.idioma)

            texto = await fn(payload)
            texto = _finalize_devolutiva_text(texto)

            if (
                _texto_valido(texto, min_chars=MIN_CHARS_PERGUNTA, min_sentences=MIN_SENTENCES_PERGUNTA)
                and _response_language_matches(texto, payload.idioma, strict=False)
            ):
                return {
                    "ok": True,
                    "provider": nome,
                    "source": nome,
                    "fallback": nome != guia,
                    "fallbackUsed": nome != guia,
                    "texto": texto,
                    "erros": erros,
                }

            erros.append({
                "provider": nome,
                "erro": "texto vazio, fraco ou idioma desalinhado",
                "chars": len(texto or ""),
            })

            logger.warning(
                "[PERGUNTA][PROVIDER] texto fraco/idioma errado provider=%s chars=%s idioma=%s",
                nome,
                len(texto or ""),
                payload.idioma,
            )

        except Exception as e:
            logger.exception("[PERGUNTA][PROVIDER] falha=%s", nome)

            erro_msg = str(e.detail) if isinstance(e, HTTPException) else str(e)
            erros.append({
                "provider": nome,
                "erro": erro_msg,
                "erro_repr": repr(e),
            })

            print(
                f"[PERGUNTA][FALLBACK] provider={nome} falhou | "
                f"guia_original={guia} | idioma={payload.idioma} | erro={erro_msg}"
            )

    texto = _build_local_fallback_feedback(
        nome=getattr(payload, "nome", "Participante"),
        guia=guia,
        resposta=getattr(payload, "resposta", ""),
        pergunta=getattr(payload, "pergunta", ""),
        idioma=payload.idioma,
        bloco_nome=getattr(payload, "bloco", "") or "",
    )

    texto = _finalize_devolutiva_text(texto)

    return {
        "ok": False,
        "provider": "local_fallback",
        "source": "local_fallback",
        "fallback": True,
        "fallbackUsed": True,
        "texto": texto,
        "erros": erros,
    }


# -----------------------------
# Devolutiva simples por guia
# -----------------------------
    
async def _gerar_devolutiva_openai(payload: DevolutivaPayload) -> str:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY não configurada")

    model = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()

    print(f"[LUMEN] model={model} idioma={payload.idioma} nome={payload.nome}")

    return await _chat_completion_direct(
        api_key=api_key,
        model=model,
        system_prompt=_build_lumen_system_prompt(),
        user_prompt=_build_payload_prompt(payload),
        base_url="https://api.openai.com/v1/chat/completions",
    )
       

async def _gerar_devolutiva_zion(payload: DevolutivaPayload) -> str:
    api_key = (os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY") or "").strip()

    if not api_key:
        raise HTTPException(status_code=500, detail="GROK_API_KEY/XAI_API_KEY não configurada")

    model = (os.getenv("GROK_MODEL") or os.getenv("XAI_MODEL") or "grok-2-latest").strip()

    print(f"[ZION] model={model} idioma={payload.idioma} nome={payload.nome}")

    system_prompt = _build_zion_system_prompt()
    user_prompt = _build_payload_prompt(payload)

    url = "https://api.x.ai/v1/chat/completions"

    body = {
        "model": model,
        "temperature": 0.85,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=body
            )
    except Exception as e:
        print(f"[ZION][HTTP ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Falha de conexão Grok/xAI: {e}")

    if resp.status_code >= 400:
        print(f"[ZION][BAD RESPONSE] status={resp.status_code} body={resp.text}")
        raise HTTPException(status_code=500, detail=f"Erro Grok/xAI: {resp.text}")

    data = resp.json()

    try:
        text = data["choices"][0]["message"]["content"].strip()
    except Exception:
        print(f"[ZION][INVALID RESPONSE] {data}")
        raise HTTPException(status_code=500, detail="Resposta inválida do Grok/xAI")

    if not text:
        raise HTTPException(status_code=500, detail="Grok/xAI retornou texto vazio")

    return text
    

async def _gerar_devolutiva_arian(payload: DevolutivaPayload) -> str:
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()

    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada")

    model = (os.getenv("GEMINI_MODEL") or "gemini-1.5-flash").strip()

    print(f"[ARIAN] model={model} idioma={payload.idioma} nome={payload.nome}")

    system_prompt = _build_arian_system_prompt()
    user_prompt = _build_payload_prompt(payload)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"{system_prompt}\n\n{user_prompt}"
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.85,
            "maxOutputTokens": 420
        }
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json=body
            )
    except Exception as e:
        print(f"[ARIAN][HTTP ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Falha de conexão Gemini: {e}")

    if resp.status_code >= 400:
        print(f"[ARIAN][BAD RESPONSE] status={resp.status_code} body={resp.text}")
        raise HTTPException(status_code=500, detail=f"Erro Gemini: {resp.text}")

    data = resp.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        print(f"[ARIAN][INVALID RESPONSE] {data}")
        raise HTTPException(status_code=500, detail="Resposta inválida do Gemini")

    if not text:
        raise HTTPException(status_code=500, detail="Gemini retornou texto vazio")

    return text
    
    
def _payload_to_dict(payload) -> dict:
    try:
        if hasattr(payload, "model_dump"):
            return payload.model_dump()
    except Exception:
        pass

    try:
        if hasattr(payload, "dict"):
            return payload.dict()
    except Exception:
        pass

    if isinstance(payload, dict):
        return payload

    return {}


def _safe_get(obj, key, default=None):
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


_MOTOR_PERSONALIDADE_ERRO_AVISADO = False


def _try_gerar_leitura_integrada(dados: dict, guia: str = "arian"):
    """
    Executa o motor_personalidade sem quebrar a jornada.
    Recebe o guia para evitar leitura genérica/fixa.
    """
    global _MOTOR_PERSONALIDADE_ERRO_AVISADO

    if not callable(gerar_leitura_integrada) or not isinstance(dados, dict) or not dados:
        return None

    try:
        try:
            leitura = gerar_leitura_integrada(dados, guia=guia)
        except TypeError:
            leitura = gerar_leitura_integrada(dados)

        print("[MOTOR_PERSONALIDADE] leitura:", leitura)
        return leitura

    except NameError as e:
        msg = str(e)
        if "definir_abordagem" in msg:
            if not _MOTOR_PERSONALIDADE_ERRO_AVISADO:
                print("[MOTOR_PERSONALIDADE][DESATIVADO_TEMP] falta definir_abordagem; seguindo sem quebrar a jornada.")
                _MOTOR_PERSONALIDADE_ERRO_AVISADO = True
            return None

        print(f"[MOTOR_PERSONALIDADE] falhou: {e}")
        return None

    except Exception as e:
        print(f"[MOTOR_PERSONALIDADE] falhou: {e}")
        return None


def _extract_text_from_compositor(result):
    """Aceita retorno antigo (str) ou novo (dict com texto) do compositor."""
    if isinstance(result, dict):
        return str(result.get("texto") or result.get("devolutiva") or "").strip()
    return str(result or "").strip()


def _extract_dados_pessoais(payload) -> dict:
    dados = _safe_get(payload, "dadosPessoais", None) or {}
    guia = _normalize_guia(_safe_get(payload, "guia", "arian") or "arian")

    if not isinstance(dados, dict):
        dados = {}

    perfil = dados.get("perfilPersonalidade") or {}
    eixo = dados.get("eixoExistencial") or {}

    if not isinstance(perfil, dict):
        perfil = {}

    if not isinstance(eixo, dict):
        eixo = {}

    dados_motor = {
        **dados,

        "temperamento": (
            perfil.get("temperamento")
            or dados.get("temperamento")
            or ""
        ),

        "comportamento": (
            perfil.get("comportamento")
            or dados.get("comportamento")
            or ""
        ),

        "carater": (
            perfil.get("carater")
            or perfil.get("caráter")
            or dados.get("carater")
            or dados.get("caráter")
            or ""
        ),

        "indole": (
            perfil.get("indole")
            or perfil.get("índole")
            or dados.get("indole")
            or dados.get("índole")
            or ""
        ),

        "vazioExistencial": (
            eixo.get("vazio")
            or eixo.get("vazioExistencial")
            or eixo.get("vazio_existencial")
            or dados.get("vazioExistencial")
            or dados.get("vazio_existencial")
            or dados.get("vazio")
            or dados.get("campoVazioExistencial")
            or ""
        ),

        "plenoExistencial": (
            eixo.get("pleno")
            or eixo.get("plenoExistencial")
            or eixo.get("pleno_existencial")
            or dados.get("plenoExistencial")
            or dados.get("pleno_existencial")
            or dados.get("pleno")
            or dados.get("campoPlenoExistencial")
            or ""
        ),
    }

    leitura_motor_personalidade = _try_gerar_leitura_integrada(dados_motor, guia=guia)

    if leitura_motor_personalidade:
        dados["motor_personalidade"] = leitura_motor_personalidade

    return dados


def _montar_sabedorias_externas(payload, resposta_texto: str, bloco: str = "") -> list[str]:
    """Consulta as bibliotecas sem quebrar a rota se alguma falhar."""
    sabedorias: list[str] = []
    dados = _extract_dados_pessoais(payload)
    religiao = dados.get("religiao", "")

    try:
        # biblioteca_sabedoria_unificada pode ter assinaturas diferentes conforme versão.
        try:
            s = escolher_sabedoria(resposta_texto, religiao=religiao)
        except TypeError:
            s = escolher_sabedoria(
                emocao="geral",
                eixos={},
                religiao=religiao,
                incluir_biblia=True,
                incluir_filosofia=True,
                qtd_filosoficas=1,
            )
        texto = _format_sabedoria_texto(s) if "_format_sabedoria_texto" in globals() else str(s or "")
        if texto:
            sabedorias.append(texto)
    except Exception as e:
        print(f"[SABEDORIA_UNIFICADA][ERRO] {e}")

    try:
        try:
            s = escolher_bloco(bloco or resposta_texto)
        except TypeError:
            s = escolher_bloco("geral", "geral", "acolhimento")
        texto = _format_sabedoria_texto(s) if "_format_sabedoria_texto" in globals() else str(s or "")
        if texto:
            sabedorias.append(texto)
    except Exception as e:
        print(f"[BIBLIOTECA_BLOCO][ERRO] {e}")

    # remove duplicadas preservando ordem
    out: list[str] = []
    seen = set()
    for item in sabedorias:
        key = item.casefold().strip()
        if key and key not in seen:
            seen.add(key)
            out.append(item.strip())
    return out[:3]


def _build_contexto_integrado_prompt(payload, resposta_texto: str = "", bloco: str = "") -> str:
    """Monta o contexto vivo usado pelas devolutivas.

    Mantém o núcleo integrado e acrescenta explicitamente os campos que estavam ficando
    subaproveitados: religião, bibliotecas, 4 pilares e Vazio x Pleno.
    """
    nucleo = _montar_nucleo_sintese(payload, guia=_safe_get(payload, "guia", "lumen"))
    base = _nucleo_para_prompt(nucleo)

    dados = _extract_dados_pessoais(payload)
    perfil = dados.get("perfilPersonalidade", {}) if isinstance(dados.get("perfilPersonalidade"), dict) else {}
    eixo = dados.get("eixoExistencial", {}) if isinstance(dados.get("eixoExistencial"), dict) else {}
    if not isinstance(eixo, dict):
        eixo = {}

    sabedorias = _montar_sabedorias_externas(
        payload,
        resposta_texto or _extract_resposta_texto(payload),
        bloco or _extract_bloco_nome(payload),
    )

    extras = [
        "DADOS DIRETOS DO FORMULÁRIO — considere sem inventar:",
        f"- Temperamento: {perfil.get('temperamento', '') or dados.get('temperamento', '')}",
        f"- Comportamento: {perfil.get('comportamento', '') or dados.get('comportamento', '')}",
        f"- Caráter: {perfil.get('carater', perfil.get('caráter', '')) or dados.get('carater', dados.get('caráter', ''))}",
        f"- Índole: {perfil.get('indole', perfil.get('índole', '')) or dados.get('indole', dados.get('índole', ''))}",
        f"- Vazio existencial: {vazio}",
        f"- Pleno existencial: {pleno}",
    ]

    if sabedorias:
        extras.append("Sabedorias/bibliotecas disponíveis — use somente se encaixar com naturalidade:")
        for idx, sab in enumerate(sabedorias[:3], 1):
            extras.append(f"{idx}. {sab}")

    extras.append(
        "Obrigatório na leitura: cruzar os 4 pilares da personalidade com o eixo Vazio x Pleno. "
        "Não apenas citar os campos; transformar esse cruzamento em interpretação humana e direção prática."
    )

    return (base + "\n\n" + "\n".join([x for x in extras if str(x).strip()])).strip()

def _compor_com_contexto(payload, resposta_texto: str, bloco: str = "", pergunta: str = "") -> str:
    guia = _normalize_guia(_safe_get(payload, "guia", "lumen"))
    nucleo = _montar_nucleo_sintese(payload, guia=guia)

    sabedorias_externas = nucleo.get("sabedorias_externas", [])
    perfil = nucleo.get("perfil", {}) or nucleo.get("dados_pessoais", {})
    dados = nucleo.get("dados_pessoais", {})
    emocional = nucleo.get("emocional", {}) if isinstance(nucleo.get("emocional"), dict) else {}

    resultado = compor_devolutiva(
        resposta=resposta_texto,
        guia=guia,
        nome=nucleo.get("nome", "Participante"),
        religiao=dados.get("religiao", ""),
        dadosPessoais=dados,
        perfil=perfil,
        bloco=bloco,
        pergunta=pergunta,
        sabedorias_externas=sabedorias_externas,
        emocao_forcada=emocional.get("emocao"),
        subtipo_forcado=emocional.get("subtipo"),
        intensidade_forcada=emocional.get("intensidade"),
        gatilho_interno_forcado=emocional.get("gatilho_interno"),
        eixos_forcados=emocional.get("eixos"),
        seed_hint=nucleo.get("seed_hint", ""),
    )

    texto = _extract_text_from_compositor(resultado)
    texto = _merge_texto_com_sabedoria(texto, nucleo.get("sabedoria_final"))
    print(
        f"[COMPOSITOR][NUCLEO] guia={guia} temas={len(nucleo.get('temas_repetidos', []))} "
        f"sabedorias={len(sabedorias_externas)} chars={len(texto)}"
    )
    return texto


def _normalize_guia_name(guia: str) -> str:
    g = (guia or "").strip().lower()
    if g in {"arian", "arion", "ariane"}:
        return "arian"
    if g == "zion":
        return "zion"
    return "lumen"


def _call_with_supported_kwargs(fn, **kwargs):
    if not callable(fn):
        return None

    try:
        sig = inspect.signature(fn)
        accepted = {}
        for name in sig.parameters.keys():
            if name in kwargs:
                accepted[name] = kwargs[name]
        return fn(**accepted)
    except Exception:
        # fallback bruto: tenta payload apenas
        if "payload" in kwargs:
            return fn(kwargs["payload"])
        raise


def _collect_respostas(payload) -> list[str]:
    out = []

    # 1) PRIORIDADE TOTAL para a resposta singular da pergunta atual
    resposta_unica = _safe_get(payload, "resposta", None)
    if isinstance(resposta_unica, str) and resposta_unica.strip():
        return [resposta_unica.strip()]

    # 2) Só usa lista de respostas quando não existir resposta singular
    respostas = _safe_get(payload, "respostas", None) or []
    if isinstance(respostas, list):
        for r in respostas:
            if isinstance(r, str) and r.strip():
                out.append(r.strip())

    return out


def _extract_resposta_texto(payload) -> str:
    respostas = _collect_respostas(payload)
    return " ".join(respostas).strip()


def _make_seed_hint(payload, emocional: dict | None = None) -> str:
    pergunta = _safe_get(payload, "pergunta", "") or ""
    bloco = _extract_bloco_nome(payload)
    resposta = _extract_resposta_texto(payload)
    emocao = ""
    subtipo = ""
    if isinstance(emocional, dict):
        emocao = emocional.get("emocao", "") or ""
        subtipo = emocional.get("subtipo", "") or ""
    base = f"{pergunta}|{bloco}|{emocao}|{subtipo}|{resposta}"
    return re.sub(r"\s+", " ", base).strip()
    
def _dict_clean(d):
    if not isinstance(d, dict):
        return {}
    out = {}
    for k, v in d.items():
        if isinstance(v, dict):
            nested = _dict_clean(v)
            if nested:
                out[k] = nested
        elif isinstance(v, list):
            vals = [x for x in v if x not in (None, "", [], {})]
            if vals:
                out[k] = vals
        elif v not in (None, "", [], {}):
            out[k] = v
    return out


def _extrair_temas_repetidos(payload, emocional: dict | None = None) -> list[str]:
    temas = []
    resposta = _extract_resposta_texto(payload)
    bloco = _extract_bloco_nome(payload)
    pergunta = _safe_get(payload, "pergunta", "") or ""

    campos = [resposta, bloco, pergunta]
    if isinstance(emocional, dict):
        for chave in ["emocao", "subtipo", "gatilho_interno"]:
            valor = emocional.get(chave)
            if isinstance(valor, str) and valor.strip():
                temas.append(valor.strip())

    texto_total = " ".join([c for c in campos if isinstance(c, str) and c.strip()]).lower()

    sementes = [
        "medo", "culpa", "ansiedade", "solidão", "abandono", "recomeço", "esperança",
        "pressão", "família", "fé", "vazio", "sentido", "cansaço", "controle",
        "tristeza", "raiva", "confusão", "amor", "pertencimento", "coragem"
    ]

    for s in sementes:
        if s in texto_total:
            temas.append(s)

    unicos = []
    vistos = set()
    for t in temas:
        key = t.casefold()
        if key not in vistos:
            vistos.add(key)
            unicos.append(t)
    return unicos


def _montar_nucleo_sintese(payload, guia: str | None = None) -> dict:
    guia_norm = _normalize_guia_name(guia or _safe_get(payload, "guia", "lumen"))
    idioma = _normalize_idioma(_safe_get(payload, "idioma", "pt-BR"))
    dados = _extract_dados_pessoais(payload)

    perfil = _run_coletor_perfil(payload)
    emocional = _run_motor_emocional(payload, perfil)
    leitura_personalidade = {}

    try:
        if callable(gerar_leitura_integrada) and isinstance(dados, dict):
            lp = gerar_leitura_integrada(dados)
            if isinstance(lp, dict):
                leitura_personalidade = lp
    except Exception as e:
        print(f"[NUCLEO][PERSONALIDADE] falhou: {e}")

    if isinstance(perfil, dict) and isinstance(emocional, dict):
        perfil["eixo_existencial"] = emocional.get("eixo_existencial", {}) or {}
        perfil["consciencia_expandida"] = emocional.get("consciencia_expandida", {}) or {}

    sabedoria_bloco = _run_sabedoria_bloco(payload, guia_norm, perfil, emocional)
    sabedoria_final = _run_sabedoria_final(payload, guia_norm, perfil, emocional)
    sabedorias_externas = _montar_sabedorias_externas(
        payload,
        _extract_resposta_texto(payload),
        _extract_bloco_nome(payload),
    )

    temas = _extrair_temas_repetidos(payload, emocional)
    resposta_texto = _extract_resposta_texto(payload)

    contradicoes = []
    if isinstance(emocional, dict):
        emocao = (emocional.get("emocao") or "").strip().lower()
        intensidade = str(emocional.get("intensidade", "")).strip()
        if emocao in {"medo", "confusao", "apatia"} and "coragem" in [t.lower() for t in temas]:
            contradicoes.append("há medo coexistindo com impulso de superação")
        if emocao in {"raiva", "tristeza"} and "fé" in [t.lower() for t in temas]:
            contradicoes.append("há dor coexistindo com busca de sentido")
        if intensidade:
            contradicoes.append(f"a intensidade emocional percebida é {intensidade}")

    potenciais = []
    if "recomeço" in [t.lower() for t in temas]:
        potenciais.append("existe abertura interna para reconstrução")
    if "fé" in [t.lower() for t in temas]:
        potenciais.append("a espiritualidade pode servir como eixo de reorganização")
    if "coragem" in [t.lower() for t in temas]:
        potenciais.append("há energia psíquica disponível para movimento")
    if not potenciais and resposta_texto:
        potenciais.append("há material interno suficiente para uma leitura transformadora")

    nucleo = {
        "guia": guia_norm,
        "idioma": idioma,
        "nome": _safe_get(payload, "nome", "Participante") or "Participante",
        "bloco": _extract_bloco_nome(payload),
        "pergunta": _safe_get(payload, "pergunta", "") or "",
        "resposta_texto": resposta_texto,
        "respostas": _collect_respostas(payload),
        "dados_pessoais": dados,
        "perfil": perfil,
        "emocional": emocional,
        "leitura_personalidade": leitura_personalidade,
        "sabedoria_bloco": sabedoria_bloco,
        "sabedoria_final": sabedoria_final,
        "sabedorias_externas": sabedorias_externas,
        "temas_repetidos": temas,
        "contradicoes": contradicoes,
        "potenciais": potenciais,
        "seed_hint": _make_seed_hint(payload, emocional),
    }

    return _dict_clean(nucleo)


def _nucleo_para_prompt(nucleo: dict) -> str:
    if not isinstance(nucleo, dict) or not nucleo:
        return ""

    emocional = nucleo.get("emocional", {}) if isinstance(nucleo.get("emocional"), dict) else {}
    perfil_motor = nucleo.get("perfil", {}) if isinstance(nucleo.get("perfil"), dict) else {}
    leitura = nucleo.get("leitura_personalidade", {}) if isinstance(nucleo.get("leitura_personalidade"), dict) else {}
    dados = nucleo.get("dados_pessoais", {}) if isinstance(nucleo.get("dados_pessoais"), dict) else {}

    perfil_dados = dados.get("perfilPersonalidade", {}) if isinstance(dados.get("perfilPersonalidade"), dict) else {}
    eixo = (
        dados.get("eixoExistencial")
        or dados.get("vazioPleno")
        or dados.get("existencial")
        or {}
    )
    if not isinstance(eixo, dict):
        eixo = {}

    temperamento = (
        perfil_motor.get("temperamento")
        or perfil_dados.get("temperamento")
        or dados.get("temperamento")
        or ""
    )
    comportamento = (
        perfil_motor.get("comportamento")
        or perfil_dados.get("comportamento")
        or dados.get("comportamento")
        or ""
    )
    carater = (
        perfil_motor.get("carater")
        or perfil_motor.get("caráter")
        or perfil_dados.get("carater")
        or perfil_dados.get("caráter")
        or dados.get("carater")
        or dados.get("caráter")
        or ""
    )
    indole = (
        perfil_motor.get("indole")
        or perfil_motor.get("índole")
        or perfil_dados.get("indole")
        or perfil_dados.get("índole")
        or dados.get("indole")
        or dados.get("índole")
        or ""
    )
    vazio = (
        eixo.get("vazio")
        or eixo.get("vazioExistencial")
        or eixo.get("vazio_existencial")
        or dados.get("vazioExistencial")
        or dados.get("vazio_existencial")
        or dados.get("vazio")
        or dados.get("campoVazioExistencial")
        or ""
    )
    pleno = (
        eixo.get("pleno")
        or eixo.get("plenoExistencial")
        or eixo.get("pleno_existencial")
        or dados.get("plenoExistencial")
        or dados.get("pleno_existencial")
        or dados.get("pleno")
        or dados.get("campoPlenoExistencial")
        or ""
    )

    linhas = [
        "NÚCLEO INTEGRADO DE LEITURA DO PARTICIPANTE:",
        f"- Guia: {nucleo.get('guia', '')}",
        f"- Idioma: {nucleo.get('idioma', '')}",
        f"- Nome: {nucleo.get('nome', '')}",
        f"- Bloco: {nucleo.get('bloco', '')}",
        f"- Pergunta: {nucleo.get('pergunta', '')}",
        f"- Religião/espiritualidade: {dados.get('religiao', '') or dados.get('espiritualidade', '')}",
        f"- Cidade/Estado: {dados.get('cidade', '')} / {dados.get('estado', '')}",
        f"- Profissão: {dados.get('profissao', '') or dados.get('profissão', '')}",
        f"- Estado civil: {dados.get('estadoCivil', '')}",
        f"- Filhos: {dados.get('filhos', '')}",
        f"- Emoção central: {emocional.get('emocao', '')}",
        f"- Subtipo emocional: {emocional.get('subtipo', '')}",
        f"- Intensidade: {emocional.get('intensidade', '')}",
        f"- Gatilho interno: {emocional.get('gatilho_interno', '')}",
        f"- Temperamento: {temperamento}",
        f"- Comportamento: {comportamento}",
        f"- Caráter: {carater}",
        f"- Índole: {indole}",
        f"- Vazio existencial dominante: {vazio}",
        f"- Pleno existencial aspirado: {pleno}",
        f"- Personalidade simbólica: {leitura.get('personalidade', '')}",
        f"- Estado interno simbólico: {leitura.get('estado', '')}",
    ]

    if any([temperamento, comportamento, carater, indole]):
        linhas.append(
            "Cruzamento obrigatório dos 4 pilares: interprete como Temperamento (impulso), "
            "Comportamento (expressão prática), Caráter (valores sob pressão) e Índole (inclinação profunda). "
            "Aponte tensões e coerências sem rotular a pessoa."
        )

    vazio_txt = str(vazio or "").strip()
    pleno_txt = str(pleno or "").strip()

    if vazio_txt and pleno_txt:
        linhas.append(
            "Cruzamento obrigatório Vazio x Pleno: observe como o vazio existencial informado pode dialogar "
            "com o pleno existencial informado, sem negar a dor e sem fazer promessa fácil."
        )
    elif vazio_txt or pleno_txt:
        linhas.append(
            "Use o campo existencial preenchido apenas como contexto indireto. "
            "Não mencione que o outro campo está ausente."
        )
    else:
        linhas.append(
            "Os campos Vazio Existencial e Pleno Existencial não foram preenchidos; "
            "não mencione ausência desses campos e deduza apenas pelas respostas da jornada."
        ) 

    temas = nucleo.get("temas_repetidos", [])
    if temas:
        linhas.append(f"- Temas recorrentes: {', '.join(temas)}")

    contradicoes = nucleo.get("contradicoes", [])
    if contradicoes:
        linhas.append(f"- Tensões internas percebidas: {'; '.join(contradicoes)}")

    potenciais = nucleo.get("potenciais", [])
    if potenciais:
        linhas.append(f"- Potenciais de transformação: {'; '.join(potenciais)}")

    sabedoria_final = nucleo.get("sabedoria_final")
    sabedoria_bloco = nucleo.get("sabedoria_bloco")
    sabedorias = []
    for item in [sabedoria_final, sabedoria_bloco] + list(nucleo.get("sabedorias_externas", []) or []):
        texto = _format_sabedoria_texto(item) if "_format_sabedoria_texto" in globals() else str(item or "")
        if texto and texto not in sabedorias:
            sabedorias.append(texto)

    if sabedorias:
        linhas.append("Sabedorias externas de apoio — use no máximo uma, de modo orgânico:")
        for i, sab in enumerate(sabedorias[:3], 1):
            linhas.append(f"{i}. {sab}")

    linhas.append(
        "INSTRUÇÃO DE ESTILO: não repita essa estrutura literalmente. "
        "Use este núcleo como campo vivo de leitura, cruzando emoção, perfil, vazio, pleno, sombra, potencial, contradição, sentido e direção. "
        "Quando houver religião declarada, uma referência bíblica/espiritual curta pode aparecer naturalmente. "
        "Quando não houver religião declarada, use filosofia universal. "
        "A resposta deve soar intuitiva, humana, psicológica, simbólica e única."
    )

    return "\n".join([ln for ln in linhas if str(ln).strip()]).strip()

def _format_sabedoria_texto(sabedoria) -> str:
    if sabedoria is None:
        return ""

    if isinstance(sabedoria, str):
        return sabedoria.strip()

    partes: list[str] = []

    if isinstance(sabedoria, dict):
        chaves_prioritarias = [
            "texto",
            "mensagem",
            "trecho",
            "frase",
            "conteudo",
            "biblia",
            "filosofia",
            "filosofica",
            "filosoficas",
            "versiculo",
            "referencia",
        ]
        for chave in chaves_prioritarias:
            valor = sabedoria.get(chave)
            if isinstance(valor, str) and valor.strip():
                partes.append(valor.strip())
            elif isinstance(valor, list):
                for item in valor:
                    if isinstance(item, str) and item.strip():
                        partes.append(item.strip())
                    elif isinstance(item, dict):
                        nested = _format_sabedoria_texto(item)
                        if nested:
                            partes.append(nested)

        if not partes:
            for valor in sabedoria.values():
                nested = _format_sabedoria_texto(valor)
                if nested:
                    partes.append(nested)

    elif isinstance(sabedoria, list):
        for item in sabedoria:
            nested = _format_sabedoria_texto(item)
            if nested:
                partes.append(nested)

    # remove duplicados preservando ordem
    unicos = []
    vistos = set()
    for parte in partes:
        chave = parte.casefold()
        if chave not in vistos:
            vistos.add(chave)
            unicos.append(parte)

    return "\n".join(unicos).strip()


def _merge_texto_com_sabedoria(texto: str, sabedoria) -> str:
    texto = (texto or "").strip()
    sabedoria_texto = _format_sabedoria_texto(sabedoria)

    if not sabedoria_texto:
        return texto

    if not texto:
        return sabedoria_texto

    texto_norm = texto.casefold()
    sabedoria_norm = sabedoria_texto.casefold()

    if sabedoria_norm in texto_norm:
        return texto

    return f"{texto}\n\n{sabedoria_texto}".strip()


def _collect_devolutivas(payload) -> list[str]:
    devolutivas = _safe_get(payload, "devolutivas", None) or []
    out = []

    if isinstance(devolutivas, list):
        for d in devolutivas:
            if isinstance(d, str) and d.strip():
                out.append(d.strip())

    return out


def _extract_bloco_nome(payload) -> str:
    return (
        _safe_get(payload, "bloco", None)
        or _safe_get(payload, "blocoTitulo", None)
        or _safe_get(payload, "titulo", None)
        or "este bloco"
    )


def _run_coletor_perfil(payload) -> dict:
    """Coleta o perfil do participante a partir do payload."""
    if not callable(coletar_perfil):
        if _COLETOR_PERFIL_IMPORT_ERROR:
            print(f"[PIPELINE][PERFIL] import ausente: {_COLETOR_PERFIL_IMPORT_ERROR}")
        return {}

    try:
        # coletar_perfil espera um dict com chaves do formulário
        dados_pessoais = _safe_get(payload, "dadosPessoais", None) or {}
        respostas_dict = {
            "nome_participante": _safe_get(payload, "nome", "") or dados_pessoais.get("nomeCompleto", ""),
            "faixa_etaria": dados_pessoais.get("idadeFaixa", ""),
            "identidade_genero": dados_pessoais.get("identidadeGenero", ""),
            "estado_civil": dados_pessoais.get("estadoCivil", ""),
            "situacao_familiar_origem": dados_pessoais.get("situacaoFamiliar", ""),
            "filho_unico": dados_pessoais.get("filhoUnico", ""),
            "condicao_permanente": dados_pessoais.get("condicaoPermanente", ""),
            "condicao_permanente_detalhe": dados_pessoais.get("condicaoPermanenteDetalhe", ""),
            "tradicao_espiritual": dados_pessoais.get("religiao", ""),
            "pratica_espiritual": dados_pessoais.get("praticaEspiritual", ""),
            "momento_emocional_atual": dados_pessoais.get("momentoEmocional", ""),
            "expectativa_jornada": dados_pessoais.get("expectativa", ""),
            "perfilPersonalidade": dados_pessoais.get("perfilPersonalidade", {}) or {},
        }
        
        result = coletar_perfil(respostas_dict)
        # coletar_perfil retorna um PerfilParticipante dataclass
        if hasattr(result, "to_dict"):
            return result.to_dict()
        if isinstance(result, dict):
            return result
        return {}
    except Exception as e:
        print(f"[PIPELINE][PERFIL] falhou: {e}")
        return {}


def _run_motor_emocional(payload, perfil: dict) -> dict:
    """Executa análise emocional das respostas."""
    if not callable(analisar_motor_emocional):
        if _MOTOR_EMOCIONAL_IMPORT_ERROR:
            print(f"[PIPELINE][EMOCIONAL] import ausente: {_MOTOR_EMOCIONAL_IMPORT_ERROR}")
        return {}

    try:
        respostas = _collect_respostas(payload)
        result = analisar_motor_emocional(
            respostas=respostas,
            perfil=perfil or {}
        )
        return result if isinstance(result, dict) else {}
    except Exception as e:
        print(f"[PIPELINE][EMOCIONAL] falhou: {e}")
        return {}


def _run_sabedoria_bloco(payload, guia: str, perfil: dict, emocional: dict):
    """Escolhe um bloco de sabedoria baseado na análise emocional."""
    try:
        emocao = emocional.get("emocao", "apatia") if isinstance(emocional, dict) else "apatia"
        subtipo = emocional.get("subtipo", "geral") if isinstance(emocional, dict) else "geral"
        categoria_prioritaria = "espelhamento" if emocao in {"raiva", "apatia", "medo", "confusao"} else "acolhimento"
        return {
            "categoria_prioritaria": categoria_prioritaria,
            "trecho": escolher_bloco(emocao, subtipo, categoria_prioritaria),
        }
    except Exception as e:
        print(f"[PIPELINE][BLOCO] falhou: {e}")
        return None


def _run_sabedoria_final(payload, guia: str, perfil: dict, emocional: dict):
    """Escolhe sabedoria (bíblica + filosófica) baseada na análise emocional."""
    try:
        emocao = emocional.get("emocao", "apatia") if isinstance(emocional, dict) else "apatia"
        eixos = emocional.get("eixos", {}) if isinstance(emocional, dict) else {}
        religiao = ""
        if isinstance(perfil, dict):
            religiao = perfil.get("tradicao_espiritual", "")
        dados = _safe_get(payload, "dadosPessoais", None)
        if not religiao and isinstance(dados, dict):
            religiao = dados.get("religiao", "")
        # escolher_sabedoria espera (emocao, eixos, religiao, ...)
        return escolher_sabedoria(
            emocao=emocao,
            eixos=eixos,
            religiao=religiao,
            incluir_biblia=True,
            incluir_filosofia=True,
            qtd_filosoficas=1,
        )
    except Exception as e:
        print(f"[PIPELINE][SABEDORIA] falhou: {e}")
        return None


def _compose_text_curto(payload, guia: str, perfil: dict, emocional: dict, sabedoria) -> str:
    """Compõe devolutiva curta usando o compositor integrado."""
    try:
        resposta_texto = _extract_resposta_texto(payload)
        nome = _safe_get(payload, "nome", "Caminhante") or "Caminhante"
        dados = _extract_dados_pessoais(payload)
        religiao = ""
        if isinstance(perfil, dict):
            religiao = perfil.get("tradicao_espiritual", "") or perfil.get("religiao", "")
        if not religiao:
            religiao = dados.get("religiao", "")

        _has_emocional = isinstance(emocional, dict) and bool(emocional)
        sabedorias_externas = []
        sabedoria_texto = _format_sabedoria_texto(sabedoria)
        if sabedoria_texto:
            sabedorias_externas.append(sabedoria_texto)

        resultado = compor_devolutiva_curta(
            resposta=resposta_texto,
            guia=guia,
            nome=nome,
            religiao=religiao,
            dadosPessoais=dados,
            perfil=perfil or dados,
            bloco=_extract_bloco_nome(payload),
            pergunta=_safe_get(payload, "pergunta", "") or "",
            emocao_forcada=(emocional.get("emocao") if _has_emocional else None),
            subtipo_forcado=(emocional.get("subtipo") if _has_emocional else None),
            intensidade_forcada=(emocional.get("intensidade") if _has_emocional else None),
            gatilho_interno_forcado=(emocional.get("gatilho_interno") if _has_emocional else None),
            eixos_forcados=(emocional.get("eixos") if _has_emocional else None),
            sabedorias_externas=sabedorias_externas,
            seed_hint=_make_seed_hint(payload, emocional),
        )
        texto = _extract_text_from_compositor(resultado)
        return _merge_texto_com_sabedoria(texto, sabedoria)
    except Exception as e:
        print(f"[PIPELINE][COMPOSITOR_CURTO] falhou: {e}")
        return _merge_texto_com_sabedoria("", sabedoria)


def _compose_text_longo(payload, guia: str, perfil: dict, emocional: dict, sabedoria) -> str:
    """Compõe devolutiva longa usando o compositor integrado."""
    try:
        resposta_texto = _extract_resposta_texto(payload)
        if not resposta_texto:
            respostas = _safe_get(payload, "respostas", None) or []
            devolutivas = _safe_get(payload, "devolutivas", None) or []
            resposta_texto = "\n".join([str(x) for x in respostas + devolutivas if str(x).strip()]).strip()

        nome = _safe_get(payload, "nome", "Caminhante") or "Caminhante"
        dados = _extract_dados_pessoais(payload)
        religiao = ""
        if isinstance(perfil, dict):
            religiao = perfil.get("tradicao_espiritual", "") or perfil.get("religiao", "")
        if not religiao:
            religiao = dados.get("religiao", "")

        _has_emocional = isinstance(emocional, dict) and bool(emocional)
        sabedorias_externas = []
        sabedoria_texto = _format_sabedoria_texto(sabedoria)
        if sabedoria_texto:
            sabedorias_externas.append(sabedoria_texto)

        resultado = compor_devolutiva(
            resposta=resposta_texto,
            guia=guia,
            nome=nome,
            religiao=religiao,
            dadosPessoais=dados,
            perfil=perfil or dados,
            bloco=_extract_bloco_nome(payload),
            pergunta=_safe_get(payload, "pergunta", "") or "Síntese psicológica, simbólica e existencial",
            sabedorias_externas=sabedorias_externas,
            emocao_forcada=(emocional.get("emocao") if _has_emocional else None),
            subtipo_forcado=(emocional.get("subtipo") if _has_emocional else None),
            intensidade_forcada=(emocional.get("intensidade") if _has_emocional else None),
            gatilho_interno_forcado=(emocional.get("gatilho_interno") if _has_emocional else None),
            eixos_forcados=(emocional.get("eixos") if _has_emocional else None),
            seed_hint=_make_seed_hint(payload, emocional),
        )
        texto = _extract_text_from_compositor(resultado)
        print(f"[PIPELINE][COMPOSITOR_LONGO] texto_len={len(texto)}")
        return _merge_texto_com_sabedoria(texto, sabedoria)
    except Exception as e:
        print(f"[PIPELINE][COMPOSITOR_LONGO] falhou: {e}")
        return _merge_texto_com_sabedoria("", sabedoria)


def _gerar_devolutiva_bloco_biblioteca(payload, guia: str) -> str:
    guia = _normalize_guia_name(guia)

    perfil = _run_coletor_perfil(payload)
    emocional = _run_motor_emocional(payload, perfil)

    if isinstance(perfil, dict) and isinstance(emocional, dict):
        perfil["eixo_existencial"] = emocional.get("eixo_existencial", {}) or {}
        perfil["consciencia_expandida"] = emocional.get("consciencia_expandida", {}) or {}

    sabedoria = _run_sabedoria_bloco(payload, guia, perfil, emocional)
    texto = _compose_text_curto(payload, guia, perfil, emocional, sabedoria)

    print(
        f"[PIPELINE][BLOCO] guia={guia} emocao={(emocional or {}).get('emocao', '') if isinstance(emocional, dict) else ''} "
        f"subtipo={(emocional or {}).get('subtipo', '') if isinstance(emocional, dict) else ''} "
        f"perfil_keys={list(perfil.keys()) if isinstance(perfil, dict) else []} "
        f"emocional_keys={list(emocional.keys()) if isinstance(emocional, dict) else []} "
        f"sabedoria_tipo={type(sabedoria).__name__ if sabedoria is not None else 'None'} "
        f"texto_len={len(texto or '')}"
    )

    return texto


def _gerar_devolutiva_com_biblioteca(payload, guia: str) -> str:
    guia = _normalize_guia_name(guia)
    nucleo = _montar_nucleo_sintese(payload, guia=guia)

    texto = _compose_text_longo(
        payload,
        guia,
        nucleo.get("perfil", {}),
        nucleo.get("emocional", {}),
        nucleo.get("sabedoria_final"),
    )

    if not texto.strip():
        texto = _compor_com_contexto(
            payload,
            resposta_texto=nucleo.get("resposta_texto", ""),
            bloco=nucleo.get("bloco", ""),
            pergunta=nucleo.get("pergunta", ""),
        )

    print(
        f"[PIPELINE][GERAL][NUCLEO] guia={guia} "
        f"temas={nucleo.get('temas_repetidos', [])} "
        f"perfil_keys={list((nucleo.get('perfil') or {}).keys())} "
        f"emocional_keys={list((nucleo.get('emocional') or {}).keys())} "
        f"texto_len={len(texto or '')}"
    )
    return texto


def _gerar_devolutiva_final_com_biblioteca(payload, guia: str) -> str:
    guia = _normalize_guia_name(guia)

    perfil = _run_coletor_perfil(payload)
    emocional = _run_motor_emocional(payload, perfil)

    if isinstance(perfil, dict) and isinstance(emocional, dict):
        perfil["eixo_existencial"] = emocional.get("eixo_existencial", {}) or {}
        perfil["consciencia_expandida"] = emocional.get("consciencia_expandida", {}) or {}

    sabedoria = _run_sabedoria_final(payload, guia, perfil, emocional)
    texto = _compose_text_longo(payload, guia, perfil, emocional, sabedoria)

    print(
        f"[PIPELINE][FINAL] guia={guia} "
        f"perfil_keys={list(perfil.keys()) if isinstance(perfil, dict) else []} "
        f"emocional_keys={list(emocional.keys()) if isinstance(emocional, dict) else []} "
        f"sabedoria_tipo={type(sabedoria).__name__ if sabedoria is not None else 'None'} "
        f"texto_len={len(texto or '')}"
    )

    return texto



def _build_final_local_synthesis(payload, motivo: str = "") -> str:
    """Síntese final local robusta para não entregar encerramento fraco."""
    nome = _safe_get(payload, "nome", "Participante") or "Participante"
    guia = _normalize_guia(_safe_get(payload, "guia", "lumen"))
    idioma = _normalize_idioma(_safe_get(payload, "idioma", "pt-BR"))
    nucleo = _montar_nucleo_sintese(payload, guia=guia)
    dados = nucleo.get("dados_pessoais", {}) if isinstance(nucleo.get("dados_pessoais"), dict) else {}
    perfil_dados = dados.get("perfilPersonalidade", {}) if isinstance(dados.get("perfilPersonalidade"), dict) else {}
    eixo = dados.get("eixoExistencial", {}) if isinstance(dados.get("eixoExistencial"), dict) else {}
    if not isinstance(eixo, dict):
        eixo = {}

    temperamento = perfil_dados.get("temperamento") or dados.get("temperamento") or "não informado"
    comportamento = perfil_dados.get("comportamento") or dados.get("comportamento") or "não informado"
    carater = perfil_dados.get("carater") or perfil_dados.get("caráter") or dados.get("carater") or dados.get("caráter") or "não informado"
    indole = perfil_dados.get("indole") or perfil_dados.get("índole") or dados.get("indole") or dados.get("índole") or "não informado"
    vazio = eixo.get("vazio") or eixo.get("vazioExistencial") or dados.get("vazioExistencial") or dados.get("vazio") or "não informado"
    pleno = eixo.get("pleno") or eixo.get("plenoExistencial") or dados.get("plenoExistencial") or dados.get("pleno") or "não informado"
    religiao = dados.get("religiao") or dados.get("espiritualidade") or ""

    # Português é o fallback principal do projeto. Para outros idiomas, os providers devem responder.
    if idioma != "pt-BR":
        return build_local_fallback_feedback(
            nome=nome,
            guia=guia,
            resposta="\n".join(_collect_respostas(payload)[:8]),
            pergunta="Síntese final da jornada",
            idioma=idioma,
            bloco_nome="Síntese Final",
        )

    referencia = ""
    if religiao:
        referencia = "Como eco espiritual, a travessia lembra que a luz não elimina a noite de uma vez, mas ensina o coração a caminhar sem se entregar a ela."
    else:
        referencia = "Como lembraria a filosofia antiga, uma vida examinada não é uma vida parada: é uma vida que começa a reconhecer a própria direção."

    return _finalize_devolutiva_text(f"""
{nome}, ao concluir esta jornada, o que aparece não é apenas uma soma de respostas, mas um mapa vivo da sua forma de sentir, resistir, sonhar e tentar continuar. Há sinais de que sua história carrega uma tensão entre aquilo que pesa por dentro e aquilo que ainda deseja florescer, e essa tensão não deve ser lida como fracasso, mas como chamado de reorganização interior. Quando cruzamos seus pilares de personalidade, o temperamento aponta para impulsos e sensibilidades que precisam ser acolhidos; o comportamento revela como esses impulsos aparecem no mundo; o caráter mostra quais valores tentam permanecer de pé sob pressão; e a índole indica a inclinação profunda que ainda busca coerência com o bem. O vazio existencial declarado — {vazio} — parece mostrar onde a alma se sente esvaziada, cansada ou distante de si mesma. O pleno existencial — {pleno} — aponta a direção contrária: não como mágica, mas como construção possível, passo por passo, escolha por escolha. {referencia} Também se percebe que nem toda relação, hábito ou pensamento que acompanha você merece continuar recebendo o mesmo espaço; algumas presenças fortalecem, outras drenam, e parte da maturidade está em discernir essa diferença sem culpa. Sua travessia pede menos autopunição e mais responsabilidade amorosa: olhar para o que dói, reconhecer sua participação no que precisa mudar e proteger aquilo que ainda carrega vida. Se houve medo, dúvida ou fragilidade, eles não anulam sua capacidade de recomeço; apenas mostram onde a sua coragem precisa ser tratada com mais verdade. A partir daqui, a missão não é provar força o tempo todo, mas cultivar direção, limite, fé no possível e pequenos atos de reconstrução diária. Que esta devolutiva final não seja um ponto final, mas uma chave: volte ao que você respondeu, perceba os padrões, honre as sementes boas e decida com mais consciência o que não pode mais governar sua caminhada. Para além. E sempre.
""")


def _coletar_devolutiva_final_do_payload_pdf(payload) -> str:
    """Extrai a devolutiva final do PDF mesmo quando o frontend envia com nomes diferentes."""
    candidatos = [
        _safe_get(payload, "devolutivaFinal", None),
        _safe_get(payload, "devolutiva_final", None),
        _safe_get(payload, "mensagemFinal", None),
        _safe_get(payload, "mensagem_final", None),
        _safe_get(payload, "textoFinal", None),
        _safe_get(payload, "finalText", None),
        _safe_get(payload, "devolutiva", None),
    ]
    for item in candidatos:
        txt = limpar_formatacao(str(item or ""))
        if txt:
            return txt

    devs = _safe_get(payload, "devolutivas", None) or []
    if isinstance(devs, list):
        txt = "\n\n".join(limpar_formatacao(str(item)) for item in devs if limpar_formatacao(str(item)))
        if txt:
            return txt

    # Compatibilidade: se o PDF recebeu blocos com devolutivas, mas não recebeu devolutivaFinal.
    blocos = _safe_get(payload, "blocos", None) or []
    blocos_devs = []
    if isinstance(blocos, list):
        for bloco in blocos:
            dev_bloco = _safe_get(bloco, "devolutiva", None)
            if limpar_formatacao(str(dev_bloco or "")):
                blocos_devs.append(limpar_formatacao(str(dev_bloco)))
            perguntas = _safe_get(bloco, "perguntas", None) or []
            if isinstance(perguntas, list):
                for item in perguntas:
                    dev_item = _safe_get(item, "devolutiva", None)
                    if limpar_formatacao(str(dev_item or "")):
                        blocos_devs.append(limpar_formatacao(str(dev_item)))
    if blocos_devs:
        return _build_final_local_synthesis(payload, motivo="pdf_sem_devolutiva_final")

    return ""

# -----------------------------
# Devolutiva simples por BLOCO
# -----------------------------
    
@app.post("/api/jornada/devolutiva-bloco")
@app.post("/jornada/devolutiva-bloco")
async def jornada_devolutiva_bloco(payload: DevolutivaBlocoPayload):
    payload.guia = _normalize_guia(payload.guia)
    payload.idioma = _normalize_idioma(payload.idioma)

    if not payload.respostas:
        raise HTTPException(status_code=400, detail="Envie respostas do bloco para gerar a devolutiva")

    resultado = await gerar_devolutiva_bloco_real(payload)
    
    return {
        "ok": resultado["ok"],
        "guia": payload.guia,
        "idioma": payload.idioma,
        "texto": resultado["texto"],
        "devolutivaFinal": resultado["texto"],
        "provider": resultado["provider"],
        "source": resultado["source"],
        "fallback": resultado["fallback"],
        "fallbackUsed": resultado["fallbackUsed"],
        "erros": resultado.get("erros", []),
    }



# -----------------------------
# Devolutiva final por guia
# -----------------------------

async def _gerar_devolutiva_final_lumen(payload: DevolutivaFinalPayload) -> str:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()

    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY não configurada")

    model = (os.getenv("OPENAI_MODEL") or "gpt-4o-mini").strip()

    print(f"[LUMEN FINAL] model={model} idioma={payload.idioma} nome={payload.nome}")

    return await _chat_completion_direct(
        api_key=api_key,
        model=model,
        system_prompt=_build_lumen_final_system_prompt(),
        user_prompt=_build_final_payload_prompt(payload),
        base_url="https://api.openai.com/v1/chat/completions",
        timeout=60.0,
    )

async def _gerar_devolutiva_final_zion(payload: DevolutivaFinalPayload) -> str:
    api_key = (os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY") or "").strip()

    if not api_key:
        raise HTTPException(status_code=500, detail="GROK_API_KEY/XAI_API_KEY não configurada")

    model = (os.getenv("GROK_MODEL") or os.getenv("XAI_MODEL") or "grok-2-latest").strip()

    print(f"[ZION FINAL] model={model} idioma={payload.idioma} nome={payload.nome}")

    system_prompt = _build_zion_final_system_prompt()
    user_prompt = _build_final_payload_prompt(payload)

    url = "https://api.x.ai/v1/chat/completions"

    body = {
        "model": model,
        "temperature": 0.85,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json=body
            )
    except Exception as e:
        print(f"[ZION FINAL][HTTP ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Falha de conexão Grok/xAI final: {e}")

    if resp.status_code >= 400:
        print(f"[ZION FINAL][BAD RESPONSE] status={resp.status_code} body={resp.text}")
        raise HTTPException(status_code=500, detail=f"Erro Grok/xAI final: {resp.text}")

    data = resp.json()

    try:
        text = data["choices"][0]["message"]["content"].strip()
    except Exception:
        print(f"[ZION FINAL][INVALID RESPONSE] {data}")
        raise HTTPException(status_code=500, detail="Resposta inválida do Grok/xAI final")

    if not text:
        raise HTTPException(status_code=500, detail="Grok/xAI final retornou texto vazio")

    return text

async def _gerar_devolutiva_final_arian(payload: DevolutivaFinalPayload) -> str:
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()

    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY não configurada")

    model = (os.getenv("GEMINI_MODEL") or "gemini-1.5-flash").strip()

    print(f"[ARIAN FINAL] model={model} idioma={payload.idioma} nome={payload.nome}")

    system_prompt = _build_arian_final_system_prompt()
    user_prompt = _build_final_payload_prompt(payload)

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    body = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": f"{system_prompt}\n\n{user_prompt}"
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.85,
            "maxOutputTokens": 1400
        }
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                json=body
            )
    except Exception as e:
        print(f"[ARIAN FINAL][HTTP ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Falha de conexão Gemini final: {e}")

    if resp.status_code >= 400:
        print(f"[ARIAN FINAL][BAD RESPONSE] status={resp.status_code} body={resp.text}")
        raise HTTPException(status_code=500, detail=f"Erro Gemini final: {resp.text}")

    data = resp.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception:
        print(f"[ARIAN FINAL][INVALID RESPONSE] {data}")
        raise HTTPException(status_code=500, detail="Resposta inválida do Gemini final")

    if not text:
        raise HTTPException(status_code=500, detail="Gemini final retornou texto vazio")

    return text

# -----------------------------
# Health
# -----------------------------
    
@app.get("/")
def root():
    return {"ok": True, "service": APP_TITLE, "version": APP_VERSION}


@app.get("/healthz")
@app.get("/api/healthz")
def healthz():
    return {"ok": True}


# -----------------------------
# fallback para Lumen
# -----------------------------

import re
import traceback

def _texto_valido_fallback_lumen(txt: str, min_chars: int = 140, min_sentences: int = 2) -> bool:
    if not txt:
        return False
    clean = " ".join(str(txt).split()).strip()
    if len(clean) < min_chars:
        return False
    sentencas = [s.strip() for s in re.split(r'[.!?…]+', clean) if s.strip()]
    if len(sentencas) < min_sentences:
        return False
    return True


def _normalizar_guia_backend(raw: str) -> str:
    g = str(raw or "lumen").strip().lower()
    if g in ("arion", "ariane"):
        return "arian"
    if "arian" in g or "arion" in g:
        return "arian"
    if "zion" in g:
        return "zion"
    if "lumen" in g:
        return "lumen"
    return "lumen"


@app.post("/api/jornada/devolutiva")
@app.post("/api/jornada/devolutiva/")
@app.post("/jornada/devolutiva")
async def jornada_devolutiva(payload: DevolutivaPayload):
    payload.guia = normalizeguia(payload.guia)
    payload.idioma = normalizeidioma(payload.idioma)

    print(
        f"[DEVOLUTIVA][IN] "
        f"guia={payload.guia} "
        f"idioma={payload.idioma} "
        f"nome={payload.nome!r} "
        f"bloco={getattr(payload, 'bloco', '')!r} "
        f"pergunta={payload.pergunta!r} "
        f"resposta_chars={len((payload.resposta or '').strip())}"
    )

    try:
        dados = payload.dadosPessoais or {}
        perfil = dados.get("perfilPersonalidade") if isinstance(dados, dict) else {}
        religiao = ""
        if isinstance(dados, dict):
            religiao = (
                dados.get("religiao")
                or dados.get("tradicaoEspiritual")
                or dados.get("tradicao_espiritual")
                or ""
            )

        resultado = compordevolutiva(
            resposta=payload.resposta,
            guia=payload.guia,
            nome=payload.nome,
            religiao=religiao,
            dadosPessoais=dados,
            perfil=perfil if isinstance(perfil, dict) else {},
            bloco=getattr(payload, "bloco", "") or "",
            pergunta=payload.pergunta,
        )

        texto = (resultado.get("texto") or "").strip()
        emocao = resultado.get("emocao")
        subtipo = resultado.get("subtipo")
        intensidade = resultado.get("intensidade")
        devolutiva_id = resultado.get("devolutiva_id")
        metadados = resultado.get("metadados") or {}
        padrao_detectado = resultado.get("padrao_detectado")

        print(
            f"[DEVOLUTIVA][OUT] "
            f"guia={payload.guia} "
            f"idioma={payload.idioma} "
            f"emocao={emocao} "
            f"subtipo={subtipo} "
            f"intensidade={intensidade} "
            f"devolutiva_id={devolutiva_id} "
            f"chars={len(texto)} "
            f"metadados_keys={list(metadados.keys()) if isinstance(metadados, dict) else []} "
            f"padrao_detectado={'sim' if padrao_detectado else 'nao'}"
        )

        return {
            "ok": True,
            "guia": payload.guia,
            "idioma": payload.idioma,
            "texto": texto,
            "devolutivaFinal": texto,
            "emocao": emocao,
            "subtipo": subtipo,
            "intensidade": intensidade,
            "devolutiva_id": devolutiva_id,
            "metadados": metadados,
            "padrao_detectado": padrao_detectado,
            "source": "compositor_devolutiva",
            "provider": "compositor_devolutiva",
            "fallback": False,
            "fallbackUsed": False,
        }

    except Exception as e:
        print(f"[DEVOLUTIVA][ERRO] guia={payload.guia} idioma={payload.idioma} erro={repr(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar devolutiva: {e}")


@app.post("/jornada/devolutiva-feedback")
async def registrar_feedback_devolutiva(payload: FeedbackDevolutivaPayload):
    try:
        if _CALIBRADOR_FEEDBACK is None:
            return {
                "ok": False,
                "message": "Calibrador de feedback indisponível no ambiente.",
            }

        pesos = _CALIBRADOR_FEEDBACK.aplicar_feedback(
            usuario_id=payload.usuario_id,
            devolutiva_id=payload.devolutiva_id,
            positivo=payload.positivo,
        )

        return {
            "ok": True,
            "usuario_id": payload.usuario_id,
            "devolutiva_id": payload.devolutiva_id,
            "positivo": payload.positivo,
            "pesos_atualizados": pesos,
        }

    except Exception as e:
        print(f"[FEEDBACK_DEVOLUTIVA][ERRO] {repr(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao registrar feedback: {e}")


@app.post("/api/jornada/essencial/pdf")
@app.post("/jornada/essencial/pdf")
@app.post("/api/jornada/pdf")
@app.post("/jornada/pdf")
@app.post("/api/jornada-essencial/pdf")
@app.post("/jornada-essencial/pdf")
@app.post("/api/pdf")
@app.post("/pdf")
@app.post("/api/gerar-pdf")
@app.post("/api/gerar-pdf")
async def gerar_pdf_jornada(payload: PDFPayload):

    try:

        payload.guia = _normalize_guia(
            payload.guia
        )

        payload.idioma = _normalize_idioma(
            payload.idioma
        )

        print("[PDF] recebendo payload...")

        pdf_bytes = _build_pdf_bytes(payload)

        # =====================================================
        # ENVIO AUTOMÁTICO DO PDF POR EMAIL
        # =====================================================

        try:

            await enviar_email_jornada(

                email=payload.email,

                nome=payload.nome,

                pdf_bytes=pdf_bytes

            )

        except Exception as e:

            print(
                f"[EMAIL][ERRO] {str(e)}"
            )

        filename = _safe_filename(

            payload.nome,

            payload.guia

        )

        print(
            "[PDF] gerado com sucesso",
            filename
        )

        return StreamingResponse(

            io.BytesIO(pdf_bytes),

            media_type="application/pdf",

            headers={
                "Content-Disposition":
                f'attachment; filename="{filename}"'
            }

        )

    except HTTPException:
        raise

    except Exception as e:

        print(f"[PDF][ERRO] {repr(e)}")

        raise HTTPException(

            status_code=500,

            detail=f"Erro ao gerar PDF: {e}"

        )


# -----------------------------
# Devolutiva simples por BLOCO
# -----------------------------
@app.post("/api/jornada/devolutiva-final")
@app.post("/jornada/devolutiva-final")
async def jornadadevolutivafinal(payload: DevolutivaFinalPayload):
    guia = _normalize_guia(payload.guia)
    payload.idioma = _normalize_idioma(payload.idioma)

    if not payload.respostas and not payload.devolutivas:
        raise HTTPException(
            status_code=400,
            detail="Envie ao menos respostas ou devolutivas para gerar a síntese final."
        )

    try:
        texto = ""
        provider_usado = "compositorfinal"

        # 1) PRIORIDADE TOTAL: biblioteca/compositor integrado
        if _should_use_library_pipeline(payload.idioma):
            texto = _gerar_devolutiva_final_com_biblioteca(payload, guia)
            texto = _finalize_devolutiva_text(texto)

            if texto and not _response_language_matches(texto, payload.idioma, strict=False):
                print("[DEVOLUTIVA_FINAL][IDIOMA] biblioteca retornou idioma desalinhado; forçando fallback IA")
                texto = ""

        # 2) FALLBACK: provider direto respeitando o guia
        if not texto:
            print(f"[DEVOLUTIVA_FINAL][FALLBACK] usando provedor direto para guia={guia} idioma={payload.idioma}")

            if guia == "lumen":
                texto = await _gerar_devolutiva_final_lumen(payload)
                provider_usado = "lumen"

            elif guia == "zion":
                try:
                    texto = await _gerar_devolutiva_final_zion(payload)
                    provider_usado = "zion"
                except Exception as e:
                    print(f"[DEVOLUTIVA_FINAL][FALLBACK] zion falhou: {e}")
                    texto = await _gerar_devolutiva_final_lumen(payload)
                    guia = "lumen"
                    provider_usado = "lumen"

            else:
                try:
                    texto = await _gerar_devolutiva_final_arian(payload)
                    provider_usado = "arian"
                except Exception as e:
                    print(f"[DEVOLUTIVA_FINAL][FALLBACK] arian falhou: {e}")
                    texto = await _gerar_devolutiva_final_lumen(payload)
                    guia = "lumen"
                    provider_usado = "lumen"

        texto = _finalize_devolutiva_text(texto)

        if not _texto_valido(texto, min_chars=900, min_sentences=8):
            print(f"[DEVOLUTIVA_FINAL][FRACA] chars={len(texto or '')}; usando sintese local robusta")
            texto = _build_final_local_synthesis(payload, motivo="provider_fraco")
            provider_usado = "local_final_synthesis"

        return {
            "ok": True,
            "guia": guia,
            "devolutivaFinal": texto,
            "texto": texto,
            "provider": provider_usado,
            "source": provider_usado,
            "fallback": provider_usado != "compositorfinal",
            "fallbackUsed": provider_usado != "compositorfinal",
            "idioma": payload.idioma,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[DEVOLUTIVA_FINAL][ERRO] {repr(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro na devolutiva final: {e}"
        )

# -----------------------------
# Devolutiva final da jornada
# -----------------------------

@app.post("/legacy/jornada/devolutiva-bloco")
async def gerar_devolutiva_bloco(payload: dict):
    """
    Gera devolutiva para um bloco específico da jornada
    """

    try:

        nome = payload.get("nome", "Buscador")
        guia = payload.get("guia", "lumen")
        respostas = payload.get("respostas", [])
        bloco = payload.get("blocoTitulo", "este bloco")

        prompt = f"""
Você é o guia espiritual da Jornada Conhecimento com Luz.

O participante {nome} acabou de concluir o bloco {bloco}.

Respostas dele neste bloco:
{chr(10).join(respostas)}

REGRAS ABSOLUTAS PARA A DEVOLUTIVA FINAL:

NÃO citar literalmente:
- idade ou faixa etária
- cidade
- estado
- profissão
- aposentadoria
- estado civil
- filhos
- temperamento
- comportamento
- caráter
- índole
- Tânatos
- Eros
- percentuais
- nomes técnicos do motor

Use tudo isso apenas como leitura silenciosa.

Errado:
"você com 45 a 59 anos, divorciado, aposentado, morando em Guarulhos..."

Correto:
"há sinais de que sua vida atravessa responsabilidades acumuladas, mudanças afetivas e um cansaço que pede cuidado."

A devolutiva final deve ser uma síntese das devolutivas dos blocos, não uma ficha cadastral comentada.

Escreva uma devolutiva curta (4 a 6 linhas) analisando
a essência das respostas e oferecendo encorajamento e reflexão.

Tom:
- acolhedor
- inspirador
- espiritual
- sem exagero místico
"""

        from google.generativeai import GenerativeModel
        model = GenerativeModel("gemini-2.5-flash")

        resp = model.generate_content(prompt)

        texto = resp.text.strip()

        return {
            "ok": True,
            "guia": guia,
            "devolutivaBloco": texto
        }

    except Exception as e:

        print("[API] erro devolutiva bloco:", e)

        return {
            "ok": False,
            "error": str(e)
        }

# -----------------------------
# Existing proxy endpoints (mantidos)
# -----------------------------

async def proxy_request(request: Request, base_url: str, path: str):
    async with httpx.AsyncClient(timeout=60.0) as client:
        method = request.method
        headers = dict(request.headers)
        headers.pop("host", None)

        body = await request.body()

        resp = await client.request(
            method,
            base_url + path,
            headers=headers,
            content=body,
            params=dict(request.query_params),
        )

        content_type = resp.headers.get("content-type", "")
        if "application/json" in content_type:
            return JSONResponse(status_code=resp.status_code, content=resp.json())
        return JSONResponse(status_code=resp.status_code, content={"text": resp.text})


ZION_BASE = os.getenv("ZION_BASE", "https://api.openai.com")
ARIAN_BASE = os.getenv("ARIAN_BASE", "https://api.openai.com")


@app.api_route("/proxy/zion/v1/chat", methods=["GET", "POST"])
async def proxy_zion_v1_chat(request: Request):
    return await proxy_request(request, ZION_BASE, "/v1/chat")


@app.api_route("/proxy/zion/chat/completions", methods=["GET", "POST"])
@app.api_route("/proxy/zion/v1/chat/completions", methods=["GET", "POST"])
async def proxy_zion_chat_completions(request: Request):
    return await proxy_request(request, ZION_BASE, "/v1/chat/completions")


@app.api_route("/proxy/zion/v1/completions", methods=["GET", "POST"])
async def proxy_zion_completions(request: Request):
    return await proxy_request(request, ZION_BASE, "/v1/completions")


@app.api_route("/proxy/arian/v1/chat", methods=["GET", "POST"])
async def proxy_arian_v1_chat(request: Request):
    return await proxy_request(request, ARIAN_BASE, "/v1/chat")


@app.api_route("/proxy/arian/chat/completions", methods=["GET", "POST"])
@app.api_route("/proxy/arian/v1/chat/completions", methods=["GET", "POST"])
async def proxy_arian_chat_completions(request: Request):
    return await proxy_request(request, ARIAN_BASE, "/v1/chat/completions")


@app.api_route("/proxy/arian/v1/completions", methods=["GET", "POST"])
async def proxy_arian_completions(request: Request):
    return await proxy_request(request, ARIAN_BASE, "/v1/completions")
