// Speech recognition & synthesis utilities for Jarvis Web Interface

// Audio chime using Web Audio API
export function playChime(type: 'wake' | 'success' | 'alert' | 'shutdown' = 'wake') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'wake') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.15);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'shutdown') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  } catch {
    // Audio context might be restricted before user gesture
  }
}

// Text-to-Speech (Jarvis Voice)
let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speakJarvis(
  text: string,
  options: {
    voiceRate?: number;
    voicePitch?: number;
    enabled?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
) {
  if (options.enabled === false) return;
  if (!('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    // Clean text of markdown or special characters for cleaner speech
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;

    utterance.rate = options.voiceRate ?? 1.05;
    utterance.pitch = options.voicePitch ?? 0.95; // Slightly deeper, measured voice for Jarvis

    // Select British or sleek English voice if available
    const voices = window.speechSynthesis.getVoices();
    const jarvisVoice =
      voices.find((v) => v.lang.includes('en-GB') || v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('george')) ||
      voices.find((v) => v.lang.includes('en') && (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('guy'))) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (jarvisVoice) {
      utterance.voice = jarvisVoice;
    }

    utterance.onstart = () => {
      options.onStart?.();
    };

    utterance.onend = () => {
      currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = () => {
      currentUtterance = null;
      options.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    options.onEnd?.();
  }
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export const speakPRAJ = speakJarvis;
