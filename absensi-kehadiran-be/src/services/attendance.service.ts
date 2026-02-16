import { AttendanceModel } from '../models/attendance.model';
import { EmployeeModel } from '../models/employee.model';
import { verifyQRSignature } from './qr.service';

export class AttendanceService {
    static async scanAttendance(data: { uid: string; div: string; ts: string; sig: string }) {
        // 1. Fetch Employee
        const employee = await EmployeeModel.findByUniqueId(data.uid);
        if (!employee) {
            throw new Error('EMPLOYEE_NOT_FOUND');
        }

        // 2. Active Check
        if (!employee.is_active) {
            throw new Error('EMPLOYEE_INACTIVE');
        }

        // 3. Verify Signature
        // We use the employee's stored secret to verify the payload signature
        const isValid = verifyQRSignature({
            uid: data.uid,
            div: data.div,
            ts: data.ts,
            sig: data.sig
        }, employee.qr_secret);

        if (!isValid) {
            throw new Error('INVALID_SIGNATURE');
        }

        // 4. Division Check
        if (employee.division !== data.div) {
            throw new Error('DIVISION_MISMATCH');
        }

        // 5. Build Date Objects (Asia/Jakarta)
        // We need server time. 
        // Note: 'new Date()' in Node follows system time. .env TZ=Asia/Jakarta should handle this.
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const day = now.getDay(); // 0 = Sunday, 6 = Saturday

        // 6. Weekend Check
        if (day === 0 || day === 6) {
            throw new Error('WEEKEND_CLOSED');
        }

        // 7. Holiday Check
        const isHoliday = await AttendanceModel.isHoliday(dateStr);
        if (isHoliday) {
            throw new Error('HOLIDAY_CLOSED');
        }

        // 8. Insert (Duplicate check handled by DB Constraint)
        try {
            const id = await AttendanceModel.create({
                employee_id: employee.id!,
                date: dateStr,
                status: 'Hadir',
                method: 'QR',
                notes: 'Scanned at ' + now.toTimeString()
            });
            return {
                status: 'Hadir',
                time: now.toISOString(),
                employee_name: employee.name
            };
        } catch (error: any) {
            if (error.message === 'ALREADY_CHECKED_IN') {
                throw new Error('ALREADY_CHECKED_IN');
            }
            throw error;
        }
    }
}
