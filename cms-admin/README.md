# cms-admin

Panel de administración custom (Next.js) del contenido de Yamaha Oriente, consumido contra el GraphQL de `../backend`. Arquitectura decidida en la Fase 3 (`../docs/architecture/cms-admin.md`), scaffold inicial en la Fase 4.

## Dev

```bash
pnpm --filter yamaha-oriente-cms-admin dev
```

Corre en `http://localhost:3001`. Requiere que `../backend` esté corriendo en `http://localhost:8080` (`npm run docker:up` en `backend/`).

Credenciales de desarrollo (ver `backend/.env`): `admin@yamahaoriente.com` / `admin123`.

Ver `CLAUDE.md` para convenciones del paquete.
