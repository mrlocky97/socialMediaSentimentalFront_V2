export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api/v1',
  apiVersion: 'v1',
  // Feature flags para desarrollo
  features: {
    mockData: false, // Usar datos mock si backend no está disponible
    realTimeUpdates: false, // Desactivar actualizaciones en tiempo real
    offlineMode: true, // Permitir funcionalidad offline
  },
  // Configuración de desarrollo
  development: {
    enableLogging: true,
    debugMode: true,
    skipAuth: false, // Para testing rápido
  },
};
