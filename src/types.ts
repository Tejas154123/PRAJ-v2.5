export interface CommandResult {
  id: string;
  command: string;
  reply: string;
  timestamp: string;
  source: 'voice' | 'typing' | 'quick_action';
  actionType: 'system_app' | 'knowledge_base' | 'ai_chat' | 'memory' | 'system_control' | 'news' | 'wikipedia';
  targetApp?: string;
  systemExecuted: boolean;
  bridgeConnected: boolean;
  latencyMs?: number;
  rawDetails?: string;
  imageUrl?: string;
}

export interface BridgeStatus {
  connected: boolean;
  checking: boolean;
  lastChecked: number | null;
  bridgeUrl: string;
  platform?: string;
  agentName?: string;
  systemTime?: string;
  storedMemory?: string;
  error?: string;
}

export interface VoiceState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  mode: 'push_to_talk' | 'continuous';
  isSpeaking: boolean;
}

export interface SystemActionConfig {
  id: string;
  name: string;
  command: string;
  category: 'apps' | 'system' | 'web' | 'memory';
  icon: string;
  description: string;
  hotkey?: string;
}

export interface KnowledgeItem {
  id: string;
  question: string;
  answer: string;
  category: 'physics' | 'gk' | 'science' | 'geography';
}

export type AiProvider = 'gemini' | 'openrouter' | 'openai' | 'custom_openai';

export interface AiConfig {
  provider?: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

export type AssistantPersona = 'jarvis' | 'companion' | 'concise' | 'cyberpunk' | 'formal';

export interface UserPersonalization {
  userName: string;
  userTitle: string; // e.g. 'Sir', 'Boss', 'Captain', 'Master', or custom/none
  userRole: string; // e.g. 'Developer & Researcher'
  persona: AssistantPersona;
  customToneInstructions: string;
  favoriteTopics: string[]; // e.g. ['AI', 'Robotics', 'Space', 'Coding']
  autoAcknowledgeWithName: boolean;
}

