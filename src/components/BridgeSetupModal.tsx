import { useState } from 'react';
import { X, Download, Copy, Check, ShieldCheck, RefreshCw, Terminal, Laptop, HelpCircle, Zap, Power, Code2 } from 'lucide-react';
import { BridgeStatus } from '../types';
import { PYTHON_BRIDGE_SCRIPT } from '../data/pythonBridgeScript';
import { START_PRAJ_BAT, KILL_PRAJ_BAT, INSTALL_PYTHON_BAT, downloadScriptFile } from '../data/batchScripts';

interface BridgeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  bridgeStatus: BridgeStatus;
  onCheckBridge: (customUrl?: string) => Promise<void>;
  bridgeUrl: string;
  setBridgeUrl: (url: string) => void;
  onOpenMasterSwitch?: () => void;
}

export function BridgeSetupModal({
  isOpen,
  onClose,
  bridgeStatus,
  onCheckBridge,
  bridgeUrl,
  setBridgeUrl,
  onOpenMasterSwitch,
}: BridgeSetupModalProps) {
  const [copied, setCopied] = useState(false);
  const [testingPing, setTestingPing] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_BRIDGE_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_BRIDGE_SCRIPT], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'praj_desktop_bridge.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    await onCheckBridge(bridgeUrl);
    setTestingPing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <Laptop className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
                Host PC Agent & Desktop Bridge
              </h2>
              <p className="text-xs text-slate-400">
                Enables this web interface to execute real actions on your local operating system
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              bridgeStatus.connected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  bridgeStatus.connected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
                }`}
              />
              <div>
                <p className="font-semibold text-sm">
                  {bridgeStatus.connected ? 'Local Desktop Bridge is Connected!' : 'Local Desktop Bridge is in Standby'}
                </p>
                <p className="text-xs opacity-80 mt-0.5">
                  {bridgeStatus.connected
                    ? `Running on ${bridgeStatus.platform || 'your OS'} at ${bridgeStatus.bridgeUrl}. All typed & voice commands execute on your host machine.`
                    : 'Run praj_desktop_bridge.py on your PC to trigger native applications directly.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleTestPing}
              disabled={testingPing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingPing ? 'animate-spin' : ''}`} />
              <span>Test Ping</span>
            </button>
          </div>

          {/* Quick Steps */}
          <div>
            <h3 className="text-xs uppercase font-bold text-cyan-400 tracking-wider mb-3">
              How to Link Your Local Computer (3 Steps)
            </h3>
            <ol className="space-y-3">
              <li className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex-shrink-0">
                  1
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">Download the Python Bridge Script</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click the download button below to save <code className="text-cyan-300 font-mono">praj_desktop_bridge.py</code> onto your machine.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download praj_desktop_bridge.py</span>
                    </button>
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex-shrink-0">
                  2
                </span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">Run the Script in Terminal or Command Prompt</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Open your command prompt in that folder and run:
                  </p>
                  <div className="mt-1.5 p-2 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-cyan-300 flex items-center justify-between">
                    <span>python praj_desktop_bridge.py</span>
                  </div>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex-shrink-0">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-200">Auto-Launch & Real System Execution</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    The script opens this web UI in your browser. Whenever you speak or type "open chrome", "open notepad", "shutdown 30", or "open vlc", the command runs directly on your computer without ever saying "I am a web based AI"!
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* 1-Click Launcher & Kill Switch Windows Automation */}
          <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-slate-950/60 to-red-950/40 border border-slate-700/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                  1-Click Windows Master Launch & Kill Switch
                </h4>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Skip typing terminal commands manually. Double-click <code className="text-cyan-300 font-mono">START_PRAJ.bat</code> to launch both programs at once, or <code className="text-red-300 font-mono">KILL_PRAJ.bat</code> for an emergency stop.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => downloadScriptFile('START_PRAJ.bat', START_PRAJ_BAT)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium font-mono shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>START_PRAJ.bat</span>
              </button>
              <button
                onClick={() => downloadScriptFile('INSTALL_PYTHON.bat', INSTALL_PYTHON_BAT)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium font-mono shadow-md transition-colors"
                title="Download 1-Click Python Setup for Windows"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>INSTALL_PYTHON.bat</span>
              </button>
              <button
                onClick={() => downloadScriptFile('KILL_PRAJ.bat', KILL_PRAJ_BAT)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium font-mono shadow-md transition-colors"
              >
                <Power className="w-3.5 h-3.5" />
                <span>KILL_PRAJ.bat</span>
              </button>
              {onOpenMasterSwitch && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenMasterSwitch();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-medium font-mono transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open Master Console</span>
                </button>
              )}
            </div>
          </div>

          {/* Config URL */}
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="flex-1">
              <label htmlFor="input-bridge-endpoint-url" className="text-xs font-medium text-slate-400">Bridge Endpoint URL</label>
              <input
                id="input-bridge-endpoint-url"
                type="text"
                value={bridgeUrl}
                onChange={(e) => setBridgeUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 mt-1 font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              onClick={handleTestPing}
              className="mt-5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${testingPing ? 'animate-spin' : ''}`} />
              <span>Connect</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/60">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Standard Python library only • Zero npm dependencies needed
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
