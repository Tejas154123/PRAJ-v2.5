# PRAJ — Voice & Desktop AI Assistant

A full-stack, voice-enabled assistant with native operating system controls. PRAJ combines a futuristic web dashboard with a local desktop agent (`praj_desktop_bridge.py`), allowing typed and spoken commands to execute real actions on your computer (opening apps, setting power states, taking notes) without the web browser refusing or saying *"I am a web based AI, I can't do that"*.

PRAJ operates in **Dual-Mode**:
1. **Offline Zero-API Mode**: Complete offline support for 60+ physics laws, general knowledge, system time, memory management (`temp_memory.txt`), and desktop app execution without an API key.
2. **Hybrid AI Mode**: Server-side proxy with Google Gemini 3.8 Flash for answering open-ended conversational questions concisely and speaking them aloud.

---

## Architecture Overview

```
                      +--------------------------------------+
                      |      Browser Voice / Web UI          |
                      |   (React 19 + Tailwind CSS + Vite)   |
                      +-------------------+------------------+
                                          |
                      +-------------------+------------------+
                      |                                      |
                      v                                      v
          +-----------------------+              +-----------------------+
          | Express Backend       |              | Python Desktop Bridge |
          | (localhost:3000)      |              | (localhost:5000)      |
          | - Vite Asset Serving  |              | - OS App Launching    |
          | - Gemini API Proxy    |              | - System Shutdown     |
          | - News & Wikipedia    |              | - Local Memory I/O    |
          +-----------------------+              +-----------------------+
                                                             |
                                                             v
                                                 +-----------------------+
                                                 | Your Host Computer    |
                                                 | Chrome, Notepad, VLC, |
                                                 | Notepad++, Bluetooth  |
                                                 +-----------------------+
```

---

## Project Structure

```
├── praj_desktop_bridge.py      # Standalone Python agent for host OS controls (localhost:5000)
├── server.ts                   # Express full-stack backend with Vite middleware & Gemini proxy
├── index.html                  # HTML entry point with metadata, fonts & viewport configuration
├── package.json                # Dependencies, dev scripts & build pipeline
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite & Tailwind CSS plugins
├── metadata.json               # Platform permissions and AI studio config
├── .env.example                # Template for environment variables (GEMINI_API_KEY)
└── src/
    ├── main.tsx                # React client entry point
    ├── App.tsx                 # Core application coordinator & state engine
    ├── index.css               # Tailwind CSS setup
    ├── types.ts                # TypeScript interfaces (BridgeStatus, CommandResult, etc.)
    ├── components/
    │   ├── Header.tsx          # System bar, bridge status indicator, quick modals
    │   ├── VoiceVisualizer.tsx # Arc reactor core, live audio waveform, mic toggle
    │   ├── CommandInput.tsx    # Text input, wake-word loop ("PRAJ" / "Arise"), chip suggestions
    │   ├── ResponseCard.tsx    # Response readout, speech synthesizer, shutdown alert
    │   ├── QuickActions.tsx    # 1-click action deck for Desktop Apps, Web, Power, and Memory
    │   ├── SystemLog.tsx       # Real-time telemetry log terminal & execution monitor
    │   ├── BridgeSetupModal.tsx# 1-click download, copy code & live ping tester
    │   ├── MemoryModal.tsx     # Persistent local memory inspector & editor
    │   └── KnowledgeModal.tsx  # 60+ offline physics, geography, and science browser
    ├── data/
    │   ├── knowledgeBase.ts    # Built-in offline Q&A dataset (Zero-API)
    │   └── pythonBridgeScript.ts# Embedded Python source for in-app download
    └── utils/
        ├── bridgeClient.ts     # HTTP client for communicating with praj_desktop_bridge.py
        └── speech.ts           # Web Speech API synthesizer & Web Audio API sound chimes
```

---

## Quick Start (Run Locally)

### Prerequisites
- **Node.js**: v18 or later
- **Python**: v3.8 or later (standard library only; no extra pip packages required for basic bridging)

---

### Step 1: Run the Web & Server Application

1. Clone or download this repository:
   ```bash
   git clone https://github.com/your-username/praj-assistant.git
   cd praj-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Set up your Gemini API key for hybrid conversational AI:
   ```bash
   cp .env.example .env
   ```
   Add your API key into `.env`:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
   *(Note: PRAJ works 100% fine without an API key using the built-in offline engine).*

4. Start the application in development mode:
   ```bash
   npm run dev
   ```
   The web interface will be accessible at: **`http://localhost:3000`**

---

### Step 2: Run the Local Desktop Bridge (Host OS Controls)

To enable PRAJ to launch real applications on your machine (like Chrome, Notepad, VLC, etc.) and handle OS actions:

1. Open a terminal in the project directory:
   ```bash
   python praj_desktop_bridge.py
   ```

2. What this script does:
   - Starts a lightweight local HTTP bridge at `http://127.0.0.1:5000`
   - Automatically opens your web browser to `http://localhost:3000`
   - Connects to the PRAJ dashboard (you'll see the status badge turn green: **Host PC Linked**)
   - Listens for command dispatches (e.g. `open chrome`, `shutdown 30`, `arise`, `remember ...`)

*(Optional)* For native spoken voice output through Python's text-to-speech engine:
```bash
pip install pyttsx3
```

---

## Supported Commands

### Desktop Apps (Runs on your PC)
- `"open chrome"` — Launches Google Chrome on host PC
- `"open notepad"` — Opens Windows Notepad / TextEdit
- `"open vlc"` — Launches VLC Media Player
- `"open notepad++"` — Launches Notepad++
- `"open bluetooth"` — Opens Windows Bluetooth settings
- `"open calculator"` — Opens native system calculator

### Web Portals
- `"open youtube"` — Opens YouTube
- `"open spotify"` — Opens Spotify
- `"open whatsapp"` — Opens WhatsApp Web
- `"open gmail"` — Opens Google Mail
- `"open chat gpt"` — Opens ChatGPT

### System Power & Time
- `"what time is it"` — Reads current system time
- `"shutdown 30"` — Schedules host computer shutdown in 30 seconds
- `"arise"` or `"cancel shutdown"` — Immediately aborts scheduled shutdown

### Memory
- `"remember [note]"` — Stores a note in local `temp_memory.txt`
- `"do you remember"` — Recalls the saved note

### Offline Knowledge (Zero-API)
- *"What is Newton's first law?"*
- *"What is Newton's second law?"*
- *"Who is the prime minister of India?"*
- *"Capital of France?"*
- And over 60+ science, geography, and general knowledge questions!

---

## Putting on GitHub

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: PRAJ Voice & Desktop AI Assistant"
   ```

2. Create a repository on GitHub (e.g., `praj-assistant`).

3. Link and push:
   ```bash
   git remote add origin https://github.com/your-username/praj-assistant.git
   git branch -M main
   git push -u origin main
   ```

---

## Production Build

To build the project for production deployment:
```bash
npm run build
npm start
```
This builds the client assets with Vite and compiles the custom Express server with `esbuild` into `dist/server.cjs`.
                               or
   for deployment:  npm.cmd run dev  
   for starting the bridge  :   python praj_desktop_bridge.py

   Make sure both the files are in the same folder and the powershell is running in that folder only
   
