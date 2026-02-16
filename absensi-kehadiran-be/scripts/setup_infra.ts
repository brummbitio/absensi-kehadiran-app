import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    timezone: '+07:00'
};

const DDL = {
    users: `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('SUPERADMIN','ADMIN') DEFAULT 'ADMIN',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    employees: `CREATE TABLE IF NOT EXISTS employees (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    holidays: `CREATE TABLE IF NOT EXISTS holidays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        description VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    daily_attendance: `CREATE TABLE IF NOT EXISTS daily_attendance (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
};

async function setupInfra() {
    let connection;
    try {
        // 1. Connect without DB to create it
        console.log('🔌 Connecting to MySQL server...');
        connection = await mysql.createConnection({
            host: DB_CONFIG.host,
            user: DB_CONFIG.user,
            password: DB_CONFIG.password
        });

        // 2. Create Database
        console.log(`🔨 Creating Database '${process.env.DB_NAME}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);

        // 3. Set Global Timezone (if possible, otherwise session)
        console.log('🕒 Setting Timezone to +07:00...');
        try {
            await connection.query("SET GLOBAL time_zone = '+07:00';");
        } catch (e) {
            console.warn('⚠️  Could not set GLOBAL time_zone (permissions?), setting SESSION instead.');
        }

        // Switch to DB
        await connection.changeUser({ database: process.env.DB_NAME });
        await connection.query("SET time_zone = '+07:00';");

        // 4. Execute Schema
        console.log('📜 Executing Schema DDL...');
        await connection.query(DDL.users);
        await connection.query(DDL.employees);
        await connection.query(DDL.holidays);
        await connection.query(DDL.daily_attendance);
        console.log('✅ Schema created.');

        // 5. Validation Tests
        console.log('🧪 Running Validation Tests...');
        await runValidation(connection);

    } catch (error) {
        console.error('❌ Setup Failed:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

async function runValidation(conn: mysql.Connection) {
    const results: any = {};

    // Test 1: UNIQUE(email) on users
    try {
        await conn.query("INSERT INTO users (name, email, password_hash) VALUES ('T1', 'test@test.com', 'hash')");
        await conn.query("INSERT INTO users (name, email, password_hash) VALUES ('T2', 'test@test.com', 'hash')");
        results.unique_email = 'FAIL';
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') results.unique_email = 'PASS';
        else results.unique_email = `FAIL (${e.code})`;
    }
    // Cleanup
    await conn.query("DELETE FROM users WHERE email='test@test.com'");

    // Test 2: UNIQUE(identity_number) on employees
    try {
        await conn.query("INSERT INTO employees (unique_id, name, identity_number, division, qr_secret) VALUES ('U1', 'N1', 'ID123', 'D1', 'S1')");
        await conn.query("INSERT INTO employees (unique_id, name, identity_number, division, qr_secret) VALUES ('U2', 'N2', 'ID123', 'D1', 'S2')");
        results.unique_identity = 'FAIL';
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') results.unique_identity = 'PASS';
        else results.unique_identity = `FAIL (${e.code})`;
    }
    // Cleanup
    await conn.query("DELETE FROM employees WHERE identity_number='ID123'");

    // Test 3: UNIQUE(employee_id, date) on daily_attendance
    try {
        // Setup employee
        await conn.query("INSERT INTO employees (unique_id, name, identity_number, division, qr_secret) VALUES ('U_ATT', 'N_ATT', 'ID_ATT', 'DIV', 'SEC')");
        const [rows]: any = await conn.query("SELECT id FROM employees WHERE unique_id='U_ATT'");
        const empId = rows[0].id;

        await conn.query(`INSERT INTO daily_attendance (employee_id, date) VALUES (${empId}, '2025-01-01')`);
        await conn.query(`INSERT INTO daily_attendance (employee_id, date) VALUES (${empId}, '2025-01-01')`);
        results.unique_attendance_log = 'FAIL';
    } catch (e: any) {
        if (e.code === 'ER_DUP_ENTRY') results.unique_attendance_log = 'PASS';
        else results.unique_attendance_log = `FAIL (${e.code})`;
    }

    // Test 4: FK Constraint (Cascade Delete)
    try {
        const [rows]: any = await conn.query("SELECT id FROM employees WHERE unique_id='U_ATT'");
        if (rows.length > 0) {
            const empId = rows[0].id;
            await conn.query(`DELETE FROM employees WHERE id=${empId}`);
            const [attRows]: any = await conn.query(`SELECT * FROM daily_attendance WHERE employee_id=${empId}`);
            if (attRows.length === 0) results.fk_cascade = 'PASS';
            else results.fk_cascade = 'FAIL (Records remain)';
        } else {
            results.fk_cascade = 'FAIL (Setup missing)';
        }
    } catch (e: any) {
        results.fk_cascade = `FAIL (${e.message})`;
    }

    console.table(results);

    // Output JSON for Agent
    console.log('VALIDATION_RESULT_JSON:', JSON.stringify(results));
}

setupInfra();
