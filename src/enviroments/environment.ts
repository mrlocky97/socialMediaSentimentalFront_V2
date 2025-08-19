export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001/api/v1',
  apiVersion: 'v1',
  // Feature flags para desarrollo - BACKEND ACTIVADO
  features: {
    mockData: true, // Mantener activo para fallback cuando backend no esté disponible
    realTimeUpdates: true, // ✅ ACTIVADO: Actualizaciones en tiempo real
    offlineMode: true, // Permitir funcionalidad offline como fallback
  },
  // Configuración de desarrollo
  development: {
    enableLogging: true,
    debugMode: true,
    skipAuth: false, // Para testing rápido
  },
};
