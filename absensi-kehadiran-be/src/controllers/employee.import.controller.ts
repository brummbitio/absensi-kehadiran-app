import { Request, Response } from 'express';
import Papa from 'papaparse';
import fs from 'fs';
import { EmployeeService } from '../services/employee.service';

export const importEmployees = async (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ status: 'error', message: 'No file uploaded' });
        return;
    }

    try {
        const fileContent = fs.readFileSync(req.file.path, 'utf8');

        // Parse CSV
        const parsed = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true
        });

        if (parsed.errors.length > 0) {
            res.status(400).json({ status: 'error', message: 'CSV parsing errors', errors: parsed.errors });
            return;
        }

        const rows: any[] = parsed.data;
        const results = {
            inserted: 0,
            skipped: 0,
            errors: [] as string[]
        };

        // Process rows 
        // Note: For large files, stream processing or batch insert is better. 
        // For MVP (<1000 rows as per spec), loop is fine.
        for (const row of rows) {
            try {
                if (!row.name || !row.identity_number || !row.division) {
                    results.skipped++;
                    continue;
                }

                await EmployeeService.createEmployee({
                    name: row.name,
                    identity_number: row.identity_number,
                    division: row.division
                });
                results.inserted++;
            } catch (error: any) {
                if (error.message === 'IDENTITY_EXISTS') {
                    results.skipped++;
                } else {
                    results.errors.push(`Row ${row.identity_number}: ${error.message}`);
                    results.skipped++;
                }
            }
        }

        // Cleanup uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            status: 'success',
            message: 'Import completed',
            data: results
        });

    } catch (error: any) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
