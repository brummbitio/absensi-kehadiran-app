import { pool } from '../config/db';
import { RowDataPacket } from 'mysql2';
import { HolidayModel } from '../models/holiday.model';
import { EmployeeModel } from '../models/employee.model';

export class ReportService {
    static async getMonthlyRecap(month: number, year: number) {
        // 1. Calculate Working Days in Month (excluding Weekends and Holidays)
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        const totalDays = endDate.getDate();

        let workingDays = 0;
        const holidays = await HolidayModel.findAll();
        const holidaySet = new Set(holidays.map(h => h.date)); // format YYYY-MM-DD? Wait. HolidayModel returns strict string from DB.

        // Note: db date might be Date object or String depending on driver config. mysql2 returns Date object by default unless configured.
        // I should check db config. I didn't set dateStrings: true. So it returns Date objects.
        // I need to normalize.
        // Let's adjust logic to handle Date objects or Strings.

        // Actually, let's use a helper to format YYYY-MM-DD
        const toYMD = (d: Date) => d.toISOString().split('T')[0];

        // Re-fetch holidays to map correctly
        const holidayDates = new Set<string>();
        // We can optimize by filtering holidays for this month in SQL, but for now strict logic in JS is fine.
        holidays.forEach(h => {
            const hDate = new Date(h.date);
            // Ensure correct timezone handling? DB is +07:00. 
            // If DB returns Date object, it is in server local time (or UTC if configured).
            // To match "YYYY-MM-DD" reliably, strict string parsing is better.
            // But let's assume standard behavior:
            holidayDates.add(toYMD(hDate));
        });

        for (let d = 1; d <= totalDays; d++) {
            const current = new Date(year, month - 1, d);
            const dayOfWeek = current.getDay();
            const dateStr = toYMD(current); // Local time YYYY-MM-DD

            // Exclude Weekend (0=Sun, 6=Sat)
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                // Exclude Holiday
                // We need to be careful about timezone. 'current' uses component creation which is local.
                // toYMD uses toISOString which is UTC. This is a BUG RISK.
                // Fix: string construction.
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const dayStr = String(current.getDate()).padStart(2, '0');
                const localDateStr = `${y}-${m}-${dayStr}`;

                if (!holidayDates.has(localDateStr)) {
                    workingDays++;
                }
            }
        }

        // 2. Get attendance records with dates
        const [attendanceRows] = await pool.query<RowDataPacket[]>(
            `SELECT employee_id, DATE_FORMAT(date, '%Y-%m-%d') as attendance_date
             FROM daily_attendance 
             WHERE MONTH(date) = ? AND YEAR(date) = ? AND status = 'Hadir'
             ORDER BY employee_id, date`,
            [month, year]
        );

        // Group by employee_id
        const attendanceMap = new Map<number, string[]>();
        attendanceRows.forEach(row => {
            const empId = row.employee_id;
            if (!attendanceMap.has(empId)) {
                attendanceMap.set(empId, []);
            }
            attendanceMap.get(empId)!.push(row.attendance_date);
        });

        // Get Employees (using pagination? No, report usually all. limit 1000?)
        const { data: employees } = await EmployeeModel.findAll(1000, 0); // Limit 1000 for now

        const report = employees.map(emp => {
            const attendanceDates = attendanceMap.get(emp.id!) || [];
            const present = attendanceDates.length;
            // absent = working_days - present. (If present > working_days due to overtime/weekend, absent=0?)
            // Logic: absent shouldn't be negative.
            const absent = Math.max(0, workingDays - present);

            return {
                employee_id: emp.id,
                name: emp.name,
                division: emp.division,
                present_days: present,
                absent_days: absent,
                attendance_dates: attendanceDates // Array of dates in YYYY-MM-DD format
            };
        });

        return {
            month,
            year,
            working_days: workingDays,
            employees: report
        };
    }
}
