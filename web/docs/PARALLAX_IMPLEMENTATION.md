# Efecto Parallax - Documentación

## Descripción

Se ha implementado un efecto parallax en el componente `SecondBanner` que crea una sensación de profundidad al hacer scroll. El efecto hace que la imagen de fondo se mueva a una velocidad diferente que el contenido, creando una experiencia visual atractiva.

## Características Implementadas

### 1. Hook Personalizado `useParallax`

Ubicación: `/src/hooks/useParallax.ts`

**Parámetros:**

- `speed` (default: 0.5): Controla la velocidad del efecto parallax (0.5 = mitad de velocidad del scroll)
- `enableOnMobile` (default: true): Habilita/deshabilita el efecto en dispositivos móviles

**Retorna:**

- `ref`: Referencia al elemento HTML
- `offset`: Valor calculado del desplazamiento
- `transform`: String CSS con la transformación aplicada

### 2. Optimizaciones de Rendimiento

- **Hardware Acceleration**: Uso de `transform: translateZ(0)` y `will-change: transform`
- **Passive Listeners**: Event listeners optimizados para scroll
- **Viewport Detection**: Solo calcula parallax cuando el elemento está visible
- **Mobile Optimization**: Efecto deshabilitado por defecto en móviles para mejor rendimiento

### 3. Accesibilidad

- **Reduced Motion**: Respeta la preferencia `prefers-reduced-motion: reduce`
- **Responsive Design**: Comportamiento adaptativo según el tamaño de pantalla

## Uso en SecondBanner

```tsx
// Parallax para imagen de fondo (movimiento más pronunciado)
const backgroundParallax = useParallax<HTMLElement>({
  speed: 0.5,
  enableOnMobile: false,
});

// Parallax para contenido (movimiento sutil)
const contentParallax = useParallax<HTMLDivElement>({
  speed: 0.2,
  enableOnMobile: false,
});
```

### Aplicación en el JSX

```tsx
<section ref={backgroundParallax.ref} className={styles.banner}>
  <div
    className={styles.backgroundContainer}
    style={{ transform: backgroundParallax.transform }}
  >
    {/* Imagen de fondo */}
  </div>

  <div
    className={styles.content}
    style={{ transform: contentParallax.transform }}
  >
    {/* Contenido */}
  </div>
</section>
```

## Componente de Demostración

Se incluye también `ParallaxDemo` en `/src/components/parallax-demo/` que puede ser usado para aplicar efectos parallax a otros elementos.

## Estilos CSS

### Optimizaciones añadidas:

```scss
.banner {
  will-change: transform;
  transform: translateZ(0); // Hardware acceleration
}

.backgroundContainer {
  transform: scale(1.1); // Permite movimiento sin mostrar bordes
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}

// Deshabilitar en móviles
@media (max-width: 767px) {
  .backgroundContainer {
    transform: scale(1) !important;
  }
}

// Respetar preferencias de movimiento
@media (prefers-reduced-motion: reduce) {
  .banner,
  .backgroundContainer,
  .content {
    transform: none !important;
  }
}
```

## Consideraciones Técnicas

1. **Rendimiento**: El efecto está optimizado para 60 FPS usando hardware acceleration
2. **Compatibilidad**: Funciona en todos los navegadores modernos
3. **Responsive**: Se adapta automáticamente a diferentes tamaños de pantalla
4. **Accesibilidad**: Respeta las preferencias del usuario sobre animaciones

## Personalización

Para ajustar el efecto parallax:

- **Velocidad**: Cambiar el valor `speed` (0.1 = muy lento, 1.0 = velocidad normal)
- **Dirección**: Usar valores negativos para invertir la dirección
- **Móviles**: Cambiar `enableOnMobile` a `true` si se desea en dispositivos móviles

## Testing

El efecto puede probarse:

1. Haciendo scroll en la página
2. Verificando que la imagen de fondo se mueve más lento que el scroll
3. Comprobando que el contenido tiene un movimiento más sutil
4. Confirmando que se deshabilita en móviles y con `prefers-reduced-motion`
