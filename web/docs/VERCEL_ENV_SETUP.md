# Configuración de Variables de Entorno en Vercel

## Error Actual

```
Error: Contentful configuration missing: SPACE_ID and API_KEY are required
```

Este error ocurre porque las variables de entorno de Contentful no están configuradas en Vercel.

## Solución: Configurar Variables de Entorno en Vercel

### Opción 1: Usando la Interfaz de Vercel (Recomendado)

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto `yamaha-motohertz`
3. Ve a **Settings** (Configuración)
4. En el menú lateral, selecciona **Environment Variables**
5. Agrega las siguientes variables:

   | Name              | Value                                     | Environment                      |
   | ----------------- | ----------------------------------------- | -------------------------------- |
   | `SPACE_ID`        | Tu Space ID de Contentful                 | Production, Preview, Development |
   | `API_KEY`         | Tu Access Token de Contentful             | Production, Preview, Development |
   | `PREVIEW_API_KEY` | Tu Preview Token de Contentful (opcional) | Production, Preview, Development |

6. Haz clic en **Save** para cada variable
7. **Importante**: Después de agregar las variables, debes hacer un **Redeploy** del proyecto:
   - Ve a la pestaña **Deployments**
   - Encuentra el último deployment
   - Haz clic en los tres puntos (•••)
   - Selecciona **Redeploy**
   - Confirma con **Redeploy**

### Opción 2: Usando Vercel CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Desde la raíz del proyecto, agregar variables
vercel env add SPACE_ID
# Pega tu Space ID cuando te lo pida

vercel env add API_KEY
# Pega tu Access Token cuando te lo pida

vercel env add PREVIEW_API_KEY
# Pega tu Preview Token cuando te lo pida (opcional)

# Hacer un nuevo deployment
vercel --prod
```

## Dónde Encontrar tus Credenciales de Contentful

1. **Inicia sesión en Contentful**: https://app.contentful.com
2. **Selecciona tu Space** (yamaha-motohertz o el nombre que uses)
3. **Ve a Settings > API keys**
4. **Crea un nuevo API key** o usa uno existente:
   - **Space ID**: Aparece en la parte superior
   - **Content Delivery API - access token**: Copia este valor para `API_KEY`
   - **Content Preview API - access token**: Copia este valor para `PREVIEW_API_KEY` (opcional)

## Verificar la Configuración

Después de configurar las variables y hacer redeploy:

1. Ve a tu sitio en producción
2. El error debería desaparecer
3. El contenido de Contentful debería cargarse correctamente

## Variables de Entorno Locales

Para desarrollo local, crea un archivo `.env.local` en la raíz del proyecto:

```bash
# .env.local
SPACE_ID=tu_space_id_aqui
API_KEY=tu_access_token_aqui
PREVIEW_API_KEY=tu_preview_token_aqui
```

**Nota**: El archivo `.env.local` no se debe subir a Git (ya está en .gitignore)

## Troubleshooting

### El error persiste después de agregar las variables

- Asegúrate de haber hecho **Redeploy** después de agregar las variables
- Verifica que los valores no tengan espacios al inicio o al final
- Confirma que las credenciales sean correctas en Contentful

### Error 401 Unauthorized

- Verifica que el `API_KEY` sea del tipo "Content Delivery API"
- Asegúrate de que el token no haya expirado

### Las variables no se encuentran

- En Vercel, las variables de entorno del servidor no necesitan el prefijo `NEXT_PUBLIC_`
- Verifica que las variables estén marcadas para el ambiente correcto (Production, Preview, Development)

## Recursos Adicionales

- [Documentación de Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentación de API Keys en Contentful](https://www.contentful.com/developers/docs/references/authentication/)
