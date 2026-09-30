import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  X, 
  Play, 
  Square, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Mic, 
  Search, 
  Radio, 
  UserCheck,
  Languages
} from 'lucide-react';
import { 
  UserVoiceSettings, 
  DEFAULT_VOICE_SETTINGS, 
  loadSavedVoiceSettings, 
  saveVoiceSettings, 
  getAvailableVoices, 
  getFemaleVoice,
  isFemaleVoice,
  speakJarvis, 
  stopSpeaking 
} from '../utils/speech';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceMuted: boolean;
  onToggleMute: () => void;
  onVoiceChanged?: (settings: UserVoiceSettings) => void;
}

export function VoiceSettingsModal({
  isOpen,
  onClose,
  voiceMuted,
  onToggleMute,
  onVoiceChanged,
}: VoiceSettingsModalProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<UserVoiceSettings>(loadSavedVoiceSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'female' | 'english'>('female');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [defaultFemaleVoiceName, setDefaultFemaleVoiceName] = useState<string>('System Default Female');

  // Load and refresh available system voices
  useEffect(() => {
    const updateVoices = () => {
      const all = getAvailableVoices();
      setVoices(all);
      const def = getFemaleVoice();
      if (def) {
        setDefaultFemaleVoiceName(def.name);
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filtered voice list
  const filteredVoices = voices.filter((v) => {
    const nameLower = v.name.toLowerCase();
    const langLower = v.lang.toLowerCase();
    const matchesSearch = !searchQuery || nameLower.includes(searchQuery.toLowerCase()) || langLower.includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (categoryFilter === 'female') {
      return isFemaleVoice(v.name) || nameLower.includes('zira') || nameLower.includes('female') || nameLower.includes('natural');
    }
    if (categoryFilter === 'english') {
      return langLower.startsWith('en');
    }
    return true;
  });

  const handleSelectVoice = (voice: SpeechSynthesisVoice | 'default') => {
    const newSettings: UserVoiceSettings = {
      ...settings,
      voiceURI: voice === 'default' ? 'default' : voice.voiceURI,
      voiceName: voice === 'default' ? DEFAULT_VOICE_SETTINGS.voiceName : voice.name,
    };
    setSettings(newSettings);
    saveVoiceSettings(newSettings);
    onVoiceChanged?.(newSettings);
  };

  const handleResetToDefault = () => {
    setSettings(DEFAULT_VOICE_SETTINGS);
    saveVoiceSettings(DEFAULT_VOICE_SETTINGS);
    onVoiceChanged?.(DEFAULT_VOICE_SETTINGS);
    // Play test chime with default
    stopSpeaking();
    speakJarvis("Default female voice restored.", {
      voiceURI: 'default',
      voicePitch: 1.1,
      voiceRate: 1.02,
    });
  };

  const handlePitchChange = (pitch: number) => {
    const updated = { ...settings, pitch };
    setSettings(updated);
    saveVoiceSettings(updated);
    onVoiceChanged?.(updated);
  };

  const handleRateChange = (rate: number) => {
    const updated = { ...settings, rate };
    setSettings(updated);
    saveVoiceSettings(updated);
    onVoiceChanged?.(updated);
  };

  const handleTestVoice = (customURI?: string) => {
    stopSpeaking();
    setIsPlayingPreview(true);
    const targetURI = customURI ?? settings.voiceURI;
    const testText = targetURI === 'default' 
      ? "Hello! This is PRAJ speaking with the default female voice. Everything is operating normally."
      : `Hello! This is a preview of the ${settings.voiceName} voice for PRAJ.`;

    speakJarvis(testText, {
      voiceURI: targetURI,
      voicePitch: settings.pitch,
      voiceRate: settings.rate,
      enabled: true,
      onStart: () => setIsPlayingPreview(true),
      onEnd: () => setIsPlayingPreview(false),
    });
  };

  const isDefaultSelected = settings.voiceURI === 'default' || !settings.voiceURI;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                PRAJ Voice & Audio Customization
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Interactive
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose your favorite voice, fine-tune pitch and speed, or keep the original default.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close voice settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Active Voice Summary Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Currently Active Voice</span>
              </div>
              <button
                onClick={handleResetToDefault}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-cyan-200 bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700 transition-all cursor-pointer"
                title="Reset to original default female voice"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <div className="text-base font-bold text-white flex items-center gap-2">
                  {isDefaultSelected ? '⭐ Default PRAJ Voice (Original Female)' : settings.voiceName}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {isDefaultSelected ? (
                    <span>Mapped to: <strong className="text-cyan-300">{defaultFemaleVoiceName}</strong> (Pitch 1.1, Rate 1.02)</span>
                  ) : (
                    <span>Custom System Voice selected &amp; persisted across browser sessions</span>
                  )}
                </div>
              </div>

              {/* Test Voice Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTestVoice()}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isPlayingPreview
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {isPlayingPreview ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Speaking...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Audio</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onToggleMute}
                  className={`p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    voiceMuted 
                      ? 'bg-rose-950/40 text-rose-300 border-rose-500/40' 
                      : 'bg-slate-800 text-cyan-300 border-slate-700'
                  }`}
                  title={voiceMuted ? 'Voice is currently muted' : 'Voice is enabled'}
                >
                  {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Fine Tuning Sliders: Pitch & Speed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            {/* Pitch */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Voice Pitch</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.pitch.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={settings.pitch}
                onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Deeper (0.8x)</span>
                <span className="text-cyan-400/80">Default 1.1x</span>
                <span>Higher (1.5x)</span>
              </div>
            </div>

            {/* Speed Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Speaking Speed (Rate)</span>
                <span className="font-mono text-cyan-400 font-bold">{settings.rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={settings.rate}
                onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Calm (0.8x)</span>
                <span className="text-cyan-400/80">Default 1.02x</span>
                <span>Brisk (1.4x)</span>
              </div>
            </div>
          </div>

          {/* Voice Selection List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-cyan-400" />
                Select from Installed Browser / OS Voices
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setCategoryFilter('female')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    categoryFilter === 'female'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Female Recommended
                </button>
                <button
                  onClick={() => setCategoryFilter('english')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    categoryFilter === 'english'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({voices.length})
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search voices by name (e.g. Zira, Jenny, Samantha, Google)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            {/* Voices Grid / List */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {/* Option 0: Default PRAJ Female Voice */}
              <div
                onClick={() => handleSelectVoice('default')}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isDefaultSelected
                    ? 'bg-cyan-950/50 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isDefaultSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">Default PRAJ Voice</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        RECOMMENDED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Original clear female voice profile tuned for assistant responses
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestVoice('default');
                    }}
                    className="p-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg cursor-pointer"
                    title="Test this voice"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  {isDefaultSelected && (
                    <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Available Voices */}
              {filteredVoices.map((v) => {
                const isSelected = !isDefaultSelected && (settings.voiceURI === v.voiceURI || settings.voiceURI === v.name);
                const isFemale = isFemaleVoice(v.name);

                return (
                  <div
                    key={v.voiceURI || v.name}
                    onClick={() => handleSelectVoice(v)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                        <Radio className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{v.name}</span>
                          {isFemale && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                              Female
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {v.lang}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {v.localService ? 'Local device voice' : 'Network synthesized voice'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoice(v.voiceURI || v.name);
                        }}
                        className="p-1.5 text-xs text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg cursor-pointer"
                        title={`Test voice ${v.name}`}
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredVoices.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  No matching voices found for &quot;{searchQuery}&quot;. Try selecting &quot;All&quot; voices.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <div className="text-xs text-slate-400">
            Selected: <strong className="text-cyan-300">{isDefaultSelected ? 'Default PRAJ Female' : settings.voiceName}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
          >
            Apply &amp; Done
          </button>
        </div>

      </div>
    </div>
  );
}
