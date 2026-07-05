import type { ContentfulComponent } from "@/types/contentful";
import Banner from "@/components/banner/Banner";
import Cards from "@/components/cards/Cards";
import SecondBanner from "@/components/second-banner/SecondBanner";
import NewsSection from "@/components/news-section/NewsSection";
import { LayoutFullWidth, Layout1Column } from "@/components/layouts";

interface ContentfulComponentRendererProps {
  component: ContentfulComponent;
}

/**
 * Maps Contentful contentType IDs to their respective React components
 * Handles recursive rendering for nested components
 */
export function ContentfulComponentRenderer({
  component,
}: ContentfulComponentRendererProps) {
  // Extract contentType from sys
  const contentType = component.sys?.contentType?.sys?.id;

  if (!contentType) {
    console.warn(
      "ContentfulComponentRenderer: No contentType found",
      component
    );
    return null;
  }

  // Get fields from component
  const fields = component.fields || {};

  // Map contentType to renderer
  switch (contentType) {
    case "layoutFullWidth":
      return <LayoutFullWidthRenderer fields={fields} />;

    case "layout1Column":
      return <Layout1ColumnRenderer fields={fields} />;

    case "layout2Column":
      return <Layout2ColumnRenderer fields={fields} />;

    case "bannerGallery":
      return <BannerGalleryRenderer fields={fields} />;

    case "fullWidthBanner":
      return <FullWidthBannerRenderer fields={fields} />;

    case "gallerySlide":
      return <GallerySlideRenderer fields={fields} />;

    case "newsCard":
      return <NewsCardRenderer fields={fields} />;

    case "serviceCard":
      return <ServiceCardRenderer fields={fields} />;

    case "captionBlock":
      return <CaptionBlockRenderer fields={fields} />;

    case "paragraph":
      return <ParagraphRenderer fields={fields} />;

    case "title":
      return <TitleRenderer fields={fields} />;

    case "ctaButton":
      return <CTAButtonRenderer fields={fields} />;

    case "menuItem":
      return <MenuItemRenderer fields={fields} />;

    case "image":
      return <ImageRenderer fields={fields} />;

    case "menu":
      return <MenuRenderer fields={fields} />;

    default:
      console.warn(
        `ContentfulComponentRenderer: No renderer found for contentType: ${contentType}`
      );
      return (
        <div className="contentful-component-missing">
          <p>Missing renderer for: {contentType}</p>
          <pre>{JSON.stringify(fields, null, 2)}</pre>
        </div>
      );
  }
}

// ============================================
// RENDERER COMPONENTS (Placeholders for now)
// ============================================

function LayoutFullWidthRenderer({ fields }: { fields: any }) {
  const components = fields.components || [];
  const className = fields.className || "";
  const entryId = fields.entryId || "";

  return (
    <LayoutFullWidth
      className={className}
      padding="none"
      dataAttributes={{ entryId }}
    >
      {components.map((component: any, index: number) => (
        <ContentfulComponentRenderer
          key={component.sys?.id || `component-${index}`}
          component={component}
        />
      ))}
    </LayoutFullWidth>
  );
}

