import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, X, CornerDownLeft, Radio } from 'lucide-react';

interface CommandInputProps {
  onSendCommand: (cmd: string, source: 'voice' | 'typing') => void;
  isListening: boolean;
  onToggleMic: () => void;
  continuousMode: boolean;
  onToggleContinuous: () => void;
  isProcessing: boolean;
}

export function CommandInput({
  onSendCommand,
  isListening,
  onToggleMic,
  continuousMode,
  onToggleContinuous,
  isProcessing,
}: CommandInputProps) {
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputVal.trim() || isProcessing) return;
    onSendCommand(inputVal.trim(), 'typing');
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInputVal('');
    }
  };

  const sampleSuggestions = [
    'open chrome',
    'open notepad',
    'open vlc',
    'bluetooth settings',
    "what is newton's first law",
    'do you remember',
    'open youtube',
    'headlines',
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Input container */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full bg-slate-900/90 border border-slate-700/80 focus-within:border-cyan-500/80 rounded-2xl p-1.5 shadow-xl transition-all duration-200"
      >
        {/* Voice Trigger Button */}
        <button
          type="button"
          id="btn-voice-input-mic"
          onClick={onToggleMic}
          disabled={isProcessing}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
            isListening
              ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700/90 text-cyan-400 hover:text-cyan-300'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice recognition (speak your command)'}
        >
          {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          id="input-praj-command"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening
              ? 'Listening to your voice... Speak now'
              : 'Type command or say: "open chrome", "shutdown 45", "remember my keys"...'
          }
          disabled={isProcessing}
          className="flex-1 bg-transparent px-3 py-2 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none"
        />

        {/* Clear Button */}
        {inputVal && (
          <button
            type="button"
            onClick={() => setInputVal('')}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors mr-1"
            title="Clear text"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Send Button */}
        <button
          type="submit"
          id="btn-send-command"
          disabled={!inputVal.trim() || isProcessing}
          className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all ${
            inputVal.trim() && !isProcessing
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer'
              : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
          }`}
          title="Send command"
        >
          <CornerDownLeft className="w-5 h-5" />
        </button>
      </form>

      {/* Mode Controls & Quick Suggestion Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Continuous Listen Toggle */}
        <button
          type="button"
          onClick={onToggleContinuous}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
            continuousMode
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-300'
          }`}
          title="When enabled, mic stays active and listens for wake-word 'PRAJ'"
        >
          <Radio className={`w-3.5 h-3.5 ${continuousMode ? 'text-cyan-400 animate-pulse' : ''}`} />
          <span>Wake-Word Loop: {continuousMode ? 'ON' : 'OFF'}</span>
        </button>

        {/* Suggestion pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Try:</span>
          {sampleSuggestions.slice(0, 4).map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => onSendCommand(sug, 'typing')}
              className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors whitespace-nowrap"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
