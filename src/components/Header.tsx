import { Shield, ShieldAlert, Volume2, VolumeX, Cpu, Database, BookOpen, Terminal, Download, Sparkles } from 'lucide-react';
import { BridgeStatus } from '../types';

interface HeaderProps {
  bridgeStatus: BridgeStatus;
  voiceMuted: boolean;
  hasGeminiKey: boolean;
  onToggleMute: () => void;
  onOpenBridgeModal: () => void;
  onOpenMemoryModal: () => void;
  onOpenKnowledgeModal: () => void;
  onToggleLogs: () => void;
  showLogs: boolean;
}

export function Header({
  bridgeStatus,
  voiceMuted,
  hasGeminiKey,
  onToggleMute,
  onOpenBridgeModal,
  onOpenMemoryModal,
  onOpenKnowledgeModal,
  onToggleLogs,
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

        {/* Mobile quick bridge status */}
        <button
          onClick={onOpenBridgeModal}
          className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-800/70 border-slate-700"
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

      {/* Center/Right Control Cluster */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
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
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
            hasGeminiKey
              ? 'bg-purple-950/30 border-purple-500/40 text-purple-300'
              : 'bg-blue-950/30 border-blue-500/40 text-blue-300'
          }`}
          title={hasGeminiKey ? 'Gemini 3.8 Flash Hybrid AI active' : 'Offline Zero-API Knowledge Mode active'}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{hasGeminiKey ? 'Gemini AI Active' : 'Offline Zero-API Mode'}</span>
        </div>

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

        {/* Voice Mute Toggle */}
        <button
          id="btn-toggle-speech-mute"
          onClick={onToggleMute}
          className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
            voiceMuted
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/40'
              : 'bg-slate-800/80 hover:bg-slate-700/80 text-cyan-300 border-slate-700/80'
          }`}
          title={voiceMuted ? 'Jarvis voice muted. Click to unmute.' : 'Jarvis voice active. Click to mute.'}
          aria-label={voiceMuted ? 'Unmute voice' : 'Mute voice'}
        >
          {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
