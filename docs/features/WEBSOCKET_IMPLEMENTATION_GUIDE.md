# WebSocket Implementation Guide

## 📋 Overview

Esta guía completa muestra cómo integrar WebSockets en tu aplicación Angular para monitoreo en tiempo real del scraping. La implementación incluye:

- ✅ Servicio WebSocket completo con Socket.IO
- ✅ Componente de monitoreo en tiempo real  
- ✅ Gestión de estado de conexión
- ✅ Progreso de scraping en vivo
- ✅ Manejo de errores y reconexión automática

## 🚀 Components Created

### 1. WebSocketService (`/core/services/websocket.service.ts`)

Servicio principal que maneja todas las comunicaciones WebSocket:

**Features:**
- Conexión/desconexión automática
- Reconexión automática en caso de fallos
- Eventos específicos para scraping
- Gestión de estados de conexión
- Observables para progreso en tiempo real

**Key Methods:**
```typescript
connect(): Observable<ConnectionStatus>
disconnect(): void
subscribeToScrapingProgress(sessionId: string): Observable<ScrapingProgress>
startScraping(config: any): Observable<any>
stopScraping(sessionId: string): Observable<any>
pauseScraping(sessionId: string): Observable<any>
resumeScraping(sessionId: string): Observable<any>
```

### 2. WebSocket Scraping Component (`/shared/components/websocket-scraping/`)

Componente de demostración que muestra:
- Estado de conexión en tiempo real
- Progreso detallado del scraping
- Controles para iniciar/detener scraping
- Visualización de errores
- Interfaz responsiva con Material Design

## 🔧 Configuration

### Environment Setup

**Development** (`environment.ts`):
```typescript
export const environment = {
  // ... existing config
  websocketUrl: 'http://localhost:3000',
  features: {
    // ... existing features
    websockets: true,
  }
};
```

**Production** (`environment.prod.ts`):
```typescript
export const environment = {
  // ... existing config
  websocketUrl: 'wss://tu-websocket-production.com',
  features: {
    // ... existing features
    websockets: true,
  }
};
```

## 📝 Usage Examples

### Basic WebSocket Connection

```typescript
import { WebSocketService } from '../core/services/websocket.service';

constructor(private websocketService: WebSocketService) {}

ngOnInit() {
  // Connect to WebSocket
  this.websocketService.connect().subscribe(status => {
    console.log('Connection status:', status);
  });

  // Listen for scraping progress
  this.websocketService.getScrapingProgress().subscribe(progress => {
    if (progress) {
      console.log(`Progress: ${progress.percentage}%`);
      console.log(`Tweets: ${progress.processedTweets}/${progress.totalTweets}`);
    }
  });
}
```

### Start Scraping with Progress Monitoring

```typescript
startScrapingWithWebSocket() {
  const sessionId = 'scraping-' + Date.now();
  
  // Subscribe to progress for this session
  this.websocketService.subscribeToScrapingProgress(sessionId).subscribe(
    progress => {
      // Update UI with real-time progress
      this.updateProgressUI(progress);
    }
  );

  // Start scraping
  const config = {
    sessionId: sessionId,
    maxTweets: 1000,
    keywords: ['angular', 'typescript'],
    isBackground: false
  };

  this.websocketService.startScraping(config).subscribe(
    response => console.log('Scraping started:', response)
  );
}
```

### Integration with Existing ScrapingService

```typescript
// In your existing scraping service, add WebSocket support:

export class ScrapingService {
  constructor(
    private http: HttpClient,
    private websocketService: WebSocketService // Add this
  ) {}

  async scrapeTweets(config: ScrapingConfig): Promise<any> {
    // Check if WebSocket is available
    if (environment.features.websockets && this.websocketService.isConnected()) {
      // Use WebSocket for real-time updates
      return this.scrapeWithWebSocket(config);
    } else {
      // Fallback to HTTP polling
      return this.scrapeWithHttp(config);
    }
  }

  private scrapeWithWebSocket(config: ScrapingConfig): Promise<any> {
    const sessionId = 'scraping-' + Date.now();
    
    return new Promise((resolve, reject) => {
      // Subscribe to progress
      this.websocketService.subscribeToScrapingProgress(sessionId).subscribe(
        progress => {
          this.progressSubject.next(progress); // Update existing progress subject
          
          if (progress.status === 'completed') {
            resolve(progress);
          } else if (progress.status === 'error') {
            reject(new Error(progress.error));
          }
        }
      );

      // Start scraping
      this.websocketService.startScraping({
        sessionId,
        ...config
      }).subscribe();
    });
  }
}
```

