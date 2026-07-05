# Sistema de Breakpoints con SASS

## 📐 Breakpoints Disponibles

| Nombre  | Ancho mínimo | Dispositivo típico           | Uso común                            |
| ------- | ------------ | ---------------------------- | ------------------------------------ |
| **xs**  | 0px          | Móviles pequeños             | Layout base                          |
| **sm**  | 640px        | Smartphones modernos         | Ajustes básicos de layout            |
| **md**  | 768px        | Tablets / móviles horizontal | Reorganización de columnas           |
| **lg**  | 1024px       | Laptops pequeños             | Layout "de escritorio"               |
| **xl**  | 1280px       | Monitores estándar           | Más columnas, paddings amplios       |
| **2xl** | 1536px       | Monitores grandes            | Ajustes finos para pantallas grandes |

## 🚀 Uso Básico

### Mixins Individuales (Recomendado)

```scss
// Importa los mixins al inicio de tu archivo SCSS
@import "../styles/abstracts";

.mi-componente {
  padding: 1rem;

  @include sm {
    padding: 1.5rem;
  }

  @include md {
    padding: 2rem;
    display: flex;
  }

  @include lg {
    padding: 2.5rem;
    grid-template-columns: repeat(3, 1fr);
  }

  @include xl {
    padding: 3rem;
  }

  @include xxl {
    padding: 4rem;
  }
}
```

### Mixin Principal con Parámetros

```scss
@import "../styles/abstracts";

.elemento {
  font-size: 14px;

  @include breakpoint(sm) {
    font-size: 16px;
  }

  @include breakpoint(md) {
    font-size: 18px;
  }

  @include breakpoint(lg) {
    font-size: 20px;
  }
}
```

## 🎯 Mixins Especiales

### Solo Ciertos Rangos

```scss
.mobile-especial {
  background: red;

  @include mobile-only {
    // Solo hasta 639px
    background: blue;
  }
}

.tablet-especial {
  @include tablet-only {
    // Solo entre 640px y 1023px
    background: green;
  }
}

.desktop-especial {
  @include desktop-only {
    // Solo desde 1024px en adelante
    background: purple;
  }
}
```

### Rangos Personalizados

```scss
.rango-custom {
  @include breakpoint-between(sm, lg) {
    // Solo entre 640px y 1023px
    display: flex;
  }
}

.max-width {
  @include breakpoint-max(md) {
    // Solo hasta 767px
    display: none;
  }
}
```

## 📱 Ejemplos Prácticos

### Grid Responsivo

```scss
.grid-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @include sm {
    grid-template-columns: repeat(2, 1fr);
  }

  @include md {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  @include lg {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }

  @include xl {
    grid-template-columns: repeat(6, 1fr);
  }
}
```

### Typography Responsiva

```scss
.titulo {
  font-size: 1.5rem;
  line-height: 1.2;

  @include sm {
    font-size: 2rem;
  }

  @include md {
    font-size: 2.5rem;
    line-height: 1.3;
  }

  @include lg {
    font-size: 3rem;
    line-height: 1.4;
  }

  @include xl {
    font-size: 3.5rem;
  }
}
```

### Container con Max-Width

```scss
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 1rem;

  @include sm {
    max-width: 640px;
  }

  @include md {
    max-width: 768px;
    padding: 0 1.5rem;
  }

  @include lg {
    max-width: 1024px;
    padding: 0 2rem;
  }

  @include xl {
    max-width: 1280px;
  }

  @include xxl {
    max-width: 1536px;
  }
}
```

## 🛠️ Estructura de Archivos

```
src/styles/
├── abstracts/
│   ├── _index.scss      # Importa todo
│   ├── _variables.scss  # Breakpoints y variables
│   └── _mixins.scss     # Mixins de breakpoints
├── _ejemplos.scss       # Ejemplos de uso
└── main.scss           # Archivo principal
```

## 📝 Cómo Importar en tus Componentes

### En archivos SCSS

```scss
// Al inicio de tu archivo .scss
@import "../styles/abstracts";

// O si estás en una subcarpeta
@import "../../styles/abstracts";
```

### En componentes React

```tsx
// Para archivos de componente
import "./MiComponente.scss";
```

## 🔄 Enfoque Mobile-First

El sistema usa un enfoque **mobile-first**, lo que significa:

- Los estilos base son para móviles (xs)
- Cada breakpoint agrega estilos para pantallas más grandes
- Es más eficiente y accesible

```scss
.ejemplo-mobile-first {
  // Estilos base (móvil)
  padding: 1rem;
  font-size: 14px;

  // Se aplica desde 640px en adelante
  @include sm {
    padding: 1.5rem;
    font-size: 16px;
  }

  // Se aplica desde 768px en adelante
  @include md {
    padding: 2rem;
    font-size: 18px;
  }
}
```

## 🚨 Errores Comunes

### ❌ Breakpoint inexistente

```scss
@include invalidBreakpoint {
  // Error: breakpoint no existe
  color: red;
}
```

### ✅ Breakpoint correcto

```scss
@include md {
  color: red;
}
```

## 🎨 Integración con TailwindCSS

El sistema SASS es completamente compatible con TailwindCSS. Puedes usar ambos:

```scss
.componente-hibrido {
  @apply bg-blue-500 text-white; // TailwindCSS

  @include md {
    @apply bg-green-500; // TailwindCSS en breakpoint SASS
    padding: 2rem; // SASS personalizado
  }
}
```
