import { pool } from '../src/config/db';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { RowDataPacket } from 'mysql2';

dotenv.config();

const SUPERADMIN_EMAIL = 'admin@absensi.com';
const SUPERADMIN_PASSWORD = 'admin123';
const SALT_ROUNDS = 12;

async function initDB() {
    let connection;
    try {
        connection = await pool.getConnection();

        console.log('🔄 Initializing Database Schema...');

        // 1. Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('SUPERADMIN','ADMIN') DEFAULT 'ADMIN',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table "users" ready.');

        // 2. Employees Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS employees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                unique_id VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                identity_number VARCHAR(50) UNIQUE NOT NULL,
                division VARCHAR(100) NOT NULL,
                qr_secret VARCHAR(255) NOT NULL,
                is_active TINYINT(1) DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_identity(identity_number),
                INDEX idx_division(division)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table "employees" ready.');

        // 3. Holidays Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS holidays (
                id INT AUTO_INCREMENT PRIMARY KEY,
                date DATE UNIQUE NOT NULL,
                description VARCHAR(255),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table "holidays" ready.');

        // 4. Daily Attendance Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS daily_attendance (
                id INT AUTO_INCREMENT PRIMARY KEY,
                employee_id INT NOT NULL,
                date DATE NOT NULL,
                time_in DATETIME DEFAULT CURRENT_TIMESTAMP,
                status ENUM('Hadir','Tidak Hadir','Izin','Sakit') DEFAULT 'Hadir',
                method ENUM('QR','Manual') DEFAULT 'QR',
                coordinates VARCHAR(100),
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_daily_log(employee_id, date),
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('✅ Table "daily_attendance" ready.');

        // 5. Seed SuperAdmin
        const [rows] = await connection.query<RowDataPacket[]>(
            'SELECT id FROM users WHERE email = ?',
            [SUPERADMIN_EMAIL]
        );

        if (rows.length === 0) {
            const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, SALT_ROUNDS);
            await connection.query(
                `INSERT INTO users (name, email, password_hash, role) 
                 VALUES (?, ?, ?, 'SUPERADMIN')`,
                ['Super Administrator', SUPERADMIN_EMAIL, passwordHash]
            );
            console.log('✅ SUPERADMIN seeded successfully.');
        } else {
            console.log('ℹ️  Superadmin already exists. Skipping seed.');
        }

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

initDB();
