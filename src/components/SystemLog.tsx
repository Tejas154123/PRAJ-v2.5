import { Terminal, Trash2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { CommandResult } from '../types';

interface SystemLogProps {
  logs: CommandResult[];
  onClearLogs: () => void;
}

export function SystemLog({ logs, onClearLogs }: SystemLogProps) {
  return (
    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden font-mono text-xs shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">SYSTEM TELEMETRY & EXECUTION TERMINAL</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            {logs.length} entries
          </span>
        </div>

        <button
          onClick={onClearLogs}
          disabled={logs.length === 0}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 disabled:opacity-40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>

      {/* Log Feed */}
      <div className="p-4 max-h-60 overflow-y-auto space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-6">
            // No telemetry events registered. Dispatch a command to see live stream.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2.5 pb-2 border-b border-slate-900/60 last:border-b-0"
            >
              <span className="text-slate-500 text-[10px] flex-shrink-0 pt-0.5">
                [{log.timestamp}]
              </span>

              {log.systemExecuted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-cyan-300 font-medium">CMD: "{log.command}"</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                    {log.actionType}
                  </span>
                  {log.latencyMs !== undefined && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {log.latencyMs}ms
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-[11px] mt-0.5 truncate">
                  → {log.reply}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
