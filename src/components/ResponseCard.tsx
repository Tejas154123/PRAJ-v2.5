import { Volume2, Copy, Check, Clock, Laptop, Sparkles, BookOpen, AlertOctagon, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { CommandResult } from '../types';

interface ResponseCardProps {
  result: CommandResult | null;
  onReplayVoice: (text: string) => void;
  onCancelShutdown: () => void;
}

export function ResponseCard({ result, onReplayVoice, onCancelShutdown }: ResponseCardProps) {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="w-full p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 min-h-[140px]">
        <Laptop className="w-8 h-8 mb-2 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">PRAJ Systems Standing By</p>
        <p className="text-xs text-slate-500 mt-1">
          Give a command above via speech or typing to trigger OS actions & responses
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isShutdown = result.reply.toLowerCase().includes('shutdown') || result.command.toLowerCase().includes('shutdown');

  return (
    <div
      className={`w-full p-5 md:p-6 rounded-2xl border transition-all shadow-xl backdrop-blur-md ${
        isShutdown
          ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/20'
          : result.systemExecuted
          ? 'bg-slate-900/80 border-cyan-500/40 shadow-[0_4px_25px_rgba(6,182,212,0.12)]'
          : 'bg-slate-900/80 border-slate-800'
      }`}
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Action badge */}
          {result.systemExecuted ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 font-medium">
              <Laptop className="w-3.5 h-3.5" />
              OS Executed
            </span>
          ) : result.actionType === 'knowledge_base' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-950/50 border border-blue-500/40 text-blue-300 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              Offline KB (No API Key)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/40 text-purple-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              AI Synthesized
            </span>
          )}

          <span className="text-slate-400 font-mono">
            Prompt: <strong className="text-slate-200">"{result.command}"</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          {result.latencyMs !== undefined && (
            <span className="hidden sm:inline font-mono">{result.latencyMs}ms</span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {result.timestamp}
          </span>
        </div>
      </div>

      {/* Main Jarvis Voice Reply Content */}
      <div className="py-4">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0 animate-pulse" />
          <div className="flex-1 text-slate-100 text-base md:text-lg leading-relaxed font-sans font-medium selection:bg-cyan-500/30">
            {result.reply}
          </div>
        </div>

        {/* Emergency Cancel Shutdown Button */}
        {isShutdown && !result.command.toLowerCase().includes('arise') && (
          <div className="mt-4 p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-rose-300 text-xs sm:text-sm">
              <AlertOctagon className="w-5 h-5 text-rose-400 animate-bounce flex-shrink-0" />
              <span>Shutdown sequence is active on the host machine.</span>
            </div>
            <button
              id="btn-cancel-shutdown-arise"
              onClick={onCancelShutdown}
              className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              Cancel Shutdown (Say "Arise")
            </button>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
        <span className="text-[11px] text-slate-500">
          Source: {result.source === 'voice' ? 'Spoken Voice Recognition' : 'Typed Command Bar'}
        </span>

        <div className="flex items-center gap-2">
          {/* Replay voice button */}
          <button
            onClick={() => onReplayVoice(result.reply)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Read out aloud again"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Replay Voice</span>
          </button>

          {/* Copy response */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
            title="Copy reply text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
