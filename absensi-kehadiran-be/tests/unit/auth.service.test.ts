import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../../src/services/auth.service';
import { pool } from '../../src/config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock DB
jest.mock('../../src/config/db', () => ({
    pool: {
        query: jest.fn(),
    },
}));

describe('AuthService', () => {
    const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        password_hash: '$2b$10$hashedpassword',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('login', () => {
        it('should return tokens and user on successful login', async () => {
            // Mock DB response
            (pool.query as any).mockResolvedValue([[mockUser], []]);

            // Mock bcrypt compare
            jest.spyOn(bcrypt, 'compare').mockImplementation((pass, hash) => Promise.resolve(true));
            // Mock jwt sign
            jest.spyOn(jwt, 'sign').mockImplementation(() => 'mock_token');

            const result = await AuthService.login('test@example.com', 'password');

            expect(result).toHaveProperty('user');
            expect(result.user.email).toBe(mockUser.email);
            expect(result).toHaveProperty('access_token', 'mock_token');
            expect(result).toHaveProperty('refresh_token', 'mock_token');
        });

        it('should throw INVALID_CREDENTIALS if user not found', async () => {
            (pool.query as any).mockResolvedValue([[], []]);

            await expect(AuthService.login('wrong@example.com', 'password'))
                .rejects.toThrow('INVALID_CREDENTIALS');
        });

        it('should throw INVALID_CREDENTIALS if password mismatch', async () => {
            (pool.query as any).mockResolvedValue([[mockUser], []]);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            await expect(AuthService.login('test@example.com', 'wrongpass'))
                .rejects.toThrow('INVALID_CREDENTIALS');
        });
    });
});
