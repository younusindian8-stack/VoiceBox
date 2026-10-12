from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="VoiceBox API", version="0.2.0")
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
MAX_FILE_SIZE = 100 * 1024 * 1024

ALLOWED_TYPES = {
    "video/mp4", "video/webm", "video/quicktime",
    "audio/mpeg", "audio/wav", "audio/x-wav",
    "audio/mp4", "audio/ogg", "audio/webm",
    "application/pdf", "text/plain",
    "image/jpeg", "image/png", "image/webp"
}

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.get("/health")
def health():
    return {"status": "ok", "service": "voicebox-api"}

@app.get("/api/uploads")
def list_uploads():
    items = []
    for p in sorted(UPLOAD_DIR.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.is_file() and not p.name.startswith("."):
            items.append({
                "id": p.stem,
                "filename": p.name,
                "size_bytes": p.stat().st_size,
                "url": f"/uploads/{p.name}"
            })
    return {"items": items, "count": len(items)}

@app.post("/api/uploads")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, "यह फ़ाइल प्रकार समर्थित नहीं है।")
    destination = UPLOAD_DIR / f"{uuid4().hex}{Path(file.filename or 'upload').suffix[:12]}"
    size = 0
    try:
        with destination.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(413, "फ़ाइल 100 MB से बड़ी है।")
                out.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    return {
        "id": destination.stem,
        "filename": file.filename or "upload",
        "content_type": file.content_type,
        "size_bytes": size,
        "url": f"/uploads/{destination.name}"
    }

from pydantic import BaseModel
from deep_translator import GoogleTranslator
import asyncio

class TranslateRequest(BaseModel):
    text: str
    target_language: str = "hi"

@app.post("/api/translate")
async def translate_text(request: TranslateRequest):
    text = request.text.strip()
    if not text:
        raise HTTPException(400, "अनुवाद के लिए टेक्स्ट खाली है।")
    try:
        translated = await asyncio.to_thread(
            GoogleTranslator(source="auto", target=request.target_language).translate,
            text
        )
        return {
            "original_text": text,
            "translated_text": translated,
            "target_language": request.target_language
        }
    except Exception as exc:
        raise HTTPException(502, "अनुवाद नहीं हो सका। भाषा और इंटरनेट कनेक्शन जाँचें।")

@app.post("/api/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if not (file.content_type or "").startswith("audio/"):
        raise HTTPException(415, "कृपया ऑडियो फ़ाइल अपलोड करें।")

    import tempfile
    from faster_whisper import WhisperModel

    suffix = Path(file.filename or "audio.wav").suffix or ".wav"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp_path = Path(temp.name)
            size = 0
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(413, "फ़ाइल 100 MB से बड़ी है।")
                temp.write(chunk)

        def run_transcription():
            model = WhisperModel("base", device="cpu", compute_type="int8")
            segments, info = model.transcribe(str(temp_path), vad_filter=True)
            return {
                "text": " ".join(segment.text.strip() for segment in segments),
                "detected_language": info.language
            }

        result = await asyncio.to_thread(run_transcription)
        return result
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(500, "ऑडियो पहचान नहीं हो सकी।")
    finally:
        if temp_path:
            temp_path.unlink(missing_ok=True)
        await file.close()


@app.post("/api/extract-pdf")
async def extract_pdf(file: UploadFile = File(...)):
    import io
    from pypdf import PdfReader

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=415, detail="Please upload a PDF file")

    try:
        raw = await file.read(MAX_FILE_SIZE + 1)
        if len(raw) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail="PDF exceeds 100 MB limit")

        reader = PdfReader(io.BytesIO(raw))
        text = "\\n".join(page.extract_text() or "" for page in reader.pages).strip()

        if not text:
            raise HTTPException(status_code=422, detail="No readable text found in PDF")

        return {"text": text, "pages": len(reader.pages)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Could not read this PDF") from exc
    finally:
        await file.close()
