import { useState } from 'react';
import { X, Database, Save, Trash2, Check } from 'lucide-react';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: string;
  onSaveMemory: (text: string) => void;
}

export function MemoryModal({ isOpen, onClose, memory, onSaveMemory }: MemoryModalProps) {
  const [val, setVal] = useState(memory);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveMemory(val.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    setVal('');
    onSaveMemory('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-100 uppercase tracking-wider font-mono">
                PRAJ Memory Storage
              </h2>
              <p className="text-xs text-slate-400">
                Persistent local notes (equivalent to temp_memory.txt)
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="textarea-memory-content" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Current Memory Buffer
            </label>
            <textarea
              id="textarea-memory-content"
              rows={4}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="e.g. 'Project files are stored on Desktop in the PRAJ folder'..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 text-sm focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <p className="text-xs text-slate-500">
            Tip: You can also say or type <code className="text-cyan-300">"remember [anything]"</code> to save notes, and <code className="text-cyan-300">"do you remember"</code> to recall it at any time.
          </p>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleClear}
              className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Memory</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              {saved ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Save className="w-3.5 h-3.5" />}
              <span>{saved ? 'Saved to Memory!' : 'Save Memory'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
