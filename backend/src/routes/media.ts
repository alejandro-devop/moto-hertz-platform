import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { mediaService } from '../services/media.service';
import { BadRequestError } from '../shared/errors';
import { MIMES_ACEPTADOS } from '../shared/images/process';
import { requireAdmin } from '../shared/middleware/require-admin';
import { errorResponse, successResponse } from '../shared/utils/response';

/**
 * La única ruta Express de negocio del backend, y está justificada: GraphQL no
 * es transporte para binarios (base64 infla un 33 % y obliga a bufferizar el
 * JSON entero). Ver `CLAUDE.md`, «Regla #1».
 *
 * Un archivo por request: así el panel puede mostrar el progreso de cada foto
 * cuando se suben las 16 o 18 de una moto.
 */
const router: Router = Router();

const MAX_MB = Number(process.env.MEDIA_MAX_UPLOAD_MB || 15);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!MIMES_ACEPTADOS.includes(file.mimetype?.toLowerCase())) {
      cb(new BadRequestError(`"${file.originalname}" no es una imagen. Sube un JPG, PNG, WebP o HEIC.`));
      return;
    }
    cb(null, true);
  },
});

/** Multer tira sus propios errores; se traducen a algo que se pueda leer. */
function recibirArchivo(req: Request, res: Response, next: NextFunction): void {
  upload.single('file')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res
          .status(413)
          .json(
            errorResponse(
              `La imagen pesa más de ${MAX_MB} MB. Redúcela antes de subirla (el servidor la comprime, pero no puede recibirla tan grande).`
            )
          );
        return;
      }
      res.status(400).json(errorResponse(`No se pudo recibir el archivo: ${error.message}`));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    next();
  });
}

router.post('/', requireAdmin, recibirArchivo, async (req, res, next) => {
  try {
    if (!req.file) {
      throw new BadRequestError('No llegó ningún archivo (campo "file").');
    }

    const item = await mediaService.uploadMedia({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
    });

    res.status(201).json(successResponse(item));
  } catch (error) {
    next(error);
  }
});

export default router;
