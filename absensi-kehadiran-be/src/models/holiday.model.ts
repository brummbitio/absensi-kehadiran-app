import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface Holiday {
    id?: number;
    date: string; // YYYY-MM-DD
    description: string;
    created_at?: Date;
}

export class HolidayModel {
    static async findAll() {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM holidays ORDER BY date ASC');
        return rows as Holiday[];
    }

    static async findByDate(date: string) {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM holidays WHERE date = ?', [date]);
        return rows[0] as Holiday | undefined;
    }

    static async create(date: string, description: string) {
        try {
            const [result] = await pool.query<ResultSetHeader>(
                'INSERT INTO holidays (date, description) VALUES (?, ?)',
                [date, description]
            );
            return result.insertId;
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('DUPLICATE_DATE');
            }
            throw error;
        }
    }

    static async delete(id: number) {
        const [result] = await pool.query<ResultSetHeader>('DELETE FROM holidays WHERE id = ?', [id]);
        return result.affectedRows;
    }
}
