import { useState } from 'react';
import { 
  Chrome, 
  FileText, 
  PlaySquare, 
  Bluetooth, 
  Calculator, 
  Youtube, 
  Music, 
  MessageSquare, 
  Mail, 
  Clock, 
  Newspaper, 
  Power, 
  Undo2, 
  Database,
  TerminalSquare,
  Bot
} from 'lucide-react';

interface QuickActionsProps {
  onSendCommand: (cmd: string, source: 'quick_action') => void;
  bridgeConnected: boolean;
}

export function QuickActions({ onSendCommand, bridgeConnected }: QuickActionsProps) {
  const [activeTab, setActiveTab] = useState<'apps' | 'web' | 'system' | 'memory'>('apps');

  const actionCategories = {
    apps: [
      {
        id: 'chrome',
        label: 'Open Chrome',
        cmd: 'open chrome',
        icon: Chrome,
        desc: 'Launches Google Chrome on host PC',
        color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/20',
      },
      {
        id: 'notepad',
        label: 'Open Notepad',
        cmd: 'open notepad',
        icon: FileText,
        desc: 'Launches Windows Notepad text editor',
        color: 'text-blue-400 border-blue-500/30 hover:bg-blue-950/20',
      },
      {
        id: 'vlc',
        label: 'Open VLC Player',
        cmd: 'open vlc',
        icon: PlaySquare,
        desc: 'Launches VLC Media Player application',
        color: 'text-orange-400 border-orange-500/30 hover:bg-orange-950/20',
      },
      {
        id: 'notepad_plus',
        label: 'Open Notepad++',
        cmd: 'open notepad++',
        icon: TerminalSquare,
        desc: 'Launches Notepad++ code editor',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
      {
        id: 'bluetooth',
        label: 'Bluetooth Settings',
        cmd: 'open bluetooth',
        icon: Bluetooth,
        desc: 'Opens Windows Bluetooth control panel',
        color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/20',
      },
      {
        id: 'calculator',
        label: 'Open Calculator',
        cmd: 'open calculator',
        icon: Calculator,
        desc: 'Opens native operating system calculator',
        color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20',
      },
    ],
    web: [
      {
        id: 'youtube',
        label: 'Open YouTube',
        cmd: 'open youtube',
        icon: Youtube,
        desc: 'Opens YouTube in browser',
        color: 'text-red-400 border-red-500/30 hover:bg-red-950/20',
      },
      {
        id: 'spotify',
        label: 'Open Spotify',
        cmd: 'open spotify',
        icon: Music,
        desc: 'Opens Spotify web player',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
      {
        id: 'whatsapp',
        label: 'Open WhatsApp',
        cmd: 'open whatsapp',
        icon: MessageSquare,
        desc: 'Opens WhatsApp Web messenger',
        color: 'text-green-400 border-green-500/30 hover:bg-green-950/20',
      },
      {
        id: 'gmail',
        label: 'Open Gmail',
        cmd: 'open gmail',
        icon: Mail,
        desc: 'Opens Google Mail inbox',
        color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20',
      },
      {
        id: 'chatgpt',
        label: 'Open ChatGPT',
        cmd: 'open chat gpt',
        icon: Bot,
        desc: 'Opens ChatGPT web interface',
        color: 'text-teal-400 border-teal-500/30 hover:bg-teal-950/20',
      },
    ],
    system: [
      {
        id: 'time',
        label: 'System Time',
        cmd: 'what time is it',
        icon: Clock,
        desc: 'Reads current system clock time',
        color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/20',
      },
      {
        id: 'headlines',
        label: 'Top Headlines',
        cmd: 'news headlines',
        icon: Newspaper,
        desc: 'Reads latest world and national news',
        color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/20',
      },
      {
        id: 'shutdown30',
        label: 'Shutdown (30s)',
        cmd: 'shutdown 30',
        icon: Power,
        desc: 'Schedules PC power shutdown in 30s',
        color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20',
      },
      {
        id: 'arise',
        label: 'Cancel Shutdown ("Arise")',
        cmd: 'arise',
        icon: Undo2,
        desc: 'Aborts pending system shutdown sequence',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
    ],
    memory: [
      {
        id: 'recall_notes',
        label: 'What did I tell you to remember?',
        cmd: 'do you remember',
        icon: Database,
        desc: 'Recalls saved notes from temp_memory.txt',
        color: 'text-purple-400 border-purple-500/30 hover:bg-purple-950/20',
      },
      {
        id: 'remember_keys',
        label: 'Remember: Meeting at 4pm',
        cmd: 'remember meeting at 4pm today',
        icon: Database,
        desc: 'Stores note into local persistent memory',
        color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/20',
      },
    ],
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {(['apps', 'web', 'system', 'memory'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab === 'apps'
                ? 'Desktop Apps'
                : tab === 'web'
                ? 'Web Portals'
                : tab === 'system'
                ? 'System Power & Time'
                : 'Memory Bank'}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          {bridgeConnected ? '● Host Bridge Linked' : '○ Standby'}
        </span>
      </div>

      {/* Grid of Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {actionCategories[activeTab].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onSendCommand(action.cmd, 'quick_action')}
              className={`p-3 rounded-xl border bg-slate-900/60 text-left flex flex-col justify-between transition-all duration-200 group cursor-pointer ${action.color}`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                  {action.cmd}
                </span>
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-slate-200 group-hover:text-white">
                  {action.label}
                </p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {action.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
