# Contentful Reference Resolver

Sistema de resolución recursiva de referencias para datos de Contentful CMS.

## 📋 Descripción

Cuando Contentful devuelve datos con el parámetro `include`, la respuesta contiene:

- **items**: Los datos principales solicitados
- **includes**: Referencias adicionales (Entry y Asset) que están vinculadas desde items

Las referencias en `items` aparecen como objetos Link:

```json
{
  "sys": {
    "type": "Link",
    "linkType": "Entry",
    "id": "5xY1UzzDnzw0Rhm1mVkTEk"
  }
}
```

Este sistema resuelve automáticamente todas estas referencias de forma recursiva, reemplazando los Links con sus datos completos.

## 🎯 Problema que Resuelve

**Antes (sin resolver):**

```json
{
  "fields": {
    "components": [
      {
        "sys": {
          "type": "Link",
          "linkType": "Entry",
          "id": "5xY1UzzDnzw0Rhm1mVkTEk"
        }
      }
    ]
  }
}
```

**Después (resuelto):**

```json
{
  "fields": {
    "components": [
      {
        "sys": { "id": "5xY1UzzDnzw0Rhm1mVkTEk", ... },
        "fields": {
          "entryId": "Home > Banner Gallery",
          "slides": [
            {
              "sys": { "id": "...", ... },
              "fields": {
                "title": "Yamaha Motohertz",
                "caption": "Descubre la nueva generación...",
                "image": {
                  "fields": {
                    "url": "https://storage.googleapis.com/..."
                  }
                }
              }
            }
          ]
        }
      }
    ]
  }
}
```

## 🚀 Uso

### En el Servicio de Contentful

El servicio ya está configurado para resolver automáticamente todas las referencias:

```typescript
import { contentfulService } from "@/services/contentful";

// Obtener datos de home (ya resueltos)
const homeData = await contentfulService.getHomePageData();

// Todos los datos están completamente resueltos
console.log(homeData.fields.layout[0].fields.components[0].fields.slides);
```

### En React Hooks

El hook `useHomeData` devuelve datos ya resueltos:

```typescript
import { useHomeData } from "@/hooks/useHomeData";

function MyComponent() {
  const { data, loading, error } = useHomeData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Los datos están completamente resueltos
  const bannerGallery = data.fields.layout[0].fields.components[0];
  const slides = bannerGallery.fields.slides;

  return (
    <div>
      {slides.map((slide) => (
        <div key={slide.sys.id}>
          <h2>{slide.fields.title}</h2>
          <img src={slide.fields.image.fields.url} alt={slide.fields.title} />
          <p>{slide.fields.caption}</p>
        </div>
      ))}
    </div>
  );
}
```

### Uso Directo del Resolver

Si necesitas resolver datos manualmente:

```typescript
import { resolveContentfulResponse } from "@/utils/contentful-resolver";

// Respuesta raw de Contentful
const rawResponse = await fetch("...");
const data = await rawResponse.json();

// Resolver todas las referencias
const resolved = resolveContentfulResponse(data);

// Ahora todos los Links están reemplazados con sus datos completos
console.log(resolved.items[0].fields.layout);
```

## 🔧 Configuración

### Nivel de Profundidad (include)

El servicio de Contentful está configurado con `include=4`, que obtiene 4 niveles de referencias anidadas:

```typescript
// src/services/contentful.ts
const params = {
  content_type: "homePage",
  include: "4", // 4 niveles de profundidad
  "fields.slug": "home",
};
```

Puedes ajustar este valor según tus necesidades:

- `include=1`: Solo el primer nivel de referencias
- `include=2`: Dos niveles (referencias de referencias)
- `include=3`: Tres niveles
- `include=4`: Cuatro niveles (configuración actual)
- `include=10`: Máximo permitido por Contentful

## 📁 Archivos del Sistema

```
src/
├── utils/
│   ├── contentful-resolver.ts    # Lógica principal del resolver
│   └── index.ts                   # Exportaciones
├── services/
│   └── contentful.ts              # Servicio con resolver integrado
└── hooks/
    └── useHomeData.ts             # Hook que consume datos resueltos
```

## 🧪 Testing

Puedes probar el resolver con tus datos de ejemplo:

```bash
# Ejecutar test del resolver
node test-resolver-simple.mjs
```

Esto generará un archivo `src/hooks/data-resolved.json` con todas las referencias resueltas que puedes inspeccionar.

## ⚠️ Consideraciones

### Referencias Circulares

El resolver detecta y previene referencias circulares automáticamente:

```typescript
// Si A → B → A, el resolver detectará el ciclo y detendrá la recursión
console.warn(`⚠️ Circular reference detected for entry: ${id}`);
```

### Referencias No Encontradas

Si una referencia no está en los includes, se mantiene el Link original:

```typescript
console.warn(`⚠️ Referenced entry not found in includes: ${id}`);
return link; // Devuelve el Link sin resolver
```

### Performance

- El resolver usa un Map para búsquedas O(1)
- Las referencias ya resueltas se cachean durante la ejecución
- No hace peticiones adicionales a Contentful

## 🔍 Debugging

Para ver el proceso de resolución en detalle:

```typescript
// Los logs se muestran en la consola del servidor
console.log("🔍 Resolving Contentful references...");
console.log(`📦 Items: ${response.items?.length || 0}`);
console.log(`📚 Includes (Entry): ${response.includes?.Entry?.length || 0}`);
console.log(`🗺️ Total entries in map: ${includesMap.size}`);
console.log("✅ References resolved successfully");
```

## 📚 Ejemplos de Uso

### Acceder a Datos Anidados

```typescript
// Antes (con Links sin resolver)
const firstLayout = data.items[0].fields.layout[0];
// firstLayout = { sys: { type: "Link", id: "..." } }

// Después (con referencias resueltas)
const firstLayout = data.items[0].fields.layout[0];
// firstLayout = { sys: {...}, fields: { entryId: "...", components: [...] } }
```

### Recorrer Estructuras Complejas

```typescript
// Todos los niveles están resueltos
data.items[0].fields.layout.forEach((layoutItem) => {
  layoutItem.fields.components?.forEach((component) => {
    component.fields.slides?.forEach((slide) => {
      console.log(slide.fields.title);
      console.log(slide.fields.image.fields.url);
      console.log(slide.fields.ctaButton.fields.text);
    });
  });
});
```

## 🤝 Contribuir

Para agregar soporte a nuevos tipos de content:

1. Asegúrate de que el `include` sea suficientemente profundo
2. El resolver funciona automáticamente con cualquier estructura
3. No necesitas modificar el resolver para nuevos content types

## 📄 Licencia

Este código es parte del proyecto Yamaha Wheels.
