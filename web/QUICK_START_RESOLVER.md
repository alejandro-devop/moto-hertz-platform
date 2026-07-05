# 🚀 Quick Start - Contentful Resolver

## ¿Qué se implementó?

Tu hook `useHomeData` ahora recibe **todos los datos completamente resueltos** de Contentful. Ya no necesitas buscar manualmente en el array de `includes`.

## ✨ Cambio Principal

### Antes ❌

```typescript
// Tenías que buscar manualmente en includes
const layoutId = data.items[0].fields.layout[0].sys.id;
const layoutData = data.includes.Entry.find((e) => e.sys.id === layoutId);
```

### Ahora ✅

```typescript
// Todo está automáticamente resuelto
const layoutData = data.fields.layout[0];
// layoutData ya tiene todos sus campos, no es solo un Link
```

## 🎯 Uso Inmediato

```typescript
import { useHomeData } from "@/hooks/useHomeData";

function HomePage() {
  const { data, loading, error } = useHomeData();

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Acceso directo a TODOS los datos anidados
  const bannerGallery = data.fields.layout[0].fields.components[0];
  const slides = bannerGallery.fields.slides;

  return (
    <div>
      {slides.map((slide) => (
        <div key={slide.sys.id}>
          <img src={slide.fields.image.fields.url} />
          <h2>{slide.fields.title}</h2>
          <p>{slide.fields.caption}</p>
          <a href={slide.fields.ctaButton.fields.url}>
            {slide.fields.ctaButton.fields.text}
          </a>
        </div>
      ))}
    </div>
  );
}
```

## 📊 Estructura de Datos

Tus datos ahora tienen esta estructura (todo resuelto):

```
data
└── fields
    ├── title: "Yamaha Oriente"
    ├── slug: "home"
    └── layout: [
        {
          sys: { id: "...", contentType: "layoutFullWidth" },
          fields: {
            entryId: "Home > Banner Container",
            components: [
              {
                sys: { id: "...", contentType: "bannerGallery" },
                fields: {
                  entryId: "Home > Banner Gallery",
                  slides: [
                    {
                      sys: { id: "..." },
                      fields: {
                        title: "Yamaha Motohertz",
                        caption: "Descubre...",
                        image: {
                          fields: {
                            url: "https://storage.googleapis.com/..."
                          }
                        },
                        ctaButton: {
                          fields: {
                            text: "Explorar modelos",
                            url: "/"
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
      ]
```

## 🔍 Explorar los Datos

### Opción 1: Ver archivo generado

Abre el archivo: `src/hooks/data-resolved.json`

Este archivo muestra **exactamente** cómo lucen tus datos con todas las referencias resueltas.

### Opción 2: Console.log en tu componente

```typescript
const { data } = useHomeData();
console.log("Datos completos:", data);
console.log("Layout:", data.fields.layout);
console.log("Primer componente:", data.fields.layout[0]);
```

## 🧪 Probar el Resolver

Si quieres volver a probar que todo funciona:

```bash
node test-resolver-simple.mjs
```

Esto generará de nuevo el archivo `data-resolved.json` con tus datos resueltos.

## 📚 Documentación Completa

- **`docs/CONTENTFUL_RESOLVER.md`** - Documentación técnica completa
- **`docs/RESOLVER_IMPLEMENTATION_SUMMARY.md`** - Resumen de implementación
- **`src/examples/useHomeData-example.tsx`** - Ejemplos de código

## ⚙️ Configuración Actual

```typescript
// El servicio está configurado con:
include: "4"; // 4 niveles de profundidad
```

Esto significa que obtienes hasta 4 niveles de referencias anidadas automáticamente resueltas.

## 🎨 Ejemplo Real - Renderizar Gallery

```typescript
function BannerGallery() {
  const { data } = useHomeData();

  // Navegar directo a los slides
  const bannerContainer = data.fields.layout.find(
    (item) => item.fields.entryId === "Home > Banner Container"
  );

  const gallery = bannerContainer.fields.components.find(
    (comp) => comp.sys.contentType.sys.id === "bannerGallery"
  );

  const slides = gallery.fields.slides;

  return (
    <Carousel>
      {slides.map((slide) => (
        <Slide key={slide.sys.id}>
          <img src={slide.fields.image.fields.url} alt={slide.fields.title} />
          <h2>{slide.fields.title}</h2>
          <p>{slide.fields.caption}</p>
          {slide.fields.ctaButton && (
            <Button href={slide.fields.ctaButton.fields.url}>
              {slide.fields.ctaButton.fields.text}
            </Button>
          )}
        </Slide>
      ))}
    </Carousel>
  );
}
```

## 🚨 Importante

- ✅ **No** necesitas buscar en `includes` manualmente
- ✅ **No** necesitas hacer peticiones adicionales
- ✅ **Todas** las referencias están resueltas automáticamente
- ✅ Funciona con **cualquier** estructura de Contentful
- ✅ **Type-safe** con TypeScript

## 💡 Tips

1. **Usa optional chaining** para seguridad:

   ```typescript
   const url =
     data?.fields?.layout?.[0]?.fields?.components?.[0]?.fields?.slides?.[0]
       ?.fields?.image?.fields?.url;
   ```

2. **Verifica content types** para renderizado condicional:

   ```typescript
   layout.map((item) => {
     const type = item.sys.contentType.sys.id;
     if (type === "bannerGallery") return <BannerGallery {...item} />;
     if (type === "layout1Column") return <SingleColumn {...item} />;
   });
   ```

3. **Aprovecha la estructura recursiva**:
   - Todos los niveles están resueltos
   - Puedes navegar sin límites
   - No hay "Links" pendientes de resolver

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si cambio el content model en Contentful?**  
R: El resolver funciona automáticamente. No necesitas cambiar nada.

**P: ¿Puedo obtener más niveles de profundidad?**  
R: Sí, cambia `include: "4"` a un número mayor (máx 10) en `src/services/contentful.ts`

**P: ¿Afecta la performance?**  
R: No. Todo se resuelve en memoria en el servidor. Una sola petición a Contentful.

**P: ¿Funciona con preview?**  
R: Sí, automáticamente. Solo pasa `preview: true` al hook.

## 🎉 ¡Listo para usar!

Ahora puedes acceder a todos tus datos de Contentful sin complicaciones. Todo está completamente resuelto y listo para renderizar.

---

**¿Necesitas ayuda?** Revisa los archivos de ejemplo en `src/examples/` o la documentación completa en `docs/`.