function Layout1ColumnRenderer({ fields }: { fields: any }) {
  const components = fields.components || [];
  const entryId = fields.entryId || fields.layout1Column || "";
  const className = fields.className || "";

  // Check if this is a services or news container
  const hasServiceCards = components.some(
    (c: any) => c.sys?.contentType?.sys?.id === "serviceCard"
  );
  const hasNewsCards = components.some(
    (c: any) => c.sys?.contentType?.sys?.id === "newsCard"
  );

  // If it's a services container, render Cards component
  if (hasServiceCards) {
    // Extract title and subtitle from components
    const titleComponent = components.find(
      (c: any) => c.sys?.contentType?.sys?.id === "title"
    );
    const paragraphComponent = components.find(
      (c: any) => c.sys?.contentType?.sys?.id === "paragraph"
    );

    const title = titleComponent?.fields?.text || undefined;
    const subtitle = paragraphComponent?.fields?.content || undefined;

    // Filter only service cards
    const serviceCards = components.filter(
      (c: any) => c.sys?.contentType?.sys?.id === "serviceCard"
    );

    return <Cards cards={serviceCards} title={title} subtitle={subtitle} />;
  }

  // If it's a news container, render NewsSection component
  if (hasNewsCards) {
    // Extract title and subtitle from components
    const titleComponent = components.find(
      (c: any) => c.sys?.contentType?.sys?.id === "title"
    );
    const paragraphComponent = components.find(
      (c: any) => c.sys?.contentType?.sys?.id === "paragraph"
    );

    const title = titleComponent?.fields?.text || undefined;
    const subtitle = paragraphComponent?.fields?.content || undefined;

    // Filter only news cards
    const newsCards = components.filter(
      (c: any) => c.sys?.contentType?.sys?.id === "newsCard"
    );

    return <NewsSection news={newsCards} title={title} subtitle={subtitle} />;
  }

  // Check if this is just a title + paragraph section (like a header)
  const hasOnlyTextContent =
    components.length <= 2 &&
    components.every(
      (c: any) =>
        c.sys?.contentType?.sys?.id === "title" ||
        c.sys?.contentType?.sys?.id === "paragraph"
    );

  if (hasOnlyTextContent) {
    const titleComponent = components.find(
      (c: any) => c.sys?.contentType?.sys?.id === "title"
    );
    const paragraphComponent = components.find(
      (c: any) => c.sys?.contentType?.sys?.id === "paragraph"
    );

    return (
      <div
        className="section-header"
        style={{ textAlign: "center", padding: "3rem 1rem" }}
      >
        {titleComponent && (
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              marginBottom: "1rem",
            }}
          >
            {titleComponent.fields?.text}
          </h2>
        )}
        {paragraphComponent && (
          <p
            style={{
              fontSize: "1.125rem",
              color: "#6b7280",
              maxWidth: "42rem",
              margin: "0 auto",
            }}
          >
            {paragraphComponent.fields?.content}
          </p>
        )}
      </div>
    );
  }

  return (
    <Layout1Column
      className={className}
      padding="md"
      maxWidth="lg"
      dataAttributes={{ entryId }}
    >
      {components.length > 0 ? (
        components.map((component: any, index: number) => (
          <ContentfulComponentRenderer
            key={component.sys?.id || `component-${index}`}
            component={component}
          />
        ))
      ) : (
        <div className="layout-placeholder">
          <p>{entryId}</p>
        </div>
      )}
    </Layout1Column>
  );
}

function Layout2ColumnRenderer({ fields }: { fields: any }) {
  return (
    <div className="layout-2-column">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}

function BannerGalleryRenderer({ fields }: { fields: any }) {
  const slides = fields.slides || [];
  return <Banner slides={slides} autoPlayInterval={5000} />;
}

function FullWidthBannerRenderer({ fields }: { fields: any }) {
  // Extract data from nested objects
  const title = fields.title?.fields?.text || fields.title;
  const description = fields.caption?.fields?.content || fields.caption;
  const ctaLabel = fields.cta?.fields?.text || fields.ctaButton?.fields?.label;
  const ctaUrl = fields.cta?.fields?.url || fields.ctaButton?.fields?.url;
  const backgroundImage = fields.backgroundImage || fields.image;

  return (
    <SecondBanner
      title={title}
      description={description}
      ctaLabel={ctaLabel}
      ctaUrl={ctaUrl}
      backgroundImage={backgroundImage}
      parallaxSpeed={0.1}
    />
  );
}

function GallerySlideRenderer({ fields }: { fields: any }) {
  return (
    <div className="gallery-slide">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}

function NewsCardRenderer({ fields }: { fields: any }) {
  return (
    <div className="news-card">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}

function ServiceCardRenderer({ fields }: { fields: any }) {
  return (
    <div className="service-card">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}

function CaptionBlockRenderer({ fields }: { fields: any }) {
  return (
    <div className="caption-block">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}

function ParagraphRenderer({ fields }: { fields: any }) {
  const content = fields.content || fields.text || "";

  // If this paragraph is part of a cards or news section, don't render it
  // (it will be extracted and used as subtitle)
  if (!content) return null;

  return <p className="paragraph">{content}</p>;
}

function TitleRenderer({ fields }: { fields: any }) {
  const text = fields.text || "";

  // If this title is part of a cards or news section, don't render it
  // (it will be extracted and used as title)
  if (!text) return null;

  return <h2 className="title">{text}</h2>;
}

function CTAButtonRenderer({ fields }: { fields: any }) {
  // Don't render CTA buttons as they should be handled by their parent components
  return null;
}

function MenuItemRenderer({ fields }: { fields: any }) {
  return (
    <div className="menu-item">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}

function ImageRenderer({ fields }: { fields: any }) {
  return (
    <div className="image">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}

function MenuRenderer({ fields }: { fields: any }) {
  return (
    <div className="menu">
      <pre>{JSON.stringify(fields, null, 2)}</pre>
    </div>
  );
}
