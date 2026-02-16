import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';

export const create = async (req: Request, res: Response) => {
    try {
        const { name, identity_number, division } = req.body;
        if (!name || !identity_number || !division) {
            res.status(400).json({ status: 'error', message: 'Missing required fields' });
            return;
        }

        const employee = await EmployeeService.createEmployee({ name, identity_number, division });
        res.status(201).json({ status: 'success', data: employee });
    } catch (error: any) {
        if (error.message === 'IDENTITY_EXISTS') {
            res.status(409).json({ status: 'error', message: 'Identity number already exists' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};

export const getAll = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;

        const result = await EmployeeService.getEmployees(page, limit, search);
        res.json({ status: 'success', data: result });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const getOne = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const employee = await EmployeeService.getEmployee(id);
        res.json({ status: 'success', data: employee });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
            res.status(404).json({ status: 'error', message: 'Employee not found' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};

export const update = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const result = await EmployeeService.updateEmployee(id, req.body);
        res.json({ status: 'success', data: result });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND_OR_NO_CHANGE') {
            res.status(404).json({ status: 'error', message: 'Employee not found or no changes made' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await EmployeeService.deleteEmployee(id);
        res.json({ status: 'success', message: 'Employee deleted' });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
            res.status(404).json({ status: 'error', message: 'Employee not found' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};

export const getQR = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        const qrPayload = await EmployeeService.getEmployeeQR(id);
        res.json({ status: 'success', data: qrPayload });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
            res.status(404).json({ status: 'error', message: 'Employee not found' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};
