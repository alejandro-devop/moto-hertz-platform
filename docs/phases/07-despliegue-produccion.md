# Fase 7 — Despliegue a producción

## Objetivo

Desplegar los 3 paquetes a producción, con `backend` en Cloud Run siguiendo el patrón de `xavi-platform-node`.

## Prerrequisitos

- Fases 0–6 completadas y validadas localmente.

## Pasos detallados

1. Adaptar `docs/DEPLOYMENT_GUIDE.md` de la plantilla `xavi-platform-node` para `backend` (proyecto GCP propio de Yamaha Oriente, no el de xavi): setup de Cloud Run, Cloud SQL (Postgres) o equivalente, Redis administrado, variables de entorno/secrets.
2. Definir CI/CD para `backend` (GitHub Actions, tal como en la plantilla `.github/`) — build de imagen Docker, push a registry, deploy a Cloud Run.
3. Decidir hosting de `web`: Vercel (más natural para Next.js) vs. Cloud Run también (consistencia de infra). Confirmar con el usuario.
4. Decidir hosting de `cms-admin`: mismo criterio que `web`, considerando que es una app interna (posiblemente detrás de auth/VPN, no pública).
5. Configurar dominios: sitio público en el dominio de Yamaha Oriente, `cms-admin` en subdominio interno (ej. `admin.yamahaoriente.com` o similar).
6. Configurar variables de entorno de producción en cada plataforma de hosting.
7. Smoke test post-deploy: verificar que `web` en producción consume `backend` en producción correctamente, y que `cms-admin` puede autenticar y hacer un cambio visible.

## Entregables

- `backend` desplegado en Cloud Run.
- `web` y `cms-admin` desplegados en la plataforma decidida.
- CI/CD funcional para al menos `backend`.

## Criterios de aceptación (DoD)

- [ ] Los 3 servicios responden en sus URLs de producción.
- [ ] Un deploy se dispara automáticamente al hacer push a la rama principal (o el flujo que el usuario prefiera).
- [ ] Smoke test end-to-end pasa en producción.

## Riesgos / notas

- Costos de infraestructura (Cloud SQL, Redis administrado, Cloud Run) deben estimarse y confirmarse con el usuario antes de aprovisionar recursos reales — acción con costo económico, no solo técnica.
