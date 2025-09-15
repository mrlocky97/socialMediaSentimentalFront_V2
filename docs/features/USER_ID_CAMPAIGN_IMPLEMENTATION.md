# Implementación de userId en Creación de Campañas

## 📋 Resumen de Cambios

Se ha implementado la funcionalidad para incluir automáticamente el **userId** del usuario autenticado en el cuerpo de la petición cuando se crea una nueva campaña.

## 🔧 Archivos Modificados

### 1. **CampaignAdapter** (`campaign.adapter.ts`)

**Cambio:** Método `fromRequestToApi()` ahora acepta un parámetro opcional `userId`

```typescript
// ANTES
static fromRequestToApi(
  request: CampaignRequest
): Partial<ApiCampaignExtended> & { type: string; organizationId: string }

// AHORA
static fromRequestToApi(
  request: CampaignRequest,
  userId?: string
): Partial<ApiCampaignExtended> & { type: string; organizationId: string; userId?: string }
```

**Funcionalidad:**
- Si se proporciona `userId`, se incluye en el objeto retornado
- Si no se proporciona, el campo se omite (compatible con implementaciones anteriores)
- Usa el operador spread condicional: `...(userId && { userId })`

### 2. **CampaignEffects** (`campaign.effects.ts`)

**Cambios realizados:**

1. **Importación de AuthService:**
```typescript
import { AuthService } from '../../auth/services/auth.service';
```

2. **Inyección del servicio:**
```typescript
private authService = inject(AuthService);
```

3. **Obtención automática del userId:**
```typescript
// Obtener el userId del usuario autenticado
const currentUser = this.authService.currentUser();
const userId = currentUser?.id;

// Enviar userId al adapter
const campaignToCreate = CampaignAdapter.fromRequestToApi(campaign, userId);
```

4. **Logging mejorado:**
```typescript
console.log('Sending campaign to API:', campaignToCreate);
console.log('User ID incluido:', userId);
```

## 🚀 Cómo Funciona

### Flujo de Creación de Campaña

1. **Usuario crea campaña** → `CampaignDialogComponent`
2. **Submit del formulario** → `CampaignDialogService.createCampaign()`
3. **Dispatching de acción** → `CampaignFacade.createCampaign()`
4. **NgRx Action** → `createCampaign({ campaign })`
5. **Effect ejecutado** → `CampaignEffects.createCampaign$`
6. **Obtención automática de userId** → `this.authService.currentUser()?.id`
7. **Transformación de datos** → `CampaignAdapter.fromRequestToApi(campaign, userId)`
8. **Petición HTTP** → `this.apiService.createCampaign(campaignToCreate)`

### Estructura del Body enviado

```json
{
  "name": "Mi Campaña",
  "description": "Descripción de la campaña",
  "type": "hashtag",
  "hashtags": ["#marketing", "#social"],
  "keywords": ["análisis", "mercado"],
  "startDate": "2025-09-15T00:00:00.000Z",
  "endDate": "2025-12-15T00:00:00.000Z",
  "status": "draft",
  "dataSources": ["twitter"],
  "organizationId": "org-123",
  "maxTweets": 1000,
  "userId": "user-456"  // ✅ NUEVO CAMPO INCLUIDO AUTOMÁTICAMENTE
}
```

## 🧪 Cómo Verificar

### 1. **Verificación en DevTools**

1. Abrir las **DevTools** del navegador (F12)
2. Ir a la pestaña **Network**
3. Crear una nueva campaña desde la aplicación
4. Buscar la petición HTTP `POST` al endpoint de crear campaña
5. Revisar el **Request Payload** para confirmar que incluye `userId`

### 2. **Verificación en Console Logs**

Los logs aparecerán en la consola del navegador:

```bash
Sending campaign to API: {name: "...", userId: "user-456", ...}
User ID incluido: user-456
Campaign created successfully: {...}
```

### 3. **Verificación Backend**

En el backend, el endpoint ahora recibirá:

```javascript
// En tu controlador de Node.js/Express
app.post('/api/v1/campaigns', (req, res) => {
  console.log('Body recibido:', req.body);
  // Verás: { ..., userId: "user-456" }
  
  const { userId, name, description, ... } = req.body;
  // userId ahora está disponible para usar
});
```

## ✅ Ventajas de la Implementación

1. **Automático**: No requiere cambios en los componentes existentes
2. **Backward Compatible**: Funciona con código que no necesita userId
3. **Seguro**: Usa el usuario autenticado actual, no datos del frontend
4. **Rastreable**: Incluye logging para debugging
5. **Tipado**: TypeScript mantiene la seguridad de tipos

## 🔍 Casos de Uso

- **Auditoría**: Saber qué usuario creó cada campaña
- **Permisos**: Validar en backend que el usuario tiene permisos para crear campañas
- **Notificaciones**: Enviar notificaciones al usuario que creó la campaña
- **Analytics**: Métricas de uso por usuario
- **Workspace/Teams**: Filtrar campañas por usuario o equipo

## 🛠️ Mantenimiento

Si en el futuro necesitas modificar qué datos del usuario se envían:

```typescript
// En campaign.effects.ts, línea ~20
const currentUser = this.authService.currentUser();
const userInfo = {
  userId: currentUser?.id,
  userRole: currentUser?.role,
  organizationId: currentUser?.organizationId
};

const campaignToCreate = CampaignAdapter.fromRequestToApi(campaign, userInfo);
```

Y actualizar el adapter para aceptar el nuevo tipo de datos.

---

¡El userId ya está siendo incluido automáticamente en todas las creaciones de campañas! 🎉