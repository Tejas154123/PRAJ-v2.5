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

// Text-to-Speech (PRAJ Voice Configuration)
let currentUtterance: SpeechSynthesisUtterance | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

export interface UserVoiceSettings {
  voiceURI: string; // 'default' means use default high-quality female voice
  voiceName: string;
  pitch: number;    // default 1.1
  rate: number;     // default 1.02
}

export const DEFAULT_VOICE_SETTINGS: UserVoiceSettings = {
  voiceURI: 'default',
  voiceName: 'Default PRAJ Voice (Original Female)',
  pitch: 1.1,
  rate: 1.02,
};

export function loadSavedVoiceSettings(): UserVoiceSettings {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const saved = localStorage.getItem('praj_voice_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        voiceURI: parsed.voiceURI || 'default',
        voiceName: parsed.voiceName || DEFAULT_VOICE_SETTINGS.voiceName,
        pitch: typeof parsed.pitch === 'number' ? parsed.pitch : 1.1,
        rate: typeof parsed.rate === 'number' ? parsed.rate : 1.02,
      };
    }
  } catch {
    // ignore
  }
  return DEFAULT_VOICE_SETTINGS;
}

export function saveVoiceSettings(settings: UserVoiceSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('praj_voice_settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Initialize and pre-cache voices immediately
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

const MALE_VOICE_KEYWORDS = [
  'david', 'george', 'daniel', 'guy', 'mark', 'james', 'richard', 
  'alex', 'fred', 'male', 'tom', 'oliver', 'bruce', 'sean', 
  'ravi', 'paul', 'stefan', 'john', 'michael', 'ryan', 'sam', 
  'adam', 'bill', 'frank', 'man', 'boy'
];

// Original preferred female voice names
const PREFERRED_FEMALE_NAMES = [
  'zira',
  'jenny',
  'aria',
  'samantha',
  'victoria',
  'karen',
  'fiona',
  'moira',
  'catherine',
  'sonia',
  'tessa',
  'serena',
  'female',
  'google uk english female',
  'google us english',
];

export function isMaleVoice(name: string): boolean {
  const lower = name.toLowerCase();
  return MALE_VOICE_KEYWORDS.some((kw) => lower.includes(kw));
}

export function isFemaleVoice(name: string): boolean {
  const lower = name.toLowerCase();
  return PREFERRED_FEMALE_NAMES.some((kw) => lower.includes(kw)) && !isMaleVoice(lower);
}

// Helper to select the highest-quality female voice available (Strictly NO Male Voices)
export function getFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. High-priority preferred female voices (exact same as before)
  for (const pref of PREFERRED_FEMALE_NAMES) {
    const match = voices.find((v) => v.name.toLowerCase().includes(pref) && !isMaleVoice(v.name));
    if (match) return match;
  }

  // 2. Any English voice that is strictly NOT male
  const nonMaleEnglish = voices.find((v) => v.lang.startsWith('en') && !isMaleVoice(v.name));
  if (nonMaleEnglish) return nonMaleEnglish;

  // 3. Fallback to any non-male voice in any language
  const nonMaleAny = voices.find((v) => !isMaleVoice(v.name));
  if (nonMaleAny) return nonMaleAny;

  // NEVER return a male voice
  return null;
}

// Return all voices installed in user's browser/OS
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  return voices || [];
}

// Resolve voice based on user preference or fallback to default female voice
export function getResolvedVoice(voiceURI?: string): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // If user selected a specific voice
  if (voiceURI && voiceURI !== 'default') {
    const found = voices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
    if (found) return found;
  }

  // Otherwise return the original default female voice
  return getFemaleVoice();
}

// Ensure voices are available before speaking
function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return resolve([]);
    }
    const current = window.speechSynthesis.getVoices();
    if (current && current.length > 0) {
      cachedVoices = current;
      return resolve(current);
    }
    const timeout = setTimeout(() => {
      resolve(window.speechSynthesis.getVoices() || []);
    }, 200);
    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timeout);
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };
  });
}

export async function speakJarvis(
  text: string,
  options: {
    voiceURI?: string;
    voiceRate?: number;
    voicePitch?: number;
    enabled?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
  } = {}
) {
  if (options.enabled === false) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    window.speechSynthesis.cancel();

    // Clean text of markdown or special characters for cleaner speech
    const cleanText = text
      .replace(/[*_#`~[\]()]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // Wait for voices if not yet cached to ensure voices load
    if (cachedVoices.length === 0) {
      await ensureVoicesLoaded();
    }

    const savedSettings = loadSavedVoiceSettings();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    currentUtterance = utterance;

    // Rate and pitch (use user's saved preference or defaults)
    utterance.rate = options.voiceRate ?? savedSettings.rate ?? 1.02;
    utterance.pitch = options.voicePitch ?? savedSettings.pitch ?? 1.1;

    // Resolve voice: user's custom selection or default female voice
    const targetURI = options.voiceURI ?? savedSettings.voiceURI;
    const resolvedVoice = getResolvedVoice(targetURI);
    if (resolvedVoice) {
      utterance.voice = resolvedVoice;
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
