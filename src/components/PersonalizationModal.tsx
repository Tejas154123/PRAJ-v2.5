import React, { useState } from 'react';
import { 
  User, 
  Sparkles, 
  Check, 
  X, 
  Sliders, 
  Compass, 
  ShieldCheck, 
  BookMarked, 
  Tag, 
  Plus, 
  RotateCcw,
  Zap,
  Volume2
} from 'lucide-react';
import { UserPersonalization, AssistantPersona } from '../types';
import { playChime, speakJarvis } from '../utils/speech';

export const DEFAULT_PERSONALIZATION: UserPersonalization = {
  userName: 'Commander',
  userTitle: 'Sir',
  userRole: 'Lead Engineer & Researcher',
  persona: 'jarvis',
  customToneInstructions: 'Keep replies intelligent, crisp, and helpful. Maintain high operational competence.',
  favoriteTopics: ['Artificial Intelligence', 'Space Exploration', 'System Automation'],
  autoAcknowledgeWithName: true,
};

export function loadSavedPersonalization(): UserPersonalization {
  if (typeof window === 'undefined') return DEFAULT_PERSONALIZATION;
  try {
    const saved = localStorage.getItem('praj_personalization');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_PERSONALIZATION,
        ...parsed,
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_PERSONALIZATION;
}

export function savePersonalization(p: UserPersonalization) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('praj_personalization', JSON.stringify(p));
  } catch {
    // fallback
  }
}

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalization: UserPersonalization;
  onSave: (p: UserPersonalization) => void;
}

const PERSONA_OPTIONS: Array<{
  id: AssistantPersona;
  title: string;
  badge: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'jarvis',
    title: 'Jarvis Protocol',
    badge: 'RECOMMENDED',
    description: 'Crisp, loyal, razor-sharp intelligence with courteous elegance.',
    icon: '⚡',
  },
  {
    id: 'companion',
    title: 'Warm Companion',
    badge: 'FRIENDLY',
    description: 'Empathetic, upbeat, conversational, and encouraging tone.',
    icon: '☀️',
  },
  {
    id: 'concise',
    title: 'Executive Ultra-Brief',
    badge: 'PRODUCTIVITY',
    description: 'Zero fluff, laser-focused brevity, action-oriented bullet style.',
    icon: '🎯',
  },
  {
    id: 'cyberpunk',
    title: 'Cyberpunk Tactical',
    badge: 'FUTURISTIC',
    description: 'High-tech telemetry tone, matrix aesthetics, cybernetic alertness.',
    icon: '🔮',
  },
  {
    id: 'formal',
    title: 'Distinguished Butler',
    badge: 'CLASSIC',
    description: 'Extremely polite, dignified aristocratic English assistance.',
    icon: '🎩',
  },
];

export function PersonalizationModal({
  isOpen,
  onClose,
  personalization,
  onSave,
}: PersonalizationModalProps) {
  const [profile, setProfile] = useState<UserPersonalization>(personalization);
  const [newTopic, setNewTopic] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePersonaSelect = (persona: AssistantPersona) => {
    setProfile((prev) => ({ ...prev, persona }));
  };

  const handleAddTopic = () => {
    const trimmed = newTopic.trim();
    if (trimmed && !profile.favoriteTopics.includes(trimmed)) {
      setProfile((prev) => ({
        ...prev,
        favoriteTopics: [...prev.favoriteTopics, trimmed],
      }));
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (topic: string) => {
    setProfile((prev) => ({
      ...prev,
      favoriteTopics: prev.favoriteTopics.filter((t) => t !== topic),
    }));
  };

  const handleResetToDefaults = () => {
    setProfile(DEFAULT_PERSONALIZATION);
    onSave(DEFAULT_PERSONALIZATION);
    savePersonalization(DEFAULT_PERSONALIZATION);
    playChime('success');
  };

  const handleSaveAndApply = () => {
    onSave(profile);
    savePersonalization(profile);
    setSavedSuccess(true);
    playChime('success');
    
    // Vocal acknowledgement tailored to their title & name
    const address = profile.userTitle ? profile.userTitle : profile.userName || 'Sir';
    speakJarvis(`Personalization profile updated, ${address}. Persona set to ${profile.persona}.`, {
      enabled: true,
    });

    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                PRAJ Personalization &amp; Identity Profile
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Custom
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tailor how PRAJ addresses you, adapts its persona, and prioritizes your interests.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close personalization"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Name & Title Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <label htmlFor="input-personalization-username" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Your Name</span>
              </label>
              <input
                id="input-personalization-username"
                type="text"
                value={profile.userName}
                onChange={(e) => setProfile({ ...profile, userName: e.target.value })}
                placeholder="e.g. Alex or Commander"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label htmlFor="input-personalization-usertitle" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Honorific / Title</span>
              </label>
              <input
                id="input-personalization-usertitle"
                type="text"
                value={profile.userTitle}
                onChange={(e) => setProfile({ ...profile, userTitle: e.target.value })}
                placeholder="e.g. Sir, Boss, Captain"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label htmlFor="input-personalization-userrole" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span>Role / Specialty</span>
              </label>
              <input
                id="input-personalization-userrole"
                type="text"
                value={profile.userRole}
                onChange={(e) => setProfile({ ...profile, userRole: e.target.value })}
                placeholder="e.g. Lead Software Engineer"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Persona Style Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Select Assistant Persona Style
              </h3>
              <span className="text-[11px] text-cyan-400/80 font-mono">
                Active: {profile.persona.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERSONA_OPTIONS.map((opt) => {
                const isSelected = profile.persona === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handlePersonaSelect(opt.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                        : 'bg-slate-950/40 hover:bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{opt.icon}</span>
                        <span className="text-xs font-bold text-white">{opt.title}</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      {opt.description}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interests & Favorite Topics */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-cyan-400" />
              Focus Interests &amp; Domains
            </h3>
            
            <div className="flex flex-wrap gap-1.5">
              {profile.favoriteTopics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs"
                >
                  <Tag className="w-3 h-3 text-cyan-400" />
                  {topic}
                  <button
                    onClick={() => handleRemoveTopic(topic)}
                    className="hover:text-rose-400 transition-colors ml-0.5"
                    title={`Remove ${topic}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                placeholder="Add custom topic (e.g. Quantum Computing, Cyber Security)..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={handleAddTopic}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Custom Tone Directives */}
          <div className="space-y-2">
            <label htmlFor="textarea-personalization-tone" className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Direct Tone Instructions for PRAJ
            </label>
            <textarea
              id="textarea-personalization-tone"
              rows={3}
              value={profile.customToneInstructions}
              onChange={(e) => setProfile({ ...profile, customToneInstructions: e.target.value })}
              placeholder="e.g. 'Always address me with quiet confidence. Emphasize speed and executable code over explanations.'"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono resize-none leading-relaxed"
            />
          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex items-center gap-2 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Profile Applied!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save Personalization</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
