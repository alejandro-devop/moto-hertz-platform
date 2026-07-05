import { Router } from 'express';
import healthRoutes from './health';

const router: Router = Router();

// Health check routes (no auth required)
router.use('/health', healthRoutes);
router.use('/', healthRoutes); // Also expose at root for Cloud Run

// Los dominios de negocio (motorcycle, service-point, service, news) se
// exponen vía GraphQL (/graphql), no vía REST — ver src/graphql/.

export default router;
