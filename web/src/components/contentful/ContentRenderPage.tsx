import type { HomePageData } from "@/types/contentful";
import { ContentfulComponentRenderer } from "./ContentfulComponentRenderer";

interface ContentRenderPageProps {
  data: HomePageData;
}

/**
 * Main component that renders the Contentful page structure
 * Iterates through the layout array and renders each component
 */
export function ContentRenderPage({ data }: ContentRenderPageProps) {
  // Extract fields and layout from the data
  const { fields } = data;

  if (!fields || !fields.layout) {
    console.warn("ContentRenderPage: No layout found in data");
    return null;
  }

  return (
    <div className="contentful-page">
      {fields.layout.map((component, index) => (
        <ContentfulComponentRenderer
          key={component.sys?.id || `layout-${index}`}
          component={component}
        />
      ))}
    </div>
  );
}
