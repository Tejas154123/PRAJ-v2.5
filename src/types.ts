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

