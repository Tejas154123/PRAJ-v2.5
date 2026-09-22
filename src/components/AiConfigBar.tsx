import { useState } from 'react';
import { Key, Globe, Cpu, Check, AlertCircle, Eye, EyeOff, Sparkles, ChevronDown, ChevronUp, RefreshCw, Trash2, ExternalLink, Layers } from 'lucide-react';
import { AiConfig, AiProvider } from '../types';

interface AiConfigBarProps {
  config: AiConfig;
  onSaveConfig: (newConfig: AiConfig) => void;
  hasServerKey: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
}

interface ProviderMeta {
  id: AiProvider;
  name: string;
  badge: string;
  defaultBaseUrl: string;
  keyPlaceholder: string;
  defaultModel: string;
  models: { id: string; label: string }[];
  keyHelpUrl: string;
  keyHelpLabel: string;
  colorClass: string;
}

const PROVIDERS: Record<AiProvider, ProviderMeta> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    keyPlaceholder: 'AIzaSy... (Google AI Studio key)',
    defaultModel: 'gemini-3.8-flash',
    models: [
      { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Fast & Recommended)' },
      { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Deep Reasoning)' },
      { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite (Ultra-fast)' },
    ],
    keyHelpUrl: 'https://aistudio.google.com/app/apikey',
    keyHelpLabel: 'Get Gemini Key',
    colorClass: 'border-cyan-500/30 text-cyan-400 bg-cyan-950/40',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'OpenRouter (100+ Models)',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-... (OpenRouter key)',
    defaultModel: 'deepseek/deepseek-r1',
    models: [
      { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1 (Reasoning)' },
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
      { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B' },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
      { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash' },
    ],
    keyHelpUrl: 'https://openrouter.ai/keys',
    keyHelpLabel: 'Get OpenRouter Key',
    colorClass: 'border-purple-500/30 text-purple-400 bg-purple-950/40',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'OpenAI ChatGPT',
    defaultBaseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-proj-... or sk-... (OpenAI key)',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & Cheap)' },
      { id: 'gpt-4o', label: 'GPT-4o (Full Flagship)' },
      { id: 'o3-mini', label: 'o3-mini (STEM Reasoning)' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    ],
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    keyHelpLabel: 'Get OpenAI Key',
    colorClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-950/40',
  },
  custom_openai: {
    id: 'custom_openai',
    name: 'Custom / Local LLM',
    badge: 'Ollama / Groq / Custom',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_... or ollama (API key or token)',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', label: 'Groq: Llama 3.3 70B' },
      { id: 'mistral-small-latest', label: 'Mistral: Small' },
      { id: 'llama3', label: 'Local: Ollama Llama3' },
      { id: 'qwen2.5-coder', label: 'Local: Qwen2.5 Coder' },
    ],
    keyHelpUrl: 'https://console.groq.com/keys',
    keyHelpLabel: 'Groq Free Keys',
    colorClass: 'border-amber-500/30 text-amber-400 bg-amber-950/40',
  },
};