## 🖥️ Backend Requirements

Para que funcione completamente, tu backend Node.js necesita:

### Socket.IO Server Setup

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:4200", // Tu frontend URL
    methods: ["GET", "POST"]
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join scraping session room
  socket.on('join-scraping-session', ({ sessionId }) => {
    socket.join(sessionId);
    console.log(`Client joined scraping session: ${sessionId}`);
  });

  // Start scraping
  socket.on('start-scraping', async (config) => {
    const { sessionId } = config;
    
    try {
      // Emit start confirmation
      socket.emit('scraping-started', { sessionId, status: 'started' });
      
      // Start scraping process with progress updates
      await startScrapingProcess(config, (progress) => {
        // Send progress to specific session room
        io.to(sessionId).emit('scraping-progress', progress);
      });
      
    } catch (error) {
      socket.emit('scraping-error', { 
        sessionId, 
        message: error.message 
      });
    }
  });

  // Stop scraping
  socket.on('stop-scraping', ({ sessionId }) => {
    // Stop scraping logic
    stopScrapingProcess(sessionId);
    socket.emit('scraping-stopped', { sessionId });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('WebSocket server running on port 3000');
});
```

### Progress Updates Example

```javascript
async function startScrapingProcess(config, progressCallback) {
  const { sessionId, maxTweets, keywords } = config;
  
  for (let i = 0; i < maxTweets; i += 100) {
    // Process chunk of tweets
    const chunkData = await processTweetChunk(keywords, i, 100);
    
    // Send progress update
    progressCallback({
      sessionId,
      status: 'processing',
      totalTweets: maxTweets,
      processedTweets: i + chunkData.length,
      currentChunk: Math.floor(i / 100) + 1,
      totalChunks: Math.ceil(maxTweets / 100),
      percentage: Math.round(((i + chunkData.length) / maxTweets) * 100),
      isBackground: config.isBackground || false,
      startTime: config.startTime,
      estimatedTimeRemaining: calculateETA(i + chunkData.length, maxTweets)
    });
    
    // Small delay to prevent overwhelming
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Final completion update
  progressCallback({
    sessionId,
    status: 'completed',
    totalTweets: maxTweets,
    processedTweets: maxTweets,
    percentage: 100,
    endTime: new Date()
  });
}
```

## 🧪 Testing

### Component Testing

Usa el componente `WebsocketScrapingComponent` incluido para probar:

1. **Conectar WebSocket**: Verifica que la conexión se establece
2. **Progreso en tiempo real**: Inicia un scraping de prueba
3. **Estados de error**: Simula errores de conexión
4. **Reconexión automática**: Desconecta y observa la reconexión

### Integration in Your App

Para integrar en tu aplicación:

```typescript
// En tu app.component.html o dashboard
<app-websocket-scraping *ngIf="showWebSocketMonitor"></app-websocket-scraping>

// O usar el servicio directamente en tus componentes existentes
```

## 🔍 Debugging

### WebSocket Debug Mode

```typescript
// En development, habilita logging detallado
if (environment.development.debugMode) {
  // El servicio ya incluye console.log para eventos importantes
  // Puedes agregar más logging según necesites
}
```

### Common Issues

1. **CORS**: Asegúrate de configurar CORS en tu backend Socket.IO
2. **Ports**: Backend WebSocket (3000) vs API (3001) vs Frontend (4200)
3. **SSL**: En producción usa `wss://` en lugar de `ws://`

## 📊 Performance Considerations

- **Connection Pooling**: El servicio mantiene una sola conexión WebSocket
- **Memory Management**: Subscripciones se limpian automáticamente
- **Reconnection Strategy**: Reconexión automática con backoff exponencial
- **Rate Limiting**: El backend debe implementar rate limiting

## 🎯 Next Steps

1. **Implementar backend Socket.IO** siguiendo los ejemplos
2. **Integrar WebSocket service** en tus componentes existentes
3. **Configurar environments** con URLs correctas
4. **Testing exhaustivo** en desarrollo y producción

---

Esta implementación te da una base sólida para WebSockets en tiempo real. ¡El timeout también ya está actualizado a la fórmula que solicitaste! 🚀