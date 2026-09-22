import { BridgeStatus } from '../types';

export const DEFAULT_BRIDGE_URL = 'http://127.0.0.1:5000';

export async function pingLocalBridge(url = DEFAULT_BRIDGE_URL): Promise<BridgeStatus> {
  const cleanUrl = url.replace(/\/+$/, '');

  // 1. Direct fetch to local bridge
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
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
        agentName: data.agent || 'PRAJ Desktop Agent',
        systemTime: data.system_time,
        storedMemory: data.stored_memory,
      };
    }
  } catch {
    // Direct attempt failed (could be Chrome Private Network Access blocking)
  }

  // 2. Fallback to Server Proxy (bypasses browser PNA restrictions)
  try {
    const proxyController = new AbortController();
    const proxyTimeout = setTimeout(() => proxyController.abort(), 3000);
    const proxyRes = await fetch('/api/bridge-proxy/status', {
      method: 'GET',
      signal: proxyController.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(proxyTimeout);

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data.connected || data.status === 'online') {
        return {
          connected: true,
          checking: false,
          lastChecked: Date.now(),
          bridgeUrl: cleanUrl,
          platform: data.platform || 'Desktop Host',
          agentName: data.agent || 'PRAJ Desktop Agent',
          systemTime: data.system_time,
          storedMemory: data.stored_memory,
        };
      }
    }
  } catch {
    // Both failed
  }

  return {
    connected: false,
    checking: false,
    lastChecked: Date.now(),
    bridgeUrl: cleanUrl,
    error: 'Bridge unreachable',
  };
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

  // 1. Direct attempt
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
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
  } catch {
    // Try fallback
  }

  // 2. Server Proxy fallback
  try {
    const proxyRes = await fetch('/api/bridge-proxy/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command }),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        success: data.success ?? true,
        reply: data.reply || '',
        action: data.action || 'system_command',
        systemExecuted: data.system_executed ?? true,
      };
    }
  } catch (err: unknown) {
    return {
      success: false,
      reply: '',
      action: 'error',
      systemExecuted: false,
      error: err instanceof Error ? err.message : 'Bridge offline',
    };
  }

  return {
    success: false,
    reply: '',
    action: 'error',
    systemExecuted: false,
    error: 'Bridge unreachable',
  };
}

export async function sendShutdownToBridge(bridgeUrl: string, seconds = 30): Promise<boolean> {
  const cleanUrl = bridgeUrl.replace(/\/+$/, '');
  try {
    const res = await fetch(`${cleanUrl}/api/shutdown`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds }),
    });
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  try {
    const proxyRes = await fetch('/api/bridge-proxy/shutdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds }),
    });
    return proxyRes.ok;
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
    if (res.ok) return true;
  } catch {
    // Fallback
  }

  try {
    const proxyRes = await fetch('/api/bridge-proxy/cancel_shutdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return proxyRes.ok;
  } catch {
    return false;
  }
}
