"""
=============================================================================
PRAJ DESKTOP SYSTEM AGENT & WEB BRIDGE
=============================================================================
Run this script on your personal computer:
    python praj_desktop_bridge.py

Features:
- Executes real OS commands (Chrome, Notepad, VLC, Notepad++, Bluetooth, etc.)
- Controls System Shutdown & Cancel Shutdown ("Arise")
- Local Persistent Memory & Offline Physics / GK Knowledge Base
- Zero extra dependencies required for HTTP server (uses standard Python library)
- Optional voice I/O via pyttsx3, speech_recognition, sounddevice, wavio
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
from urllib.parse import urlparse, parse_qs

# Multithreaded HTTP server so pings never block
try:
    from http.server import ThreadingHTTPServer as ServerClass, BaseHTTPRequestHandler
except ImportError:
    from http.server import HTTPServer, BaseHTTPRequestHandler
    from socketserver import ThreadingMixIn
    class ThreadingHTTPServer(ThreadingMixIn, HTTPServer):
        daemon_threads = True
    ServerClass = ThreadingHTTPServer

# Optional libraries for voice/audio (gracefully fall back if not installed)
try:
    import pyttsx3
    def _speak_worker(text):
        try:
            engine = pyttsx3.init()
            engine.setProperty('rate', 175)
            engine.say(text)
            engine.runAndWait()
        except Exception as e:
            print("TTS error:", e)

    def speak(text):
        print(f"PRAJ: {text}")
        t = threading.Thread(target=_speak_worker, args=(text,), daemon=True)
        t.start()
except Exception:
    def speak(text):
        print(f"PRAJ (voice output): {text}")

# Target Web App URL (change if hosted remotely or use AI Studio URL)
WEB_APP_URL = "http://localhost:3000"
BRIDGE_PORT = 5000
MEMORY_FILE = "temp_memory.txt"

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

def execute_system_command(raw_command):
    cmd = raw_command.lower().strip()
    result = {
        "command": raw_command,
        "action": "unknown",
        "reply": "",
        "success": True,
        "system_executed": True
    }

    # 1. Shutdown & Cancel Shutdown
    if "arise" in cmd or "cancel shutdown" in cmd:
        cancel_shutdown()
        result["action"] = "cancel_shutdown"
        result["reply"] = "Shutdown canceled. PRAJ stands ready."
        return result

    if "shutdown" in cmd:
        digits = "".join(filter(str.isdigit, cmd))
        seconds = int(digits) if digits else 30
        shutdown_system(seconds)
        result["action"] = "shutdown"
        result["reply"] = f"Initiating system shutdown in {seconds} seconds. Say 'Arise' to cancel."
        return result

    # 2. Local Applications
    if "open notepad++" in cmd or "open notepad plus plus" in cmd:
        paths = [
            "C:\\Program Files\\Notepad++\\notepad++.exe",
            "C:\\Program Files (x86)\\Notepad++\\notepad++.exe"
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
            "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            os.path.expanduser("~\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe")
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
            "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
            "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe"
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

    # 3. Web Navigation Actions (Opens in user's default desktop browser)
    web_shortcuts = {
        "youtube": ("https://www.youtube.com", "YouTube"),
        "spotify": ("https://open.spotify.com", "Spotify"),
        "gmail": ("https://mail.google.com", "Gmail"),
        "whatsapp": ("https://web.whatsapp.com", "WhatsApp Web"),
        "facebook": ("https://www.facebook.com", "Facebook"),
        "chat gpt": ("https://chatgpt.com/", "ChatGPT"),
        "chatgpt": ("https://chatgpt.com/", "ChatGPT"),
        "github": ("https://github.com", "GitHub")
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
            sys.stdout.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format%args))

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
            self._set_cors_headers(200)
            self.wfile.write(json.dumps(res).encode("utf-8"))
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

    print(f"\n=======================================================")
    print(f"  PRAJ DESKTOP BRIDGE ACTIVE ON http://127.0.0.1:{BRIDGE_PORT}")
    print(f"  Ready to receive commands from the PRAJ Web Interface.")
    print(f"=======================================================\n")
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
        print("\nShutting down PRAJ Desktop Bridge. Goodbye!")
