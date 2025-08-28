# Guía para Organización de Tests

## Estructura de Carpetas

La organización de los tests en este proyecto sigue una estructura jerárquica y lógica:

```
src/app/
├── tests/                           # Carpeta raíz de tests
│   ├── unit/                        # Tests unitarios
│   │   ├── services/                # Tests para servicios
│   │   ├── utils/                   # Tests para utilidades
│   │   └── components/              # Tests para componentes
│   │
│   ├── integration/                 # Tests de integración
│   │   └── features/                # Tests por característica
│   │
│   ├── mocks/                       # Datos de prueba compartidos
│   │   └── [feature].mock.ts        # Mocks por característica
│   │
│   └── helpers/                     # Funciones de ayuda para tests
│       └── test-helpers.ts          # Utilidades compartidas para tests
```

## Convenciones de Nomenclatura

1. **Archivos de test unitario**:
   ```
   [nombre-del-archivo].spec.ts
   ```

2. **Archivos de test de integración**:
   ```
   [nombre-de-característica].integration.spec.ts
   ```

3. **Archivos de datos mock**:
   ```
   [nombre-de-característica].mock.ts
   ```

## Estructura Recomendada para Tests Unitarios

```typescript
describe('[Nombre del componente/servicio/utilidad]', () => {
  // Configuración global
  
  beforeEach(() => {
    // Configuración antes de cada test
  });
  
  afterEach(() => {
    // Limpieza después de cada test
  });
  
  describe('[Nombre del método/funcionalidad]', () => {
    it('debería [comportamiento esperado]', () => {
      // Arrange
      // ...
      
      // Act
      // ...
      
      // Assert
      // ...
    });
    
    // Más casos de test...
  });
  
  // Más grupos de tests...
});
```

## Mejores Prácticas para Tests

1. **Un test unitario debe probar una sola cosa** - Evita múltiples aserciones no relacionadas.

2. **Usa descripciones claras** - La descripción del test debe explicar claramente qué se está probando.

3. **Sigue el patrón AAA** - Arrange (preparar), Act (ejecutar), Assert (verificar).

4. **Independencia** - Cada test debe ser independiente, sin depender de otros tests.

5. **Mocks reutilizables** - Define mocks en archivos separados para reutilizarlos.

6. **Evita lógica compleja** - Los tests deben ser simples y fáciles de entender.

7. **Cobertura de casos límite** - Incluye tests para casos de error y casos límite.

## Herramientas de Testing

- **Jasmine** - Framework principal de testing
- **Karma** - Test runner
- **Angular Testing Utilities** - Herramientas de Angular para testing

## Ejemplo de Test Unitario

```typescript
import { TestBed } from '@angular/core/testing';
import { StringUtils } from './string-utils.service';

describe('StringUtils', () => {
  let service: StringUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StringUtils]
    });
    service = TestBed.inject(StringUtils);
  });

  describe('capitalize()', () => {
    it('should capitalize first letter of a string', () => {
      // Arrange
      const input = 'hello';
      const expected = 'Hello';
      
      // Act
      const result = service.capitalize(input);
      
      // Assert
      expect(result).toBe(expected);
    });
    
    it('should handle empty string', () => {
      expect(service.capitalize('')).toBe('');
    });
    
    it('should handle null input', () => {
      expect(service.capitalize(null)).toBe('');
    });
  });
});
```

## Ejemplo de Mock Reutilizable

```typescript
// user.mock.ts
export const MOCK_USERS = [
  { id: 1, name: 'Test User 1', email: 'user1@example.com' },
  { id: 2, name: 'Test User 2', email: 'user2@example.com' }
];

export const MOCK_USER_RESPONSE = {
  success: true,
  data: MOCK_USERS,
  totalCount: 2
};
```

## Cómo Añadir Nuevos Tests

1. Identifica el componente/servicio/utilidad a testear
2. Crea un archivo de test en la carpeta correspondiente
3. Sigue la estructura recomendada y las convenciones de nomenclatura
4. Implementa los tests siguiendo las mejores prácticas
5. Ejecuta los tests con `ng test [archivo]`
