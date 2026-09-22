import { BridgeStatus } from '../types';

export const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:5000';

export async function pingLocalBridge(url = DEFAULT_BRIDGE_URL): Promise<BridgeStatus> {
  const cleanUrl = url.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const res = await fetch(`${cleanUrl}/api/status`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        checking: false,
        lastChecked: Date.now(),
        bridgeUrl: cleanUrl,
        platform: data.platform || 'Desktop Host',
        agentName: data.agent || 'Jarvis Desktop Agent',
        systemTime: data.system_time,
        storedMemory: data.stored_memory,
      };
    }
    return {
      connected: false,
      checking: false,
      lastChecked: Date.now(),
      bridgeUrl: cleanUrl,
      error: `Bridge returned status ${res.status}`,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    return {
      connected: false,
      checking: false,
      lastChecked: Date.now(),
      bridgeUrl: cleanUrl,
      error: err instanceof Error ? err.message : 'Bridge unreachable',
    };
  }
}

export async function sendCommandToBridge(
  bridgeUrl: string,
  command: string
): Promise<{
  success: boolean;
  reply: string;
  action: string;
  systemExecuted: boolean;
  error?: string;
}> {
  const cleanUrl = bridgeUrl.replace(/\/+$/, '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`${cleanUrl}/api/command`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        success: data.success ?? true,
        reply: data.reply || '',
        action: data.action || 'system_command',
        systemExecuted: data.system_executed ?? true,
      };
    }

    return {
      success: false,
      reply: '',
      action: 'error',
      systemExecuted: false,
      error: `Bridge HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    return {
      success: false,
      reply: '',
      action: 'error',
      systemExecuted: false,
      error: err instanceof Error ? err.message : 'Bridge offline',
    };
  }
}

export async function sendShutdownToBridge(bridgeUrl: string, seconds = 30): Promise<boolean> {
  const cleanUrl = bridgeUrl.replace(/\/+$/, '');
  try {
    const res = await fetch(`${cleanUrl}/api/shutdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function cancelShutdownOnBridge(bridgeUrl: string): Promise<boolean> {
  const cleanUrl = bridgeUrl.replace(/\/+$/, '');
  try {
    const res = await fetch(`${cleanUrl}/api/cancel_shutdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return res.ok;
  } catch {
    return false;
  }
}
