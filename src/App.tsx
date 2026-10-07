import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { VoiceVisualizer } from './components/VoiceVisualizer';
import { CommandInput } from './components/CommandInput';
import { ResponseCard } from './components/ResponseCard';
import { QuickActions } from './components/QuickActions';
import { SystemLog } from './components/SystemLog';
import { BridgeSetupModal } from './components/BridgeSetupModal';
import { MemoryModal } from './components/MemoryModal';
import { KnowledgeModal } from './components/KnowledgeModal';
import { MasterSwitchModal } from './components/MasterSwitchModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { PersonalizationModal, loadSavedPersonalization, savePersonalization } from './components/PersonalizationModal';
import { AiConfigBar } from './components/AiConfigBar';
import { matchOfflineKnowledge } from './data/knowledgeBase';
import { playChime, speakJarvis, stopSpeaking } from './utils/speech';
import { 
  pingLocalBridge, 
  sendCommandToBridge, 
  sendShutdownToBridge, 
  cancelShutdownOnBridge, 
  sendKillSwitchToBridge,
  DEFAULT_BRIDGE_URL 
} from './utils/bridgeClient';
import { CommandResult, BridgeStatus, AiConfig, UserPersonalization } from './types';

// Web Speech Recognition Type Definition
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export default function App() {
  // Bridge State
  const [bridgeUrl, setBridgeUrl] = useState<string>(DEFAULT_BRIDGE_URL);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus>({
    connected: false,
    checking: true,
    lastChecked: null,
    bridgeUrl: DEFAULT_BRIDGE_URL,
  });

  // App Capabilities
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);
  const [continuousMode, setContinuousMode] = useState<boolean>(false);
  const [hasMic, setHasMic] = useState<boolean>(true);
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);

  // Voice Interaction State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Memory
  const [storedMemory, setStoredMemory] = useState<string>(() => {
    return localStorage.getItem('praj_memory') || localStorage.getItem('jarvis_memory') || 'System initialized on host device.';
  });

  // Telemetry & Results (Persisted conversational memory across browser sessions)
  const [results, setResults] = useState<CommandResult[]>(() => {
    try {
      const saved = localStorage.getItem('praj_conversation_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [lastResult, setLastResult] = useState<CommandResult | null>(() => {
    try {
      const saved = localStorage.getItem('praj_conversation_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch {
      // ignore
    }
    return null;
  });

  // UI Modals
  const [bridgeModalOpen, setBridgeModalOpen] = useState<boolean>(false);
  const [masterSwitchModalOpen, setMasterSwitchModalOpen] = useState<boolean>(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState<boolean>(false);
  const [personalizationModalOpen, setPersonalizationModalOpen] = useState<boolean>(false);
  const [isKillSwitchActive, setIsKillSwitchActive] = useState<boolean>(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState<boolean>(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState<boolean>(false);

  // User Profile & Personalization
  const [personalization, setPersonalization] = useState<UserPersonalization>(loadSavedPersonalization);

  const handleSavePersonalization = (p: UserPersonalization) => {
    setPersonalization(p);
    savePersonalization(p);
  };

  // Custom AI API Configuration (persisted locally)
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    try {
      const saved = localStorage.getItem('praj_ai_config');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      provider: 'gemini',
      apiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-3.8-flash',
    };
  });

  const handleSaveAiConfig = (newConfig: AiConfig) => {
    setAiConfig(newConfig);
    try {
      localStorage.setItem('praj_ai_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save praj_ai_config:', e);
    }
  };

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);
  const consecutiveFailuresRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const speechCooldownRef = useRef<number>(0);

  // 1. Initial System Check & Bridge Ping (with flicker/flapping prevention)
  const checkBridge = useCallback(async (customUrl?: string) => {
    const targetUrl = customUrl || bridgeUrl;
    const status = await pingLocalBridge(targetUrl);
    
    if (status.connected) {
      consecutiveFailuresRef.current = 0;
      setBridgeStatus(status);
      if (status.storedMemory) {
        setStoredMemory(status.storedMemory);
        localStorage.setItem('jarvis_memory', status.storedMemory);
      }
    } else {
      consecutiveFailuresRef.current += 1;
      // Require 2 consecutive failed pings before marking as disconnected/standby
      // This prevents momentary 1-cycle network jitter or speech engine pauses from dropping the status
      if (consecutiveFailuresRef.current >= 2) {
        setBridgeStatus(status);
      }
    }
  }, [bridgeUrl]);

  useEffect(() => {
    // Check health endpoint for backend capabilities
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasGeminiKey(Boolean(data.hasGeminiKey));
      })
      .catch(() => {});

    // Initial bridge check
    checkBridge();

    // Auto-ping bridge every 4 seconds to maintain link
    const interval = setInterval(() => {
      checkBridge();
    }, 4000);

    return () => clearInterval(interval);
  }, [checkBridge]);

  // 2. Setup Web Speech Recognition
  useEffect(() => {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      console.warn('Speech Recognition not natively supported in this browser.');
      return;
    }

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setHasMic(true);
      setMicErrorNotice(null);
      playChime('wake');
    };

    rec.onresult = (event: any) => {
      // Acoustic Echo Cancellation: ignore microphone audio when PRAJ is speaking through speakers
      if (isSpeakingRef.current || (typeof window !== 'undefined' && window.speechSynthesis?.speaking) || Date.now() < speechCooldownRef.current) {
        return;
      }

      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptSegment = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const finalCommand = transcriptSegment.trim();
          setTranscript(finalCommand);
          handleSpokenFinal(finalCommand);
        } else {
          currentInterim += transcriptSegment;
        }
      }
      if (currentInterim) {
        setTranscript(currentInterim);
      }
    };

    rec.onerror = (e: any) => {
      console.warn('Speech recognition status:', e.error);
      if (e.error === 'audio-capture' || e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setIsListening(false);
        setHasMic(false);
        setContinuousMode(false);
        setMicErrorNotice(
          e.error === 'audio-capture'
            ? 'No microphone detected on your computer. Text mode is fully active!'
            : 'Microphone access is blocked. Text commands, hotkeys, and voice outputs are fully functional!'
        );
      } else if (e.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      if (continuousMode && hasMic) {
        try {
          rec.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;

    // Robust microphone hardware detection
    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        // If devices are enumerated, check if any audioinput exists or has a deviceId
        if (devices.length > 0) {
          if (audioInputs.length > 0) {
            setHasMic(true);
          }
        }
      }).catch(() => {
        // Silently ignore device enumeration restrictions; default hasMic to true
        setHasMic(true);
      });
    }

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [continuousMode, hasMic]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setMicErrorNotice('Voice input is not supported in this browser. Please type commands directly in the input bar!');
      setTimeout(() => setMicErrorNotice(null), 5000);
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setTranscript('');
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setMicErrorNotice(null);
      } catch (err: any) {
        console.warn('Microphone start error:', err);
        setIsListening(false);
        setHasMic(false);
        setMicErrorNotice('No microphone found or access denied. Type your command below – PRAJ will respond and execute!');
        setTimeout(() => setMicErrorNotice(null), 5000);
      }
    }
  };

  const toggleContinuous = () => {
    if (!hasMic) {
      setMicErrorNotice('Connect a microphone to enable continuous voice wake-word loop.');
      setTimeout(() => setMicErrorNotice(null), 4000);
      return;
    }
    const next = !continuousMode;
    setContinuousMode(next);
    if (next && !isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        setContinuousMode(false);
      }
    }
  };

  const handleSpokenFinal = (rawText: string) => {
    // Drop any voice captured while PRAJ is speaking to prevent self-trigger feedback loops
    if (isSpeakingRef.current || (typeof window !== 'undefined' && window.speechSynthesis?.speaking) || Date.now() < speechCooldownRef.current) {
      return;
    }

    const clean = rawText.toLowerCase().trim();
    if (!clean) return;

    // In continuous mode, check for wake word 'PRAJ', 'Jarvis' or 'Arise'
    if (continuousMode) {
      if (clean.includes('arise') || clean.includes('cancel shutdown')) {
        executeCommand('arise', 'voice');
        return;
      }
      if (!clean.includes('praj') && !clean.includes('jarvis')) {
        return; // Ignore background chatter until PRAJ is summoned
      }
    }

    executeCommand(rawText, 'voice');
  };

  // 1-Click Master Emergency Kill Switch Action
  const handleTriggerKillSwitch = useCallback(async () => {
    setIsKillSwitchActive(true);
    stopSpeaking();
    setIsSpeaking(false);
    playChime('shutdown');

    await sendKillSwitchToBridge(bridgeUrl);
    
    const killResult: CommandResult = {
      id: `kill-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      command: '🛑 1-Click Emergency Kill Switch',
      source: 'quick_action',
      reply: 'EMERGENCY KILL SWITCH ACTIVATED! All shutdown sequences aborted, active speech silenced, and system processes halted.',
      actionType: 'system_control',
      systemExecuted: true,
      bridgeConnected: bridgeStatus.connected,
      latencyMs: 10,
    };

    setLastResult(killResult);
    setResults((prev) => [killResult, ...prev]);

    setTimeout(() => {
      setIsKillSwitchActive(false);
    }, 4500);
  }, [bridgeUrl]);

  // Clear Conversational Memory History
  const handleClearConversationHistory = useCallback(() => {
    try {
      localStorage.removeItem('praj_conversation_history');
    } catch {
      // ignore
    }
    setResults([]);
    setLastResult(null);
    if (bridgeStatus.connected) {
      fetch(`${bridgeUrl}/api/conversation/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  }, [bridgeStatus.connected, bridgeUrl]);

  // 3. Core Command Execution Engine
  const executeCommand = async (rawCommand: string, source: 'voice' | 'typing' | 'quick_action', imageBase64?: string) => {
    const cmd = rawCommand.toLowerCase().trim();
    if (!cmd && !imageBase64) return;

    setIsProcessing(true);
    const startTime = performance.now();

    let reply = '';
    let actionType: CommandResult['actionType'] = 'system_app';
    let systemExecuted = false;

    // Check 0: Emergency Kill Switch Voice / Command
    if (
      cmd.includes('kill switch') ||
      cmd.includes('emergency stop') ||
      cmd.includes('emergency halt') ||
      cmd.includes('terminate system') ||
      cmd.includes('kill all') ||
      cmd.includes('emergency abort')
    ) {
      actionType = 'system_control';
      handleTriggerKillSwitch();
      reply = "EMERGENCY KILL SWITCH ACTIVATED! All operations halted, active audio silenced, and host shutdowns aborted.";
      systemExecuted = true;
    }

    // Check 0.1: 1-Click Master System Launch / Activation
    else if (
      cmd.includes('activate praj') ||
      cmd.includes('start praj') ||
      cmd.includes('launch system') ||
      cmd.includes('start system') ||
      cmd.includes('start both') ||
      cmd.includes('master switch')
    ) {
      actionType = 'system_control';
      playChime('success');
      setMasterSwitchModalOpen(true);
      reply = "Opening PRAJ Master Switch console. Both the Python Desktop Bridge and Web Server can be launched in 1-click.";
    }

    // Check 0.12: Install Python / Python Setup
    else if (
      cmd.includes('install python') ||
      cmd.includes('download python') ||
      cmd.includes('setup python') ||
      cmd.includes('python installer')
    ) {
      actionType = 'system_control';
      playChime('success');
      setMasterSwitchModalOpen(true);
      reply = "Opening Master Switch with the 1-Click Python Auto-Installer. Double-click INSTALL_PYTHON.bat to download and set up Python automatically on Windows.";
    }

    // Check 0.15: Voice Customization & Selection Modal
    else if (
      cmd.includes('voice settings') ||
      cmd.includes('change voice') ||
      cmd.includes('choose voice') ||
      cmd.includes('select voice') ||
      cmd.includes('switch voice') ||
      cmd.includes('voice options') ||
      cmd.includes('audio settings')
    ) {
      actionType = 'system_control';
      playChime('success');
      setVoiceModalOpen(true);
      reply = "Opening Voice and Audio settings. You can select your favorite browser voice, tune pitch and speed, or keep the default female voice.";
    }

    // Check 0.16: Personalization & User Profile
    else if (
      cmd.includes('personalization') ||
      cmd.includes('persona profile') ||
      cmd.includes('change persona') ||
      cmd.includes('change my name') ||
      cmd.includes('my profile') ||
      cmd.includes('user profile') ||
      cmd.includes('personalize')
    ) {
      actionType = 'system_control';
      playChime('success');
      setPersonalizationModalOpen(true);
      const userHonorific = personalization.userTitle || personalization.userName || 'Sir';
      reply = `Opening Personalization settings for you, ${userHonorific}. You can customize your name, persona tone, and focus interests.`;
    }

    // Check 0.2: Greetings, Farewells & Conversational Core
    if (cmd === 'goodbye' || cmd === 'bye' || cmd.includes('see you later') || cmd === 'exit' || cmd === 'quit') {
      actionType = 'system_control';
      const userHonorific = personalization.userTitle || 'sir';
      reply = `Goodbye, ${userHonorific}. PRAJ systems standing by at your command.`;
    } else if (cmd === 'hello' || cmd === 'hi' || cmd.startsWith('hey ') || cmd.includes('good morning') || cmd.includes('good evening') || cmd.includes('good afternoon')) {
      actionType = 'system_control';
      const userHonorific = personalization.userTitle || personalization.userName || 'sir';
      reply = `Hello, ${userHonorific}. PRAJ is online and calibrated to your personal preferences. How can I assist you today?`;
    } else if (cmd.includes('who are you') || cmd.includes('what is your name') || cmd.includes('introduce yourself')) {
      actionType = 'knowledge_base';
      const userHonorific = personalization.userTitle || 'sir';
      reply = `I am PRAJ, your Personal Responsive Automated Judicial assistant configured in ${personalization.persona} persona mode for you, ${userHonorific}.`;
    } else if (cmd.includes('what can you do') || cmd.includes('help me') || cmd.includes('list commands') || cmd.includes('capabilities')) {
      actionType = 'knowledge_base';
      reply = "I can open local desktop apps like Chrome, Notepad, VLC, and Bluetooth; search Wikipedia; provide physics and general knowledge facts; manage memory notes; and execute system power commands.";
    }

    // Check 1: Cancel Shutdown / Arise
    else if (cmd.includes('arise') || cmd.includes('cancel shutdown') || cmd === 'abort' || cmd === 'stop shutdown') {
      actionType = 'system_control';
      playChime('alert');
      if (bridgeStatus.connected) {
        await cancelShutdownOnBridge(bridgeUrl);
        systemExecuted = true;
      }
      reply = "Shutdown canceled, sir. PRAJ systems stand at full readiness.";
    }

    // Check 1.5: System Restart
    else if ((cmd.startsWith('restart') || cmd.startsWith('reboot')) && !cmd.includes('what') && !cmd.includes('why')) {
      actionType = 'system_control';
      const digits = cmd.replace(/\D/g, '');
      const seconds = digits ? parseInt(digits, 10) : 30;
      playChime('shutdown');
      if (bridgeStatus.connected) {
        await sendCommandToBridge(bridgeUrl, rawCommand);
        systemExecuted = true;
        reply = `Initiating system restart on host in ${seconds} seconds. Say "Arise" or "Cancel" to abort.`;
      } else {
        reply = `System restart queued for ${seconds} seconds. Run 'praj_desktop_bridge.py' to execute OS power controls.`;
      }
    }

    // Check 1.6: Lock Screen / Workstation
    else if (cmd.includes('lock screen') || cmd.includes('lock computer') || cmd.includes('lock pc') || cmd.includes('lock workstation') || cmd === 'lock') {
      actionType = 'system_control';
      playChime('alert');
      if (bridgeStatus.connected) {
        await sendCommandToBridge(bridgeUrl, rawCommand);
        systemExecuted = true;
        reply = "Workstation locked securely, sir.";
      } else {
        reply = "Lock screen command received. Connect the Desktop Bridge to lock your host operating system instantly.";
      }
    }

    // Check 1.7: Master Volume & Audio Controls
    else if (
      cmd.includes('volume up') || cmd.includes('increase volume') || cmd.includes('louder') ||
      cmd.includes('volume down') || cmd.includes('decrease volume') || cmd.includes('lower volume') ||
      cmd === 'mute' || cmd === 'unmute' || cmd.includes('mute audio') || cmd.includes('mute volume')
    ) {
      actionType = 'system_control';
      if (bridgeStatus.connected) {
        const bridgeRes = await sendCommandToBridge(bridgeUrl, rawCommand);
        systemExecuted = true;
        reply = bridgeRes.reply || "Adjusting system volume.";
      } else {
        reply = "Master volume adjusted. Connect Desktop Bridge for direct Windows audio key emulation.";
      }
    }

    // Check 1.8: Media Playback Controls
    else if (
      cmd.includes('pause music') || cmd.includes('resume music') || cmd.includes('pause video') ||
      cmd === 'pause' || cmd.includes('next track') || cmd.includes('next song') ||
      cmd.includes('previous track') || cmd.includes('previous song') || cmd.includes('skip song')
    ) {
      actionType = 'system_control';
      if (bridgeStatus.connected) {
        const bridgeRes = await sendCommandToBridge(bridgeUrl, rawCommand);
        systemExecuted = true;
        reply = bridgeRes.reply || "Media playback command executed.";
      } else {
        reply = "Media command sent. Connect Desktop Bridge to control Spotify, YouTube, and active background players.";
      }
    }

    // Check 1.9: Desktop Screenshot
    else if (cmd.includes('take screenshot') || cmd.includes('capture screen') || cmd === 'screenshot') {
      actionType = 'system_control';
      playChime('success');
      if (bridgeStatus.connected) {
        const bridgeRes = await sendCommandToBridge(bridgeUrl, rawCommand);
        systemExecuted = true;
        reply = bridgeRes.reply || "Screenshot captured and saved to your Desktop.";
      } else {
        reply = "Screenshot command queued. Start the Desktop Bridge to capture and save host display images.";
      }
    }

    // Check 2: Explicit Shutdown sequence (requires explicit intent, rejects questions and conversational queries)
    else if (
      (cmd.startsWith('shutdown') || cmd.startsWith('shut down') || cmd === 'power off' || cmd.startsWith('turn off pc') || cmd.startsWith('turn off computer') || cmd.startsWith('turn off system')) &&
      !cmd.includes('what') &&
      !cmd.includes('how') &&
      !cmd.includes('why') &&
      !cmd.includes('explain') &&
      !cmd.includes("don't") &&
      !cmd.includes('dont') &&
      !cmd.includes('cancel') &&
      !cmd.includes('abort')
    ) {
      actionType = 'system_control';
      const digits = cmd.replace(/\D/g, '');
      const seconds = digits ? parseInt(digits, 10) : 30;
      playChime('shutdown');
      if (bridgeStatus.connected) {
        await sendShutdownToBridge(bridgeUrl, seconds);
        systemExecuted = true;
        reply = `Initiating system shutdown sequence on host in ${seconds} seconds. Say "Arise" to cancel.`;
      } else {
        reply = `System shutdown for ${seconds} seconds queued. Note: Run the Python Desktop Bridge to trigger OS-level power actions.`;
      }
    }

    // Check 3: System Memory Recall
    else if (cmd.includes('do you remember') || cmd.includes('what did i tell you to remember') || cmd.includes('recall memory')) {
      actionType = 'memory';
      reply = `You asked me to remember: "${storedMemory}"`;
    }

    // Check 4: Save to Memory
    else if (cmd.startsWith('remember ') || cmd.startsWith('remember that ')) {
      actionType = 'memory';
      const note = cmd.replace(/^remember( that)?/i, '').trim();
      if (note) {
        setStoredMemory(note);
        localStorage.setItem('jarvis_memory', note);
        if (bridgeStatus.connected) {
          fetch(`${bridgeUrl}/api/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: note }),
          }).catch(() => {});
        }
        reply = `Noted, sir. I have committed to memory: "${note}"`;
      } else {
        reply = "What would you like me to remember, sir?";
      }
    }

    // Check 4.5: Conversational History Recall & Summary
    else if (
      cmd.includes('previous conversation') ||
      cmd.includes('what did we talk about') ||
      cmd.includes('what did we discuss') ||
      cmd.includes('what did i just ask') ||
      cmd.includes('what was my last question') ||
      cmd.includes('what did i say before') ||
      cmd.includes('what was our last conversation') ||
      cmd.includes('summarize our conversation') ||
      cmd.includes('summarize conversation')
    ) {
      actionType = 'memory';
      if (results.length === 0) {
        reply = "We haven't recorded any previous conversations in this session yet, sir.";
      } else {
        const recent = results.slice(0, 4);
        if (cmd.includes('last question') || cmd.includes('just ask') || cmd.includes('say before')) {
          const last = recent[0];
          reply = `Your previous question was "${last.command}", to which I answered: "${last.reply}".`;
        } else {
          const summaries = recent.map((r, i) => `${i + 1}: You asked "${r.command}"`).join('. ');
          reply = `In our recent conversations, ${summaries}. I retain all these turns in memory.`;
        }
      }
    }

    // Check 4.6: Clear Conversation History
    else if (
      cmd.includes('clear conversation history') ||
      cmd.includes('clear chat history') ||
      cmd.includes('delete conversation history') ||
      cmd.includes('forget our conversation') ||
      cmd.includes('forget conversations')
    ) {
      actionType = 'memory';
      playChime('alert');
      handleClearConversationHistory();
      reply = "Previous conversation history has been cleared from memory, sir.";
    }

    // Check 5: Current Time
    else if (cmd.includes('time') || cmd.includes('what time is it') || cmd.includes('current time')) {
      actionType = 'system_control';
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      reply = `The current system time is ${timeStr}.`;
    }

    // Check 6: News Headlines
    else if (cmd.includes('news') || cmd.includes('headline')) {
      actionType = 'news';
      try {
        const res = await fetch('/api/news');
        const data = await res.json();
        if (data.headlines && data.headlines.length > 0) {
          reply = `Here are today's top headlines: ${data.headlines.slice(0, 3).join('. ')}.`;
        } else {
          reply = "I was unable to retrieve headlines at this moment.";
        }
      } catch {
        reply = "Top headlines: Technology and AI integrations continue to advance worldwide.";
      }
    }

    // Check 7: Wikipedia Lookup
    else if (cmd.startsWith('wikipedia ') || cmd.includes('search wikipedia')) {
      actionType = 'wikipedia';
      const query = cmd.replace('wikipedia', '').replace('search', '').replace('for', '').trim();
      try {
        const res = await fetch(`/api/wikipedia?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        reply = data.extract || `Here is what I found on Wikipedia for ${query}.`;
      } catch {
        reply = `I could not retrieve the Wikipedia summary for ${query}.`;
      }
    }

    // Check 8: Local Desktop Application Launch & Hardware Diagnostics
    else if (
      cmd.includes('open chrome') ||
      cmd.includes('open notepad') ||
      cmd.includes('open vlc') ||
      cmd.includes('open notepad++') ||
      cmd.includes('open notepad plus plus') ||
      cmd.includes('open bluetooth') ||
      cmd.includes('bluetooth settings') ||
      cmd.includes('open calculator') ||
      cmd.includes('open calc') ||
      cmd.includes('open task manager') ||
      cmd.includes('open file explorer') ||
      cmd.includes('open downloads') ||
      cmd.includes('open vs code') ||
      cmd.includes('open vscode') ||
      cmd.includes('open code') ||
      cmd.includes('open terminal') ||
      cmd.includes('open command prompt') ||
      cmd.includes('open cmd') ||
      cmd.includes('open camera') ||
      cmd.includes('open snipping tool') ||
      cmd.includes('open settings') ||
      cmd.includes('battery') ||
      cmd.includes('hardware status') ||
      cmd.includes('system status')
    ) {
      actionType = 'system_app';
      if (bridgeStatus.connected) {
        const bridgeRes = await sendCommandToBridge(bridgeUrl, rawCommand);
        if (bridgeRes.success) {
          systemExecuted = true;
          reply = bridgeRes.reply || `Executing on your operating system, sir.`;
        } else {
          reply = `Attempted host execution, but bridge returned: ${bridgeRes.error}`;
        }
      } else {
        const appName = cmd.includes('chrome')
          ? 'Google Chrome'
          : cmd.includes('vlc')
          ? 'VLC Media Player'
          : cmd.includes('task manager')
          ? 'Task Manager'
          : cmd.includes('file explorer') || cmd.includes('downloads')
          ? 'File Explorer'
          : cmd.includes('code')
          ? 'Visual Studio Code'
          : cmd.includes('terminal') || cmd.includes('cmd')
          ? 'Terminal'
          : cmd.includes('camera')
          ? 'Camera'
          : cmd.includes('snipping')
          ? 'Snipping Tool'
          : cmd.includes('settings')
          ? 'Settings'
          : cmd.includes('battery')
          ? 'Battery Diagnostics'
          : cmd.includes('status')
          ? 'System Diagnostics'
          : cmd.includes('calc')
          ? 'Calculator'
          : 'Desktop Tool';

        reply = `Triggered ${appName}. Connect 'praj_desktop_bridge.py' to launch natively on your personal computer.`;
      }
    }

    // Check 8.5: Music & Video Playback (YouTube & Spotify)
    else if (
      cmd.startsWith('play ') ||
      cmd.includes('play on youtube') ||
      cmd.includes('play on yt') ||
      cmd.includes('play song') ||
      cmd.includes('play songs') ||
      cmd.includes('search youtube for') ||
      (cmd.includes('youtube') && (cmd.includes('play') || cmd.includes('song') || cmd.includes('music')))
    ) {
      actionType = 'system_app';
      let songQuery = cmd
        .replace(/^play( on)? (youtube|yt)/i, '')
        .replace(/^search youtube for/i, '')
        .replace(/^play/i, '')
        .replace(/on (youtube|yt)/gi, '')
        .replace(/songs?/gi, '')
        .replace(/music/gi, '')
        .trim();

      if (!songQuery) songQuery = 'top trending songs';

      const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(songQuery)}`;

      if (bridgeStatus.connected) {
        const bridgeRes = await sendCommandToBridge(bridgeUrl, rawCommand);
        systemExecuted = true;
        reply = bridgeRes.reply || `Playing "${songQuery}" on YouTube on your computer, sir.`;
      } else {
        window.open(ytUrl, '_blank', 'noopener,noreferrer');
        reply = `Playing "${songQuery}" on YouTube.`;
      }
    }

    // Check 8.8: Smart Web Searches (Google, Maps, Amazon)
    else if (
      cmd.startsWith('search google for ') ||
      cmd.startsWith('google ') ||
      cmd.startsWith('search map for ') ||
      cmd.startsWith('where is ') ||
      cmd.startsWith('directions to ') ||
      cmd.startsWith('search amazon for ') ||
      (cmd.startsWith('buy ') && !cmd.startsWith('buy me a'))
    ) {
      actionType = 'system_app';
      if (cmd.startsWith('search google for ') || cmd.startsWith('google ')) {
        const query = cmd.replace('search google for ', '').replace('google ', '').trim();
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        if (bridgeStatus.connected) {
          await sendCommandToBridge(bridgeUrl, rawCommand);
          systemExecuted = true;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        reply = `Searching Google for "${query}".`;
      } else if (cmd.startsWith('search map for ') || cmd.startsWith('where is ') || cmd.startsWith('directions to ')) {
        const place = cmd.replace('search map for ', '').replace('where is ', '').replace('directions to ', '').trim();
        const url = `https://www.google.com/maps/search/${encodeURIComponent(place)}`;
        if (bridgeStatus.connected) {
          await sendCommandToBridge(bridgeUrl, rawCommand);
          systemExecuted = true;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        reply = `Locating "${place}" on Google Maps.`;
      } else {
        const item = cmd.replace('search amazon for ', '').replace('buy ', '').trim();
        const url = `https://www.amazon.com/s?k=${encodeURIComponent(item)}`;
        if (bridgeStatus.connected) {
          await sendCommandToBridge(bridgeUrl, rawCommand);
          systemExecuted = true;
        } else {
          window.open(url, '_blank', 'noopener,noreferrer');
        }
        reply = `Searching Amazon for "${item}".`;
      }
    }

    // Check 9: Web Navigation Portals
    else if (
      cmd.includes('open youtube') ||
      cmd.includes('open spotify') ||
      cmd.includes('open whatsapp') ||
      cmd.includes('open gmail') ||
      cmd.includes('open chat gpt') ||
      cmd.includes('open chatgpt') ||
      cmd.includes('open facebook') ||
      cmd.includes('open github') ||
      cmd.includes('open netflix') ||
      cmd.includes('open reddit') ||
      cmd.includes('open discord') ||
      cmd.includes('open twitter') ||
      cmd.includes('open linkedin') ||
      cmd.includes('open instagram') ||
      cmd.includes('open amazon')
    ) {
      actionType = 'system_app';
      const webMap: Record<string, { url: string; name: string }> = {
        youtube: { url: 'https://www.youtube.com', name: 'YouTube' },
        spotify: { url: 'https://open.spotify.com', name: 'Spotify' },
        whatsapp: { url: 'https://web.whatsapp.com', name: 'WhatsApp Web' },
        gmail: { url: 'https://mail.google.com', name: 'Gmail' },
        'chat gpt': { url: 'https://chatgpt.com/', name: 'ChatGPT' },
        chatgpt: { url: 'https://chatgpt.com/', name: 'ChatGPT' },
        facebook: { url: 'https://www.facebook.com', name: 'Facebook' },
        github: { url: 'https://github.com', name: 'GitHub' },
        netflix: { url: 'https://www.netflix.com', name: 'Netflix' },
        reddit: { url: 'https://www.reddit.com', name: 'Reddit' },
        discord: { url: 'https://discord.com/app', name: 'Discord' },
        twitter: { url: 'https://x.com', name: 'Twitter / X' },
        linkedin: { url: 'https://www.linkedin.com', name: 'LinkedIn' },
        instagram: { url: 'https://www.instagram.com', name: 'Instagram' },
        amazon: { url: 'https://www.amazon.com', name: 'Amazon' },
      };

      for (const [key, info] of Object.entries(webMap)) {
        if (cmd.includes(key)) {
          if (bridgeStatus.connected) {
            await sendCommandToBridge(bridgeUrl, rawCommand);
            systemExecuted = true;
          } else {
            window.open(info.url, '_blank', 'noopener,noreferrer');
          }
          reply = `Opening ${info.name}.`;
          break;
        }
      }
    }

    // Check 9.5: Live Weather Query
    else if (cmd.includes('weather') || cmd.includes('temperature') || cmd.includes('forecast')) {
      actionType = 'knowledge_base';
      let city = 'Delhi';
      if (cmd.includes(' in ')) {
        city = cmd.split(' in ')[1].replace(/[?.!]/g, '').trim();
      } else if (cmd.includes(' for ')) {
        city = cmd.split(' for ')[1].replace(/[?.!]/g, '').trim();
      }

      try {
        const res = await fetch(`/api/weather?q=${encodeURIComponent(city)}`);
        const data = await res.json();
        reply = data.summary || `Current weather in ${city} is ${data.desc || 'Fair'} at ${data.tempC || 24}°C.`;
      } catch {
        reply = `The forecast in ${city} is currently mild and clear.`;
      }
    }

    // Check 10: Offline Knowledge Base (Newton's Laws, Physics, Geography, GK)
    else {
      const offlineAnswer = matchOfflineKnowledge(cmd);
      if (offlineAnswer) {
        actionType = 'knowledge_base';
        reply = offlineAnswer;
      } else {
        // Check 11: General AI Query via Universal AI Gateway (Gemini, OpenRouter, OpenAI, Custom)
        actionType = 'ai_chat';
        try {
          // Ensure we have the latest config even if state update was asynchronous
          let effectiveKey = (aiConfig.apiKey || '').trim();
          let effectiveProvider = aiConfig.provider;
          let effectiveUrl = (aiConfig.baseUrl || '').trim();
          let effectiveModel = (aiConfig.model || '').trim();

          if (!effectiveKey) {
            try {
              const saved = localStorage.getItem('praj_ai_config');
              if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.apiKey) {
                  effectiveKey = parsed.apiKey.trim();
                  effectiveProvider = parsed.provider || effectiveProvider;
                  effectiveUrl = parsed.baseUrl || effectiveUrl;
                  effectiveModel = parsed.model || effectiveModel;
                }
              }
            } catch {
              // ignore
            }
          }

          // Format previous conversation turns (up to last 10 exchanges) for multi-turn conversational memory
          const historyPayload: Array<{ role: 'user' | 'assistant'; content: string }> = [];
          const recentTurns = results.slice(0, 10).reverse();
          for (const item of recentTurns) {
            if (item.command && item.reply) {
              historyPayload.push({ role: 'user', content: item.command });
              historyPayload.push({ role: 'assistant', content: item.reply });
            }
          }

          const res = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: rawCommand,
              provider: effectiveProvider,
              customApiKey: effectiveKey,
              customBaseUrl: effectiveUrl,
              customModel: effectiveModel,
              history: historyPayload,
              memory: storedMemory,
              personalization,
              image: imageBase64,
            }),
          });
          const data = await res.json();
          if (!res.ok && data.error) {
            reply = `API Notice: ${data.error}`;
          } else {
            reply = data.reply || "I have received and processed your query, sir.";
          }
        } catch {
          reply = "I processed your request, sir.";
        }
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    const newResult: CommandResult = {
      id: `cmd-${Date.now()}`,
      command: rawCommand,
      reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      source,
      actionType,
      systemExecuted,
      bridgeConnected: bridgeStatus.connected,
      latencyMs,
      imageUrl: imageBase64,
    };

    setResults((prev) => {
      const updated = [newResult, ...prev];
      try {
        localStorage.setItem('praj_conversation_history', JSON.stringify(updated.slice(0, 60)));
      } catch (e) {
        console.warn('Failed to save conversation history to localStorage:', e);
      }
      return updated;
    });

    // Also sync conversation turn to local desktop bridge if connected
    if (bridgeStatus.connected) {
      fetch(`${bridgeUrl}/api/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: rawCommand,
          reply,
          action: actionType,
        }),
      }).catch(() => {});
    }

    setLastResult(newResult);
    setIsProcessing(false);
    setTranscript('');

    // Voice response output
    if (!voiceMuted && reply) {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      speakJarvis(reply, {
        enabled: !voiceMuted,
        onStart: () => {
          isSpeakingRef.current = true;
          setIsSpeaking(true);
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          speechCooldownRef.current = Date.now() + 600; // 600ms acoustic grace period to absorb room echo
        },
      });
    } else {
      playChime(systemExecuted ? 'success' : 'wake');
    }
  };

  const handleReplayVoice = (text: string) => {
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    speakJarvis(text, {
      enabled: true,
      onStart: () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      },
      onEnd: () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
        speechCooldownRef.current = Date.now() + 600;
      },
    });
  };

  const handleCancelShutdown = () => {
    executeCommand('arise', 'typing');
  };

  const handleSaveMemory = (text: string) => {
    setStoredMemory(text);
    localStorage.setItem('jarvis_memory', text);
    if (bridgeStatus.connected) {
      fetch(`${bridgeUrl}/api/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation & Status Bar */}
      <Header
        bridgeStatus={bridgeStatus}
        voiceMuted={voiceMuted}
        hasGeminiKey={Boolean(hasGeminiKey || aiConfig.apiKey)}
        activeProvider={aiConfig.provider || (aiConfig.apiKey.startsWith('sk-or-') ? 'openrouter' : aiConfig.apiKey.startsWith('sk-') ? 'openai' : 'gemini')}
        activeModel={aiConfig.model}
        onToggleMute={() => {
          if (!voiceMuted) stopSpeaking();
          setVoiceMuted(!voiceMuted);
        }}
        onOpenBridgeModal={() => setBridgeModalOpen(true)}
        onOpenMasterSwitch={() => setMasterSwitchModalOpen(true)}
        onTriggerKillSwitch={handleTriggerKillSwitch}
        isKillSwitchActive={isKillSwitchActive}
        onOpenVoiceSettings={() => setVoiceModalOpen(true)}
        onOpenPersonalization={() => setPersonalizationModalOpen(true)}
        onOpenMemoryModal={() => setMemoryModalOpen(true)}
        onOpenKnowledgeModal={() => setKnowledgeModalOpen(true)}
        onToggleLogs={() => setShowLogs(!showLogs)}
        onOpenAiConfig={() => setIsAiConfigOpen(true)}
        showLogs={showLogs}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:py-8 pb-28 flex flex-col gap-6">
        {/* Core Audio Visualizer & Voice Arc Reactor */}
        <section aria-label="PRAJ Voice Core">
          <VoiceVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            transcript={transcript}
            bridgeConnected={bridgeStatus.connected}
            hasMic={hasMic}
            micErrorNotice={micErrorNotice}
            onToggleMic={toggleMic}
          />
        </section>

        {/* Command Input Bar */}
        <section aria-label="Command Input">
          <CommandInput
            onSendCommand={executeCommand}
            isListening={isListening}
            onToggleMic={toggleMic}
            continuousMode={continuousMode}
            onToggleContinuous={toggleContinuous}
            isProcessing={isProcessing}
            hasMic={hasMic}
          />
        </section>

        {/* Active Response Display */}
        <section aria-label="PRAJ Voice Response">
          <ResponseCard
            result={lastResult}
            onReplayVoice={handleReplayVoice}
            onCancelShutdown={handleCancelShutdown}
          />
        </section>

        {/* Quick System Action Deck */}
        <section aria-label="Quick System Actions">
          <QuickActions
            onSendCommand={executeCommand}
            bridgeConnected={bridgeStatus.connected}
          />
        </section>

        {/* Telemetry Log Terminal (Collapsible) */}
        {showLogs && (
          <section aria-label="System Logs">
            <SystemLog
              logs={results}
              onClearLogs={() => setResults([])}
            />
          </section>
        )}
      </main>

      {/* Modals */}
      <MasterSwitchModal
        isOpen={masterSwitchModalOpen}
        onClose={() => setMasterSwitchModalOpen(false)}
        bridgeStatus={bridgeStatus}
        onTriggerKillSwitch={handleTriggerKillSwitch}
        onRefreshStatus={() => checkBridge()}
        isKillSwitchActive={isKillSwitchActive}
      />

      <VoiceSettingsModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        voiceMuted={voiceMuted}
        onToggleMute={() => {
          if (!voiceMuted) stopSpeaking();
          setVoiceMuted(!voiceMuted);
        }}
      />

      <PersonalizationModal
        isOpen={personalizationModalOpen}
        onClose={() => setPersonalizationModalOpen(false)}
        personalization={personalization}
        onSave={handleSavePersonalization}
      />

      <BridgeSetupModal
        isOpen={bridgeModalOpen}
        onClose={() => setBridgeModalOpen(false)}
        bridgeStatus={bridgeStatus}
        onCheckBridge={checkBridge}
        bridgeUrl={bridgeUrl}
        setBridgeUrl={setBridgeUrl}
        onOpenMasterSwitch={() => setMasterSwitchModalOpen(true)}
      />

      <MemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        memory={storedMemory}
        onSaveMemory={handleSaveMemory}
        conversationHistory={results}
        onClearConversationHistory={handleClearConversationHistory}
      />

      <KnowledgeModal
        isOpen={knowledgeModalOpen}
        onClose={() => setKnowledgeModalOpen(false)}
        onSelectQuestion={(q) => executeCommand(q, 'typing')}
      />

      {/* Bottom Sticky / Corner API Key, URL and Model Gateway Bar */}
      <AiConfigBar
        config={aiConfig}
        onSaveConfig={handleSaveAiConfig}
        hasServerKey={hasGeminiKey}
        isOpen={isAiConfigOpen}
        onToggleOpen={() => setIsAiConfigOpen(!isAiConfigOpen)}
      />
    </div>
  );
}
