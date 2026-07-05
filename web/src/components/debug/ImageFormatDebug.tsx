import { useImageFormatSupport } from "@/hooks/useImageFormat";

export default function ImageFormatDebug() {
  const { avif, webp, loading } = useImageFormatSupport();

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (loading) {
    return (
      <div
        style={{
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 9999,
        }}
      >
        🔍 Detectando formatos...
      </div>
    );
  }

  const format = avif ? "AVIF" : webp ? "WebP" : "JPG";
  const emoji = avif ? "🚀" : webp ? "⚡" : "📷";

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "8px 12px",
        borderRadius: "4px",
        fontSize: "12px",
        zIndex: 9999,
      }}
    >
      {emoji} Usando: {format}
      <div style={{ fontSize: "10px", opacity: 0.7 }}>
        AVIF: {avif ? "✅" : "❌"} | WebP: {webp ? "✅" : "❌"}
      </div>
    </div>
  );
}
