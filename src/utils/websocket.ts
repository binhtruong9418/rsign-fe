import api from '@/services/api';

/**
 * Resolve the base URL to use for WebSocket connections.
 * Falls back to the current window location when the API base URL is unavailable.
 */
export const getWebSocketBaseUrl = (): string => {


  let resolved = '';
  const apiBaseUrl = api.defaults.baseURL;
  if (apiBaseUrl) {
    try {
      const base = new URL(apiBaseUrl);
      const protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
      resolved = `${protocol}//${base.host}`;
    } catch (error) {
      console.warn('[WebSocket] Failed to parse API base URL.', error);
    }
  }

  return resolved;
};
