"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ResponsiveDemo = dynamic(() => import("./ResponsiveDemo"), {
  ssr: false,
  loading: () => <div>Cargando demo responsivo...</div>,
});

export default function ResponsiveDemoWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Cargando demo responsivo...</div>;
  }

  return <ResponsiveDemo />;
}
