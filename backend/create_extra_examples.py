"""
Generates additional realistic screenshots for comprehensive user testing:
1. Flight boarding pass / itinerary (Event / Travel)
2. Fine dining dinner bill (Receipt)
3. GitHub repository / Book reading recommendation (Reading)
"""

from pathlib import Path
from PIL import Image, ImageDraw


def generate_extra_screenshots(output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Flight / Travel Confirmation (Event)
    img_flight = Image.new("RGB", (800, 500), color=(18, 30, 49))
    d = ImageDraw.Draw(img_flight)
    d.rectangle([(20, 20), (780, 480)], outline=(60, 120, 216), width=2)
    d.text((50, 45), "AIRLINE BOARDING PASS & FLIGHT CONFIRMATION", fill=(100, 180, 255))
    d.text((50, 85), "Flight AI 173: New Delhi (DEL) -> San Francisco (SFO)", fill=(255, 255, 255))
    d.text((50, 140), "Departure Date & Time:", fill=(170, 180, 195))
    d.text((50, 170), "October 26, 2026 at 04:30 AM", fill=(255, 220, 100))
    d.text((50, 220), "Terminal & Gate:", fill=(170, 180, 195))
    d.text((50, 250), "Indira Gandhi Intl Airport, Terminal 3, Gate 18B", fill=(240, 240, 240))
    d.text((50, 300), "Passenger:", fill=(170, 180, 195))
    d.text((50, 330), "Passenger: Alex Mercer | Seat: 24A | Booking Ref: AI-78294", fill=(200, 210, 225))
    d.text((50, 400), "Please arrive at gate 60 minutes prior to departure.", fill=(140, 190, 140))
    img_flight.save(output_dir / "flight_boarding_pass.png")

    # 2. Restaurant Dinner Bill (Receipt)
    img_dinner = Image.new("RGB", (600, 850), color=(252, 250, 245))
    d = ImageDraw.Draw(img_dinner)
    d.text((170, 40), "TRATTORIA BELLA ITALIA", fill=(20, 20, 20))
    d.text((210, 70), "45 Columbus Ave, SF", fill=(80, 80, 80))
    d.text((190, 100), "Date: Oct 21, 2026  20:15", fill=(80, 80, 80))
    d.line([(50, 135), (550, 135)], fill=(200, 200, 200), width=2)
    # Line items
    d.text((60, 160), "1x Woodfired Margherita Pizza", fill=(30, 30, 30))
    d.text((480, 160), "$18.50", fill=(30, 30, 30))
    d.text((60, 200), "1x Handcrafted Truffle Pasta", fill=(30, 30, 30))
    d.text((480, 200), "$24.00", fill=(30, 30, 30))
    d.text((60, 240), "1x Classic Tiramisu", fill=(30, 30, 30))
    d.text((480, 240), "$9.50", fill=(30, 30, 30))
    d.text((60, 280), "2x San Pellegrino Sparkling", fill=(30, 30, 30))
    d.text((480, 280), "$8.00", fill=(30, 30, 30))
    d.line([(50, 330), (550, 330)], fill=(200, 200, 200), width=2)
    # Totals
    d.text((60, 360), "SUBTOTAL", fill=(60, 60, 60))
    d.text((480, 360), "$60.00", fill=(60, 60, 60))
    d.text((60, 400), "TAX (8.5%)", fill=(60, 60, 60))
    d.text((480, 400), "$5.10", fill=(60, 60, 60))
    d.text((60, 440), "TIP (18%)", fill=(60, 60, 60))
    d.text((480, 440), "$10.80", fill=(60, 60, 60))
    d.line([(50, 480), (550, 480)], fill=(180, 180, 180), width=2)
    d.text((60, 510), "TOTAL AMOUNT PAID", fill=(10, 10, 10))
    d.text((450, 510), "$75.90 USD", fill=(10, 10, 10))
    d.text((180, 600), "Card: Mastercard ending in 4102", fill=(100, 100, 100))
    d.text((230, 640), "GRAZIE MILLE!", fill=(100, 100, 100))
    img_dinner.save(output_dir / "restaurant_dinner_bill.png")

    # 3. GitHub Repository Reading List (Reading)
    img_repo = Image.new("RGB", (850, 520), color=(255, 255, 255))
    d = ImageDraw.Draw(img_repo)
    d.rectangle([(0, 0), (850, 50)], fill=(246, 248, 250))
    d.text((30, 15), "https://github.com/ollama/ollama", fill=(90, 90, 90))
    d.text((50, 80), "GITHUB / OLLAMA", fill=(9, 105, 218))
    d.text((50, 120), "ollama/ollama: Get up and running with Llama 3, Gemma 3, and other LLMs", fill=(31, 35, 40))
    d.text((50, 170), "By Jeffrey Morgan & Ollama Contributors | 115k Stars", fill=(101, 109, 118))
    d.line([(50, 210), (800, 210)], fill=(216, 222, 228), width=1)
    body_text = (
        "Ollama allows you to run open-weight language models locally on macOS, Linux, and Windows.\n"
        "Features native hardware acceleration for NVIDIA GPUs and seamless multimodal vision models.\n"
        "Provides REST API at localhost:11434 for local agentic orchestration."
    )
    d.text((50, 240), body_text, fill=(31, 35, 40))
    img_repo.save(output_dir / "reading_github_ollama.png")

    print(f"Generated 3 extra realistic screenshots in {output_dir}")


if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent
    generate_extra_screenshots(base_dir / "sample_screenshots")
