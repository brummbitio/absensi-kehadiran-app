import { Router } from 'express';
import * as HolidayController from '../controllers/holiday.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin); // Holidays managed by Admin only

router.get('/', HolidayController.list);
router.post('/', HolidayController.create);
router.delete('/:id', HolidayController.remove);

export default router;
