"""
Generates synthetic yet realistic screenshot images using PIL for testing and evaluation.
Renders legible text for events, receipts, reading lists, and edge cases.
"""

from __future__ import annotations
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def create_sample_images(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Event Poster: "Open Source AI Summit 2026"
    img_event = Image.new("RGB", (800, 600), color=(24, 28, 36))
    d = ImageDraw.Draw(img_event)
    # Background accent border
    d.rectangle([(20, 20), (780, 580)], outline=(80, 140, 240), width=3)
    d.text((50, 60), "COMMUNITY TECH EVENT", fill=(100, 180, 255))
    d.text((50, 110), "Open Source AI Summit 2026", fill=(255, 255, 255))
    d.text((50, 180), "Date & Time:", fill=(180, 190, 200))
    d.text((50, 210), "Tomorrow at 7 PM - 10 PM", fill=(255, 220, 100))
    d.text((50, 270), "Venue & Location:", fill=(180, 190, 200))
    d.text((50, 300), "Hacker Hub, 42 Innovation Way, Hall 3", fill=(240, 240, 240))
    d.text((50, 360), "Keynote & Networking:", fill=(180, 190, 200))
    d.text((50, 390), "Local LLM fine-tuning, Ollama workflows, and Vision models", fill=(200, 210, 220))
    d.text((50, 480), "RSVP required at summit2026.org/rsvp", fill=(120, 200, 120))
    img_event.save(output_dir / "event_summit_poster.png")

    # 2. Receipt: "Blue Bottle Coffee"
    img_receipt = Image.new("RGB", (600, 800), color=(250, 248, 245))
    d = ImageDraw.Draw(img_receipt)
    # Header
    d.text((180, 50), "BLUE BOTTLE COFFEE", fill=(20, 20, 20))
    d.text((200, 80), "115 Sansome St, SF", fill=(80, 80, 80))
    d.text((190, 110), "Date: Oct 21, 2026  14:35", fill=(80, 80, 80))
    d.line([(50, 150), (550, 150)], fill=(200, 200, 200), width=2)
    # Line items
    d.text((60, 180), "1x Single Origin Espresso", fill=(30, 30, 30))
    d.text((480, 180), "$4.75", fill=(30, 30, 30))
    d.text((60, 220), "1x Almond Milk Cappuccino", fill=(30, 30, 30))
    d.text((480, 220), "$6.50", fill=(30, 30, 30))
    d.text((60, 260), "1x Olive Oil Sea Salt Cookie", fill=(30, 30, 30))
    d.text((480, 260), "$4.50", fill=(30, 30, 30))
    d.line([(50, 320), (550, 320)], fill=(200, 200, 200), width=2)
    # Totals
    d.text((60, 350), "SUBTOTAL", fill=(60, 60, 60))
    d.text((480, 350), "$15.75", fill=(60, 60, 60))
    d.text((60, 390), "TAX (8.5%)", fill=(60, 60, 60))
    d.text((480, 390), "$1.34", fill=(60, 60, 60))
    d.text((60, 440), "TOTAL AMOUNT PAID", fill=(10, 10, 10))
    d.text((460, 440), "$17.09 USD", fill=(10, 10, 10))
    d.text((180, 520), "Card: Visa ending in 8842", fill=(100, 100, 100))
    d.text((220, 560), "THANK YOU!", fill=(100, 100, 100))
    img_receipt.save(output_dir / "receipt_coffee_shop.png")

    # 3. Reading / Article Screenshot: "Building Reliable AI Systems"
    img_article = Image.new("RGB", (850, 550), color=(255, 255, 255))
    d = ImageDraw.Draw(img_article)
    d.rectangle([(0, 0), (850, 50)], fill=(245, 245, 247))
    d.text((30, 15), "https://newsletter.pragmaticengineer.com/p/reliable-ai-systems", fill=(90, 90, 90))
    d.text((50, 90), "THE PRAGMATIC ENGINEER", fill=(230, 80, 0))
    d.text((50, 130), "How To Architect Reliable Local AI Systems in 2026", fill=(15, 20, 25))
    d.text((50, 180), "By Gergely Orosz | Oct 2026", fill=(100, 110, 120))
    d.line([(50, 220), (800, 220)], fill=(230, 230, 230), width=1)
    body_text = (
        "As open weights models become standard, local-first inference is transforming personal workflows.\n"
        "Instead of sending private screenshots to external cloud endpoints, small multimodal models\n"
        "enable zero-latency classification while preserving personal privacy on personal workstations."
    )
    d.text((50, 250), body_text, fill=(50, 55, 60))
    img_article.save(output_dir / "reading_pragmatic_engineer.png")

    # 4. Uncertain / Abstract Image (Meme / doodle)
    img_uncertain = Image.new("RGB", (500, 500), color=(240, 235, 220))
    d = ImageDraw.Draw(img_uncertain)
    d.ellipse([(150, 150), (350, 350)], outline=(100, 100, 100), width=5)
    d.text((190, 240), "Random scribble", fill=(120, 120, 120))
    img_uncertain.save(output_dir / "uncertain_doodle.png")

    # 5. Corrupted Image (Invalid header/bytes)
    with open(output_dir / "corrupted_screenshot.png", "wb") as f:
        f.write(b"NOT_A_VALID_PNG_HEADER_CORRUPTED_FILE_DATA_123456789")

    print(f"Generated sample screenshots in {output_dir}")


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent
    create_sample_images(base_dir / "sample_screenshots")
    create_sample_images(base_dir / "evaluation_dataset")
