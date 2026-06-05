import re
import traceback

import pytesseract
from PIL import Image
import structlog

from app.models.schemas import OCRResult, OCRTaskPayload

logger = structlog.get_logger()

class OCRService:
    def process_document(self, payload: OCRTaskPayload) -> OCRResult:
        """
        Process the document using Tesseract OCR and extract fields via Regex.
        In a real scenario, we'd fetch the file from MinIO using payload.document_id.
        For this prototype, we'll simulate the OCR extraction since we can't easily 
        fetch files from MinIO without the full MinIO setup and object keys.
        """
        logger.info("starting_ocr_processing", task_id=str(payload.task_id), document_id=str(payload.document_id))
        
        try:
            # 1. Fetch file from MinIO (Mocked for now)
            # image = Image.open("path_to_downloaded_file.jpg")
            
            # 2. Perform OCR
            # raw_text = pytesseract.image_to_string(image, lang="ara+eng")
            
            # Mocked OCR Text (Simulating what Tesseract might output for an Arabic transcript)
            raw_text = """
            جامعة العلوم والتكنولوجيا
            الاسم: محمد أحمد عبدالله
            التخصص: هندسة البرمجيات
            الرقم الجامعي: 20231055
            المعدل التراكمي: 3.85
            التقدير العام: ممتاز
            """
            
            # 3. Extract Fields via Regex
            extracted_data = self._extract_fields(raw_text)
            
            # 4. Calculate Confidence (Mocked)
            confidence = 0.88 if extracted_data.get("gpa") else 0.45
            needs_review = confidence < 0.80

            return OCRResult(
                task_id=payload.task_id,
                extracted_data=extracted_data,
                confidence_score=confidence,
                raw_text=raw_text,
                needs_review=needs_review,
                error_message=None
            )

        except Exception as e:
            logger.error("ocr_processing_failed", error=str(e), trace=traceback.format_exc())
            return OCRResult(
                task_id=payload.task_id,
                extracted_data={},
                confidence_score=0.0,
                raw_text="",
                needs_review=True,
                error_message=str(e)
            )

    def _extract_fields(self, text: str) -> dict:
        """Extract structured fields using Regex."""
        data = {
            "student_name": None,
            "university": None,
            "gpa": None,
            "raw_fields": {}
        }
        
        # Extract GPA (looks for 'المعدل التراكمي' followed by a number)
        gpa_match = re.search(r"المعدل\s*التراكمي\s*[:\-]?\s*(\d+\.\d+|\d+)", text)
        if gpa_match:
            try:
                data["gpa"] = float(gpa_match.group(1))
            except ValueError:
                pass
                
        # Extract Name (looks for 'الاسم' followed by words)
        name_match = re.search(r"الاسم\s*[:\-]?\s*([\u0600-\u06FF\s]+)", text)
        if name_match:
            # Clean up trailing newlines or extra spaces
            data["student_name"] = name_match.group(1).strip().split('\n')[0]
            
        # Extract University (looks for 'جامعة' followed by words)
        uni_match = re.search(r"(جامعة\s+[\u0600-\u06FF\s]+)", text)
        if uni_match:
            data["university"] = uni_match.group(1).strip().split('\n')[0]
            
        return data

ocr_service = OCRService()
