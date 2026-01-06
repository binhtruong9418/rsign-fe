import api from '@/services/api';

/**
 * Resolve the base URL to use for WebSocket connections.
 * Falls back to the current window location when the API base URL is unavailable.
 */
export const getWebSocketBaseUrl = (): string => {
  const fallbackProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const fallbackHost = typeof window !== 'undefined' ? window.location.host : '';
  let resolved = `${fallbackProtocol}//${fallbackHost}`;

  const apiBaseUrl = api.defaults.baseURL;
  if (apiBaseUrl) {
    try {
      const base = new URL(apiBaseUrl);
      const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      resolved = `${protocol}//${base.host}`;
    } catch (error) {
      console.warn('[WebSocket] Failed to parse API base URL, using window location.', error);
    }
  }

  return resolved;
};
