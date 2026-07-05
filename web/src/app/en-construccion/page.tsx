import Link from "next/link";
import styles from "./EnConstruccion.module.scss";
import Icon from "@/components/icon";
import Menu from "@/components/menu";

export const metadata = {
  title: "En Construcción - Yamaha",
  description: "Esta sección está en construcción. Pronto estará disponible.",
};

const ConstructionBarrier = () => (
  <svg
    width="200"
    height="120"
    viewBox="0 0 200 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.barrierIcon}
  >
    {/* Poste izquierdo con detalles */}
    <rect x="15" y="30" width="12" height="70" fill="#8B4513" rx="1" />
    <rect x="15" y="30" width="4" height="70" fill="#A0522D" rx="1" />
    <rect x="15" y="95" width="12" height="8" fill="#654321" rx="1" />

    {/* Poste derecho con detalles */}
    <rect x="173" y="30" width="12" height="70" fill="#8B4513" rx="1" />
    <rect x="173" y="30" width="4" height="70" fill="#A0522D" rx="1" />
    <rect x="173" y="95" width="12" height="8" fill="#654321" rx="1" />

    {/* Barra superior con franjas diagonales */}
    <g>
      <rect x="20" y="35" width="165" height="18" fill="#FFA500" rx="2" />
      {/* Franjas negras diagonales */}
      <path d="M20 35 L35 35 L25 53 L20 53 Z" fill="#000000" />
      <path d="M35 35 L50 35 L40 53 L25 53 Z" fill="#FFA500" />
      <path d="M50 35 L65 35 L55 53 L40 53 Z" fill="#000000" />
      <path d="M65 35 L80 35 L70 53 L55 53 Z" fill="#FFA500" />
      <path d="M80 35 L95 35 L85 53 L70 53 Z" fill="#000000" />
      <path d="M95 35 L110 35 L100 53 L85 53 Z" fill="#FFA500" />
      <path d="M110 35 L125 35 L115 53 L100 53 Z" fill="#000000" />
      <path d="M125 35 L140 35 L130 53 L115 53 Z" fill="#FFA500" />
      <path d="M140 35 L155 35 L145 53 L130 53 Z" fill="#000000" />
      <path d="M155 35 L170 35 L160 53 L145 53 Z" fill="#FFA500" />
      <path d="M170 35 L185 35 L175 53 L160 53 Z" fill="#000000" />
      <rect x="20" y="35" width="165" height="2" fill="#FFB52E" />
    </g>

    {/* Barra media con franjas diagonales */}
    <g>
      <rect x="20" y="58" width="165" height="18" fill="#FFA500" rx="2" />
      {/* Offset de franjas */}
      <path d="M27.5 58 L42.5 58 L32.5 76 L17.5 76 Z" fill="#000000" />
      <path d="M42.5 58 L57.5 58 L47.5 76 L32.5 76 Z" fill="#FFA500" />
      <path d="M57.5 58 L72.5 58 L62.5 76 L47.5 76 Z" fill="#000000" />
      <path d="M72.5 58 L87.5 58 L77.5 76 L62.5 76 Z" fill="#FFA500" />
      <path d="M87.5 58 L102.5 58 L92.5 76 L77.5 76 Z" fill="#000000" />
      <path d="M102.5 58 L117.5 58 L107.5 76 L92.5 76 Z" fill="#FFA500" />
      <path d="M117.5 58 L132.5 58 L122.5 76 L107.5 76 Z" fill="#000000" />
      <path d="M132.5 58 L147.5 58 L137.5 76 L122.5 76 Z" fill="#FFA500" />
      <path d="M147.5 58 L162.5 58 L152.5 76 L137.5 76 Z" fill="#000000" />
      <path d="M162.5 58 L177.5 58 L167.5 76 L152.5 76 Z" fill="#FFA500" />
      <rect x="20" y="58" width="165" height="2" fill="#FFB52E" />
    </g>

    {/* Barra inferior con franjas diagonales */}
    <g>
      <rect x="20" y="81" width="165" height="18" fill="#FFA500" rx="2" />
      {/* Mismo patrón que la superior */}
      <path d="M20 81 L35 81 L25 99 L20 99 Z" fill="#000000" />
      <path d="M35 81 L50 81 L40 99 L25 99 Z" fill="#FFA500" />
      <path d="M50 81 L65 81 L55 99 L40 99 Z" fill="#000000" />
      <path d="M65 81 L80 81 L70 99 L55 99 Z" fill="#FFA500" />
      <path d="M80 81 L95 81 L85 99 L70 99 Z" fill="#000000" />
      <path d="M95 81 L110 81 L100 99 L85 99 Z" fill="#FFA500" />
      <path d="M110 81 L125 81 L115 99 L100 99 Z" fill="#000000" />
      <path d="M125 81 L140 81 L130 99 L115 99 Z" fill="#FFA500" />
      <path d="M140 81 L155 81 L145 99 L130 99 Z" fill="#000000" />
      <path d="M155 81 L170 81 L160 99 L145 99 Z" fill="#FFA500" />
      <path d="M170 81 L185 81 L175 99 L160 99 Z" fill="#000000" />
      <rect x="20" y="81" width="165" height="2" fill="#FFB52E" />
    </g>

    {/* Luces de advertencia */}
    <circle cx="21" cy="44" r="5" fill="#FF4444" opacity="0.8">
      <animate
        attributeName="opacity"
        values="0.8;0.3;0.8"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="179" cy="44" r="5" fill="#FF4444" opacity="0.3">
      <animate
        attributeName="opacity"
        values="0.3;0.8;0.3"
        dur="1.5s"
        repeatCount="indefinite"
      />
    </circle>

    {/* Sombra */}
    <ellipse cx="100" cy="107" rx="90" ry="8" fill="#00000022" />
  </svg>
);

export default function EnConstruccionPage() {
  return (
    <>
      <Menu />
      <div className={styles.container}>
        <div className={styles.content}>
          <ConstructionBarrier />

          <div className={styles.iconWrapper}>
            <Icon name="settings" size={80} />
          </div>

          <h1 className={styles.title}>Página en Construcción</h1>

          <p className={styles.description}>
            Estamos trabajando para traerte contenido increíble.
            <br />
            Esta sección estará disponible muy pronto.
          </p>

          <div className={styles.actions}>
            <Link href="/" className={styles.homeButton}>
              <Icon name="home" size={20} />
              Volver al inicio
            </Link>

            <Link href="/motos" className={styles.motosButton}>
              Ver Motocicletas
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
