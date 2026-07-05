"use client";

import { useParallax } from "../../hooks";
import styles from "./ParallaxDemo.module.scss";

interface ParallaxDemoProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
  enableOnMobile?: boolean;
}

export default function ParallaxDemo({
  children,
  speed = 0.5,
  className = "",
  enableOnMobile = false,
}: ParallaxDemoProps) {
  const parallax = useParallax({ speed, enableOnMobile });

  return (
    <div
      ref={parallax.ref}
      className={`${styles.parallaxContainer} ${className}`}
      style={{ transform: parallax.transform }}
    >
      {children}
    </div>
  );
}
