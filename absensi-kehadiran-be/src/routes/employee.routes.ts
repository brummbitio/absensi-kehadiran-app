import { Router } from 'express';
import * as EmployeeController from '../controllers/employee.controller';
import * as ImportController from '../controllers/employee.import.controller'; // Assuming separate file or re-export
import { authenticateToken } from '../middlewares/auth.middleware';
import multer from 'multer';

// Setup Multer for CSV Upload
const upload = multer({ dest: 'uploads/' });

const router = Router();

// Protect all employee routes
router.use(authenticateToken);

// CRUD
router.post('/', EmployeeController.create);
router.get('/', EmployeeController.getAll);
router.get('/:id', EmployeeController.getOne);
router.put('/:id', EmployeeController.update);
router.delete('/:id', EmployeeController.remove);

// QR
router.get('/:id/qr', EmployeeController.getQR);

// Import
router.post('/import', upload.single('file'), ImportController.importEmployees);

export default router;
