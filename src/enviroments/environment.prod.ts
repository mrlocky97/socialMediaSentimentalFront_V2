export const environment = {
  production: true,
  apiUrl: 'https://tu-backend-production.com',
  websocketUrl: 'wss://tu-websocket-production.com', // Production WebSocket URL
  apiVersion: 'v1',
  features: {
    mockData: false,
    realTimeUpdates: true, // ✅ ACTIVADO en producción
    offlineMode: false,
    websockets: true, // ✅ WebSocket support
  },
  development: {
    enableLogging: false,
    debugMode: false,
    skipAuth: false,
  }
};