from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, UploadFile

app = FastAPI(title="VoiceBox API", version="0.1.0")

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB for initial testing

ALLOWED_TYPES = {
    "video/mp4", "video/webm", "video/quicktime",
    "audio/mpeg", "audio/wav", "audio/x-wav",
    "application/pdf", "text/plain",
    "image/jpeg", "image/png", "image/webp",
}

@app.get("/health")
def health():
    return {"status": "ok", "service": "voicebox-api"}

@app.post("/api/uploads")
async def upload_file(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="File type not supported yet")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid4())
    suffix = Path(file.filename or "").suffix[:12]
    destination = UPLOAD_DIR / f"{file_id}{suffix}"
    size = 0

    try:
        with destination.open("xb") as output:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_FILE_SIZE:
                    raise HTTPException(status_code=413, detail="Initial test limit is 100 MB")
                output.write(chunk)
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise
    except Exception:
        destination.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail="Upload failed")
    finally:
        await file.close()

    return {
        "id": file_id,
        "filename": Path(file.filename or "upload").name,
        "content_type": file.content_type,
        "size_bytes": size,
        "storage": "temporary-local-test",
    }
