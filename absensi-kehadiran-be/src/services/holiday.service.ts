import { HolidayModel } from '../models/holiday.model';

export class HolidayService {
    static async getHolidays() {
        return await HolidayModel.findAll();
    }

    static async createHoliday(data: { date: string; description: string }) {
        // Validate Date Format YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(data.date)) {
            throw new Error('INVALID_DATE_FORMAT');
        }

        const id = await HolidayModel.create(data.date, data.description);
        return { id, ...data };
    }

    static async deleteHoliday(id: number) {
        const affected = await HolidayModel.delete(id);
        if (affected === 0) throw new Error('NOT_FOUND');
        return true;
    }
}
