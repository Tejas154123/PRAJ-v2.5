import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  X, 
  CornerDownLeft, 
  Radio, 
  Image as ImageIcon, 
  Code2, 
  Sparkles, 
  Maximize2, 
  Minimize2,
  Trash2
} from 'lucide-react';

interface CommandInputProps {
  onSendCommand: (cmd: string, source: 'voice' | 'typing', imageBase64?: string) => void;
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
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea height as user types code or multi-line prompts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      if (isExpanded) {
        textareaRef.current.style.height = Math.max(160, Math.min(scrollHeight, 400)) + 'px';
      } else {
        textareaRef.current.style.height = Math.max(48, Math.min(scrollHeight, 200)) + 'px';
      }
    }
  }, [inputVal, isExpanded]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputVal.trim() && !attachedImage) || isProcessing) return;
    
    const promptToSend = inputVal.trim() || (attachedImage ? 'Analyze this image and describe or extract information from it.' : '');
    onSendCommand(promptToSend, 'typing', attachedImage || undefined);
    
    setInputVal('');
    setAttachedImage(null);
    setImageName('');
    if (textareaRef.current) {
      textareaRef.current.style.height = isExpanded ? '160px' : '48px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (unless Shift+Enter is pressed for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      if (inputVal || attachedImage) {
        setInputVal('');
        setAttachedImage(null);
        setImageName('');
      } else if (isExpanded) {
        setIsExpanded(false);
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please select a smaller image.');
      return;
    }

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachedImage(reader.result);
        if (!inputVal) {
          setInputVal('Explain this code / screenshot in detail and provide improvements:');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input to allow re-selecting same file
  };

  const sampleSuggestions = [
    'write a python script for file cleaner',
    'generate a react typescript counter hook',
    'what is the weather in Delhi',
    'play starboy on youtube',
    'take screenshot',
    'explain this image code',
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Input container */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex flex-col w-full bg-slate-900/95 border transition-all duration-200 rounded-2xl shadow-2xl backdrop-blur-md ${
          isExpanded 
            ? 'border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)]' 
            : 'border-slate-700/80 focus-within:border-cyan-500/80'
        } p-2.5`}
      >
        {/* Attached Image Thumbnail Preview (if present) */}
        {attachedImage && (
          <div className="mb-2 p-2 rounded-xl bg-slate-950/80 border border-cyan-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img 
                src={attachedImage} 
                alt="Upload preview" 
                className="w-12 h-12 object-cover rounded-lg border border-slate-700 flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-cyan-300 truncate">
                  {imageName || 'Attached Image'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Vision analysis active • Ready for AI review
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAttachedImage(null);
                setImageName('');
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
              title="Remove attached image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Area Input */}
        <div className="flex items-start gap-2 w-full">
          {/* Voice Trigger Button */}
          <button
            type="button"
            id="btn-voice-input-mic"
            onClick={onToggleMic}
            disabled={isProcessing}
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all flex-shrink-0 mt-0.5 ${
              isListening
                ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700/90 text-cyan-400 hover:text-cyan-300'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice recognition (speak your command)'}
          >
            <Mic className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            id="input-praj-command"
            rows={isExpanded ? 6 : 1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to your voice... Speak now'
                : isExpanded
                ? 'Type or paste code, instructions, programming questions or commands (Shift+Enter for newline)...'
                : 'Type command, ask to generate code, or ask: "write a python script", "analyze this image"...'
            }
            disabled={isProcessing}
            className="flex-1 bg-transparent px-3 py-2.5 text-sm md:text-base text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans leading-relaxed min-h-[48px]"
          />

          {/* Expand / Minimize Code Box Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-xl transition-colors mt-1 cursor-pointer ${
              isExpanded 
                ? 'text-cyan-300 bg-cyan-950/60 border border-cyan-500/40' 
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
            }`}
            title={isExpanded ? 'Collapse to single line' : 'Expand full editor for coding & long prompts'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Clear Button */}
          {(inputVal || attachedImage) && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                setAttachedImage(null);
                setImageName('');
              }}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors mt-1 cursor-pointer"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Send Button */}
          <button
            type="submit"
            id="btn-send-command"
            disabled={(!inputVal.trim() && !attachedImage) || isProcessing}
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all flex-shrink-0 mt-0.5 ${
              (inputVal.trim() || attachedImage) && !isProcessing
                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer'
                : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
            }`}
            title="Send command or query (Enter)"
          >
            <CornerDownLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar Toolbar (Image Upload & Code Helpers) */}
        <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t border-slate-800/80 px-1 text-xs">
          <div className="flex items-center gap-2">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            {/* Add Image Button */}
            <button
              type="button"
              id="btn-attach-image"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-cyan-300 hover:text-cyan-200 border border-slate-700 transition-colors cursor-pointer font-medium"
              title="Upload image or screenshot to analyze or explain"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{attachedImage ? 'Replace Image' : 'Add Image'}</span>
            </button>

            {/* Code Generator Quick Prompt Insert */}
            <button
              type="button"
              onClick={() => {
                setIsExpanded(true);
                setInputVal((prev) => 
                  prev ? `${prev}\n\nWrite a clean, production-ready solution in TypeScript:` : 'Write a clean, production-ready script with comments explaining how it works:'
                );
                textareaRef.current?.focus();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700 transition-colors cursor-pointer"
              title="Expand editor & insert code template"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Code Mode</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Shift+Enter</kbd> for newline
          </div>
        </div>
      </form>

      {/* Mode Controls & Quick Suggestion Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Continuous Listen Toggle */}
        <button
          type="button"
          onClick={onToggleContinuous}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-colors border cursor-pointer ${
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
              className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors whitespace-nowrap cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
