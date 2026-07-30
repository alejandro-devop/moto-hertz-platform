# Fase 6 — Configuración del sitio

## Objetivo

Sacar del código los datos que hoy están escritos a mano y cambian sin avisar:
teléfonos, WhatsApp, direcciones, redes sociales, textos de SEO. Es lo que la
Fase 3 del plan del monorepo llamó "configuración general (SEO/contacto)".

Se diferencia de todas las fases anteriores en una cosa: **no es una lista, es
un único registro**. No hay crear ni eliminar, solo editar.

## Prerrequisitos

- Fase 5 completada.

## Contexto

Antes de decidir los campos, hay que ir a buscar qué está hoy quemado en el
código de `web`: teléfonos y WhatsApp en componentes, textos del pie de página,
metadatos en `layout.tsx` y `viewport.ts`, enlaces a redes. Ese inventario es el
primer paso, no una suposición.

## Pasos detallados

1. **Inventario.** Recorrer `web/src/` y listar los valores candidatos:
   contacto, redes, SEO, textos legales. Presentarle la lista al usuario y
   confirmar cuáles se administran y cuáles se quedan en el código.
2. **Backend — tabla.** `site_settings` como registro único (una sola fila, con
   un identificador fijo). Migración nueva que inserte la fila inicial con los
   valores actuales del código, para que el sitio no se quede en blanco.
3. **Backend — dominio.** Query pública `siteSettings` (sin argumentos) y una
   sola mutación `siteSettingsEdit` con `requireAuth`. No hay `Add` ni `Remove`.
4. **cms-admin.** Módulo `configuracion` con formulario único por secciones
   (**Contacto**, **Redes sociales**, **SEO**, **Textos**), la misma ficha por
   secciones del patrón pero sin lista delante.
   - Entrada propia en `nav-links.ts`; en móvil tiene sentido colgarla de la
     hoja "Más" en vez de gastar una de las cinco pestañas.
   - Validar formatos donde importa: correo, URL, número de WhatsApp.
5. **web.** Consumir `siteSettings` donde hoy hay valores literales.
   - Cuidado con el rendimiento: es un dato que se usa en casi todas las
     páginas. Decidir si se pide en el layout del servidor y se pasa hacia
     abajo, o se cachea.
   - El sitio no puede quedar roto si la consulta falla: dejar valores de
     respaldo.

## Entregables

- Tabla `site_settings` con la fila inicial poblada.
- Módulo de configuración en el panel.
- `web` consumiendo la configuración en lugar de valores quemados.

## Pruebas manuales

1. `pnpm dev` en la raíz.
2. En http://localhost:3001/configuracion, comprueba que el formulario llega ya
   lleno con los valores actuales del sitio (no vacío).
3. Cambia el número de WhatsApp y guarda.
4. Ve a http://localhost:3000 y confirma que el botón de WhatsApp usa el número
   nuevo, en el pie de página y en donde aparezca.
5. Cambia el título de SEO y comprueba en el navegador que la pestaña del sitio
   público cambió.
6. Escribe un correo mal formado (`hola@`) y confirma que el formulario lo
   rechaza con un mensaje claro y no guarda.
7. Apaga el backend (`pnpm docker:stop` en `backend/`) y recarga el sitio
   público: debe seguir funcionando con los valores de respaldo, no romperse.
8. Vuelve a encender el backend y confirma que se recuperan los valores reales.
9. A 390 px: comprueba que se llega a **Configuración** desde la hoja "Más" y
   que el formulario es usable.

## Criterios de aceptación (DoD)

- [ ] El usuario confirmó el inventario de campos antes de crear la tabla.
- [ ] La migración deja la fila inicial con los valores que hoy están en el
      código: al terminar la fase el sitio se ve igual que antes.
- [ ] Cambiar un valor en el panel se refleja en `web`.
- [ ] `web` no se rompe si el backend no responde.
- [ ] Ya no quedan teléfonos ni enlaces de redes escritos a mano en `web/src/`
      para los campos que se decidió administrar.
- [ ] Tests del service de `site-settings` pasan.

## Riesgos / notas

- Un registro único invita a olvidarse de la concurrencia. Con un solo
  administrador no es un problema real; anotarlo y seguir.
- Si un campo de SEO se administra pero `web` lo cachea agresivamente, el
  usuario va a creer que el panel no guardó. Documentar cuánto tarda en verse.
