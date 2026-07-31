'use client';

import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * El editor de contenido de una noticia. Decisión tomada con el usuario en
 * la Fase 4 del plan CMS: **enriquecido (Tiptap), no Markdown en textarea**.
 * Guarda el HTML tal como lo produce `editor.getHTML()` — el formato nativo
 * de la librería, sin una conversión intermedia que pudiera perder formato.
 * `web` renderiza ese mismo HTML, saneado otra vez del otro lado (ver
 * `web/src/utils/sanitize-news-content.ts` y `backend/CLAUDE.md`, sección
 * `news`).
 *
 * El propio editor ya limita lo que se puede producir: su esquema solo
 * conoce los nodos de `StarterKit` más el enlace, así que pegar HTML de otro
 * sitio no cuela un `<script>` — eso lo hace ProseMirror al convertir el
 * HTML pegado al documento interno, antes de que `getHTML()` lo vuelva a
 * serializar. El saneo del backend es la segunda capa, para cuando el HTML
 * no viene de este editor (una mutación hecha a mano).
 */

const ALTO_BOTON = 'size-11 md:size-9';

function BotonBarra({
  activo,
  onClick,
  etiqueta,
  disabled,
  children,
}: {
  activo?: boolean;
  onClick: () => void;
  etiqueta: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={activo ? 'secondary' : 'ghost'}
      size="icon"
      disabled={disabled}
      onClick={onClick}
      aria-label={etiqueta}
      aria-pressed={activo}
      className={ALTO_BOTON}
    >
      {children}
    </Button>
  );
}

function BotonEnlace({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState('');

  if (!editor) return null;
  const activo = editor.isActive('link');

  return (
    <Popover
      open={abierto}
      onOpenChange={(next) => {
        setAbierto(next);
        if (next) setUrl(editor.getAttributes('link').href ?? '');
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={activo ? 'secondary' : 'ghost'}
            size="icon"
            aria-label="Enlace"
            aria-pressed={activo}
            className={ALTO_BOTON}
          />
        }
      >
        <Link2 />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <form
          className="flex items-center gap-1.5"
          onSubmit={(event) => {
            event.preventDefault();
            const limpio = url.trim();
            if (limpio) {
              editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: limpio })
                .run();
            }
            setAbierto(false);
          }}
        >
          <Input
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://…"
            className="h-9 flex-1 text-sm"
          />
          <Button type="submit" size="sm" className="shrink-0">
            Aplicar
          </Button>
          {activo ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Quitar enlace"
              onClick={() => {
                editor.chain().focus().unsetLink().run();
                setAbierto(false);
              }}
            >
              <Link2Off />
            </Button>
          ) : null}
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  error,
}: {
  /** HTML. `''` cuando está vacío. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const editor = useEditor({
    /* El primer render en el servidor no tiene el contenido todavía y React
       se queja de la discrepancia; el editor es de cliente de todos modos
       (vive dentro de una hoja que solo se abre en el navegador). */
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? 'Escribe la noticia…',
      }),
    ],
    content: value,
    onUpdate: ({ editor: instancia }) => onChange(instancia.getHTML()),
    editorProps: {
      attributes: {
        class: cn(
          'tiptap min-h-40 rounded-b-lg bg-background px-3 py-2.5 text-sm outline-none',
          'focus-visible:ring-3 focus-visible:ring-ring/50'
        ),
      },
    },
  });

  /* Si la ficha carga otro registro (o se limpia al cerrar), el editor tiene
     que reflejarlo: `useEditor` no vuelve a leer `content` por sí solo. */
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === (value || '<p></p>')) return;
    editor.commands.setContent(value || '', { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-input bg-background',
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        error && 'border-destructive'
      )}
    >
      <div className="scroll-x flex items-center gap-0.5 border-b border-border p-1">
        <BotonBarra
          activo={editor?.isActive('bold')}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          etiqueta="Negrita"
        >
          <Bold />
        </BotonBarra>
        <BotonBarra
          activo={editor?.isActive('italic')}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          etiqueta="Cursiva"
        >
          <Italic />
        </BotonBarra>
        <BotonBarra
          activo={editor?.isActive('heading', { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          etiqueta="Encabezado"
        >
          <Heading2 />
        </BotonBarra>
        <BotonBarra
          activo={editor?.isActive('heading', { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          etiqueta="Subencabezado"
        >
          <Heading3 />
        </BotonBarra>
        <BotonBarra
          activo={editor?.isActive('bulletList')}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          etiqueta="Lista con viñetas"
        >
          <List />
        </BotonBarra>
        <BotonBarra
          activo={editor?.isActive('orderedList')}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          etiqueta="Lista numerada"
        >
          <ListOrdered />
        </BotonBarra>
        <BotonBarra
          activo={editor?.isActive('blockquote')}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          etiqueta="Cita"
        >
          <Quote />
        </BotonBarra>
        {editor ? <BotonEnlace editor={editor} /> : null}
        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden />
        <BotonBarra
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().undo()}
          etiqueta="Deshacer"
        >
          <Undo2 />
        </BotonBarra>
        <BotonBarra
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().redo()}
          etiqueta="Rehacer"
        >
          <Redo2 />
        </BotonBarra>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
