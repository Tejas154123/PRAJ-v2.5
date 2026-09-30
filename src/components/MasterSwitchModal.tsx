import { useState } from 'react';
import { 
  Zap, 
  Power, 
  X, 
  Download, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  Terminal, 
  RefreshCw, 
  Activity, 
  Flame, 
  Radio, 
  Sparkles,
  AlertTriangle,
  Play,
  Code2,
  ExternalLink
} from 'lucide-react';
import { BridgeStatus } from '../types';
import { 
  START_PRAJ_BAT, 
  KILL_PRAJ_BAT, 
  PRAJ_MASTER_SWITCH_BAT, 
  PRAJ_SWITCH_BAT,
  INSTALL_PYTHON_BAT,
  downloadScriptFile 
} from '../data/batchScripts';

interface MasterSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  bridgeStatus: BridgeStatus;
  onTriggerKillSwitch: () => void;
  onRefreshStatus: () => void;
  isKillSwitchActive?: boolean;
}

export function MasterSwitchModal({
  isOpen,
  onClose,
  bridgeStatus,
  onTriggerKillSwitch,
  onRefreshStatus,
  isKillSwitchActive = false,
}: MasterSwitchModalProps) {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [previewScript, setPreviewScript] = useState<'start' | 'kill' | 'master' | 'toggle' | 'python' | null>(null);
  const [justTriggeredKill, setJustTriggeredKill] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (filename: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const handleTriggerKill = () => {
    setJustTriggeredKill(true);
    onTriggerKillSwitch();
    setTimeout(() => setJustTriggeredKill(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/40 text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-red-600/30 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wide font-mono text-white">
                  PRAJ MASTER 1-CLICK SWITCH & KILL SYSTEM
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Instant Control
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Launch both programs at once, or instantly trigger the emergency kill switch.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Master Switch"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live System Process Audit Bar */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono font-medium">LIVE STATUS:</span>
            {/* Bridge Indicator */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${bridgeStatus.connected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
              <span className="text-slate-300">
                Python Bridge (Port 5000):{' '}
                <strong className={bridgeStatus.connected ? 'text-emerald-400' : 'text-amber-400'}>
                  {bridgeStatus.connected ? 'ONLINE' : 'STANDBY'}
                </strong>
              </span>
            </div>

            {/* Web Server Indicator */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              <span className="text-slate-300">
                Web Voice UI (Port 3000):{' '}
                <strong className="text-cyan-400">ACTIVE</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onRefreshStatus}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-check Ports</span>
          </button>
        </div>

        {/* Just Triggered Alert Banner */}
        {(justTriggeredKill || isKillSwitchActive) && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/70 border border-red-500/60 text-red-200 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
              <div>
                <p className="text-xs font-semibold text-red-100">
                  EMERGENCY KILL SWITCH TRIGGERED!
                </p>
                <p className="text-[11px] text-red-300">
                  All active speech canceled, host shutdown sequence aborted, and bridge halt signal dispatched.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
              System Halted
            </span>
          </div>
        )}

        {/* Main Content Grid: 1-Click Launcher vs 1-Click Kill Switch */}
        <div className="p-6 space-y-6">
          {/* Featured: 1-Click Smart Auto-Toggle Switch (PRAJ_SWITCH.bat) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-amber-950/40 border border-cyan-500/50 shadow-xl shadow-cyan-950/30">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-amber-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base font-mono">
                      PRAJ_SWITCH.bat (Smart 1-Click Dual Switch)
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      Start & Kill in 1 File
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Double-click once: <strong>STARTS</strong> both programs & opens browser. Double-click again: <strong>KILLS</strong> all programs & aborts shutdowns!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  onClick={() => downloadScriptFile('PRAJ_SWITCH.bat', PRAJ_SWITCH_BAT)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 font-mono transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PRAJ_SWITCH.bat</span>
                </button>

                <button
                  onClick={() => handleCopy('PRAJ_SWITCH.bat', PRAJ_SWITCH_BAT)}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  title="Copy Switch Script"
                >
                  {copiedFile === 'PRAJ_SWITCH.bat' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setPreviewScript(previewScript === 'toggle' ? null : 'toggle')}
                  className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  title="View Code"
                >
                  <Terminal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* NEW: 1-Click Python Installer Option (Auto-downloads & configures Python if missing) */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/40 shadow-lg shadow-emerald-950/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm font-mono flex items-center gap-1.5">
                      INSTALL_PYTHON.bat
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        1-Click Python Setup
                      </span>
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Download this script and double-click it on Windows. It reuses an existing Python installation or automatically downloads and installs official Python 3.13 for your PC, then sets up pip and the PRAJ libraries. An internet connection is required. Any installation errors stay visible with a log location.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  id="btn-download-python-installer-bat"
                  onClick={() => downloadScriptFile('INSTALL_PYTHON.bat', INSTALL_PYTHON_BAT)}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  title="Download 1-click batch script to automatically download & configure Python on Windows"
                >
                  <Download className="w-4 h-4" />
                  <span>Download INSTALL_PYTHON.bat</span>
                </button>

                <button
                  onClick={() => handleCopy('INSTALL_PYTHON.bat', INSTALL_PYTHON_BAT)}
                  className="flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                  title="Copy Python Installer Script"
                >
                  {copiedFile === 'INSTALL_PYTHON.bat' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setPreviewScript(previewScript === 'python' ? null : 'python')}
                  className="flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                  title="View Python Installer Code"
                >
                  <Terminal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Answer: How to Start PRAJ from Kill Switch */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs space-y-2.5">
            <h4 className="text-slate-200 font-bold font-mono uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              How to Start PRAJ from Kill Switch (3 Simple Ways):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-cyan-400 font-bold font-mono">Method 1: Smart Switch</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Double-click <code className="text-cyan-300 font-mono">PRAJ_SWITCH.bat</code> on your PC. It auto-detects that PRAJ is stopped and starts both programs immediately.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-cyan-400 font-bold font-mono">Method 2: Master Launcher</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Double-click <code className="text-cyan-300 font-mono">START_PRAJ.bat</code>. It starts Python on Port 5000 and Web on Port 3000 at once.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-cyan-400 font-bold font-mono">Method 3: Master Console</span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Open <code className="text-cyan-300 font-mono">PRAJ_MASTER_SWITCH.bat</code> and press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">1</kbd> to Activate or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[10px]">5</kbd> to Restart.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. MASTER 1-CLICK LAUNCHER CARD */}
            <div className="relative flex flex-col justify-between p-5 rounded-xl bg-gradient-to-b from-cyan-950/30 to-slate-900/90 border border-cyan-500/40 hover:border-cyan-500/70 transition-all shadow-lg shadow-cyan-950/20">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                      <Play className="w-4 h-4 fill-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm font-mono">
                        1-CLICK MASTER LAUNCHER
                      </h3>
                      <p className="text-[11px] text-cyan-400">START_PRAJ.bat</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    Dual Start
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Starts <strong>both programs simultaneously</strong> with a single click:
                </p>

                <div className="space-y-2 mb-5 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[11px] font-bold">1</span>
                    <span className="text-slate-200">Launches Python Desktop Bridge (Port 5000)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[11px] font-bold">2</span>
                    <span className="text-slate-200">Launches Node Web Interface Server (Port 3000)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-mono text-[11px] font-bold">3</span>
                    <span className="text-slate-200">Opens PRAJ Voice Dashboard in default browser</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => downloadScriptFile('START_PRAJ.bat', START_PRAJ_BAT)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-600/30 transition-all font-mono"
                >
                  <Download className="w-4 h-4" />
                  <span>Download START_PRAJ.bat</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy('START_PRAJ.bat', START_PRAJ_BAT)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    {copiedFile === 'START_PRAJ.bat' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setPreviewScript(previewScript === 'start' ? null : 'start')}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{previewScript === 'start' ? 'Hide Code' : 'View Code'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. EMERGENCY 1-CLICK KILL SWITCH CARD */}
            <div className="relative flex flex-col justify-between p-5 rounded-xl bg-gradient-to-b from-red-950/40 to-slate-900/90 border border-red-500/50 hover:border-red-500/80 transition-all shadow-lg shadow-red-950/25">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
                      <Flame className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm font-mono">
                        EMERGENCY 1-CLICK KILL SWITCH
                      </h3>
                      <p className="text-[11px] text-red-400">KILL_PRAJ.bat</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/30">
                    Full Halt
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  Instantly <strong>stops everything</strong> in an emergency:
                </p>

                <div className="space-y-2 mb-5 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center font-mono text-[11px] font-bold">1</span>
                    <span className="text-slate-200">Aborts scheduled Windows shutdowns (<code className="text-red-300 font-mono">shutdown /a</code>)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center font-mono text-[11px] font-bold">2</span>
                    <span className="text-slate-200">Kills Python Bridge (PID on Port 5000)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-slate-950/50 border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center font-mono text-[11px] font-bold">3</span>
                    <span className="text-slate-200">Kills Web Server & closes background tasks</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex gap-2">
                  <button
                    onClick={handleTriggerKill}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-medium text-xs shadow-lg shadow-red-600/30 transition-all font-mono uppercase tracking-wider"
                  >
                    <Power className="w-4 h-4" />
                    <span>Halt PRAJ Now</span>
                  </button>

                  <button
                    onClick={() => downloadScriptFile('KILL_PRAJ.bat', KILL_PRAJ_BAT)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
                    title="Download Windows KILL_PRAJ.bat file"
                  >
                    <Download className="w-4 h-4" />
                    <span>.bat</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy('KILL_PRAJ.bat', KILL_PRAJ_BAT)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    {copiedFile === 'KILL_PRAJ.bat' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setPreviewScript(previewScript === 'kill' ? null : 'kill')}
                    className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{previewScript === 'kill' ? 'Hide Code' : 'View Code'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. INTERACTIVE 7-IN-1 MASTER SWITCH CONSOLE */}
          <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wide">
                  Interactive Master Console (PRAJ_MASTER_SWITCH.bat)
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Interactive Windows CLI with 7 options: [1] Activate Praj, [2] Emergency Kill, [3] Abort Shutdown ("Arise"), [4] Status Port Audit, [5] Full Cycle Restart, [6] Auto-Install Python (1-Click), [7] Exit.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={() => downloadScriptFile('PRAJ_MASTER_SWITCH.bat', PRAJ_MASTER_SWITCH_BAT)}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium text-xs transition-colors font-mono"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Console</span>
              </button>

              <button
                onClick={() => setPreviewScript(previewScript === 'master' ? null : 'master')}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                title="View Console Script"
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Script Code Preview Accordion */}
          {previewScript && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan-400">
                  {previewScript === 'toggle' && 'PRAJ_SWITCH.bat (Smart 1-Click Dual Auto-Toggle Switch)'}
                  {previewScript === 'python' && 'INSTALL_PYTHON.bat (1-Click Python Windows Auto-Installer)'}
                  {previewScript === 'start' && 'START_PRAJ.bat (Windows Master Launcher)'}
                  {previewScript === 'kill' && 'KILL_PRAJ.bat (Windows Emergency Kill Switch)'}
                  {previewScript === 'master' && 'PRAJ_MASTER_SWITCH.bat (Interactive Master Console)'}
                </span>
                <button
                  onClick={() => setPreviewScript(null)}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close Preview
                </button>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 bg-slate-900/90 p-3 rounded-lg overflow-x-auto max-h-48 border border-slate-800/80 leading-relaxed">
                {previewScript === 'toggle' && PRAJ_SWITCH_BAT}
                {previewScript === 'python' && INSTALL_PYTHON_BAT}
                {previewScript === 'start' && START_PRAJ_BAT}
                {previewScript === 'kill' && KILL_PRAJ_BAT}
                {previewScript === 'master' && PRAJ_MASTER_SWITCH_BAT}
              </pre>
            </div>
          )}

          {/* Voice Command Reference for Kill & Master Switch */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Voice Activated Master & Kill Switch Commands:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-slate-300 font-mono text-[11px]">
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-red-400">"PRAJ, kill switch"</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Instant halt of speech & shutdown</p>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-red-400">"PRAJ, emergency stop"</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Emergency abort all tasks</p>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-amber-400">"PRAJ, arise"</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Cancel shutdown sequence</p>
              </div>
              <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                <span className="text-cyan-400">"PRAJ, activate system"</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Opens Master Switch console</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>PRAJ Master Switch Engine • Windows & Cross-Platform Bridge</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
