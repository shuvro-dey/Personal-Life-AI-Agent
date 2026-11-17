"""Verification script testing all AI methods with the live Gemini Interactions API."""
import os
import sys
import asyncio

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from app.services.ai_service import (
    get_genai_client,
    parse_shopping_items,
    parse_reminder,
    generate_study_summary,
    generate_study_explanation,
    generate_practice_questions,
    chat_study_stream
)


async def run_live_tests():
    print("Testing Live Google GenAI Interactions API...")
    client = get_genai_client()
    assert client is not None, "Failed to initialize GenAI client with key from .env"
    print("[PASS] GenAI Client initialized successfully.")

    # 1. Test Shopping parser in Bangla
    shopping_query = "২ কেজি চাল, ১ ডজন ডিম, ১ লিটার তেল, লবণ ৩৫ টাকা"
    print(f"\n1. Testing shopping parse: '{shopping_query}'...")
    shop_res = parse_shopping_items(shopping_query, language="bn")
    assert "items" in shop_res and len(shop_res["items"]) >= 3, f"Failed shopping parse: {shop_res}"
    for it in shop_res["items"]:
        print(f"   Item: {it['name']} | Qty: {it['quantity']} | Unit: {it['unit']} | Price: {it['price']}")
    print("[PASS] Shopping parse with live Gemini: OK")

    # 2. Test Reminder with full date and time in Bangla
    reminder_query = "কাল সকাল ৮টায় ওষুধ খেতে মনে করিয়ে দাও"
    print(f"\n2. Testing reminder parse (complete): '{reminder_query}'...")
    rem_res = parse_reminder(reminder_query, current_time_iso="2026-11-17T21:00:00+06:00")
    print(f"   Status: {rem_res.get('status')}")
    if rem_res.get("data"):
        print(f"   Extracted: {rem_res['data']}")
    assert rem_res.get("status") in ["ready", "needs_clarification"]
    print("[PASS] Reminder parse with live Gemini: OK")

    # 3. Test Reminder with ambiguous time (must ask clarification, never guess!)
    ambiguous_query = "ওষুধ খেতে মনে করিয়ে দাও"
    print(f"\n3. Testing reminder parse (ambiguous): '{ambiguous_query}'...")
    amb_res = parse_reminder(ambiguous_query, current_time_iso="2026-11-17T21:00:00+06:00")
    print(f"   Status: {amb_res.get('status')}")
    print(f"   Clarification Question: {amb_res.get('clarification_question')}")
    assert amb_res.get("status") == "needs_clarification", "Should ask clarification when time/date missing!"
    assert amb_res.get("clarification_question") is not None
    print("[PASS] Ambiguous reminder strictly asks clarification: OK")

    # 4. Test Study summary
    study_content = (
        "Relational database management systems (RDBMS) organize data into structured tables "
        "consisting of rows and columns. They enforce integrity constraints and use SQL for querying. "
        "Transactions adhere to ACID properties: Atomicity, Consistency, Isolation, and Durability."
    )
    print("\n4. Testing study summary generation...")
    summary_res = generate_study_summary(study_content, language="en")
    assert summary_res and len(summary_res) > 20
    print(f"   Summary preview: {summary_res[:150]}...")
    print("[PASS] Study summary generation: OK")

    # 5. Test Study explanation
    print("\n5. Testing simple explanation generation...")
    expl_res = generate_study_explanation(study_content, language="en")
    assert expl_res and len(expl_res) > 20
    print(f"   Explanation preview: {expl_res[:150]}...")
    print("[PASS] Simple explanation generation: OK")

    # 6. Test Practice questions generation
    print("\n6. Testing practice questions generation...")
    questions = generate_practice_questions(study_content, language="en")
    assert len(questions) >= 2, f"Expected at least 2 questions, got {len(questions)}"
    for q in questions[:2]:
        print(f"   [{q.get('question_type')}] {q.get('question_text')}")
        if q.get("options"):
            print(f"       Options: {q.get('options')}")
        print(f"       Correct: {q.get('correct_answer')}")
    print("[PASS] Practice questions generation: OK")

    # 7. Test Streaming chat with previous_interaction_id
    print("\n7. Testing streaming chat via Interactions API...")
    chunks = []
    interaction_id = None
    async for event in chat_study_stream(study_content, "What are ACID properties?"):
        if event["type"] == "chunk":
            chunks.append(event["text"])
        elif event["type"] == "done":
            interaction_id = event.get("interaction_id")

    full_reply = "".join(chunks)
    print(f"   Chunks received: {len(chunks)} | Total length: {len(full_reply)}")
    print(f"   Reply preview: {full_reply[:150]}...")
    print(f"   Interaction ID: {interaction_id}")
    assert len(full_reply) > 20
    print("[PASS] Streaming chat via Interactions API: OK")

    print("\nAll Live Gemini Interactions API tests passed successfully!")


if __name__ == "__main__":
    asyncio.run(run_live_tests())
