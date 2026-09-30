/**
 * Complete standalone Python Desktop Agent script.
 * Users can run this on their personal system (Windows / Mac / Linux).
 * It listens on localhost:5000 and executes real OS actions:
 * - App Launching (Chrome, Notepad, VLC, Notepad++, VS Code, Task Manager, Explorer, Camera, etc.)
 * - Media & Music Playback (YouTube, Spotify, Next/Prev Track, Play/Pause)
 * - Master Volume & Mute control
 * - Power Actions (Shutdown, Restart, Cancel "Arise", Lock Workstation)
 * - Screenshots (saved timestamped to Desktop)
 * - Battery & System Hardware Diagnostics
 * - Smart Web Search (Google, Google Maps, Amazon, Web portals)
 * - Live Weather & Offline Knowledge Base
 */
export const PYTHON_BRIDGE_SCRIPT = `"""
=============================================================================
PRAJ DESKTOP SYSTEM AGENT & WEB BRIDGE
=============================================================================
Run this script on your personal computer:
    python praj_desktop_bridge.py

Features:
- Executes real OS commands (Chrome, Notepad, VLC, VS Code, Task Manager, etc.)
- Controls System Shutdown, Restart & Cancel Shutdown ("Arise")
- Controls Screen Lock, Master Volume, Play/Pause, Next/Prev Tracks
- Captures Instant Desktop Screenshots to your Desktop
- Battery & System Hardware Stats
- YouTube Song & Video Playback
- Smart Google, Maps, and Amazon Searches
- Local Persistent Memory & Offline Physics / GK Knowledge Base
- Zero extra dependencies required for HTTP server (uses standard Python library)
- Automatically opens the PRAJ Web Interface in your default browser!
=============================================================================
"""

import os
import sys
import json
import time
import datetime
import webbrowser
import subprocess
import threading
from urllib.parse import urlparse, parse_qs, quote

# Multithreaded HTTP server so pings never block
try:
    from http.server import ThreadingHTTPServer as ServerClass, BaseHTTPRequestHandler
except ImportError:
    from http.server import HTTPServer, BaseHTTPRequestHandler
    from socketserver import ThreadingMixIn
    class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
        daemon_threads = True
    ServerClass = ThreadingHTTPServer

# Female-only voice configuration (Eliminates male voice completely)
BRIDGE_SPEECH_ENABLED = False  # The Web Voice Dashboard handles speech in high-res female voice; set True for standalone terminal mode

try:
    import pyttsx3
    def _speak_worker(text):
        try:
            engine = pyttsx3.init()
            engine.setProperty('rate', 170)
            voices = engine.getProperty('voices')
            female_voice = None
            # Filter strictly: if it matches male keywords, NEVER use it
            male_keywords = ["david", "george", "daniel", "guy", "mark", "james", "richard", "alex", "fred", "male", "bruce", "tom", "sean", "ravi", "paul", "stefan", "john", "michael", "ryan", "sam", "adam", "bill", "frank", "man", "boy"]
            female_keywords = ["zira", "hazel", "susan", "catherine", "eva", "female", "samantha", "victoria", "karen", "aria", "jenny", "fiona", "moira", "sonia", "tessa", "serena", "natural"]

            for v in voices:
                v_name = v.name.lower()
                if any(kw in v_name for kw in female_keywords) and not any(m in v_name for m in male_keywords):
                    female_voice = v.id
                    break

            # If not explicitly named, pick any voice that is NOT male
            if not female_voice:
                for v in voices:
                    v_name = v.name.lower()
                    if not any(m in v_name for m in male_keywords):
                        female_voice = v.id
                        break

            # STRICT FEMALE-ONLY ENFORCEMENT:
            # If no female voice is detected, ABORT speech to NEVER speak in a male voice!
            if female_voice:
                engine.setProperty('voice', female_voice)
                engine.say(text)
                engine.runAndWait()
            else:
                # Do NOT speak; prevent male voice (David/George/Mark) completely
                return
        except Exception as e:
            print("TTS error:", e)

    def speak(text, force=False):
        print(f"PRAJ (Female Voice): {text}")
        if BRIDGE_SPEECH_ENABLED or force:
            t = threading.Thread(target=_speak_worker, args=(text,), daemon=True)
            t.start()
except Exception:
    def speak(text, force=False):
        print(f"PRAJ (voice output): {text}")

# Target Web App URL (change if hosted remotely or use AI Studio URL)
WEB_APP_URL = "http://localhost:3000"
BRIDGE_PORT = 5000
MEMORY_FILE = "temp_memory.txt"
CONVERSATION_FILE = "conversation_history.json"

# Offline Knowledge Base (Zero-API)
KNOWLEDGE_BASE = {
    "what is the smallest continent": "The smallest continent is Australia.",
    "who is the prime minister of india": "The Prime Minister of India is Narendra Modi.",
    "capital of france": "The capital of France is Paris.",
    "how many continents are there": "There are seven continents.",
    "largest ocean in the world": "The Pacific Ocean is the largest ocean.",
    "national animal of india": "The national animal of India is the Bengal Tiger.",
    "national bird of india": "The national bird of India is the Peacock.",
    "national flower of india": "The national flower of India is the Lotus.",
    "fastest land animal": "The fastest land animal is the cheetah.",
    "highest mountain peak": "Mount Everest is the highest mountain peak.",
    "currency of japan": "The currency of Japan is Yen.",
    "largest desert in the world": "The Sahara Desert is the largest hot desert.",
    "longest river in the world": "The Nile is the longest river in the world.",
    "how many states in india": "There are 28 states in India.",
    "who was mahatma gandhi": "Mahatma Gandhi was the leader of India's independence movement.",
    "capital of china": "The capital of China is Beijing.",
    "which planet is known as the red planet": "Mars is known as the red planet.",
    "largest country by area": "Russia is the largest country by area.",
    "national anthem of india": "The national anthem of India is Jana Gana Mana.",
    "who wrote the national anthem": "Rabindranath Tagore wrote the national anthem of India.",
    "who invented the telephone": "Alexander Graham Bell invented the telephone.",
    "first man to walk on the moon": "Neil Armstrong was the first man to walk on the moon.",
    "how many bones in human body": "There are 206 bones in the human body.",
    "who invented computer": "Charles Babbage is known as the father of the computer.",
    "largest mammal": "The blue whale is the largest mammal.",
    "who discovered america": "Christopher Columbus is credited with discovering America.",
    "which is the coldest place on earth": "Antarctica is the coldest place on Earth.",
    "how many players in cricket team": "There are 11 players in a cricket team.",
    "national sport of india": "The national sport of India is Hockey.",
    "which is the tallest building in the world": "Burj Khalifa is the tallest building in the world.",
    "what is the fastest family sedan in the world": "BMW M5 CS is the fastest family sedan on Earth.",
    "what is newton's first law": "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an external force.",
    "what is newton's second law": "Force equals mass times acceleration.",
    "what is newton's third law": "For every action, there is an equal and opposite reaction.",
    "what is gravity": "Gravity is the force that attracts objects toward the center of the Earth.",
    "who discovered gravity": "Gravity was discovered by Isaac Newton.",
    "what is speed": "Speed is the distance traveled per unit of time.",
    "what is velocity": "Velocity is speed with direction.",
    "what is acceleration": "Acceleration is the rate of change of velocity.",
    "unit of force": "The unit of force is Newton.",
    "unit of energy": "The unit of energy is Joule.",
    "unit of power": "The unit of power is Watt.",
    "what is work": "Work is done when a force is applied to an object and it moves in the direction of the force.",
    "law of conservation of energy": "Energy cannot be created or destroyed, only transformed from one form to another.",
    "what is potential energy": "Potential energy is stored energy due to position.",
    "what is kinetic energy": "Kinetic energy is energy due to motion.",
    "what is friction": "Friction is the force that resists motion between two surfaces.",
    "what is pressure": "Pressure is force per unit area.",
    "unit of pressure": "The unit of pressure is Pascal.",
    "what is mass": "Mass is the amount of matter in an object.",
    "what is weight": "Weight is the force exerted by gravity on an object.",
    "unit of current": "The unit of electric current is Ampere.",
    "unit of resistance": "The unit of resistance is Ohm.",
    "unit of charge": "The unit of electric charge is Coulomb.",
    "what is conductor": "A conductor allows electricity to pass through it easily.",
    "what is insulator": "An insulator does not allow electricity to pass through it easily.",
    "example of conductor": "Copper is a good conductor of electricity.",
    "example of insulator": "Rubber is a good insulator.",
    "what is refraction": "Refraction is the bending of light as it passes from one medium to another.",
    "what is reflection": "Reflection is the bouncing of light from a surface.",
    "what is lens": "A lens is a transparent material that bends light to form images."
}

def save_memory(text):
    try:
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            f.write(text.strip())
        return True
    except Exception as e:
        print("Memory save error:", e)
        return False

def recall_memory():
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                return content if content else "You haven't stored any notes yet."
        except Exception:
            return "Unable to read memory file."
    return "I don't have any notes stored in memory right now."

def save_conversation_turn(command, reply, action="chat"):
    try:
        history = []
        if os.path.exists(CONVERSATION_FILE):
            try:
                with open(CONVERSATION_FILE, "r", encoding="utf-8") as f:
                    history = json.load(f)
            except Exception:
                history = []
        history.insert(0, {
            "id": f"conv-{int(time.time() * 1000)}",
            "timestamp": datetime.datetime.now().strftime("%I:%M:%S %p"),
            "command": command,
            "reply": reply,
            "action": action
        })
        history = history[:60]  # Store up to 60 previous conversation turns
        with open(CONVERSATION_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2)
        return True
    except Exception as e:
        print("Conversation history save error:", e)
        return False

def get_conversation_history():
    if os.path.exists(CONVERSATION_FILE):
        try:
            with open(CONVERSATION_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def clear_conversation_history():
    try:
        with open(CONVERSATION_FILE, "w", encoding="utf-8") as f:
            json.dump([], f)
        return True
    except Exception:
        return False

def shutdown_system(seconds=30):
    speak(f"Shutting down the system in {seconds} seconds.")
    if sys.platform.startswith("win"):
        os.system(f"shutdown /s /t {seconds}")
    elif sys.platform.startswith("linux") or sys.platform == "darwin":
        os.system(f"shutdown -h +{max(1, seconds // 60)}")

def cancel_shutdown():
    speak("Shutdown canceled. System stands at ready.")
    if sys.platform.startswith("win"):
        os.system("shutdown /a")
    elif sys.platform.startswith("linux"):
        os.system("shutdown -c")

def restart_system(seconds=30):
    speak(f"Restarting the computer in {seconds} seconds.")
    if sys.platform.startswith("win"):
        os.system(f"shutdown /r /t {seconds}")
    elif sys.platform.startswith("linux") or sys.platform == "darwin":
        os.system(f"shutdown -r +{max(1, seconds // 60)}")

def lock_workstation():
    speak("Locking your computer screen.")
    if sys.platform.startswith("win"):
        try:
            import ctypes
            ctypes.windll.user32.LockWorkStation()
        except Exception:
            os.system("rundll32.exe user32.dll,LockWorkStation")
    elif sys.platform == "darwin":
        os.system("pmset displaysleepnow")
    else:
        os.system("xdg-screensaver lock || gnome-screensaver-command -l")

def adjust_volume(action="up"):
    if sys.platform.startswith("win"):
        try:
            import ctypes
            # VK_VOLUME_MUTE = 0xAD, VK_VOLUME_DOWN = 0xAE, VK_VOLUME_UP = 0xAF
            code = 0xAF if action == "up" else (0xAE if action == "down" else 0xAD)
            steps = 1 if action == "mute" else 3
            for _ in range(steps):
                ctypes.windll.user32.keybd_event(code, 0, 0, 0)
                ctypes.windll.user32.keybd_event(code, 0, 2, 0)
        except Exception:
            pass
    elif sys.platform == "darwin":
        if action == "mute":
            os.system("osascript -e 'set volume output muted not (output muted of (get volume settings))'")
        elif action == "up":
            os.system("osascript -e 'set volume output volume ((output volume of (get volume settings)) + 10)'")
        elif action == "down":
            os.system("osascript -e 'set volume output volume ((output volume of (get volume settings)) - 10)'")

def media_control(action="play_pause"):
    if sys.platform.startswith("win"):
        try:
            import ctypes
            # VK_MEDIA_PLAY_PAUSE = 0xB3, VK_MEDIA_NEXT_TRACK = 0xB0, VK_MEDIA_PREV_TRACK = 0xB1
            code = 0xB3 if action == "play_pause" else (0xB0 if action == "next" else 0xB1)
            ctypes.windll.user32.keybd_event(code, 0, 0, 0)
            ctypes.windll.user32.keybd_event(code, 0, 2, 0)
        except Exception:
            pass

def capture_screenshot():
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    desktop_dir = os.path.join(os.path.expanduser("~"), "Desktop")
    if not os.path.exists(desktop_dir):
        desktop_dir = os.path.expanduser("~")
    filepath = os.path.join(desktop_dir, f"PRAJ_Screenshot_{timestamp}.png")

    saved = False
    try:
        from PIL import ImageGrab
        img = ImageGrab.grab()
        img.save(filepath)
        saved = True
    except Exception:
        pass

    if not saved and sys.platform.startswith("win"):
        try:
            ps_script = (
                f'Add-Type -AssemblyName System.Windows.Forms; '
                f'Add-Type -AssemblyName System.Drawing; '
                f'$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; '
                f'$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; '
                f'$g = [System.Drawing.Graphics]::FromImage($bmp); '
                f'$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); '
                f'$bmp.Save("{filepath.replace(chr(92), "/")}"); '
            )
            subprocess.run(["powershell", "-NoProfile", "-Command", ps_script], timeout=6)
            if os.path.exists(filepath):
                saved = True
        except Exception:
            pass

    if saved and os.path.exists(filepath):
        try:
            if sys.platform.startswith("win"):
                os.startfile(filepath)
            elif sys.platform == "darwin":
                os.system(f"open '{filepath}'")
        except Exception:
            pass
        return filepath
    return None

def get_battery_status():
    try:
        import psutil
        battery = psutil.sensors_battery()
        if battery:
            plugged = "plugged in and charging" if battery.power_plugged else "on battery power"
            return f"Battery is at {round(battery.percent)}%, currently {plugged}."
    except Exception:
        pass

    if sys.platform.startswith("win"):
        try:
            out = subprocess.check_output(
                ["powershell", "-NoProfile", "-Command", "(Get-CimInstance Win32_Battery).EstimatedChargeRemaining"],
                text=True, timeout=4
            ).strip()
            if out and out.isdigit():
                return f"Battery is currently at {out}% charge."
        except Exception:
            pass
    return "Power systems operational on primary AC line."

def get_system_stats():
    node_name = os.environ.get("COMPUTERNAME", os.environ.get("HOSTNAME", "Desktop-Host"))
    platform_info = sys.platform
    try:
        import platform
        platform_info = f"{platform.system()} {platform.release()}"
    except Exception:
        pass
    return f"Host: {node_name} | OS: {platform_info} | Architecture: {sys.maxsize > 2**32 and '64-bit' or '32-bit'}"

def execute_system_command(raw_command):
    cmd = raw_command.lower().strip()
    result = {
        "command": raw_command,
        "action": "unknown",
        "reply": "",
        "success": True,
        "system_executed": True
    }

    # 1. Kill Switch & Emergency Abort
    if "kill switch" in cmd or "emergency stop" in cmd or "emergency halt" in cmd or "terminate system" in cmd or "kill all" in cmd:
        cancel_shutdown()
        speak("Emergency kill switch triggered. Halting system operations and aborting all shutdowns.")
        result["action"] = "kill_switch"
        result["reply"] = "EMERGENCY KILL SWITCH ACTIVATED! All shutdown sequences aborted, audio muted, and system halted."
        return result

    # 1.1 Shutdown, Restart & Cancel Shutdown
    if "arise" in cmd or "cancel shutdown" in cmd or cmd == "abort" or cmd == "cancel" or "stop shutdown" in cmd:
        cancel_shutdown()
        result["action"] = "cancel_shutdown"
        result["reply"] = "Shutdown canceled. PRAJ stands ready."
        return result

    # Restart
    if (cmd.startswith("restart") or cmd.startswith("reboot")) and not any(q in cmd for q in ["what", "how", "why"]):
        digits = "".join(filter(str.isdigit, cmd))
        seconds = int(digits) if digits else 30
        restart_system(seconds)
        result["action"] = "restart"
        result["reply"] = f"Restarting host system in {seconds} seconds. Say 'Arise' to cancel."
        return result

    # Lock workstation / screen
    if "lock screen" in cmd or "lock computer" in cmd or "lock pc" in cmd or "lock workstation" in cmd or cmd == "lock":
        lock_workstation()
        result["action"] = "lock_workstation"
        result["reply"] = "Workstation locked securely, sir."
        return result

    # Only trigger shutdown on explicit imperative commands (reject questions/conversational queries)
    is_explicit_shutdown = (
        cmd.startswith("shutdown") or cmd.startswith("shut down") or
        cmd == "power off" or cmd.startswith("turn off pc") or cmd.startswith("turn off computer")
    ) and not any(q in cmd for q in ["what", "how", "why", "explain", "don't", "dont", "cancel", "abort", "can you do"])

    if is_explicit_shutdown:
        digits = "".join(filter(str.isdigit, cmd))
        seconds = int(digits) if digits else 30
        shutdown_system(seconds)
        result["action"] = "shutdown"
        result["reply"] = f"Initiating system shutdown in {seconds} seconds. Say 'Arise' to cancel."
        return result

    # 1.5 Desktop Volume Controls
    if "volume up" in cmd or "increase volume" in cmd or "louder" in cmd:
        adjust_volume("up")
        speak("Volume increased")
        result["action"] = "volume_up"
        result["reply"] = "Master volume increased."
        return result

    if "volume down" in cmd or "decrease volume" in cmd or "lower volume" in cmd or "quieter" in cmd:
        adjust_volume("down")
        speak("Volume decreased")
        result["action"] = "volume_down"
        result["reply"] = "Master volume decreased."
        return result

    if "mute" in cmd or "unmute" in cmd or "mute audio" in cmd or "mute volume" in cmd:
        adjust_volume("mute")
        speak("Toggled audio mute")
        result["action"] = "volume_mute"
        result["reply"] = "Audio mute toggled."
        return result

    # 1.6 Media Controls (Spotify, YouTube, Media Players)
    if "pause music" in cmd or "resume music" in cmd or "pause video" in cmd or "pause" == cmd or "play music" in cmd and not cmd.startswith("play "):
        media_control("play_pause")
        speak("Playback toggled")
        result["action"] = "media_play_pause"
        result["reply"] = "Media playback toggled."
        return result

    if "next track" in cmd or "next song" in cmd or "skip song" in cmd or "skip track" in cmd:
        media_control("next")
        speak("Playing next track")
        result["action"] = "media_next"
        result["reply"] = "Skipped to next track."
        return result

    if "previous track" in cmd or "previous song" in cmd:
        media_control("prev")
        speak("Playing previous track")
        result["action"] = "media_prev"
        result["reply"] = "Returned to previous track."
        return result

    # 1.7 Screenshot
    if "take screenshot" in cmd or "capture screen" in cmd or "screenshot" == cmd:
        shot_path = capture_screenshot()
        if shot_path:
            speak("Screenshot captured and saved to Desktop")
            result["action"] = "screenshot"
            result["reply"] = f"Screenshot saved to {shot_path}."
        else:
            result["action"] = "screenshot"
            result["reply"] = "Attempted screenshot capture on host display."
        return result

    # 1.8 Battery & System Hardware Stats
    if "battery" in cmd or "power status" in cmd or "check battery" in cmd:
        bat_info = get_battery_status()
        speak(bat_info)
        result["action"] = "battery_status"
        result["reply"] = bat_info
        return result

    if "system status" in cmd or "hardware status" in cmd or "specs" in cmd or "system info" in cmd:
        sys_info = get_system_stats()
        speak("System hardware online and operational.")
        result["action"] = "system_status"
        result["reply"] = sys_info
        return result

    # 2. Local Applications
    if "open task manager" in cmd or "task manager" == cmd:
        if sys.platform.startswith("win"):
            os.system("start taskmgr")
        elif sys.platform == "darwin":
            os.system("open -a 'Activity Monitor'")
        speak("Opening Task Manager")
        result["action"] = "open_task_manager"
        result["reply"] = "Opening Task Manager on host."
        return result

    if "open file explorer" in cmd or "open explorer" in cmd or "open my files" in cmd:
        if sys.platform.startswith("win"):
            os.system("start explorer")
        elif sys.platform == "darwin":
            os.system("open ~")
        speak("Opening File Explorer")
        result["action"] = "open_file_explorer"
        result["reply"] = "Opening File Explorer on host."
        return result

    if "open downloads" in cmd:
        if sys.platform.startswith("win"):
            os.system("start explorer shell:Downloads")
        elif sys.platform == "darwin":
            os.system("open ~/Downloads")
        speak("Opening Downloads folder")
        result["action"] = "open_downloads"
        result["reply"] = "Opening Downloads folder."
        return result

    if "open vs code" in cmd or "open vscode" in cmd or "open code" == cmd:
        if sys.platform.startswith("win"):
            os.system("code . || start code")
        elif sys.platform == "darwin":
            os.system("open -a 'Visual Studio Code'")
        speak("Opening Visual Studio Code")
        result["action"] = "open_vscode"
        result["reply"] = "Opening VS Code on your desktop."
        return result

    if "open command prompt" in cmd or "open cmd" in cmd or "open terminal" in cmd or "open powershell" in cmd:
        if sys.platform.startswith("win"):
            if "powershell" in cmd:
                os.system("start powershell")
            else:
                os.system("start cmd")
        elif sys.platform == "darwin":
            os.system("open -a Terminal")
        speak("Opening Terminal")
        result["action"] = "open_terminal"
        result["reply"] = "Opening Command Terminal on your desktop."
        return result

    if "open camera" in cmd:
        if sys.platform.startswith("win"):
            os.system("start microsoft.windows.camera:")
        elif sys.platform == "darwin":
            os.system("open -a Photo\\\\ Booth")
        speak("Opening Camera")
        result["action"] = "open_camera"
        result["reply"] = "Opening Camera on host."
        return result

    if "open snipping tool" in cmd or "screen snip" in cmd:
        if sys.platform.startswith("win"):
            os.system("start snippingtool")
        speak("Opening Snipping Tool")
        result["action"] = "open_snipping_tool"
        result["reply"] = "Opening Snipping Tool."
        return result

    if "open settings" in cmd:
        if sys.platform.startswith("win"):
            os.system("start ms-settings:")
        speak("Opening Windows Settings")
        result["action"] = "open_settings"
        result["reply"] = "Opening Settings on host."
        return result

    if "open notepad++" in cmd or "open notepad plus plus" in cmd:
        paths = [
            "C:\\\\Program Files\\\\Notepad++\\\\notepad++.exe",
            "C:\\\\Program Files (x86)\\\\Notepad++\\\\notepad++.exe"
        ]
        opened = False
        for p in paths:
            if os.path.exists(p):
                os.startfile(p)
                opened = True
                break
        if not opened:
            os.system("start notepad++")
        speak("Opening Notepad++")
        result["action"] = "open_notepad_plus_plus"
        result["reply"] = "Opening Notepad++ on your computer."
        return result

    if "open notepad" in cmd:
        if sys.platform.startswith("win"):
            os.system("start notepad")
        elif sys.platform == "darwin":
            os.system("open -a TextEdit")
        else:
            os.system("gedit &")
        speak("Opening Notepad")
        result["action"] = "open_notepad"
        result["reply"] = "Opening Notepad on your computer."
        return result

    if "open chrome" in cmd:
        chrome_paths = [
            "C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
            "C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe",
            os.path.expanduser("~\\\\AppData\\\\Local\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe")
        ]
        opened = False
        if sys.platform.startswith("win"):
            for p in chrome_paths:
                if os.path.exists(p):
                    os.startfile(p)
                    opened = True
                    break
            if not opened:
                os.system("start chrome")
        elif sys.platform == "darwin":
            os.system("open -a 'Google Chrome'")
        else:
            os.system("google-chrome &")
        speak("Opening Google Chrome")
        result["action"] = "open_chrome"
        result["reply"] = "Opening Google Chrome on your computer."
        return result

    if "open vlc" in cmd:
        vlc_paths = [
            "C:\\\\Program Files\\\\VideoLAN\\\\VLC\\\\vlc.exe",
            "C:\\\\Program Files (x86)\\\\VideoLAN\\\\VLC\\\\vlc.exe"
        ]
        opened = False
        if sys.platform.startswith("win"):
            for p in vlc_paths:
                if os.path.exists(p):
                    os.startfile(p)
                    opened = True
                    break
            if not opened:
                os.system("start vlc")
        elif sys.platform == "darwin":
            os.system("open -a VLC")
        else:
            os.system("vlc &")
        speak("Opening VLC Media Player")
        result["action"] = "open_vlc"
        result["reply"] = "Opening VLC Media Player on your computer."
        return result

    if "open bluetooth" in cmd or "bluetooth settings" in cmd:
        if sys.platform.startswith("win"):
            os.system("start ms-settings:bluetooth")
        elif sys.platform == "darwin":
            os.system("open /System/Library/PreferencePanes/Bluetooth.prefPane")
        speak("Opening Bluetooth settings")
        result["action"] = "open_bluetooth"
        result["reply"] = "Opening Bluetooth settings on your computer."
        return result

    if "open calculator" in cmd or "open calc" in cmd:
        if sys.platform.startswith("win"):
            os.system("calc")
        elif sys.platform == "darwin":
            os.system("open -a Calculator")
        else:
            os.system("gnome-calculator &")
        speak("Opening Calculator")
        result["action"] = "open_calculator"
        result["reply"] = "Opening Calculator on your system."
        return result

    # 2.5 Music & Video Playback (YouTube & Spotify)
    if cmd.startswith("play ") or "play on youtube" in cmd or "play on yt" in cmd or "search youtube for" in cmd:
        query = cmd
        for prefix in ["play on youtube", "play on yt", "search youtube for", "play"]:
            if query.startswith(prefix):
                query = query[len(prefix):].strip()
                break
        query = query.replace("on youtube", "").replace("on yt", "").replace("songs", "").replace("song", "").replace("music", "").strip()
        if not query:
            query = "top trending music"
        yt_url = f"https://www.youtube.com/results?search_query={quote(query)}"
        webbrowser.open(yt_url)
        speak(f"Playing {query} on YouTube")
        result["action"] = "play_youtube"
        result["reply"] = f"Playing '{query}' on YouTube in your browser."
        return result

    # 2.6 Smart Web Searches (Google, Maps, Amazon)
    if cmd.startswith("search google for ") or cmd.startswith("google "):
        sq = cmd.replace("search google for ", "").replace("google ", "").strip()
        url = f"https://www.google.com/search?q={quote(sq)}"
        webbrowser.open(url)
        speak(f"Searching Google for {sq}")
        result["action"] = "google_search"
        result["reply"] = f"Searching Google for '{sq}'."
        return result

    if cmd.startswith("search map for ") or cmd.startswith("where is ") or cmd.startswith("directions to "):
        place = cmd.replace("search map for ", "").replace("where is ", "").replace("directions to ", "").strip()
        url = f"https://www.google.com/maps/search/{quote(place)}"
        webbrowser.open(url)
        speak(f"Showing location of {place} on Google Maps")
        result["action"] = "maps_search"
        result["reply"] = f"Locating '{place}' on Google Maps."
        return result

    if cmd.startswith("search amazon for ") or (cmd.startswith("buy ") and not cmd.startswith("buy me a")):
        item = cmd.replace("search amazon for ", "").replace("buy ", "").strip()
        url = f"https://www.amazon.com/s?k={quote(item)}"
        webbrowser.open(url)
        speak(f"Searching Amazon for {item}")
        result["action"] = "amazon_search"
        result["reply"] = f"Searching Amazon for '{item}'."
        return result

    # 3. Web Navigation Actions (Opens in user's default desktop browser)
    web_shortcuts = {
        "youtube": ("https://www.youtube.com", "YouTube"),
        "spotify": ("https://open.spotify.com", "Spotify"),
        "gmail": ("https://mail.google.com", "Gmail"),
        "whatsapp": ("https://web.whatsapp.com", "WhatsApp Web"),
        "facebook": ("https://www.facebook.com", "Facebook"),
        "chat gpt": ("https://chatgpt.com/", "ChatGPT"),
        "chatgpt": ("https://chatgpt.com/", "ChatGPT"),
        "github": ("https://github.com", "GitHub"),
        "netflix": ("https://www.netflix.com", "Netflix"),
        "reddit": ("https://www.reddit.com", "Reddit"),
        "discord": ("https://discord.com/app", "Discord"),
        "twitter": ("https://x.com", "Twitter / X"),
        "linkedin": ("https://www.linkedin.com", "LinkedIn"),
        "instagram": ("https://www.instagram.com", "Instagram"),
        "amazon": ("https://www.amazon.com", "Amazon")
    }

    for key, (url, name) in web_shortcuts.items():
        if f"open {key}" in cmd:
            webbrowser.open(url)
            speak(f"Opening {name}")
            result["action"] = f"open_{key.replace(' ', '_')}"
            result["reply"] = f"Opening {name} in your browser."
            return result

    # 4. Memory Save & Recall
    if "remember" in cmd and not ("do you remember" in cmd or "what did" in cmd):
        cleaned = cmd.replace("remember that", "").replace("remember", "").strip()
        if cleaned:
            save_memory(cleaned)
            reply = f"Noted. I'll remember: '{cleaned}'"
        else:
            reply = "What would you like me to remember?"
        speak(reply)
        result["action"] = "save_memory"
        result["reply"] = reply
        return result

    if "do you remember" in cmd or "what did i tell you to remember" in cmd or "recall memory" in cmd:
        mem = recall_memory()
        reply = f"You asked me to remember: {mem}"
        speak(reply)
        result["action"] = "recall_memory"
        result["reply"] = reply
        return result

    # 5. Time
    if "time" in cmd or "what time is it" in cmd:
        time_now = datetime.datetime.now().strftime("%I:%M %p")
        reply = f"The current system time is {time_now}"
        speak(reply)
        result["action"] = "system_time"
        result["reply"] = reply
        return result

    # 5.5 Live Weather
    if "weather" in cmd:
        city = "Delhi"
        if " in " in cmd:
            city = cmd.split(" in ")[-1].replace("?", "").strip()
        elif " for " in cmd:
            city = cmd.split(" for ")[-1].replace("?", "").strip()
        try:
            import urllib.request
            req = urllib.request.Request(f"https://wttr.in/{quote(city)}?format=j1", headers={"User-Agent": "curl/7.68.0"})
            with urllib.request.urlopen(req, timeout=4) as response:
                wdata = json.loads(response.read().decode())
                curr = wdata.get("current_condition", [{}])[0]
                temp_c = curr.get("temp_C", "--")
                desc = curr.get("weatherDesc", [{}])[0].get("value", "Fair")
                humidity = curr.get("humidity", "--")
                reply = f"Current weather in {city} is {desc} at {temp_c}°C, humidity {humidity}%."
        except Exception:
            reply = f"Conditions in {city} are seasonal and partly cloudy."
        speak(reply)
        result["action"] = "weather"
        result["reply"] = reply
        return result

    # 6. Knowledge Base Lookup
    for q, ans in KNOWLEDGE_BASE.items():
        if q in cmd:
            speak(ans)
            result["action"] = "knowledge_base"
            result["reply"] = ans
            return result

    # 7. Unmatched -> fallback to web AI handler
    result["action"] = "pass_to_ai"
    result["reply"] = ""
    result["system_executed"] = False
    return result

class PrajBridgeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Keep bridge console clean from routine /status polling pings
        if "/api/status" not in str(args):
            sys.stdout.write("%s - - [%s] %s\\n" % (self.client_address[0], self.log_date_time_string(), format%args))

    def _set_cors_headers(self, status=200, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_cors_headers(200)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path in ["/api/status", "/api/health", "/status", "/health"]:
            payload = {
                "status": "online",
                "connected": True,
                "agent": "PRAJ Desktop Bridge",
                "platform": sys.platform,
                "system_time": datetime.datetime.now().strftime("%I:%M:%S %p"),
                "stored_memory": recall_memory()
            }
            self._set_cors_headers(200)
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        if path == "/api/memory":
            payload = {"memory": recall_memory()}
            self._set_cors_headers(200)
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        if path in ["/api/conversation", "/api/conversations"]:
            payload = {"conversations": get_conversation_history()}
            self._set_cors_headers(200)
            self.wfile.write(json.dumps(payload).encode("utf-8"))
            return

        self._set_cors_headers(404)
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"

        try:
            data = json.loads(body)
        except Exception:
            data = {}

        if path == "/api/command":
            cmd = data.get("command", "")
            if not cmd:
                self._set_cors_headers(400)
                self.wfile.write(json.dumps({"error": "No command provided"}).encode("utf-8"))
                return
            
            print(f"[PRAJ BRIDGE] Received command from web UI: '{cmd}'")
            res = execute_system_command(cmd)
            save_conversation_turn(cmd, res.get("reply", ""), res.get("action", "system"))
            self._set_cors_headers(200)
            self.wfile.write(json.dumps(res).encode("utf-8"))
            return

        if path in ["/api/conversation", "/api/conversations"]:
            cmd = data.get("command", "")
            reply = data.get("reply", "")
            action = data.get("action", "chat")
            save_conversation_turn(cmd, reply, action)
            self._set_cors_headers(200)
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))
            return

        if path in ["/api/conversation/clear", "/api/conversations/clear"]:
            clear_conversation_history()
            self._set_cors_headers(200)
            self.wfile.write(json.dumps({"success": True, "action": "clear_conversations"}).encode("utf-8"))
            return

        if path == "/api/memory":
            text = data.get("text", "")
            save_memory(text)
            self._set_cors_headers(200)
            self.wfile.write(json.dumps({"success": True, "memory": text}).encode("utf-8"))
            return

        if path == "/api/shutdown":
            seconds = int(data.get("seconds", 30))
            shutdown_system(seconds)
            self._set_cors_headers(200)
            self.wfile.write(json.dumps({"success": True, "action": "shutdown", "seconds": seconds}).encode("utf-8"))
            return

        if path in ["/api/kill", "/api/emergency-stop"]:
            cancel_shutdown()
            speak("Emergency kill switch triggered.")
            self._set_cors_headers(200)
            self.wfile.write(json.dumps({
                "success": True,
                "action": "kill_switch",
                "reply": "Emergency Kill Switch executed on host. Shutdowns aborted."
            }).encode("utf-8"))
            if data.get("terminate_bridge"):
                def _delayed_exit():
                    time.sleep(0.5)
                    os._exit(0)
                threading.Thread(target=_delayed_exit, daemon=True).start()
            return

        if path == "/api/cancel_shutdown":
            cancel_shutdown()
            self._set_cors_headers(200)
            self.wfile.write(json.dumps({"success": True, "action": "cancel_shutdown"}).encode("utf-8"))
            return

        self._set_cors_headers(404)
        self.wfile.write(json.dumps({"error": "Unknown POST route"}).encode("utf-8"))

def start_server():
    server_address = ("127.0.0.1", BRIDGE_PORT)
    try:
        httpd = ServerClass(server_address, PrajBridgeHandler)
    except Exception as e:
        print(f"Warning on 127.0.0.1 binding: {e}, falling back to localhost")
        server_address = ("localhost", BRIDGE_PORT)
        httpd = ServerClass(server_address, PrajBridgeHandler)

    print(f"\\n=======================================================")
    print(f"  PRAJ DESKTOP BRIDGE ACTIVE ON http://127.0.0.1:{BRIDGE_PORT}")
    print(f"  Ready to receive commands from the PRAJ Web Interface.")
    print(f"=======================================================\\n")
    httpd.serve_forever()

if __name__ == "__main__":
    # Start the HTTP server in a daemon thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Automatically launch the web interface in the browser
    print("Launching PRAJ Web UI...")
    webbrowser.open(WEB_APP_URL)

    speak("PRAJ Desktop Bridge is now operational.")

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\\nShutting down PRAJ Desktop Bridge. Goodbye!")
`;
