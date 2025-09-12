export const environment = {
  production: false,
  apiUrl: 'http://localhost:3001',
  apiVersion: 'v1',
  // Feature flags para desarrollo - MODO OFFLINE ACTIVADO
  features: {
    mockData: true, // Mantener activo para fallback cuando backend no esté disponible
    realTimeUpdates: false, // ❌ DESACTIVADO: Backend no disponible
    offlineMode: true, // ✅ ACTIVADO: Permitir funcionalidad offline por defecto
  },
  // Configuración de desarrollo
  development: {
    enableLogging: true,
    debugMode: true,
    skipAuth: false, // Para testing rápido
  },
};
