import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import logger from '../utils/logger';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const result = await AuthService.login(email, password);
        res.json({
            status: 'success',
            data: result
        });
    } catch (error: any) {
        if (error.message === 'INVALID_CREDENTIALS') {
            res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        } else {
            logger.error({ message: 'Login Error', error });
            res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            res.status(400).json({ status: 'error', message: 'Refresh token required' });
            return;
        }
        const result = await AuthService.refresh(refresh_token);
        res.json({
            status: 'success',
            data: result
        });
    } catch (error: any) {
        res.status(403).json({ status: 'error', message: 'Invalid or expired refresh token' });
    }
};

export const logout = async (req: Request, res: Response) => {
    // Stateless logout (client clears token). 
    // In strict mode, blacklist refresh token in Redis (not implemented for MVP).
    res.json({ status: 'success', message: 'Logged out successfully' });
};
