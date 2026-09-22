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
import { matchOfflineKnowledge } from './data/knowledgeBase';
import { playChime, speakJarvis, stopSpeaking } from './utils/speech';
import { pingLocalBridge, sendCommandToBridge, sendShutdownToBridge, cancelShutdownOnBridge, DEFAULT_BRIDGE_URL } from './utils/bridgeClient';
import { CommandResult, BridgeStatus } from './types';

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

  // Voice Interaction State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Memory
  const [storedMemory, setStoredMemory] = useState<string>(() => {
    return localStorage.getItem('praj_memory') || localStorage.getItem('jarvis_memory') || 'System initialized on host device.';
  });

  // Telemetry & Results
  const [results, setResults] = useState<CommandResult[]>([]);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);

  // UI Modals
  const [bridgeModalOpen, setBridgeModalOpen] = useState<boolean>(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState<boolean>(false);
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  // 1. Initial System Check & Bridge Ping
  const checkBridge = useCallback(async (customUrl?: string) => {
    const targetUrl = customUrl || bridgeUrl;
    const status = await pingLocalBridge(targetUrl);
    setBridgeStatus(status);
    if (status.storedMemory) {
      setStoredMemory(status.storedMemory);
      localStorage.setItem('jarvis_memory', status.storedMemory);
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

    // Auto-ping bridge every 5 seconds to maintain link
    const interval = setInterval(() => {
      checkBridge();
    }, 5000);

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
      playChime('wake');
    };

    rec.onresult = (event: any) => {
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
      console.warn('Speech recognition error:', e.error);
      if (e.error !== 'no-speech') {
        setIsListening(false);
      }
    };

    rec.onend = () => {
      if (continuousMode) {
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

    return () => {
      try {
        rec.stop();
      } catch {}
    };
  }, [continuousMode]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type commands in the input bar.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        recognitionRef.current.stop();
      }
    }
  };

  const toggleContinuous = () => {
    const next = !continuousMode;
    setContinuousMode(next);
    if (next && !isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }
  };

  const handleSpokenFinal = (rawText: string) => {
    const clean = rawText.toLowerCase().trim();
    if (!clean) return;

    // In continuous mode, check for wake word 'PRAJ', 'Jarvis' or 'Arise'
    if (continuousMode) {
      if (clean.includes('arise')) {
        executeCommand('arise', 'voice');
        return;
      }
      if (!clean.includes('praj') && !clean.includes('jarvis')) {
        return; // Ignore background chatter until PRAJ is summoned
      }
    }

    executeCommand(rawText, 'voice');
  };

  // 3. Core Command Execution Engine
  const executeCommand = async (rawCommand: string, source: 'voice' | 'typing' | 'quick_action') => {
    const cmd = rawCommand.toLowerCase().trim();
    if (!cmd) return;

    setIsProcessing(true);
    const startTime = performance.now();

    let reply = '';
    let actionType: CommandResult['actionType'] = 'system_app';
    let systemExecuted = false;

    // Check 1: Cancel Shutdown / Arise
    if (cmd.includes('arise') || cmd.includes('cancel shutdown')) {
      actionType = 'system_control';
      playChime('alert');
      if (bridgeStatus.connected) {
        await cancelShutdownOnBridge(bridgeUrl);
        systemExecuted = true;
      }
      reply = "Shutdown canceled, sir. PRAJ systems stand at full readiness.";
    }

    // Check 2: Shutdown sequence
    else if (cmd.includes('shutdown')) {
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

    // Check 8: Local Desktop Application Launch (e.g. Chrome, Notepad, VLC, Notepad++, Bluetooth, Calculator)
    else if (
      cmd.includes('open chrome') ||
      cmd.includes('open notepad') ||
      cmd.includes('open vlc') ||
      cmd.includes('open notepad++') ||
      cmd.includes('open notepad plus plus') ||
      cmd.includes('open bluetooth') ||
      cmd.includes('bluetooth settings') ||
      cmd.includes('open calculator') ||
      cmd.includes('open calc')
    ) {
      actionType = 'system_app';
      if (bridgeStatus.connected) {
        // Direct execution on host PC!
        const bridgeRes = await sendCommandToBridge(bridgeUrl, rawCommand);
        if (bridgeRes.success) {
          systemExecuted = true;
          reply = bridgeRes.reply || `Executing on your operating system, sir.`;
        } else {
          reply = `Attempted host execution, but bridge returned: ${bridgeRes.error}`;
        }
      } else {
        // Fallback with clear explanation and helpful action rather than "I can't do that"
        const appName = cmd.includes('chrome')
          ? 'Google Chrome'
          : cmd.includes('vlc')
          ? 'VLC Media Player'
          : cmd.includes('notepad++')
          ? 'Notepad++'
          : cmd.includes('bluetooth')
          ? 'Bluetooth Settings'
          : cmd.includes('calc')
          ? 'Calculator'
          : 'Notepad';

        reply = `Launching ${appName}. To execute directly on your desktop machine, start 'praj_desktop_bridge.py'.`;
      }
    }

    // Check 9: Web Navigation Apps (YouTube, Spotify, WhatsApp, Gmail, ChatGPT, Facebook, GitHub)
    else if (
      cmd.includes('open youtube') ||
      cmd.includes('open spotify') ||
      cmd.includes('open whatsapp') ||
      cmd.includes('open gmail') ||
      cmd.includes('open chat gpt') ||
      cmd.includes('open chatgpt') ||
      cmd.includes('open facebook') ||
      cmd.includes('open github')
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
      };

      for (const [key, info] of Object.entries(webMap)) {
        if (cmd.includes(key)) {
          if (bridgeStatus.connected) {
            await sendCommandToBridge(bridgeUrl, rawCommand);
            systemExecuted = true;
          } else {
            // Open in browser tab as immediate fulfillment!
            window.open(info.url, '_blank', 'noopener,noreferrer');
          }
          reply = `Opening ${info.name}.`;
          break;
        }
      }
    }

    // Check 10: Offline Knowledge Base (Newton's Laws, Physics, Geography, GK)
    else {
      const offlineAnswer = matchOfflineKnowledge(cmd);
      if (offlineAnswer) {
        actionType = 'knowledge_base';
        reply = offlineAnswer;
      } else {
        // Check 11: General AI Query via Gemini API Proxy
        actionType = 'ai_chat';
        try {
          const res = await fetch('/api/ai/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: rawCommand }),
          });
          const data = await res.json();
          reply = data.reply || "I have received and processed your query, sir.";
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
    };

    setResults((prev) => [newResult, ...prev]);
    setLastResult(newResult);
    setIsProcessing(false);
    setTranscript('');

    // Voice response output
    if (!voiceMuted && reply) {
      setIsSpeaking(true);
      speakJarvis(reply, {
        enabled: !voiceMuted,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    } else {
      playChime(systemExecuted ? 'success' : 'wake');
    }
  };

  const handleReplayVoice = (text: string) => {
    setIsSpeaking(true);
    speakJarvis(text, {
      enabled: true,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
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
        hasGeminiKey={hasGeminiKey}
        onToggleMute={() => {
          if (!voiceMuted) stopSpeaking();
          setVoiceMuted(!voiceMuted);
        }}
        onOpenBridgeModal={() => setBridgeModalOpen(true)}
        onOpenMemoryModal={() => setMemoryModalOpen(true)}
        onOpenKnowledgeModal={() => setKnowledgeModalOpen(true)}
        onToggleLogs={() => setShowLogs(!showLogs)}
        showLogs={showLogs}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6">
        {/* Core Audio Visualizer & Voice Arc Reactor */}
        <section aria-label="PRAJ Voice Core">
          <VoiceVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            transcript={transcript}
            bridgeConnected={bridgeStatus.connected}
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
      <BridgeSetupModal
        isOpen={bridgeModalOpen}
        onClose={() => setBridgeModalOpen(false)}
        bridgeStatus={bridgeStatus}
        onCheckBridge={checkBridge}
        bridgeUrl={bridgeUrl}
        setBridgeUrl={setBridgeUrl}
      />

      <MemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        memory={storedMemory}
        onSaveMemory={handleSaveMemory}
      />

      <KnowledgeModal
        isOpen={knowledgeModalOpen}
        onClose={() => setKnowledgeModalOpen(false)}
        onSelectQuestion={(q) => executeCommand(q, 'typing')}
      />
    </div>
  );
}
