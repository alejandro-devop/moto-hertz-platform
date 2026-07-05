import React from "react";
import styles from "./LayoutFullWidth.module.scss";

interface LayoutFullWidthProps {
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
   * Vertical alignment of content
   */
  verticalAlign?: "top" | "center" | "bottom";
  /**
   * Horizontal alignment of content
   */
  horizontalAlign?: "left" | "center" | "right";
  /**
   * Maximum width for centered content (default: no max width for full width)
   */
  maxWidth?: string;
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
 * LayoutFullWidth component
 * Provides a full-width container with centered content
 * Supports flexible content rendering through children or render props
 */
export default function LayoutFullWidth({
  children,
  className = "",
  background,
  padding = "none",
  verticalAlign = "top",
  horizontalAlign = "center",
  maxWidth,
  dataAttributes = {},
  id,
}: LayoutFullWidthProps) {
  // Build CSS classes
  const containerClasses = [
    styles.layoutFullWidth,
    styles[`padding-${padding}`],
    styles[`vertical-${verticalAlign}`],
    styles[`horizontal-${horizontalAlign}`],
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

  // Content wrapper style
  const contentStyle: React.CSSProperties = {
    ...(maxWidth && { maxWidth }),
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
      <div className={styles.contentWrapper} style={contentStyle}>
        {renderChildren()}
      </div>
    </div>
  );
}
