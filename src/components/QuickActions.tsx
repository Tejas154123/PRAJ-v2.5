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
  Bot,
  Volume2,
  VolumeX,
  Volume1,
  SkipForward,
  SkipBack,
  Play,
  Camera,
  Scissors,
  Settings,
  Folder,
  Download,
  Code,
  Lock,
  Battery,
  Cpu,
  RotateCcw,
  CloudSun,
  Search,
  MapPin,
  ShoppingCart,
  Tv,
  ShieldAlert,
  Zap,
  Sliders,
  UserCheck,
  Code2
} from 'lucide-react';

interface QuickActionsProps {
  onSendCommand: (cmd: string, source: 'quick_action') => void;
  bridgeConnected: boolean;
}

export function QuickActions({ onSendCommand, bridgeConnected }: QuickActionsProps) {
  const [activeTab, setActiveTab] = useState<'apps' | 'media' | 'system' | 'web' | 'memory'>('apps');

  const actionCategories = {
    apps: [
      {
        id: 'chrome',
        label: 'Open Chrome',
        cmd: 'open chrome',
        icon: Chrome,
        desc: 'Launches Google Chrome browser',
        color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/20',
      },
      {
        id: 'taskmgr',
        label: 'Task Manager',
        cmd: 'open task manager',
        icon: Cpu,
        desc: 'Opens Windows Task Manager',
        color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/20',
      },
      {
        id: 'explorer',
        label: 'File Explorer',
        cmd: 'open file explorer',
        icon: Folder,
        desc: 'Opens File Explorer on host PC',
        color: 'text-blue-400 border-blue-500/30 hover:bg-blue-950/20',
      },
      {
        id: 'downloads',
        label: 'Downloads Folder',
        cmd: 'open downloads',
        icon: Download,
        desc: 'Opens Downloads directory',
        color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-950/20',
      },
      {
        id: 'vscode',
        label: 'VS Code',
        cmd: 'open vs code',
        icon: Code,
        desc: 'Launches Visual Studio Code',
        color: 'text-sky-400 border-sky-500/30 hover:bg-sky-950/20',
      },
      {
        id: 'terminal',
        label: 'Command Terminal',
        cmd: 'open cmd',
        icon: TerminalSquare,
        desc: 'Opens Command Prompt / Terminal',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
      {
        id: 'notepad',
        label: 'Open Notepad',
        cmd: 'open notepad',
        icon: FileText,
        desc: 'Launches Windows Notepad',
        color: 'text-blue-400 border-blue-500/30 hover:bg-blue-950/20',
      },
      {
        id: 'notepad_plus',
        label: 'Open Notepad++',
        cmd: 'open notepad++',
        icon: TerminalSquare,
        desc: 'Launches Notepad++ code editor',
        color: 'text-teal-400 border-teal-500/30 hover:bg-teal-950/20',
      },
      {
        id: 'vlc',
        label: 'Open VLC Player',
        cmd: 'open vlc',
        icon: PlaySquare,
        desc: 'Launches VLC Media Player',
        color: 'text-orange-400 border-orange-500/30 hover:bg-orange-950/20',
      },
      {
        id: 'camera',
        label: 'Open Camera',
        cmd: 'open camera',
        icon: Camera,
        desc: 'Opens Windows Camera app',
        color: 'text-purple-400 border-purple-500/30 hover:bg-purple-950/20',
      },
      {
        id: 'snipping',
        label: 'Snipping Tool',
        cmd: 'open snipping tool',
        icon: Scissors,
        desc: 'Opens screen clipping tool',
        color: 'text-pink-400 border-pink-500/30 hover:bg-pink-950/20',
      },
      {
        id: 'settings',
        label: 'Windows Settings',
        cmd: 'open settings',
        icon: Settings,
        desc: 'Opens PC Settings panel',
        color: 'text-slate-300 border-slate-500/30 hover:bg-slate-800/40',
      },
      {
        id: 'calculator',
        label: 'Calculator',
        cmd: 'open calculator',
        icon: Calculator,
        desc: 'Opens OS Calculator',
        color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20',
      },
      {
        id: 'bluetooth',
        label: 'Bluetooth',
        cmd: 'open bluetooth',
        icon: Bluetooth,
        desc: 'Opens Bluetooth control panel',
        color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/20',
      },
    ],
    media: [
      {
        id: 'play_music',
        label: 'Play Music on YouTube',
        cmd: 'play trending songs on youtube',
        icon: Music,
        desc: 'Searches & plays songs on YouTube',
        color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20',
      },
      {
        id: 'play_pause',
        label: 'Play / Pause',
        cmd: 'pause music',
        icon: Play,
        desc: 'Toggles playback on host player',
        color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/20',
      },
      {
        id: 'next_track',
        label: 'Next Track',
        cmd: 'next track',
        icon: SkipForward,
        desc: 'Skips to next media track',
        color: 'text-blue-400 border-blue-500/30 hover:bg-blue-950/20',
      },
      {
        id: 'prev_track',
        label: 'Previous Track',
        cmd: 'previous track',
        icon: SkipBack,
        desc: 'Jumps back to previous track',
        color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-950/20',
      },
      {
        id: 'vol_up',
        label: 'Volume Up',
        cmd: 'volume up',
        icon: Volume2,
        desc: 'Increases host master volume',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
      {
        id: 'vol_down',
        label: 'Volume Down',
        cmd: 'volume down',
        icon: Volume1,
        desc: 'Decreases host master volume',
        color: 'text-teal-400 border-teal-500/30 hover:bg-teal-950/20',
      },
      {
        id: 'mute',
        label: 'Mute / Unmute',
        cmd: 'mute audio',
        icon: VolumeX,
        desc: 'Toggles master audio mute',
        color: 'text-red-400 border-red-500/30 hover:bg-red-950/20',
      },
      {
        id: 'spotify',
        label: 'Spotify Web',
        cmd: 'open spotify',
        icon: Music,
        desc: 'Opens Spotify web player',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
      {
        id: 'netflix',
        label: 'Netflix',
        cmd: 'open netflix',
        icon: Tv,
        desc: 'Opens Netflix in browser',
        color: 'text-red-400 border-red-500/30 hover:bg-red-950/20',
      },
    ],
    system: [
      {
        id: 'kill_switch',
        label: 'Emergency Kill Switch',
        cmd: 'kill switch',
        icon: ShieldAlert,
        desc: 'Instantly halts operations, mutes speech & aborts shutdown',
        color: 'text-red-400 border-red-500/50 hover:bg-red-950/40 bg-red-950/20 font-bold',
      },
      {
        id: 'master_switch',
        label: 'Master Switch Console',
        cmd: 'activate praj',
        icon: Zap,
        desc: '1-click dual program launch & Windows control center',
        color: 'text-cyan-400 border-cyan-500/50 hover:bg-cyan-950/40 bg-cyan-950/20 font-bold',
      },
      {
        id: 'install_python',
        label: '1-Click Python Setup',
        cmd: 'install python',
        icon: Code2,
        desc: 'Auto-download & install Python 3.11 with pip & bridge libraries for Windows',
        color: 'text-emerald-400 border-emerald-500/50 hover:bg-emerald-950/40 bg-emerald-950/20 font-bold',
      },
      {
        id: 'voice_settings',
        label: 'Voice & Audio Settings',
        cmd: 'voice settings',
        icon: Sliders,
        desc: 'Choose audio voice, adjust pitch & speed or keep default',
        color: 'text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/30',
      },
      {
        id: 'personalization_settings',
        label: 'Personalization & Persona',
        cmd: 'personalization profile',
        icon: UserCheck,
        desc: 'Set your name, title, assistant persona & tailored focus areas',
        color: 'text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/30',
      },
      {
        id: 'lock',
        label: 'Lock Workstation',
        cmd: 'lock pc',
        icon: Lock,
        desc: 'Instantly locks host display screen',
        color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/20',
      },
      {
        id: 'screenshot',
        label: 'Take Screenshot',
        cmd: 'take screenshot',
        icon: Camera,
        desc: 'Captures screen and saves to Desktop',
        color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/20',
      },
      {
        id: 'battery',
        label: 'Battery Status',
        cmd: 'check battery',
        icon: Battery,
        desc: 'Reports host charge percentage & AC',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
      {
        id: 'specs',
        label: 'System Hardware Info',
        cmd: 'system status',
        icon: Cpu,
        desc: 'OS version, host name & architecture',
        color: 'text-blue-400 border-blue-500/30 hover:bg-blue-950/20',
      },
      {
        id: 'time',
        label: 'System Time',
        cmd: 'what time is it',
        icon: Clock,
        desc: 'Reads current system clock time',
        color: 'text-indigo-400 border-indigo-500/30 hover:bg-indigo-950/20',
      },
      {
        id: 'headlines',
        label: 'Top Headlines',
        cmd: 'news headlines',
        icon: Newspaper,
        desc: 'Reads latest world news headlines',
        color: 'text-purple-400 border-purple-500/30 hover:bg-purple-950/20',
      },
      {
        id: 'restart',
        label: 'Restart Host (30s)',
        cmd: 'restart pc in 30 seconds',
        icon: RotateCcw,
        desc: 'Schedules machine reboot in 30s',
        color: 'text-orange-400 border-orange-500/30 hover:bg-orange-950/20',
      },
      {
        id: 'shutdown30',
        label: 'Shutdown Host (30s)',
        cmd: 'shutdown 30',
        icon: Power,
        desc: 'Schedules PC power down in 30s',
        color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20',
      },
      {
        id: 'arise',
        label: 'Cancel Shutdown ("Arise")',
        cmd: 'arise',
        icon: Undo2,
        desc: 'Aborts pending shutdown or restart',
        color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/20',
      },
    ],
    web: [
      {
        id: 'weather',
        label: 'Live Weather',
        cmd: 'what is the weather in Delhi',
        icon: CloudSun,
        desc: 'Real-time temperature and forecast',
        color: 'text-sky-400 border-sky-500/30 hover:bg-sky-950/20',
      },
      {
        id: 'google',
        label: 'Google Search',
        cmd: 'google artificial intelligence news',
        icon: Search,
        desc: 'Searches query on Google',
        color: 'text-blue-400 border-blue-500/30 hover:bg-blue-950/20',
      },
      {
        id: 'maps',
        label: 'Google Maps',
        cmd: 'where is New Delhi',
        icon: MapPin,
        desc: 'Pinpoints coordinates on Google Maps',
        color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/20',
      },
      {
        id: 'amazon',
        label: 'Amazon Shopping',
        cmd: 'search amazon for wireless mouse',
        icon: ShoppingCart,
        desc: 'Searches items on Amazon',
        color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/20',
      },
      {
        id: 'youtube',
        label: 'Open YouTube',
        cmd: 'open youtube',
        icon: Youtube,
        desc: 'Opens YouTube home page',
        color: 'text-red-400 border-red-500/30 hover:bg-red-950/20',
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
      {
        id: 'wikipedia',
        label: 'Wikipedia Search',
        cmd: 'wikipedia Artificial Intelligence',
        icon: FileText,
        desc: 'Summarizes Wikipedia article',
        color: 'text-slate-300 border-slate-500/30 hover:bg-slate-800/40',
      },
    ],
    memory: [
      {
        id: 'recall_notes',
        label: 'What did I tell you to remember?',
        cmd: 'do you remember',
        icon: Database,
        desc: 'Recalls saved notes from persistent storage',
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
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {(['apps', 'media', 'system', 'web', 'memory'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab === 'apps'
                ? 'Desktop Apps'
                : tab === 'media'
                ? 'Audio & Media'
                : tab === 'system'
                ? 'System & Hardware'
                : tab === 'web'
                ? 'Web & Weather'
                : 'Memory Bank'}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline ml-2 whitespace-nowrap">
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
                <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 truncate max-w-[110px]">
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
