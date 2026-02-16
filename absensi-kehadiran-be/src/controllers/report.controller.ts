import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

export const getMonthlyRecap = async (req: Request, res: Response) => {
    try {
        const month = parseInt(req.query.month as string);
        const year = parseInt(req.query.year as string);

        if (!month || !year || month < 1 || month > 12) {
            res.status(400).json({ status: 'error', message: 'Invalid month/year' });
            return;
        }

        const report = await ReportService.getMonthlyRecap(month, year);
        res.json({ status: 'success', data: report });
    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
