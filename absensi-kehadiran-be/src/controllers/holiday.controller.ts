import { Request, Response } from 'express';
import { HolidayService } from '../services/holiday.service';

export const list = async (req: Request, res: Response) => {
    try {
        const holidays = await HolidayService.getHolidays();
        res.json({ status: 'success', data: holidays });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const { date, description } = req.body;
        if (!date || !description) {
            res.status(400).json({ status: 'error', message: 'Date and description are required' });
            return;
        }
        const result = await HolidayService.createHoliday({ date, description });
        res.status(201).json({ status: 'success', data: result });
    } catch (error: any) {
        if (error.message === 'DUPLICATE_DATE') {
            res.status(409).json({ status: 'error', message: 'Holiday already exists for this date' });
        } else if (error.message === 'INVALID_DATE_FORMAT') {
            res.status(400).json({ status: 'error', message: 'Invalid date format (YYYY-MM-DD)' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};

export const remove = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id as string);
        await HolidayService.deleteHoliday(id);
        res.json({ status: 'success', message: 'Holiday deleted' });
    } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
            res.status(404).json({ status: 'error', message: 'Holiday not found' });
        } else {
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
};
