# Almacenamiento de archivos

Todo archivo que sube por el panel pasa por `getStorage()`. Ni los services ni
los resolvers saben dónde termina el archivo: solo hablan con la interfaz
`StorageDriver` (`types.ts`).

## Hoy

| Variable | Valor por defecto | Para qué |
| --- | --- | --- |
| `STORAGE_DRIVER` | `local` | Qué driver se usa. |
| `MEDIA_ROOT` | `<cwd>/uploads` | Carpeta del driver local. En Docker es un volumen nombrado (`media_data`), así que sobrevive a recrear el contenedor. |
| `MEDIA_PUBLIC_BASE_URL` | `http://localhost:8080/media` | Prefijo con el que se arma la URL pública. En producción, el dominio del backend. |
| `MEDIA_MAX_UPLOAD_MB` | `15` | Tamaño máximo del archivo **que llega**; lo que se guarda es el WebP procesado, mucho más liviano. |

El driver local además necesita que `app.ts` sirva `MEDIA_ROOT` como estático
bajo `/media` — eso solo aplica al driver local; un bucket sirve sus propios
archivos.

**En producción, el contenedor corre como el usuario `nodejs`** (ver
`Dockerfile`), así que `MEDIA_ROOT` tiene que existir con ese dueño *antes* de
montar el volumen; el `Dockerfile` ya lo crea. Si se monta un bind mount del
host en vez de un volumen nombrado, hay que darle permisos a mano
(`chown -R 1001:1001 <carpeta>`).

## Cómo se agrega otro driver (S3, GCS, …)

No hay implementaciones muertas a propósito: se escriben el día que exista el
bucket. Son tres pasos y **no se toca nada fuera de esta carpeta**:

1. `s3.driver.ts` con una clase que implemente `StorageDriver`
   (`put` / `delete` / `url` / `exists`) y un `static fromEnv()` que lea sus
   propias variables (`S3_BUCKET`, `S3_REGION`, credenciales…).
2. Registrarla en el mapa `DRIVERS` de `index.ts`:
   `s3: () => S3StorageDriver.fromEnv()`.
3. Poner `STORAGE_DRIVER=s3` en el entorno.

Lo que sí hay que recordar, porque no lo resuelve el driver:

- En `app.ts`, el `express.static('/media')` solo tiene sentido con el driver
  local. Si el driver remoto sirve sus propios archivos, esa línea se vuelve
  inofensiva (la carpeta estará vacía), pero conviene condicionarla.
- **Las URLs ya guardadas en el contenido no se migran solas.** La tabla `media`
  guarda `key` además de `url`, así que rearmar las URLs con el driver nuevo es
  un `UPDATE` mecánico sobre `media` y sobre las tablas de contenido que las
  referencian. Hay que hacerlo, y hacerlo una vez.
