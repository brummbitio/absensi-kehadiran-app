import { Request, Response } from 'express';
import { AttendanceService } from '../services/attendance.service';

export const scan = async (req: Request, res: Response) => {
    try {
        const { uid, div, ts, sig } = req.body;

        if (!uid || !div || !ts || !sig) {
            res.status(400).json({ status: 'error', message: 'Invalid payload structure' });
            return;
        }

        const result = await AttendanceService.scanAttendance({ uid, div, ts, sig });
        res.json({ status: 'success', data: result });

    } catch (error: any) {
        switch (error.message) {
            case 'EMPLOYEE_NOT_FOUND':
                res.status(404).json({ status: 'error', message: 'Employee not found' });
                break;
            case 'EMPLOYEE_INACTIVE':
            case 'INVALID_SIGNATURE':
            case 'DIVISION_MISMATCH':
                res.status(403).json({ status: 'error', message: 'Access denied: ' + error.message });
                break;
            case 'WEEKEND_CLOSED':
            case 'HOLIDAY_CLOSED':
                res.status(400).json({ status: 'error', message: 'Attendance closed: ' + error.message });
                break;
            case 'ALREADY_CHECKED_IN':
                res.status(409).json({ status: 'error', message: 'Already checked in today' });
                break;
            default:
                res.status(500).json({ status: 'error', message: 'Internal server error' });
        }
    }
};
