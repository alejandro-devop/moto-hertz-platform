/**
 * Ejemplo de uso del hook useHomeData con datos resueltos de Contentful
 */

"use client";

import { useHomeData } from "@/hooks/useHomeData";

export function HomePageExample() {
  // El hook devuelve los datos completamente resueltos
  const { data, loading, error, refetch, lastUpdated } = useHomeData({
    immediate: true,
    revalidateInterval: 5 * 60 * 1000, // Revalidar cada 5 minutos
  });

  if (loading) {
    return <div>Cargando datos...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={refetch}>Reintentar</button>
      </div>
    );
  }

  if (!data) {
    return <div>No hay datos disponibles</div>;
  }

  // Acceder a los datos completamente resueltos
  // No necesitas buscar en includes, todo está integrado
  const { fields } = data;
  const layout = fields.layout || [];

  console.log("Datos de la home page:", fields);
  console.log("Última actualización:", lastUpdated);

  return (
    <div>
      <h1>{fields.title}</h1>

      {layout.map((layoutItem: any, index: number) => {
        const contentType = layoutItem.sys?.contentType?.sys?.id;

        // Renderizar según el tipo de contenido
        switch (contentType) {
          case "layoutFullWidth":
            return (
              <FullWidthLayout key={layoutItem.sys.id} data={layoutItem} />
            );

          case "layout1Column":
            return (
              <SingleColumnLayout key={layoutItem.sys.id} data={layoutItem} />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

// Componente para layout full width
function FullWidthLayout({ data }: { data: any }) {
  const { entryId, components } = data.fields;

  return (
    <section className="full-width-section">
      <h2>{entryId}</h2>

      {components?.map((component: any) => {
        const componentType = component.sys?.contentType?.sys?.id;

        switch (componentType) {
          case "bannerGallery":
            return <BannerGallery key={component.sys.id} data={component} />;

          default:
            return null;
        }
      })}
    </section>
  );
}

// Componente para galería de banners
function BannerGallery({ data }: { data: any }) {
  const { entryId, slides } = data.fields;

  return (
    <div className="banner-gallery">
      <h3>{entryId}</h3>

      <div className="slides-container">
        {slides?.map((slide: any) => {
          const { title, caption, image, ctaButton } = slide.fields;

          return (
            <div key={slide.sys.id} className="slide">
              {/* La imagen está completamente resuelta */}
              {image?.fields?.url && (
                <img src={image.fields.url} alt={title} loading="lazy" />
              )}

              <div className="slide-content">
                <h4>{title}</h4>
                <p>{caption}</p>

                {/* El botón CTA también está resuelto */}
                {ctaButton?.fields && (
                  <a href={ctaButton.fields.url} className="cta-button">
                    {ctaButton.fields.text}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Componente para layout de una columna
function SingleColumnLayout({ data }: { data: any }) {
  const { layout1Column } = data.fields;

  return (
    <section className="single-column-section">
      <div className="content">{layout1Column}</div>
    </section>
  );
}

// ============================================
// Ejemplo de uso con SSR/SSG en Next.js
// ============================================

/**
 * Ejemplo de Server Component que obtiene datos en el servidor
 */
export async function HomePageSSR() {
  // En el servidor, puedes usar el servicio directamente
  const { contentfulService } = await import("@/services/contentful");

  try {
    const data = await contentfulService.getHomePageData();

    // Los datos ya están completamente resueltos
    const layout = data.fields?.layout || [];

    return (
      <div>
        <h1>{data.fields?.title}</h1>

        {layout.map((item: any, index: number) => (
          <div key={item.sys?.id || index}>{item.fields?.entryId}</div>
        ))}
      </div>
    );
  } catch (error) {
    console.error("Error fetching data:", error);
    return <div>Error loading page</div>;
  }
}

/**
 * Ejemplo de uso con datos iniciales (SSR + hidratación en cliente)
 */
export function HomePageWithInitialData({ initialData }: { initialData: any }) {
  const { data, loading, error } = useHomeData({
    initialData, // Usa los datos del servidor inicialmente
    immediate: false, // No hace fetch adicional al montar
    revalidateInterval: 5 * 60 * 1000, // Pero revalida cada 5 minutos
  });

  // En el primer render usa initialData
  // Después de 5 minutos, revalida automáticamente
  const currentData = data || initialData;

  return (
    <div>
      {loading && <div className="loading-indicator">Actualizando...</div>}

      <h1>{currentData.fields?.title}</h1>

      {/* Renderizar contenido */}
    </div>
  );
}

/**
 * Ejemplo de acceso a datos anidados profundos
 */
export function DeepNestedDataExample() {
  const { data } = useHomeData();

  if (!data) return null;

  // Acceder a datos profundamente anidados
  // Todo está resuelto, no hay Links
  const layout = data.fields.layout;
  const firstLayoutItem = layout[0];
  const bannerContainer = firstLayoutItem.fields.components[0];
  const bannerGallery = bannerContainer.fields;
  const slides = bannerGallery.slides;
  const firstSlide = slides[0];
  const image = firstSlide.fields.image;
  const imageUrl = image.fields.url;
  const ctaButton = firstSlide.fields.ctaButton;
  const buttonText = ctaButton.fields.text;

  return (
    <div>
      <img src={imageUrl} alt="Banner" />
      <button>{buttonText}</button>
    </div>
  );
}

/**
 * Ejemplo de iteración sobre todos los niveles
 */
export function IterateAllLevelsExample() {
  const { data } = useHomeData();

  if (!data) return null;

  return (
    <div>
      {data.fields.layout?.map((layoutItem: any) => (
        <div key={layoutItem.sys.id}>
          <h2>{layoutItem.fields.entryId}</h2>

          {layoutItem.fields.components?.map((component: any) => (
            <div key={component.sys.id}>
              <h3>{component.fields.entryId}</h3>

              {component.fields.slides?.map((slide: any) => (
                <div key={slide.sys.id}>
                  <h4>{slide.fields.title}</h4>
                  <p>{slide.fields.caption}</p>

                  {slide.fields.image && (
                    <img
                      src={slide.fields.image.fields.url}
                      alt={slide.fields.title}
                    />
                  )}

                  {slide.fields.ctaButton && (
                    <a href={slide.fields.ctaButton.fields.url}>
                      {slide.fields.ctaButton.fields.text}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Ejemplo con manejo de errores y reintento
 */
export function ErrorHandlingExample() {
  const { data, loading, error, refetch } = useHomeData({
    onError: (err) => {
      console.error("Error fetching home data:", err);
      // Puedes enviar a un servicio de logging
      // logErrorToService(err);
    },
  });

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Cargando contenido...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <h2>Error al cargar el contenido</h2>
        <p>{error.message}</p>
        <button onClick={refetch}>Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      {/* Renderizar contenido */}
      {data && <div>{data.fields.title}</div>}
    </div>
  );
}
