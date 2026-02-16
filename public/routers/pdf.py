from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from io import BytesIO
import base64
import re

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

try:
    from PIL import Image
    PIL_OK = True
except Exception:
    PIL_OK = False


router = APIRouter(prefix="/api", tags=["pdf"])


class PDFPayload(BaseModel):
    nome: str = Field(default="PARTICIPANTE")
    guia: str = Field(default="lumen")
    respostas: List[str] = Field(default_factory=list)
    selfieCard: Optional[str] = None  # base64 (dataURL ou puro)


def _clean_b64(data: str) -> str:
    # aceita "data:image/png;base64,...." ou só base64 puro
    if not data:
        return ""
    return re.sub(r"^data:image\/[a-zA-Z0-9.+-]+;base64,", "", data).strip()


@router.post("/jornada/essencial/pdf")
def gerar_pdf_jornada(payload: PDFPayload):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    w, h = A4

    margin_x = 18 * mm
    y = h - 20 * mm

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(margin_x, y, "Jornada Essencial — Respostas")
    y -= 10 * mm

    c.setFont("Helvetica", 11)
    c.drawString(margin_x, y, f"Nome: {payload.nome}")
    y -= 6 * mm
    c.drawString(margin_x, y, f"Guia: {payload.guia}")
    y -= 10 * mm

    # SelfieCard (opcional)
    if payload.selfieCard and PIL_OK:
        try:
            img_bytes = base64.b64decode(_clean_b64(payload.selfieCard))
            im = Image.open(BytesIO(img_bytes)).convert("RGB")

            # encaixar num bloco 70mm x 90mm (aprox)
            max_w = 70 * mm
            max_h = 90 * mm
            iw, ih = im.size
            scale = min(max_w / iw, max_h / ih)
            dw, dh = iw * scale, ih * scale

            img_buf = BytesIO()
            im.save(img_buf, format="JPEG", quality=90)
            img_buf.seek(0)

            c.drawInlineImage(img_buf, margin_x, y - dh, width=dw, height=dh)
            y -= (dh + 10 * mm)
        except Exception:
            # se falhar, segue sem imagem
            pass

    # Respostas
    c.setFont("Helvetica-Bold", 12)
    c.drawString(margin_x, y, "Respostas:")
    y -= 8 * mm

    c.setFont("Helvetica", 11)

    def new_page():
        nonlocal y
        c.showPage()
        y = h - 20 * mm
        c.setFont("Helvetica", 11)

    if not payload.respostas:
        c.drawString(margin_x, y, "(Nenhuma resposta recebida)")
        y -= 6 * mm
    else:
        for i, resp in enumerate(payload.respostas, start=1):
            text = (resp or "").strip()
            if not text:
                text = "(vazio)"

            # número
            if y < 30 * mm:
                new_page()

            c.setFont("Helvetica-Bold", 11)
            c.drawString(margin_x, y, f"{i}.")
            c.setFont("Helvetica", 11)

            # quebra de linha simples
            y -= 5 * mm
            wrap_width = int((w - 2 * margin_x) / 5.2)  # heurística de caracteres por linha

            words = text.split()
            line = ""
            lines = []
            for wd in words:
                test = (line + " " + wd).strip()
                if len(test) <= wrap_width:
                    line = test
                else:
                    lines.append(line)
                    line = wd
            if line:
                lines.append(line)

            for ln in lines:
                if y < 20 * mm:
                    new_page()
                c.drawString(margin_x + 8 * mm, y, ln)
                y -= 5 * mm

            y -= 4 * mm  # respiro entre respostas

    c.save()
    buffer.seek(0)

    filename = "jornada-respostas.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
