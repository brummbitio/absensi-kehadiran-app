import bcrypt from 'bcrypt';
import { pool } from '../config/db';
import dotenv from 'dotenv';
import { RowDataPacket } from 'mysql2';

dotenv.config();

const SUPERADMIN_EMAIL = 'admin@local.dev';
const SUPERADMIN_PASSWORD = 'ChangeMe123!';
const SALT_ROUNDS = 12;

async function seed() {
    let connection;
    try {
        console.log('🌱 Starting Seed...');
        connection = await pool.getConnection();

        // Check if exists
        const [rows] = await connection.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [SUPERADMIN_EMAIL]
        );

        if (rows.length > 0) {
            console.log('ℹ️  Superadmin already exists.');
            return;
        }

        // Hash
        const hashedPassword = await bcrypt.hash(SUPERADMIN_PASSWORD, SALT_ROUNDS);

        // Insert
        await connection.query(
            `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'SUPERADMIN')`,
            ['Super Administrator', SUPERADMIN_EMAIL, hashedPassword]
        );

        console.log('✅ Superadmin created successfully.');
        console.log(`📧 Email: ${SUPERADMIN_EMAIL}`);
        console.log(`🔑 Password: ${SUPERADMIN_PASSWORD}`);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        // We don't process.exit(0) here because standard pool might keep open, 
        // but for a script we usually want to exit.
        process.exit(0);
    }
}

seed();
