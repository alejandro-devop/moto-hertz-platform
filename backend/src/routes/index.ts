import { Router } from 'express';
import healthRoutes from './health';
import mediaRoutes from './media';

const router: Router = Router();

// Health check routes (no auth required)
router.use('/health', healthRoutes);
router.use('/', healthRoutes); // Also expose at root for Cloud Run

// Los dominios de negocio (motorcycle, service-point, service, news) se
// exponen vía GraphQL (/graphql), no vía REST — ver src/graphql/.
//
// Única excepción: la subida de archivos (multipart), que no tiene sentido en
// GraphQL. La biblioteca de medios sí se consulta y se administra por GraphQL.
router.use('/media', mediaRoutes);

export default router;
