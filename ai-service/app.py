from fastapi import FastAPI, UploadFile, File
from services.ocr import extract_text_from_pdf
from services.ai_parser import parse_invoice
from services.validator import validate_invoice
import os
import shutil

app = FastAPI(
    title="VyaaparBill AI Service",
    description="AI Microservice for Invoice Processing",
    version="1.0"
)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.get("/")
def root():
    return {
        "message": "AI Service Running"
    }


@app.post("/upload")
async def upload_invoice(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text_from_pdf(file_path)

    try:

        invoice = parse_invoice(text)
        print(invoice)
        invoice = validate_invoice(invoice)

        return {
            "message": "Invoice parsed successfully",
            "invoice": invoice
        }

    except Exception as e:

        return {
            "message": "Invoice parsing failed",
            "error": str(e)
        }