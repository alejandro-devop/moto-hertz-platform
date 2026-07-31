import sanitizeHtml from "sanitize-html";

/**
 * Sanea el HTML de `News.content` antes de un `dangerouslySetInnerHTML`.
 *
 * El backend ya lo sanea al guardar (`backend/src/services/news.service.ts`,
 * con `sanitize-html`), y el propio editor del panel (Tiptap) solo puede
 * producir estas etiquetas para empezar. Esto es la **segunda** capa, no la
 * única: nada impide que `content` llegue de una mutación hecha a mano con
 * un JWT robado, así que el sitio público no puede confiar ciegamente en lo
 * que el backend le manda. Ver «Editor de contenido» en `backend/CLAUDE.md`.
 *
 * Se usa la misma librería que el backend (`sanitize-html`), no
 * `isomorphic-dompurify`: DOMPurify necesita `jsdom` para correr en el
 * servidor, y bajo Turbopack (Next 15) `jsdom` falla al resolver
 * `default-stylesheet.css` de su propio paquete durante el SSR de esta
 * página («use client», pero Next igual la renderiza una vez en el
 * servidor) — `ENOENT ... jsdom/lib/jsdom/browser/default-stylesheet.css`.
 * `sanitize-html` no toca el DOM (parsea con `htmlparser2`), así que corre
 * igual en servidor y en navegador sin ese problema.
 *
 * La lista de etiquetas permitidas es la misma que la del backend —está
 * escrita en los dos archivos porque son paquetes distintos y ninguno
 * depende del otro (mismo criterio que el catálogo de iconos de `service`,
 * `utils/service-icons.tsx`). Si una cambia, la otra tiene que cambiar igual.
 */
const ETIQUETAS_PERMITIDAS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "h1",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
  "hr",
];

export function sanitizeNewsContent(html?: string | null): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ETIQUETAS_PERMITIDAS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  });
}
