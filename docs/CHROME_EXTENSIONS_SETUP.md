# 🚀 Configuración de Extensiones Chrome para Angular Development

## 📋 Extensiones Chrome Recomendadas

### 1. **Angular DevTools** ⭐⭐⭐⭐⭐
**Link**: [Chrome Web Store - Angular DevTools](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)

**Configuración**:
1. Instala la extensión
2. Abre tu aplicación en `http://localhost:4200`
3. Abre DevTools (F12)
4. Verás una nueva pestaña "Angular"

**Funcionalidades**:
- 🔍 Explorar el árbol de componentes
- 🎯 Inspeccionar propiedades y estado
- 📊 Profiler para performance
- 🔄 Detectar cambios en tiempo real
- 📦 Ver injector dependencies

### 2. **Redux DevTools** ⭐⭐⭐⭐
**Link**: [Chrome Web Store - Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd)

**Configuración para Signals**:
```typescript
// En tu StateService
import { effect } from '@angular/core';

constructor() {
  // Solo en desarrollo
  if (typeof window !== 'undefined' && (window as any).__REDUX_DEVTOOLS_EXTENSION__) {
    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: 'Angular Signals State'
    });
    
    effect(() => {
      devTools.send('State Updated', this.state());
    });
  }
}
```

### 3. **Lighthouse** ⭐⭐⭐⭐⭐
**Link**: [Chrome Web Store - Lighthouse](https://chrome.google.com/webstore/detail/lighthouse/blipmdconlkpinefehnmjammfjpmpbjk)

**Uso**:
1. Abre tu app en producción
2. Abre DevTools → Lighthouse
3. Ejecuta auditoría completa
4. Revisa métricas de performance, SEO, accessibility

### 4. **JSON Viewer** ⭐⭐⭐⭐
**Link**: [Chrome Web Store - JSON Viewer](https://chrome.google.com/webstore/detail/json-viewer/gbmdgpbipfallnflgajpaliibnhdgobh)

**Configuración**:
- Formatea automáticamente respuestas JSON
- Syntax highlighting
- Colapsar/expandir objetos

### 5. **Wappalyzer** ⭐⭐⭐
**Link**: [Chrome Web Store - Wappalyzer](https://chrome.google.com/webstore/detail/wappalyzer/gppongmhjkpfnbhagpmjfkannfbllamg)

**Funcionalidad**:
- Detecta tecnologías usadas en sitios web
- Útil para research y competencia

## 🛠️ Configuración Adicional

### DevTools Settings
1. Abre DevTools (F12)
2. Ve a Settings (⚙️)
3. Habilita:
   - ✅ "Enable custom formatters"
   - ✅ "Disable cache (while DevTools is open)"
   - ✅ "Enable source maps"

### Network Tab Configuration
```javascript
// Para debugging de HTTP requests
// En tu interceptor
console.group('🌐 HTTP Request');
console.log('URL:', req.url);
console.log('Method:', req.method);
console.log('Headers:', req.headers.keys());
console.groupEnd();
```

### Console Configuration
```javascript
// Agregar en main.ts para desarrollo
if (!environment.production) {
  // Enable Angular debug mode
  enableDebugMode();
  
  // Exponer servicios globalmente para debugging
  (window as any).ng = {
    getComponent: (el: Element) => ng.getComponent(el),
    getContext: (el: Element) => ng.getContext(el),
    getDirectives: (el: Element) => ng.getDirectives(el)
  };
}
```

## 🎯 Tips de Uso

### Angular DevTools
- **Component Explorer**: Click en cualquier elemento para ver su componente
- **Profiler**: Mide performance de change detection
- **Injector Tree**: Debuggea dependency injection

### Performance Monitoring
```typescript
// En tu componente
export class MyComponent implements OnInit {
  ngOnInit() {
    if (!environment.production) {
      performance.mark('component-init-start');
      // Tu código aquí
      performance.mark('component-init-end');
      performance.measure('component-init', 'component-init-start', 'component-init-end');
    }
  }
}
```

### Memory Profiling
1. DevTools → Memory tab
2. Take heap snapshot antes y después de operaciones
3. Compara para detectar memory leaks

## 🚨 Shortcuts Útiles

| Shortcut | Acción |
|----------|--------|
| `F12` | Abrir DevTools |
| `Ctrl + Shift + I` | Abrir DevTools |
| `Ctrl + Shift + C` | Element selector |
| `Ctrl + Shift + J` | Console |
| `Ctrl + R` | Reload page |
| `Ctrl + Shift + R` | Hard reload |

## 📦 Configuración de Desarrollo

### Package.json Scripts
```json
{
  "scripts": {
    "start:debug": "ng serve --source-map=true --vendor-chunk=true",
    "build:analyze": "ng build --stats-json && npx webpack-bundle-analyzer dist/stats.json",
    "lighthouse": "ng build --prod && npx lighthouse http://localhost:4200 --view"
  }
}
```

¡Con esta configuración tendrás un entorno de desarrollo súper optimizado! 🚀
