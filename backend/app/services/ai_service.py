import json
import logging
import os
import re
from typing import Any, AsyncGenerator, Dict, List, Optional
from app.config import get_settings

logger = logging.getLogger("ai_service")

# Fallback models in priority order
PRIMARY_FALLBACK_MODEL = "gemini-3.1-flash-lite"
SECONDARY_FALLBACK_MODEL = "gemini-3.5-flash-lite"


class AIServiceError(Exception):
    """Structured exception for AI service operations."""
    def __init__(self, message: str, status_code: int = 503, error_type: str = "ai_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_type = error_type


def get_configured_api_key() -> str:
    """Retrieve Gemini API key from settings or environment without logging secrets."""
    settings = get_settings()
    api_key = (settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")).strip()
    if not api_key or api_key == "your_gemini_api_key_here":
        from dotenv import load_dotenv
        load_dotenv(".env")
        load_dotenv("backend/.env")
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()

    if not api_key or api_key == "your_gemini_api_key_here":
        return ""
    return api_key


def get_genai_client(api_key_override: Optional[str] = None, timeout_ms: int = 25000):
    """
    Initialize Google GenAI client with explicit timeout.
    Returns (client, None) or (None, AIServiceError).
    """
    api_key = api_key_override or get_configured_api_key()
    if not api_key:
        return None, AIServiceError(
            message="Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.",
            status_code=401,
            error_type="missing_api_key"
        )

    try:
        from google import genai
        # timeout in HttpOptions is in milliseconds
        client = genai.Client(
            api_key=api_key,
            http_options={"timeout": timeout_ms}
        )
        return client, None
    except Exception as e:
        logger.error(f"Failed to initialize GenAI client: {type(e).__name__}")
        return None, AIServiceError(
            message="Could not initialize Google GenAI client.",
            status_code=500,
            error_type="client_init_error"
        )


def _map_genai_exception(e: Exception, model_name: str) -> AIServiceError:
    """Map Google GenAI SDK and network exceptions into structured AIServiceError without exposing secrets."""
    err_str = str(e)
    err_type = type(e).__name__

    # Sanitize any accidental API key leaks in error strings
    sanitized_msg = re.sub(r'key=[A-Za-z0-9_\-]+', 'key=[REDACTED]', err_str)
    sanitized_msg = re.sub(r'AQ\.[A-Za-z0-9_\-]+', '[REDACTED_KEY]', sanitized_msg)

    # 1. Authentication / Invalid API key
    if "API key not valid" in sanitized_msg or "API_KEY_INVALID" in sanitized_msg or ("400" in sanitized_msg and "key" in sanitized_msg.lower()):
        return AIServiceError(
            message="Invalid Gemini API key. Please verify your GEMINI_API_KEY in backend/.env.",
            status_code=401,
            error_type="invalid_api_key"
        )

    # 2. Model not found or deprecated
    if "404" in sanitized_msg or "not found" in sanitized_msg.lower() or "is no longer available" in sanitized_msg.lower():
        return AIServiceError(
            message=f"Model '{model_name}' is not supported or no longer available for this API key.",
            status_code=400,
            error_type="unsupported_model"
        )

    # 3. High demand / Service unavailable (503)
    if "503" in sanitized_msg or "high demand" in sanitized_msg.lower() or "UNAVAILABLE" in sanitized_msg:
        return AIServiceError(
            message=f"Gemini model '{model_name}' is currently experiencing high demand. Please try again shortly.",
            status_code=503,
            error_type="high_demand"
        )

    # 4. Rate limit / Quota exceeded (429)
    if "429" in sanitized_msg or "RESOURCE_EXHAUSTED" in sanitized_msg or "quota" in sanitized_msg.lower():
        return AIServiceError(
            message="Gemini API rate limit or quota exceeded. Please wait a moment and try again.",
            status_code=429,
            error_type="rate_limited"
        )

    # 5. Client / Network Timeouts
    if "timeout" in err_type.lower() or "timed out" in sanitized_msg.lower() or "ConnectTimeout" in err_type or "ReadTimeout" in err_type:
        return AIServiceError(
            message=f"Gemini API request timed out after 25 seconds for model '{model_name}'. Please try again.",
            status_code=504,
            error_type="timeout"
        )

    # 6. Network connectivity failures
    if "connect" in err_type.lower() or "network" in sanitized_msg.lower() or "connection" in sanitized_msg.lower():
        return AIServiceError(
            message="Network error connecting to Gemini AI service. Please verify server internet connectivity.",
            status_code=503,
            error_type="network_error"
        )

    # 7. Generic fallback
    return AIServiceError(
        message=f"Gemini AI service error ({err_type}). Please try again.",
        status_code=500,
        error_type="generation_error"
    )


def clean_json_text(text: str) -> str:
    """Strip markdown code fence wrappers from JSON text."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _generate_with_fallback(
    prompt: str,
    api_key_override: Optional[str] = None,
    preferred_model: Optional[str] = None
) -> str:
    """
    Execute generation with multi-model fallback.
    Tries preferred model first. If it encounters 503 high demand or 404 not found,
    it falls back immediately to PRIMARY_FALLBACK_MODEL or SECONDARY_FALLBACK_MODEL.
    """
    client, err = get_genai_client(api_key_override=api_key_override)
    if err:
        raise err

    settings = get_settings()
    configured_model = preferred_model or settings.GEMINI_MODEL or PRIMARY_FALLBACK_MODEL

    # Build sequence of models to try (deduplicated)
    models_to_try = [configured_model]
    for fallback in [PRIMARY_FALLBACK_MODEL, SECONDARY_FALLBACK_MODEL]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    last_error: Optional[AIServiceError] = None

    for i, model_name in enumerate(models_to_try):
        try:
            logger.info(f"Attempting Gemini generation using model: {model_name}")
            response = client.models.generate_content(
                model=model_name,
                contents=prompt
            )

            text_output = ""
            if hasattr(response, "text") and response.text:
                text_output = response.text.strip()
            elif hasattr(response, "output_text") and response.output_text:
                text_output = response.output_text.strip()
            elif hasattr(response, "candidates") and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, "content") and candidate.content:
                    parts = getattr(candidate.content, "parts", [])
                    text_output = "".join([getattr(p, "text", "") for p in parts]).strip()

            if text_output:
                return text_output
            else:
                raise AIServiceError(
                    message=f"Model '{model_name}' returned an empty response.",
                    status_code=502,
                    error_type="empty_response"
                )

        except Exception as exc:
            mapped = exc if isinstance(exc, AIServiceError) else _map_genai_exception(exc, model_name)
            last_error = mapped
            logger.warning(
                f"Model '{model_name}' failed with {mapped.error_type} ({mapped.status_code}): {mapped.message}"
            )

            # Do not retry on invalid API key or bad request inputs
            if mapped.status_code == 401 or (mapped.status_code == 400 and mapped.error_type != "unsupported_model"):
                raise mapped

            # If there are more models in fallback list, try next model with short delay
            if i < len(models_to_try) - 1:
                import time
                time.sleep(1.0)
                logger.info(f"Falling back to next model: {models_to_try[i+1]}")
                continue
            else:
                raise mapped

    if last_error:
        raise last_error
    raise AIServiceError("All candidate Gemini models failed.", status_code=503)


def parse_shopping_items(text: str, language: str = "en") -> Dict[str, Any]:
    """
    Parse natural language shopping items (in Bangla or English) into structured JSON.
    Returns: {"items": [{"name": str, "quantity": float, "unit": str, "price": float | null}]}
    """
    api_key = get_configured_api_key()
    if not api_key:
        return _fallback_shopping_parser(text)

    prompt = (
        "You are an expert grocery and shopping item extractor. "
        "Extract the items from the user's natural language input (which may be in English, Bangla, or mixed). "
        "Return ONLY a valid JSON object matching this exact schema, with no markdown fences, no explanatory text:\n"
        "{\n"
        '  "items": [\n'
        '    {"name": "Item name in original or clear language", "quantity": 1.0, "unit": "kg/liter/dozen/piece/packet/gm", "price": 0.0 or null}\n'
        "  ]\n"
        "}\n\n"
        f"User input: {text}"
    )

    try:
        output = _generate_with_fallback(prompt)
        cleaned = clean_json_text(output)
        data = json.loads(cleaned)
        if isinstance(data, dict) and "items" in data and isinstance(data["items"], list):
            validated_items = []
            for item in data["items"]:
                if isinstance(item, dict) and "name" in item and item["name"].strip():
                    try:
                        qty = float(item.get("quantity", 1.0))
                    except (ValueError, TypeError):
                        qty = 1.0
                    validated_items.append({
                        "name": str(item["name"]).strip(),
                        "quantity": max(0.1, qty),
                        "unit": str(item.get("unit", "piece")).strip() or "piece",
                        "price": float(item["price"]) if item.get("price") is not None else None
                    })
            if validated_items:
                return {"items": validated_items}
    except Exception as e:
        logger.warning(f"Gemini shopping parse failed, using heuristic fallback: {str(e)}")

    return _fallback_shopping_parser(text)


def _fallback_shopping_parser(text: str) -> Dict[str, Any]:
    """Fallback parsing for shopping items when API is not available."""
    lines = [line.strip() for line in text.replace("\n", ",").split(",") if line.strip()]
    items = []
    for line in lines:
        items.append({
            "name": line,
            "quantity": 1.0,
            "unit": "piece",
            "price": None
        })
    return {"items": items if items else [{"name": text.strip() or "Item", "quantity": 1.0, "unit": "piece", "price": None}]}


def parse_reminder(text: str, current_time_iso: str = "") -> Dict[str, Any]:
    """
    Parse a natural language reminder.
    If date or time is missing or ambiguous, returns status='needs_clarification' with clarification_question.
    Never guesses. Default timezone is Asia/Dhaka.
    """
    api_key = get_configured_api_key()
    if not api_key:
        return _fallback_reminder_parser(text, current_time_iso)

    prompt = (
        "You are an exact reminder assistant operating in timezone Asia/Dhaka. "
        f"Reference current time in Dhaka: {current_time_iso}.\n"
        "Extract the reminder title, due_date (YYYY-MM-DD), due_time (HH:MM:SS in 24hr format), and repeat ('none', 'daily', 'weekly').\n"
        "CRITICAL RULES:\n"
        "1. If either the date or the time is missing, vague, or ambiguous, you MUST NOT GUESS. Set status to 'needs_clarification' and provide a calm, polite clarification question.\n"
        "2. If date and time are fully clear, set status to 'ready' and provide data.\n"
        "3. Output ONLY strict JSON with no markdown:\n"
        "{\n"
        '  "status": "ready" | "needs_clarification",\n'
        '  "clarification_question": "question in English or Bangla matching user query language, or null",\n'
        '  "data": {\n'
        '    "title": "Clean reminder title without temporal words",\n'
        '    "due_date": "YYYY-MM-DD",\n'
        '    "due_time": "HH:MM:SS",\n'
        '    "repeat": "none" | "daily" | "weekly"\n'
        "  } or null\n"
        "}\n\n"
        f"User query: {text}"
    )

    try:
        output = _generate_with_fallback(prompt)
        cleaned = clean_json_text(output)
        data = json.loads(cleaned)
        if isinstance(data, dict) and "status" in data:
            return data
    except Exception as e:
        logger.warning(f"Gemini reminder parse failed, using heuristic fallback: {str(e)}")

    return _fallback_reminder_parser(text, current_time_iso)


def _fallback_reminder_parser(text: str, current_time_iso: str = "") -> Dict[str, Any]:
    """Heuristic fallback parser for reminders when Gemini API is unavailable."""
    from datetime import timedelta
    from app.utils.timezone import now_dhaka

    current_dhaka = now_dhaka()
    lower = text.lower()

    target_date = None
    if "কাল" in text or "আগামীকাল" in text or "tomorrow" in lower:
        target_date = (current_dhaka + timedelta(days=1)).strftime("%Y-%m-%d")
    elif "আজ" in text or "today" in lower:
        target_date = current_dhaka.strftime("%Y-%m-%d")
    elif "পরশু" in text or "day after tomorrow" in lower:
        target_date = (current_dhaka + timedelta(days=2)).strftime("%Y-%m-%d")

    target_time = None
    if "৮টায়" in text or "8 am" in lower or "8:00 am" in lower or "8am" in lower or "সকাল ৮" in text:
        target_time = "08:00:00"
    elif "৯টায়" in text or "9 am" in lower or "9am" in lower or "সকাল ৯" in text:
        target_time = "09:00:00"
    elif "১০টায়" in text or "10 am" in lower or "10am" in lower:
        target_time = "10:00:00"
    elif "৪টায়" in text or "4 pm" in lower or "4pm" in lower or "বিকাল ৪" in text:
        target_time = "16:00:00"
    elif "৫টায়" in text or "5 pm" in lower or "5pm" in lower or "বিকাল ৫" in text:
        target_time = "17:00:00"

    title = text
    for phrase in ["মনে করিয়ে দাও", "remind me to", "remind me", "কাল", "আজ", "সকাল ৮টায়", "বিকাল ৪টায়", "tomorrow at 8 am", "tomorrow at 4 pm"]:
        title = title.replace(phrase, "")
    title = title.strip() or "Reminder"

    if target_date and target_time:
        return {
            "status": "ready",
            "clarification_question": None,
            "data": {
                "title": title,
                "due_date": target_date,
                "due_time": target_time,
                "repeat": "none"
            }
        }

    if not target_date and not target_time:
        clarification = "কোন তারিখ এবং কোন সময়ে মনে করিয়ে দেব?" if any("\u0980" <= c <= "\u09ff" for c in text) else "Please specify the date and time for this reminder."
    elif not target_date:
        clarification = "কোন তারিখে মনে করিয়ে দেব?" if any("\u0980" <= c <= "\u09ff" for c in text) else "What date should this reminder be set for?"
    else:
        clarification = "কোন সময়ে মনে করিয়ে দেব?" if any("\u0980" <= c <= "\u09ff" for c in text) else "What time should this reminder be set for?"

    return {
        "status": "needs_clarification",
        "clarification_question": clarification,
        "data": None
    }


def generate_study_summary(content: str, language: str = "en", preferred_model: Optional[str] = None) -> str:
    """
    Generate structured, objective summary for study material.
    Raises AIServiceError on failures so caller handles HTTP errors explicitly.
    """
    cleaned_content = (content or "").strip()
    if not cleaned_content:
        raise AIServiceError("Study content is empty. Cannot generate summary.", status_code=400)

    lang_instruction = "in Bengali (বাংলা)" if language == "bn" else "in English"
    prompt = (
        f"Summarize the following study text clearly and objectively {lang_instruction}. "
        "Use plain paragraphs and bullet points for key takeaways. Avoid hype, fluff, or emojis.\n\n"
        f"Content:\n{cleaned_content[:25000]}"
    )

    return _generate_with_fallback(prompt, preferred_model=preferred_model)


def generate_study_explanation(content: str, language: str = "en", preferred_model: Optional[str] = None) -> str:
    """
    Generate simple, concept-based explanation.
    Raises AIServiceError on failures.
    """
    cleaned_content = (content or "").strip()
    if not cleaned_content:
        raise AIServiceError("Study content is empty. Cannot generate explanation.", status_code=400)

    lang_instruction = "in Bengali (বাংলা)" if language == "bn" else "in English"
    prompt = (
        f"Explain the main concepts of the following material simply and clearly {lang_instruction}. "
        "Break down complex terminology with grounded examples and real-world analogies. "
        "Do not use emojis or promotional tone.\n\n"
        f"Content:\n{cleaned_content[:25000]}"
    )

    return _generate_with_fallback(prompt, preferred_model=preferred_model)


def generate_practice_questions(content: str, language: str = "en", preferred_model: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Generate practice questions (MCQs with 4 options and short answers) with score keys and explanations.
    Raises AIServiceError on failures.
    """
    cleaned_content = (content or "").strip()
    if not cleaned_content:
        raise AIServiceError("Study content is empty. Cannot generate practice questions.", status_code=400)

    lang_instruction = "in Bengali (বাংলা)" if language == "bn" else "in English"
    prompt = (
        f"Based on the text below, generate 5 high quality practice questions {lang_instruction}: "
        "4 Multiple Choice Questions (MCQ) and 1 Short Answer Question. "
        "Return strictly valid JSON with no markdown formatting:\n"
        "{\n"
        '  "questions": [\n'
        "    {\n"
        '      "question_type": "mcq",\n'
        '      "question_text": "Question text here",\n'
        '      "options": ["Option A", "Option B", "Option C", "Option D"],\n'
        '      "correct_answer": "Option A",\n'
        '      "explanation": "Why this answer is correct."\n'
        "    },\n"
        "    {\n"
        '      "question_type": "short_answer",\n'
        '      "question_text": "Question text here",\n'
        '      "options": null,\n'
        '      "correct_answer": "Key points expected in the answer",\n'
        '      "explanation": "Evaluation criteria."\n'
        "    }\n"
        "  ]\n"
        "}\n\n"
        f"Content:\n{cleaned_content[:25000]}"
    )

    output = _generate_with_fallback(prompt, preferred_model=preferred_model)
    cleaned = clean_json_text(output)
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict) and "questions" in data and isinstance(data["questions"], list):
            valid_questions = []
            for q in data["questions"]:
                if isinstance(q, dict) and "question_text" in q and "correct_answer" in q:
                    valid_questions.append({
                        "question_type": q.get("question_type", "mcq"),
                        "question_text": str(q["question_text"]).strip(),
                        "options": q.get("options") if q.get("question_type") == "mcq" else None,
                        "correct_answer": str(q["correct_answer"]).strip(),
                        "explanation": str(q.get("explanation", "")).strip()
                    })
            if valid_questions:
                return valid_questions
    except Exception as parse_err:
        logger.error(f"Failed to parse generated questions JSON: {str(parse_err)}")

    raise AIServiceError(
        "Could not parse valid practice questions from AI response. Please try generating again.",
        status_code=502,
        error_type="json_parse_error"
    )


async def chat_study_stream(
    content: str,
    message: str,
    preferred_model: Optional[str] = None
) -> AsyncGenerator[Dict[str, Any], None]:
    """
    Streaming chat about the study material using Gemini models stream API.
    Yields chunks: {"type": "chunk", "text": str} and finally {"type": "done", "interaction_id": None}.
    """
    client, err = get_genai_client()
    if err:
        yield {"type": "chunk", "text": f"Error: {err.message}"}
        yield {"type": "done", "interaction_id": None}
        return

    settings = get_settings()
    model = preferred_model or settings.GEMINI_MODEL or PRIMARY_FALLBACK_MODEL

    prompt = (
        f"Context study content:\n{content[:20000]}\n\n"
        f"User question: {message}\n"
        "Answer calmly and accurately based on the content. Do not use emojis."
    )

    try:
        stream = client.models.generate_content_stream(
            model=model,
            contents=prompt
        )

        for chunk in stream:
            chunk_text = getattr(chunk, "text", "")
            if chunk_text:
                yield {"type": "chunk", "text": chunk_text}

        yield {"type": "done", "interaction_id": None}
    except Exception as e:
        mapped = _map_genai_exception(e, model)
        logger.error(f"Streaming chat error: {mapped.message}")
        yield {"type": "chunk", "text": f"\n[Error: {mapped.message}]"}
        yield {"type": "done", "interaction_id": None}
