import { useState } from 'react';
import { X, Database, Save, Trash2, Check, MessageSquare, History, Sparkles, Copy, Clock } from 'lucide-react';
import { CommandResult } from '../types';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: string;
  onSaveMemory: (text: string) => void;
  conversationHistory?: CommandResult[];
  onClearConversationHistory?: () => void;
}

export function MemoryModal({ 
  isOpen, 
  onClose, 
  memory, 
  onSaveMemory,
  conversationHistory = [],
  onClearConversationHistory,
}: MemoryModalProps) {
  const [activeTab, setActiveTab] = useState<'conversations' | 'notes'>('conversations');
  const [val, setVal] = useState(memory);
  const [saved, setSaved] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveMemory(val.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearNote = () => {
    setVal('');
    onSaveMemory('');
  };

  const handleCopyTurn = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                PRAJ Conversational Memory &amp; Storage
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                PRAJ remembers previous conversation turns and persists notes across sessions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close memory modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === 'conversations'
                ? 'bg-slate-900 text-cyan-300 border-slate-700/80 -mb-px'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Remembered Conversations ({conversationHistory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-t border-x cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-slate-900 text-cyan-300 border-slate-700/80 -mb-px'
                : 'text-slate-400 hover:text-white border-transparent'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Saved Memory Notes (temp_memory.txt)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'conversations' ? (
            <div className="space-y-4">
              {/* Header Info & Clear Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>
                    Previous discussions are stored and fed into AI queries for follow-up context.
                  </span>
                </div>
                {conversationHistory.length > 0 && onClearConversationHistory && (
                  <button
                    onClick={onClearConversationHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 rounded-lg border border-rose-500/30 transition-all cursor-pointer font-medium self-start sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                )}
              </div>

              {/* Conversation Log List */}
              {conversationHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <History className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-medium text-slate-400">No previous conversations recorded yet.</p>
                  <p className="text-xs">Ask questions or speak commands to build conversation context!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversationHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                    >
                      {/* User Query */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span className="font-semibold text-cyan-400">YOU</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.timestamp}
                            </span>
                            <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {item.source}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-white">
                            &quot;{item.command}&quot;
                          </div>
                        </div>

                        <button
                          onClick={() => handleCopyTurn(`User: ${item.command}\nPRAJ: ${item.reply}`, item.id)}
                          className="p-1.5 text-slate-500 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Copy exchange"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* PRAJ Reply */}
                      <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 pl-2 border-l-2 border-l-cyan-500/50">
                        <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold mb-0.5">
                          PRAJ REPLY
                        </div>
                        {item.reply}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="textarea-memory-content" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Permanent Knowledge / Fact Buffer
                </label>
                <textarea
                  id="textarea-memory-content"
                  rows={5}
                  value={val}
                  onChange={(e) => setVal(e.target.value)}
                  placeholder="e.g. 'Project files are stored on Desktop in the PRAJ folder. My preferred programming language is TypeScript'..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400 font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Voice Quick Commands:</span>
                </div>
                <p>• Say <code className="text-cyan-300">&quot;remember [anything]&quot;</code> to save facts or notes hands-free.</p>
                <p>• Say <code className="text-cyan-300">&quot;do you remember&quot;</code> or <code className="text-cyan-300">&quot;what did I tell you to remember&quot;</code> to recall it.</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleClearNote}
                  className="px-3.5 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl border border-rose-900/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Note</span>
                </button>

                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                >
                  {saved ? <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saved ? 'Saved to Memory!' : 'Save Note'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/80 text-xs text-slate-400">
          <span>Storage: Local Storage &amp; Host Bridge Synced</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
