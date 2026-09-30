import { 
  Volume2, 
  Copy, 
  Check, 
  Clock, 
  Laptop, 
  Sparkles, 
  BookOpen, 
  AlertOctagon, 
  Undo2,
  Code2,
  Terminal,
  Image as ImageIcon
} from 'lucide-react';
import { useState } from 'react';
import { CommandResult } from '../types';

interface ResponseCardProps {
  result: CommandResult | null;
  onReplayVoice: (text: string) => void;
  onCancelShutdown: () => void;
}

// Helper to render Markdown code blocks with syntax styling and dedicated 1-click copy buttons
function FormattedMessageContent({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Split text by markdown triple backtick code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const language = firstLineEnd !== -1 ? part.substring(3, firstLineEnd).trim() : '';
          const code = firstLineEnd !== -1 ? part.substring(firstLineEnd + 1, part.length - 3).trim() : part.slice(3, -3).trim();

          return (
            <div
              key={index}
              className="my-3 rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-2xl"
            >
              {/* Code block header bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider text-[11px] ml-1">
                    {language || 'code'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(code, index)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors font-mono text-[11px] cursor-pointer"
                  title="Copy code to clipboard"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code content */}
              <pre className="p-4 text-xs sm:text-sm font-mono text-cyan-100 overflow-x-auto leading-relaxed bg-slate-950 selection:bg-cyan-500/30">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Standard text paragraphs
        return (
          <p key={index} className="whitespace-pre-wrap leading-relaxed">
            {part}
          </p>
        );
      })}
    </div>
  );
}

export function ResponseCard({ result, onReplayVoice, onCancelShutdown }: ResponseCardProps) {
  const [copied, setCopied] = useState(false);

  if (!result) {
    return (
      <div className="w-full p-8 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-slate-500 min-h-[160px]">
        <Laptop className="w-9 h-9 mb-2 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">PRAJ Systems Standing By</p>
        <p className="text-xs text-slate-500 mt-1 max-w-md">
          Ask questions, request code generation, attach images/screenshots, or speak desktop automation commands.
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
  const hasCodeBlock = result.reply.includes('```');

  return (
    <div
      className={`w-full p-5 md:p-7 rounded-2xl border transition-all shadow-xl backdrop-blur-md ${
        isShutdown
          ? 'bg-rose-950/20 border-rose-500/40 shadow-rose-950/20'
          : result.systemExecuted
          ? 'bg-slate-900/80 border-cyan-500/40 shadow-[0_4px_25px_rgba(6,182,212,0.12)]'
          : 'bg-slate-900/90 border-slate-800 shadow-[0_4px_30px_rgba(0,0,0,0.4)]'
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
          ) : hasCodeBlock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 font-medium">
              <Code2 className="w-3.5 h-3.5" />
              Code Synthesized
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-950/50 border border-purple-500/40 text-purple-300 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              AI Synthesized
            </span>
          )}

          {result.imageUrl && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-300 font-medium">
              <ImageIcon className="w-3.5 h-3.5" />
              Image Analyzed
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

      {/* Uploaded Image Thumbnail Preview (if prompt had an attached image) */}
      {result.imageUrl && (
        <div className="pt-3 pb-1">
          <div className="inline-block p-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <img 
              src={result.imageUrl} 
              alt="Analyzed user query attachment" 
              className="max-h-48 max-w-full rounded-lg object-contain"
            />
          </div>
        </div>
      )}

      {/* Main Jarvis Voice / Code Reply Content */}
      <div className="py-4">
        <div className="flex items-start gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-2 flex-shrink-0 animate-pulse" />
          <div className="flex-1 text-slate-100 text-sm md:text-base leading-relaxed font-sans font-normal selection:bg-cyan-500/30">
            <FormattedMessageContent text={result.reply} />
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
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <span className="text-[11px] text-slate-500">
          Source: {result.source === 'voice' ? 'Spoken Voice Recognition' : 'Typed Command Bar'}
        </span>

        <div className="flex items-center gap-2">
          {/* Replay voice button */}
          <button
            onClick={() => onReplayVoice(result.reply.replace(/```[\s\S]*?```/g, 'Code block output.'))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Read out aloud"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Read Aloud</span>
          </button>

          {/* Copy response */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
            title="Copy full text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
