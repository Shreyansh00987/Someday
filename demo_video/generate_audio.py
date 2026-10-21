import asyncio
import os
import subprocess
import edge_tts

VOICE = "en-US-AndrewMultilingualNeural"

SCENES = [
    {
        "id": "scene1_problem",
        "text": "We all do it: we take screenshots of things we intend to do later. Event posters, dinner receipts, reading lists, articles. But while saving a screenshot takes a split second, acting on them is tedious drudgery. So they sit forgotten in a digital graveyard.",
    },
    {
        "id": "scene2_solution",
        "text": "Meet Someday. Built for the Slow and Steady hackathon, Someday rewards your inner sloth. You configure your screenshot folder once, and do nothing. Someday finishes them for you.",
    },
    {
        "id": "scene3_vision",
        "text": "In the background, an open-weight vision model running locally on your own machine inspects every screenshot. It extracts dates, merchants, and URLs, requiring verbatim textual quotes as grounded evidence. Zero data ever leaves your computer.",
    },
    {
        "id": "scene4_dates",
        "text": "No hallucinated calendar math. Someday anchors relative expressions like 'Tomorrow at 7 PM' against the screenshot's file creation timestamp using deterministic arithmetic.",
    },
    {
        "id": "scene5_export",
        "text": "Over morning coffee, review your ledger. With one click, approve items and export valid RFC-5545 calendar events, expense spreadsheets, and reading lists.",
    },
    {
        "id": "scene6_outro",
        "text": "Someday: Your screenshots are a to-do list. Someday finishes them. Completely open source, private, and running locally on your hardware.",
    },
]

async def generate():
    os.makedirs("d:/Project/Someday/demo_video/audio", exist_ok=True)
    durations = []
    
    for i, scene in enumerate(SCENES):
        out_path = f"d:/Project/Someday/demo_video/audio/{scene['id']}.mp3"
        communicate = edge_tts.Communicate(scene["text"], VOICE, rate="+4%")
        await communicate.save(out_path)
        
        # Get duration using ffprobe
        cmd = [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
            out_path
        ]
        duration = float(subprocess.check_output(cmd).decode().strip())
        durations.append((scene["id"], duration))
        print(f"Scene {i+1} ({scene['id']}): {duration:.2f}s")
        
    total_duration = sum(d[1] for d in durations)
    print(f"\nTotal Voiceover Duration: {total_duration:.2f}s (~{int(total_duration//60)}:{int(total_duration%60):02d})")
    
    # Generate concat file
    concat_list = "d:/Project/Someday/demo_video/audio/concat_list.txt"
    with open(concat_list, "w") as f:
        for scene in SCENES:
            path = f"d:/Project/Someday/demo_video/audio/{scene['id']}.mp3".replace("\\", "/")
            f.write(f"file '{path}'\n")
            
    # Concatenate all into full audio
    full_audio = "d:/Project/Someday/demo_video/audio/full_voiceover.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list, "-c", "copy", full_audio
    ], check=True)
    print(f"Full audio saved to {full_audio}")

if __name__ == "__main__":
    asyncio.run(generate())
