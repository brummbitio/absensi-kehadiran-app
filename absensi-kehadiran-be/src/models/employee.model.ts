import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Employee {
    id?: number;
    unique_id: string;
    name: string;
    identity_number: string;
    division: string;
    qr_secret: string;
    is_active: boolean;
    created_at?: Date;
}

export class EmployeeModel {
    static async findAll(limit: number, offset: number, search?: string) {
        let query = 'SELECT * FROM employees';
        const params: any[] = [];

        if (search) {
            query += ' WHERE name LIKE ? OR identity_number LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query<RowDataPacket[]>(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM employees';
        const countParams: any[] = [];
        if (search) {
            countQuery += ' WHERE name LIKE ? OR identity_number LIKE ?';
            countParams.push(`%${search}%`, `%${search}%`);
        }
        const [countRows] = await pool.query<RowDataPacket[]>(countQuery, countParams);

        return {
            data: rows as Employee[],
            total: countRows[0].total
        };
    }

    static async findById(id: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM employees WHERE id = ?',
            [id]
        );
        return rows[0] as Employee | undefined;
    }

    static async findByIdentity(identityNumber: string) {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM employees WHERE identity_number = ?',
            [identityNumber]
        );
        return rows[0] as Employee | undefined;
    }

    static async findByUniqueId(uniqueId: string) {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM employees WHERE unique_id = ?',
            [uniqueId]
        );
        return rows[0] as Employee | undefined;
    }

    static async create(employee: Employee) {
        const [result] = await pool.query<ResultSetHeader>(
            `INSERT INTO employees (unique_id, name, identity_number, division, qr_secret, is_active)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [employee.unique_id, employee.name, employee.identity_number, employee.division, employee.qr_secret, employee.is_active]
        );
        return result.insertId;
    }

    static async update(id: number, data: Partial<Employee>) {
        const fields: string[] = [];
        const values: any[] = [];

        if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
        if (data.division !== undefined) { fields.push('division = ?'); values.push(data.division); }
        if (data.is_active !== undefined) { fields.push('is_active = ?'); values.push(data.is_active); }
        if (data.qr_secret !== undefined) { fields.push('qr_secret = ?'); values.push(data.qr_secret); }

        if (fields.length === 0) return 0;

        values.push(id);
        const [result] = await pool.query<ResultSetHeader>(
            `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        return result.affectedRows;
    }

    static async delete(id: number) {
        const [result] = await pool.query<ResultSetHeader>(
            'DELETE FROM employees WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    }
}
