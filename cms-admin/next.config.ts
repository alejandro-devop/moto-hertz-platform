import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Orígenes permitidos para los assets internos de `next dev` cuando se accede
  // al server desde otra máquina de la LAN (no aplica a producción).
  allowedDevOrigins: ["192.168.40.24"],
};

export default nextConfig;
