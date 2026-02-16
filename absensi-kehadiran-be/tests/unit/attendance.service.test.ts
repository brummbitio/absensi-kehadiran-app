import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AttendanceService } from '../../src/services/attendance.service';
import { EmployeeModel } from '../../src/models/employee.model';
import { AttendanceModel } from '../../src/models/attendance.model';
import * as QRService from '../../src/services/qr.service';

// Mock dependencies
jest.mock('../../src/models/employee.model');
jest.mock('../../src/models/attendance.model');
jest.mock('../../src/services/qr.service');

describe('AttendanceService', () => {
    const mockEmployee = {
        id: 1,
        name: 'John Doe',
        unique_id: 'EMP-123',
        division: 'IT',
        qr_secret: 'secret',
        is_active: 1,
    };

    const validPayload = {
        uid: 'EMP-123',
        div: 'IT',
        ts: Date.now().toString(),
        sig: 'valid_signature'
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mocks
        // Use 'as any' to bypass TS 'never' inference on generic mocks
        (EmployeeModel.findByUniqueId as any).mockResolvedValue(mockEmployee);
        (QRService.verifyQRSignature as any).mockReturnValue(true);
        (AttendanceModel.isHoliday as any).mockResolvedValue(false);
        (AttendanceModel.create as any).mockResolvedValue(100);
    });

    it('should successfully record attendance for valid request', async () => {
        const result = await AttendanceService.scanAttendance(validPayload);

        expect(result).toHaveProperty('status', 'Hadir');
        expect(result).toHaveProperty('employee_name', 'John Doe');
        expect(AttendanceModel.create).toHaveBeenCalled();
    });

    it('should throw EMPLOYEE_NOT_FOUND if employee does not exist', async () => {
        (EmployeeModel.findByUniqueId as any).mockResolvedValue(null);

        await expect(AttendanceService.scanAttendance(validPayload))
            .rejects.toThrow('EMPLOYEE_NOT_FOUND');
    });

    it('should throw INVALID_SIGNATURE if signature verification fails', async () => {
        (QRService.verifyQRSignature as any).mockReturnValue(false);

        await expect(AttendanceService.scanAttendance(validPayload))
            .rejects.toThrow('INVALID_SIGNATURE');
    });

    it('should throw DIVISION_MISMATCH if payload division differs from employee division', async () => {
        const badPayload = { ...validPayload, div: 'HR' };

        await expect(AttendanceService.scanAttendance(badPayload))
            .rejects.toThrow('DIVISION_MISMATCH');
    });

    it('should throw HOLIDAY_CLOSED if today is a holiday', async () => {
        (AttendanceModel.isHoliday as any).mockResolvedValue(true);

        await expect(AttendanceService.scanAttendance(validPayload))
            .rejects.toThrow('HOLIDAY_CLOSED');
    });
});
