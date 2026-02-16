import { Router } from 'express';
import * as AttendanceController from '../controllers/attendance.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate Limit: 10 requests per minute
const scanLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { status: 'error', message: 'Too many scan attempts, please try again later.' }
});

router.post('/scan', authenticateToken, scanLimiter, AttendanceController.scan);

export default router;
