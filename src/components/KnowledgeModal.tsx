import { useState } from 'react';
import { X, BookOpen, Search, Atom, Globe, Compass, Sparkles } from 'lucide-react';
import { KNOWLEDGE_LIST } from '../data/knowledgeBase';
import { KnowledgeItem } from '../types';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (question: string) => void;
}

export function KnowledgeModal({ isOpen, onClose, onSelectQuestion }: KnowledgeModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = KNOWLEDGE_LIST.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
                Offline Knowledge Base (Zero-API)
              </h2>
              <p className="text-xs text-slate-400">
                Over 60 built-in facts & physics laws answered offline instantly without an API key
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

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search offline questions (e.g. Newton, gravity, prime minister)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['all', 'physics', 'geography', 'science', 'gk'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs uppercase font-medium tracking-wider transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              No matching knowledge entries found.
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectQuestion(item.question);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl border border-slate-800/80 bg-slate-950/50 hover:bg-cyan-950/20 hover:border-cyan-500/40 transition-all group flex flex-col gap-1 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                    {item.question}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 group-hover:text-cyan-400">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {item.answer}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filtered.length} knowledge entries</span>
          <span className="text-cyan-400 font-medium">Click any question to ask PRAJ</span>
        </div>
      </div>
    </div>
  );
}
