export const environment = {
  production: true,
  apiUrl: 'https://tu-backend-production.com',
  apiVersion: 'v1',
  features: {
    mockData: false,
    realTimeUpdates: false,
    offlineMode: false,
  },
  development: {
    enableLogging: false,
    debugMode: false,
    skipAuth: false,
  }
};