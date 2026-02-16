import { pool } from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface AttendanceLog {
    id?: number;
    employee_id: number;
    date: string; // YYYY-MM-DD
    time_in?: Date;
    status: 'Hadir' | 'Tidak Hadir' | 'Izin' | 'Sakit';
    method: 'QR' | 'Manual';
    coordinates?: string;
    notes?: string;
}

export class AttendanceModel {
    static async create(log: AttendanceLog) {
        try {
            const [result] = await pool.query<ResultSetHeader>(
                `INSERT INTO daily_attendance (employee_id, date, status, method, coordinates, notes)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [log.employee_id, log.date, log.status, log.method, log.coordinates, log.notes]
            );
            return result.insertId;
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('ALREADY_CHECKED_IN');
            }
            throw error;
        }
    }

    static async isHoliday(date: string): Promise<boolean> {
        const [rows] = await pool.query<RowDataPacket[]>(
            'SELECT id FROM holidays WHERE date = ?',
            [date]
        );
        return rows.length > 0;
    }

    // Additional methods for reporting can be added later
}