export function AiConfigBar({ config, onSaveConfig, hasServerKey, isOpen: controlledIsOpen, onToggleOpen }: AiConfigBarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const toggleOpen = () => {
    if (onToggleOpen) {
      onToggleOpen();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const [provider, setProvider] = useState<AiProvider>(() => {
    if (config.provider && PROVIDERS[config.provider]) return config.provider;
    if (config.apiKey.startsWith('sk-or-v1-')) return 'openrouter';
    if (config.apiKey.startsWith('sk-')) return 'openai';
    if (config.apiKey.startsWith('gsk_') || config.baseUrl.includes('groq') || config.baseUrl.includes('localhost')) return 'custom_openai';
    return 'gemini';
  });

  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || PROVIDERS.gemini.defaultBaseUrl);
  const [model, setModel] = useState(config.model || PROVIDERS.gemini.defaultModel);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const activeProviderMeta = PROVIDERS[provider] || PROVIDERS.gemini;
  const effectiveHasKey = Boolean(apiKey.trim() || (provider === 'gemini' && hasServerKey));

  // Switch Provider
  const handleSelectProvider = (newProvider: AiProvider) => {
    setProvider(newProvider);
    const meta = PROVIDERS[newProvider];
    // If URL is default for another provider or empty, switch to this provider's default URL
    const isCurrentUrlDefault = Object.values(PROVIDERS).some((p) => p.defaultBaseUrl === baseUrl) || !baseUrl;
    if (isCurrentUrlDefault) {
      setBaseUrl(meta.defaultBaseUrl);
    }
    // Switch model to default of this provider if currently on another provider's default
    const isCurrentModelAnotherDefault = Object.values(PROVIDERS).some((p) => p.defaultModel === model);
    if (isCurrentModelAnotherDefault || !model) {
      setModel(meta.defaultModel);
    }
    setTestResult(null);
  };

  // Auto-detect provider when typing or pasting API key
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('sk-or-v1-') && provider !== 'openrouter') {
      handleSelectProvider('openrouter');
    } else if (trimmed.startsWith('sk-') && !trimmed.startsWith('sk-or-') && provider !== 'openai') {
      handleSelectProvider('openai');
    } else if (trimmed.startsWith('AIzaSy') && provider !== 'gemini') {
      handleSelectProvider('gemini');
    } else if (trimmed.startsWith('gsk_') && provider !== 'custom_openai') {
      handleSelectProvider('custom_openai');
    }
  };

  const handleSave = () => {
    const updated: AiConfig = {
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || activeProviderMeta.defaultBaseUrl,
      model: model.trim() || activeProviderMeta.defaultModel,
    };
    onSaveConfig(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          customApiKey: apiKey.trim(),
          customBaseUrl: baseUrl.trim() || activeProviderMeta.defaultBaseUrl,
          customModel: model.trim() || activeProviderMeta.defaultModel,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Verified! Response from ${data.provider || provider} (${data.model}): "${data.testResponse}"`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection verification failed',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: err instanceof Error ? err.message : 'Network test error',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleReset = () => {
    setProvider('gemini');
    setApiKey('');
    setBaseUrl(PROVIDERS.gemini.defaultBaseUrl);
    setModel(PROVIDERS.gemini.defaultModel);
    setTestResult(null);
    onSaveConfig({
      provider: 'gemini',
      apiKey: '',
      baseUrl: PROVIDERS.gemini.defaultBaseUrl,
      model: PROVIDERS.gemini.defaultModel,
    });
  };

  return (
    <div className="fixed bottom-0 right-0 z-40 max-w-full md:max-w-3xl w-full p-2 md:p-3 pointer-events-none">
      <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden transition-all">
        {/* Top Header / Minimized Bar */}
        <div
          onClick={toggleOpen}
          className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 cursor-pointer border-b border-slate-700/60 select-none transition-colors"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className={`p-1.5 rounded-lg border ${effectiveHasKey ? 'bg-purple-950/50 border-purple-500/40 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
              <Key className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-mono">
                Universal AI Gateway
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${activeProviderMeta.colorClass}`}>
                {activeProviderMeta.badge}
              </span>
              <span
                className={`hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  effectiveHasKey
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                }`}
              >
                {apiKey ? 'Custom Key Set' : (provider === 'gemini' && hasServerKey) ? 'Server Env Key' : 'Zero-API Offline'}
              </span>
              <span className="hidden sm:inline-block text-[11px] text-cyan-300 font-mono bg-cyan-950/30 border border-cyan-800/40 px-2 py-0.5 rounded truncate max-w-[130px]">
                {model}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hover:text-slate-200">
              {isOpen ? 'Minimize' : 'Configure AI'}
            </span>
            <button
              id="btn-toggle-ai-config-drawer"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              aria-label={isOpen ? 'Collapse configuration' : 'Expand configuration'}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Form Body */}
        {isOpen && (
          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Provider Selector Tabs */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Select AI Provider (Universal Support)
                </span>
                <span className="text-[10px] text-slate-500">Auto-detects pasted keys</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(Object.keys(PROVIDERS) as AiProvider[]).map((pKey) => {
                  const pMeta = PROVIDERS[pKey];
                  const isSelected = provider === pKey;
                  return (
                    <button
                      key={pKey}
                      type="button"
                      onClick={() => handleSelectProvider(pKey)}
                      className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-500/80 text-cyan-300 shadow-sm shadow-cyan-500/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-semibold">{pMeta.name}</span>
                      <span className="text-[10px] opacity-70 mt-0.5">{pMeta.id === 'openrouter' ? '100+ Models' : pMeta.id === 'openai' ? 'ChatGPT' : pMeta.id === 'gemini' ? 'Google' : 'Local / Groq'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid of 3 Core Inputs: API Key, URL, Model */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* 1. API Key Slot */}
              <div className="space-y-1.5 md:col-span-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-purple-400" />
                    {activeProviderMeta.name} Key
                  </label>
                  <a
                    href={activeProviderMeta.keyHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 hover:underline"
                  >
                    {activeProviderMeta.keyHelpLabel} <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="input-api-key"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={activeProviderMeta.keyPlaceholder}
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 pr-9 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    title={showKey ? 'Hide Key' : 'Show Key'}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* 2. API URL Slot */}
              <div className="space-y-1.5 md:col-span-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Endpoint Base URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setBaseUrl(activeProviderMeta.defaultBaseUrl)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    Reset Default
                  </button>
                </div>
                <input
                  id="input-api-url"
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={activeProviderMeta.defaultBaseUrl}
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* 3. Model Slot */}
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  Model Identifier
                </label>
                <input
                  id="input-api-model"
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={activeProviderMeta.defaultModel}
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            {/* Quick Model Selector Presets for Active Provider */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> {activeProviderMeta.name} Models:
              </span>
              {activeProviderMeta.models.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setModel(m.id)}
                  className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                    model === m.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-700/60'
                  }`}
                  title={m.label}
                >
                  {m.id}
                </button>
              ))}
            </div>

            {/* Helpful Provider Guide banner */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <span className="text-cyan-400 font-bold">Tip:</span>
              {provider === 'openrouter' && (
                <span>
                  OpenRouter lets you use <strong>DeepSeek R1, Claude 3.5 Sonnet, LLaMA 3.3, and GPT-4o</strong> through one single key. Paste your <code className="text-purple-300">sk-or-v1-...</code> key above.
                </span>
              )}
              {provider === 'openai' && (
                <span>
                  Use official OpenAI ChatGPT models (e.g. <code className="text-emerald-300">gpt-4o-mini</code> or <code className="text-emerald-300">gpt-4o</code>). Paste your <code className="text-emerald-300">sk-...</code> key above.
                </span>
              )}
              {provider === 'gemini' && (
                <span>
                  Native Google Gemini API. Paste your free <code className="text-cyan-300">AIzaSy...</code> key from Google AI Studio for fast, responsive voice queries.
                </span>
              )}
              {provider === 'custom_openai' && (
                <span>
                  Connect to local models via <strong>Ollama</strong> (<code className="text-amber-300">http://localhost:11434/v1</code>), <strong>LM Studio</strong> (<code className="text-amber-300">http://localhost:1234/v1</code>), or ultra-fast cloud inference with <strong>Groq</strong>.
                </span>
              )}
            </div>

            {/* Test Connection Result Alert */}
            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 border ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="break-all">{testResult.message}</div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  id="btn-test-api-config"
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  id="btn-reset-api-config"
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                  title="Clear API Key, URL and reset to defaults"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-save-api-config"
                  type="button"
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
                >
                  {justSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      Saved & Active!
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                      Apply & Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
