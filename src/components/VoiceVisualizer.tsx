import { motion } from 'motion/react';
import { Mic, Volume2, ShieldCheck, Sparkles, Activity } from 'lucide-react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  bridgeConnected: boolean;
  onToggleMic: () => void;
}

export function VoiceVisualizer({
  isListening,
  isSpeaking,
  transcript,
  bridgeConnected,
  onToggleMic,
}: VoiceVisualizerProps) {
  return (
    <div className="relative flex flex-col items-center justify-center p-6 md:p-8 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-md shadow-2xl overflow-hidden">
      {/* Subtle background circuit grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Ambient glow rings */}
      <div
        className={`absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isListening
            ? 'bg-cyan-500/20 scale-110'
            : isSpeaking
            ? 'bg-amber-500/15 scale-105'
            : 'bg-cyan-900/10 scale-90'
        }`}
      />

      {/* Main Interactive Arc Reactor / Pulse Core */}
      <div className="relative flex items-center justify-center my-4">
        {/* Outer rotating pulse ring */}
        <motion.div
          animate={{
            rotate: isListening ? 360 : isSpeaking ? -360 : 0,
            scale: isListening ? [1, 1.08, 1] : 1,
          }}
          transition={{
            rotate: { duration: isListening ? 8 : 14, repeat: Infinity, ease: 'linear' },
            scale: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          className={`absolute w-36 h-36 md:w-44 md:h-44 rounded-full border border-dashed transition-colors duration-500 ${
            isListening
              ? 'border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
              : isSpeaking
              ? 'border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
              : 'border-slate-700/60'
          }`}
        />

        {/* Secondary wave ring */}
        {isListening && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.45, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
            className="absolute w-36 h-36 md:w-44 md:h-44 rounded-full border-2 border-cyan-400/40 pointer-events-none"
          />
        )}

        {/* Central Core Button */}
        <button
          id="btn-voice-toggle-core"
          onClick={onToggleMic}
          className={`relative z-10 w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 ${
            isListening
              ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 shadow-[0_0_40px_rgba(6,182,212,0.6)] focus:ring-cyan-400/50 scale-105'
              : isSpeaking
              ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 shadow-[0_0_35px_rgba(245,158,11,0.5)] focus:ring-amber-400/50'
              : 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30 hover:border-cyan-400 hover:bg-slate-800 shadow-[0_0_20px_rgba(6,182,212,0.15)] focus:ring-cyan-500/30'
          }`}
          title={isListening ? 'Click to stop listening' : 'Click to speak or say "PRAJ"'}
        >
          {isListening ? (
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex flex-col items-center"
            >
              <Mic className="w-8 h-8 md:w-10 md:h-10 text-slate-950" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1 text-slate-950">
                Listening
              </span>
            </motion.div>
          ) : isSpeaking ? (
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="flex flex-col items-center"
            >
              <Volume2 className="w-8 h-8 md:w-10 md:h-10 text-slate-950" />
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider mt-1 text-slate-950">
                Speaking
              </span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center group">
              <Mic className="w-8 h-8 md:w-10 md:h-10 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wider mt-1 text-slate-400 group-hover:text-cyan-300">
                Tap to Talk
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Audio Waveform Bars (Active when listening or speaking) */}
      <div className="flex items-center justify-center gap-1.5 h-8 my-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: isListening
                ? [6, Math.sin((i / 16) * Math.PI) * 28 + Math.random() * 8 + 4, 6]
                : isSpeaking
                ? [4, Math.cos((i / 16) * Math.PI) * 22 + 4, 4]
                : 3,
            }}
            transition={{
              duration: isListening ? 0.35 + (i % 3) * 0.1 : 0.45,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.03,
            }}
            className={`w-1 rounded-full transition-colors duration-300 ${
              isListening
                ? 'bg-cyan-400'
                : isSpeaking
                ? 'bg-amber-400'
                : 'bg-slate-700/50'
            }`}
          />
        ))}
      </div>

      {/* Dynamic Status / Live Transcript */}
      <div className="w-full text-center max-w-xl min-h-[3.25rem] flex flex-col items-center justify-center mt-1">
        {transcript ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-cyan-950/40 border border-cyan-500/30 rounded-full text-cyan-200 text-sm md:text-base font-medium inline-flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
            <span className="truncate">"{transcript}"</span>
          </motion.div>
        ) : isListening ? (
          <p className="text-sm text-cyan-300/80 animate-pulse flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Speak now, sir. E.g., "Open Chrome", "Open Notepad", "What is Newton's first law?"
          </p>
        ) : (
          <p className="text-xs md:text-sm text-slate-400 flex items-center gap-2">
            Say <span className="text-cyan-400 font-mono font-medium">"PRAJ"</span> or click the mic to begin voice command
          </p>
        )}
      </div>

      {/* Live System Execution Badge */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            bridgeConnected
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${bridgeConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          {bridgeConnected ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Host PC Linked: Commands Execute on System</span>
            </>
          ) : (
            <span>Bridge Standby (Click 'Connect PC' to link local apps)</span>
          )}
        </span>
      </div>
    </div>
  );
}
