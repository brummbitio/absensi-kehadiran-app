import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { requestLogger } from './middlewares/request-logger.middleware';
import logger from './utils/logger';

dotenv.config();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(requestLogger);

// Routes
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import attendanceRoutes from './routes/attendance.routes';
import holidayRoutes from './routes/holiday.routes';
import reportRoutes from './routes/report.routes';

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/report', reportRoutes);

// Health Check
app.get('/api/health', async (req: Request, res: Response) => {
    try {
        const { pool } = require('./config/db');
        await pool.query('SELECT 1');
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            db_time: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({ status: 'error', message: 'Database connection failed' });
    }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.error({ message: 'Unhandled Error', error: err, stack: err.stack, requestId: req.id });
    res.status(500).json({ status: 'error', message: 'Something went wrong!' });
});

export default app;
