import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const requestId = uuidv4();
    req.id = requestId;

    logger.info({
        message: 'Incoming Request',
        method: req.method,
        url: req.url,
        requestId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });

    const start = Date.now();

    res.on('finish', () => {
        logger.info({
            message: 'Request Completed',
            method: req.method,
            url: req.url,
            requestId,
            status: res.statusCode,
            duration: `${Date.now() - start}ms`,
        });
    });

    next();
};
