import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'fallback_refresh_secret';
const SALT_ROUNDS = 12;

export class AuthService {

    // --- Utility Methods (Requested Phase 3) ---
    static async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, SALT_ROUNDS);
    }

    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    static generateAccessToken(user: { id: number, email: string, role: string }): string {
        return jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '15m' }
        );
    }

    static generateRefreshToken(user: { id: number }): string {
        return jwt.sign(
            { id: user.id },
            REFRESH_SECRET,
            { expiresIn: '7d' }
        );
    }

    // --- Business Logic ---

    static async login(email: string, password: string) {
        const [users] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const user = users[0];
        const isValid = await this.comparePassword(password, user.password_hash);

        if (!isValid) {
            throw new Error('INVALID_CREDENTIALS');
        }

        const accessToken = this.generateAccessToken({ id: user.id, email: user.email, role: user.role });
        const refreshToken = this.generateRefreshToken({ id: user.id });

        return {
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            access_token: accessToken,
            refresh_token: refreshToken
        };
    }

    static async refresh(refreshToken: string) {
        try {
            const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any;

            const [users] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                throw new Error('USER_NOT_FOUND');
            }

            const user = users[0];
            const newAccessToken = this.generateAccessToken({ id: user.id, email: user.email, role: user.role });

            return { access_token: newAccessToken };
        } catch (error) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
    }
}
