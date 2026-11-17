import io
import logging
from typing import Tuple
from pypdf import PdfReader

logger = logging.getLogger("document_service")


def extract_text_from_file(content_bytes: bytes, filename: str) -> Tuple[str, str]:
    """
    Extract text content from uploaded file bytes (PDF or plain text).
    Returns (extracted_text, document_type).
    """
    lower_filename = filename.lower()

    if lower_filename.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(content_bytes))
            text_pages = []
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text()
                if page_text:
                    text_pages.append(page_text.strip())

            extracted = "\n\n".join(text_pages).strip()
            return extracted, "pdf"
        except Exception as e:
            logger.error(f"Error reading PDF file {filename}: {str(e)}")
            raise ValueError(f"Could not read PDF file: {str(e)}")

    elif lower_filename.endswith(".txt") or lower_filename.endswith(".md"):
        try:
            return content_bytes.decode("utf-8", errors="replace").strip(), "text"
        except Exception as e:
            logger.error(f"Error reading text file {filename}: {str(e)}")
            raise ValueError(f"Could not read text file: {str(e)}")

    else:
        try:
            return content_bytes.decode("utf-8", errors="replace").strip(), "text"
        except Exception as e:
            logger.error(f"Error reading document {filename}: {str(e)}")
            raise ValueError(f"Unsupported file format: {filename}")
