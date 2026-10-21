import os
import time
import subprocess
from playwright.sync_api import sync_playwright

DURATIONS = {
    "scene1": 16.94,
    "scene2": 10.97,
    "scene3": 16.25,
    "scene4": 11.33,
    "scene5": 12.38,
    "scene6": 9.22,
}

OUTPUT_DIR = "d:/Project/Someday/demo_video"
AUDIO_DIR = f"{OUTPUT_DIR}/audio"
RECORDINGS_DIR = f"{OUTPUT_DIR}/recordings"
CLIPS_DIR = f"{OUTPUT_DIR}/clips"

os.makedirs(RECORDINGS_DIR, exist_ok=True)
os.makedirs(CLIPS_DIR, exist_ok=True)

CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"

def record_scene(scene_id: str, url: str, action_fn, duration: float):
    print(f"\n--- Recording {scene_id} (Duration: {duration:.2f}s) ---")
    scene_rec_dir = f"{RECORDINGS_DIR}/{scene_id}"
    os.makedirs(scene_rec_dir, exist_ok=True)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=CHROME_PATH,
            headless=True,
            args=["--start-maximized", "--no-sandbox"]
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=scene_rec_dir,
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()
        page.goto(url)
        time.sleep(1.0)
        
        start_time = time.time()
        if action_fn:
            action_fn(page)
            
        elapsed = time.time() - start_time
        remaining = duration - elapsed
        if remaining > 0:
            time.sleep(remaining)
            
        page.close()
        context.close()
        browser.close()
        
    # Find recorded webm file
    files = [f for f in os.listdir(scene_rec_dir) if f.endswith(".webm")]
    if not files:
        raise RuntimeError(f"No video recorded for {scene_id}")
    raw_video = os.path.join(scene_rec_dir, files[0])
    print(f"Recorded raw video: {raw_video}")
    
    # Merge with exact scene audio using ffmpeg
    audio_file = f"{AUDIO_DIR}/{scene_id}_*.mp3"
    import glob
    matching = glob.glob(f"{AUDIO_DIR}/{scene_id}_*.mp3")
    if not matching:
        raise RuntimeError(f"No audio file found for {scene_id}")
    audio_file = matching[0]
    
    out_clip = f"{CLIPS_DIR}/{scene_id}.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", audio_file,
        "-t", str(duration),
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        out_clip
    ]
    subprocess.run(cmd, check=True)
    print(f"Generated clip with audio: {out_clip}")
    return out_clip


def run_all():
    base_dir = os.path.abspath(OUTPUT_DIR).replace("\\", "/")
    
    # Scene 1: Problem Clutter
    def act1(page):
        time.sleep(2.0)
        page.evaluate("window.scrollBy({top: 100, behavior: 'smooth'})")
        
    clip1 = record_scene(
        "scene1",
        f"file:///{base_dir}/scene1.html",
        act1,
        DURATIONS["scene1"]
    )
    
    # Scene 2: Solution Ledger
    def act2(page):
        time.sleep(2.0)
        page.evaluate("window.scrollBy({top: 400, behavior: 'smooth'})")
        time.sleep(3.0)
        page.evaluate("window.scrollBy({top: -400, behavior: 'smooth'})")
        
    clip2 = record_scene(
        "scene2",
        "http://localhost:3000",
        act2,
        DURATIONS["scene2"]
    )
    
    # Scene 3: Grounded Local Vision & Inspector Modal
    def act3(page):
        time.sleep(2.0)
        try:
            # Click on the inspect icon button of the first item
            inspect_btn = page.locator('button[title="Inspect source screenshot & edit fields"]').first
            inspect_btn.wait_for(timeout=10000)
            inspect_btn.click()
            time.sleep(3.0)
            # Smooth scroll inside modal
            page.evaluate("window.scrollBy({top: 150, behavior: 'smooth'})")
        except Exception as e:
            print("Inspect action note:", e)
        time.sleep(4.0)
        
    clip3 = record_scene(
        "scene3",
        "http://localhost:3000",
        act3,
        DURATIONS["scene3"]
    )
    
    # Scene 4: Deterministic Date Resolution
    def act4(page):
        time.sleep(2.0)
        
    clip4 = record_scene(
        "scene4",
        f"file:///{base_dir}/scene4.html",
        act4,
        DURATIONS["scene4"]
    )
    
    # Scene 5: Exporting & Metrics
    def act5(page):
        time.sleep(2.0)
        try:
            # Click Export dropdown
            export_btn = page.locator("button:has-text('Export')").first
            export_btn.wait_for(timeout=10000)
            export_btn.click()
            time.sleep(3.0)
            # Click Metrics button in header
            metrics_btn = page.locator("button:has-text('Metrics')").first
            metrics_btn.wait_for(timeout=10000)
            metrics_btn.click()
            time.sleep(3.5)
        except Exception as e:
            print("Export action note:", e)
            
    clip5 = record_scene(
        "scene5",
        "http://localhost:3000",
        act5,
        DURATIONS["scene5"]
    )
    
    # Scene 6: Outro
    def act6(page):
        time.sleep(2.0)
        
    clip6 = record_scene(
        "scene6",
        f"file:///{base_dir}/scene6.html",
        act6,
        DURATIONS["scene6"]
    )
    
    # Concatenate all clips
    concat_list_path = f"{CLIPS_DIR}/concat_clips.txt"
    with open(concat_list_path, "w") as f:
        for c in [clip1, clip2, clip3, clip4, clip5, clip6]:
            f.write(f"file '{os.path.abspath(c).replace('\\', '/')}'\n")
            
    final_video = f"{OUTPUT_DIR}/Someday_Demo_Video_1080p.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",
        final_video
    ], check=True)
    
    # Check final duration
    cmd = [
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
        final_video
    ]
    final_dur = float(subprocess.check_output(cmd).decode().strip())
    print("\n" + "="*60)
    print(f"SUCCESS: Someday Demo Video Generated!")
    print(f"Path: {final_video}")
    print(f"Duration: {final_dur:.2f}s (~{int(final_dur//60)}:{int(final_dur%60):02d})")
    print(f"Resolution: 1920x1080 (Full HD)")
    print("="*60)

if __name__ == "__main__":
    run_all()
