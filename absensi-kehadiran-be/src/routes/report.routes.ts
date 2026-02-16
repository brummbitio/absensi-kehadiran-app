import { Router } from 'express';
import * as ReportController from '../controllers/report.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken); // Reports accessible by auth users (maybe all?)
// Assuming all auth users can see reports, or limit to admin?
// User prompt didn't specify strict Admin for reports, but typically it is.
// I'll keep it open to Auth Users for now, or add requireAdmin if "Basic Reporting" implies Admin.
// "Admin protected holiday management" was specified. Reporting wasn't explicitly restricted.

router.get('/monthly', ReportController.getMonthlyRecap);

export default router;
