# Integración con Contentful - Yamaha Wheels

## ✅ Implementación Completada

La integración con Contentful ha sido implementada exitosamente siguiendo las mejores prácticas de Next.js 15 y manteniendo las credenciales seguras en el servidor.

### 🏗️ Arquitectura Implementada

```
Frontend (Cliente)  →  API Routes (Servidor)  →  Contentful GraphQL API
    ↓                        ↓                         ↓
useHomeData()         /api/contentful/home      contentfulService
    ↓                        ↓                         ↓
HTTP Client          Next.js Route Handler      HTTP Client
```

### 📂 Archivos Creados

1. **`/src/types/contentful.ts`** - Tipos TypeScript para datos de Contentful
2. **`/src/services/contentful.ts`** - Servicio para queries GraphQL
3. **`/src/app/api/contentful/home/route.ts`** - API Route para el cliente
4. **`/src/hooks/useHomeData.ts`** - Hook para obtener datos con rehidratación
5. **`/src/app/page.tsx`** - Componente Home actualizado

### 🔒 Seguridad

- ✅ **Variables de entorno**: Las credenciales se mantienen en el servidor
- ✅ **API Routes**: Solo el servidor accede a Contentful
- ✅ **No exposición**: Las API keys nunca llegan al cliente
- ✅ **Cache HTTP**: Respuestas optimizadas con headers de cache

### 🚀 Funcionalidades

- ✅ **Hook personalizado**: `useHomeData()` con rehidratación automática
- ✅ **Manejo de errores**: Graceful fallbacks y logging detallado
- ✅ **Cache inteligente**: 5 minutos dev / 1 hora producción
- ✅ **Optimización de imágenes**: Helper para URLs de Contentful
- ✅ **Debug info**: Panel de debug en desarrollo

### 🎯 Próximos Pasos

Para completar la integración, necesitas:

1. **Crear Content Types en Contentful**:

   - `banner` - Para el banner principal
   - `card` - Para las tarjetas de productos
   - `news` - Para noticias
   - `secondBanner` - Para el banner secundario

2. **Configurar los campos** según los tipos definidos en `contentful.ts`

3. **Actualizar los componentes** para usar los datos de Contentful:
   - Banner.tsx
   - Cards.tsx
   - NewsSection.tsx
   - SecondBanner.tsx

### 🔧 Uso

```tsx
import { useHomeData } from "@/hooks";

// En tu componente
const { data, loading, error, refetch } = useHomeData({
  immediate: true,
  revalidateInterval: 5 * 60 * 1000, // 5 minutos
  onError: (error) => console.error("Error:", error),
});

// Datos disponibles
if (data) {
  console.log(data.banners); // BannerData[]
  console.log(data.cards); // CardData[]
  console.log(data.news); // NewsData[]
  console.log(data.secondBanner); // SecondBannerData | null
}
```

### 🌐 URLs

- **Página principal**: http://localhost:3001
- **API Endpoint**: http://localhost:3001/api/contentful/home
- **Debug**: Panel visible en desarrollo cuando hay datos

### ⚡ Optimizaciones Incluidas

- **Lazy loading**: Componentes no críticos cargados dinámicamente
- **Error boundaries**: Manejo graceful de errores
- **Rehidratación**: Actualización automática de datos obsoletos
- **Cache estratégico**: Reducción de peticiones innecesarias
- **Optimización de imágenes**: Helper para URLs optimizadas de Contentful

La infraestructura está lista. Solo falta configurar el contenido en Contentful y adaptar los componentes para usar estos datos.
