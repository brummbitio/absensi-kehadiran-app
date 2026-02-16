import { EmployeeModel, Employee } from '../models/employee.model';
import { generateQRPayload } from './qr.service';
import crypto from 'crypto';

export class EmployeeService {
    static async createEmployee(data: { name: string; identity_number: string; division: string }) {
        // 1. Check duplicates
        const existing = await EmployeeModel.findByIdentity(data.identity_number);
        if (existing) {
            throw new Error('IDENTITY_EXISTS');
        }

        // 2. Generate Unique ID & Secret
        const unique_id = 'EMP' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();
        const qr_secret = crypto.randomBytes(32).toString('hex');

        // 3. Create
        const newEmployee: Employee = {
            unique_id,
            name: data.name, // Normalization can happen in Controller or here
            identity_number: data.identity_number.toUpperCase(),
            division: data.division,
            qr_secret,
            is_active: true
        };

        const id = await EmployeeModel.create(newEmployee);
        return { id, ...newEmployee };
    }

    static async getEmployees(page: number, limit: number, search?: string) {
        const offset = (page - 1) * limit;
        return await EmployeeModel.findAll(limit, offset, search);
    }

    static async getEmployee(id: number) {
        const emp = await EmployeeModel.findById(id);
        if (!emp) throw new Error('NOT_FOUND');
        return emp;
    }

    static async updateEmployee(id: number, data: { name?: string; division?: string; is_active?: boolean }) {
        const affected = await EmployeeModel.update(id, data);
        if (affected === 0) throw new Error('NOT_FOUND_OR_NO_CHANGE');
        return await this.getEmployee(id);
    }

    static async deleteEmployee(id: number) {
        const affected = await EmployeeModel.delete(id);
        if (affected === 0) throw new Error('NOT_FOUND');
        return true;
    }

    static async getEmployeeQR(id: number) {
        const emp = await this.getEmployee(id);
        // Generate payload using stored secret
        return generateQRPayload(emp.unique_id, emp.division, emp.qr_secret);
    }

    static async regenerateQR(id: number) {
        const new_secret = crypto.randomBytes(32).toString('hex');
        await EmployeeModel.update(id, { qr_secret: new_secret });
        return this.getEmployeeQR(id);
    }
}
