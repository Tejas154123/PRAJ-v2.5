import { Shield, ShieldAlert, Volume2, VolumeX, Cpu, Database, BookOpen, Terminal, Download, Sparkles, Zap, Power, Sliders, UserCheck } from 'lucide-react';
import { BridgeStatus } from '../types';

interface HeaderProps {
  bridgeStatus: BridgeStatus;
  voiceMuted: boolean;
  hasGeminiKey: boolean;
  activeModel?: string;
  activeProvider?: string;
  onToggleMute: () => void;
  onOpenBridgeModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenKnowledgeModal: () => void;
  onToggleLogs: () => void;
  onOpenAiConfig?: () => void;
  onOpenMasterSwitch?: () => void;
  onTriggerKillSwitch?: () => void;
  isKillSwitchActive?: boolean;
  onOpenVoiceSettings?: () => void;
  onOpenPersonalization?: () => void;
  showLogs: boolean;
}

export function Header({
  bridgeStatus,
  voiceMuted,
  hasGeminiKey,
  activeModel,
  activeProvider,
  onToggleMute,
  onOpenBridgeModal,
  onOpenMemoryModal,
  onOpenKnowledgeModal,
  onToggleLogs,
  onOpenAiConfig,
  onOpenMasterSwitch,
  onTriggerKillSwitch,
  isKillSwitchActive = false,
  onOpenVoiceSettings,
  onOpenPersonalization,
  showLogs,
}: HeaderProps) {
  return (
    <header className="w-full flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-6 bg-slate-900/80 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30">
      {/* Brand & System Status */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-slate-900 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold tracking-wider text-slate-100 uppercase font-mono">
                PRAJ
              </h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                v2.5 OS Core
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Personal Voice Assistant & System Bridge
            </p>
          </div>
        </div>

        {/* Mobile quick actions: Master Switch & Bridge status */}
        <div className="md:hidden flex items-center gap-2">
          {onOpenMasterSwitch && (
            <button
              onClick={onOpenMasterSwitch}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              title="1-Click Master Switch"
            >
              <Zap className="w-3.5 h-3.5 fill-cyan-300" />
              <span>Switch</span>
            </button>
          )}
          {onTriggerKillSwitch && (
            <button
              onClick={onTriggerKillSwitch}
              className="p-1.5 rounded-lg text-xs font-semibold bg-red-600/30 text-red-300 border border-red-500/50"
              title="1-Click Kill Switch"
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onOpenBridgeModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-800/70 border-slate-700"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                bridgeStatus.connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              {bridgeStatus.connected ? 'PC Linked' : 'Bridge'}
            </span>
          </button>
        </div>
      </div>

      {/* Center/Right Control Cluster */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
        {/* 1-Click Master Switch Button (Starts both programs & controls) */}
        {onOpenMasterSwitch && (
          <button
            id="btn-master-switch"
            onClick={onOpenMasterSwitch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wide bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-900/60 hover:to-blue-900/60 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all cursor-pointer"
            title="1-Click Master Switch: Launch Python Desktop Bridge & Web UI or download 1-click batch files"
          >
            <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 animate-pulse" />
            <span>Master Switch</span>
          </button>
        )}

        {/* 1-Click Emergency Kill Switch Button */}
        {onTriggerKillSwitch && (
          <button
            id="btn-kill-switch"
            onClick={onTriggerKillSwitch}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono tracking-wide border transition-all cursor-pointer ${
              isKillSwitchActive
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.6)] animate-pulse'
                : 'bg-red-950/50 hover:bg-red-900/60 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.25)]'
            }`}
            title="Emergency Kill Switch: 1-click instant halt of all tasks, speech, and pending host shutdowns"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Kill Switch</span>
          </button>
        )}

        {/* Desktop Bridge Status Pill */}
        <button
          id="btn-bridge-status-pill"
          onClick={onOpenBridgeModal}
          className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            bridgeStatus.connected
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
          }`}
          title="Click to view Local Python Bridge status & script instructions"
        >
          {bridgeStatus.connected ? (
            <>
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Host PC Agent: <strong>Connected</strong> (Port 5000)</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Host PC Agent: <strong>Standby</strong> (Setup Bridge)</span>
            </>
          )}
        </button>

        {/* AI Mode Pill */}
        <button
          id="btn-ai-mode-status"
          onClick={onOpenAiConfig}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            hasGeminiKey
              ? 'bg-purple-950/30 hover:bg-purple-900/40 border-purple-500/40 text-purple-300'
              : 'bg-blue-950/30 hover:bg-blue-900/40 border-blue-500/40 text-blue-300'
          }`}
          title={hasGeminiKey ? `Universal AI: ${activeProvider || 'AI'} (${activeModel || 'Active'}). Click to configure OpenRouter, OpenAI, Gemini or Custom.` : 'Offline Zero-API Mode. Click to configure API Key, URL & Model.'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {hasGeminiKey
              ? `${activeProvider ? activeProvider.toUpperCase() : 'AI'}: ${activeModel || 'Active'}`
              : 'Offline Zero-API Mode'}
          </span>
        </button>

        {/* Memory Button */}
        <button
          id="btn-open-memory-modal"
          onClick={onOpenMemoryModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 transition-colors"
          title="View & Edit Memory Notes"
        >
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Memory</span>
        </button>

        {/* Knowledge Base Button */}
        <button
          id="btn-open-knowledge-modal"
          onClick={onOpenKnowledgeModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/80 transition-colors"
          title="Browse 60+ Offline Questions & Physics Laws"
        >
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Offline KB</span>
        </button>

        {/* Logs Toggle */}
        <button
          id="btn-toggle-logs"
          onClick={onToggleLogs}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            showLogs
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700/80'
          }`}
          title="Toggle execution telemetry log"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Terminal</span>
        </button>

        {/* Voice Customization Settings */}
        {onOpenVoiceSettings && (
          <button
            id="btn-voice-settings"
            onClick={onOpenVoiceSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-slate-700/80 transition-colors cursor-pointer"
            title="PRAJ Voice Customization: Choose your favorite audio voice or keep default"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        )}

        {/* User Personalization & Persona Settings */}
        {onOpenPersonalization && (
          <button
            id="btn-personalization-settings"
            onClick={onOpenPersonalization}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border border-slate-700/80 transition-colors cursor-pointer"
            title="Personalization Profile: Custom Honorific, Persona, Interests & Tone"
          >
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Profile</span>
          </button>
        )}

        {/* Voice Mute Toggle */}
        <button
          id="btn-toggle-speech-mute"
          onClick={onToggleMute}
          className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
            voiceMuted
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/40'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border-slate-700/80'
          }`}
          title={voiceMuted ? 'PRAJ voice muted. Click to unmute.' : 'PRAJ voice active. Click to mute.'}
          aria-label={voiceMuted ? 'Unmute voice' : 'Mute voice'}
        >
          {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
