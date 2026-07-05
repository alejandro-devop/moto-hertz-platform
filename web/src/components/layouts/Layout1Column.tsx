import React from "react";
import styles from "./Layout1Column.module.scss";

interface Layout1ColumnProps {
  /**
   * Children can be React nodes or a render prop function
   */
  children?: React.ReactNode | ((props: any) => React.ReactNode);
  /**
   * Additional CSS class names
   */
  className?: string;
  /**
   * Background color or style
   */
  background?: string;
  /**
   * Padding size
   */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /**
   * Maximum width for content container
   */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
  /**
   * Horizontal alignment of content
   */
  align?: "left" | "center" | "right";
  /**
   * Data attributes for tracking or testing
   */
  dataAttributes?: Record<string, string>;
  /**
   * Optional ID
   */
  id?: string;
}

/**
 * Layout1Column component
 * Provides a single-column layout with configurable max-width and alignment
 * Supports flexible content rendering through children or render props
 */
export default function Layout1Column({
  children,
  className = "",
  background,
  padding = "md",
  maxWidth = "lg",
  align = "center",
  dataAttributes = {},
  id,
}: Layout1ColumnProps) {
  // Build CSS classes
  const containerClasses = [
    styles.layout1Column,
    styles[`padding-${padding}`],
    styles[`maxWidth-${maxWidth}`],
    styles[`align-${align}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Build data attributes
  const dataAttrs = Object.entries(dataAttributes).reduce(
    (acc, [key, value]) => {
      acc[`data-${key.toLowerCase()}`] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  // Container style
  const containerStyle: React.CSSProperties = {
    ...(background && { background }),
  };

  // Render children (supports render prop pattern)
  const renderChildren = () => {
    if (typeof children === "function") {
      return children({});
    }
    return children;
  };

  return (
    <div
      id={id}
      className={containerClasses}
      style={containerStyle}
      {...dataAttrs}
    >
      {renderChildren()}
    </div>
  );
}
