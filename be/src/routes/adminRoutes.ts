import express from 'express';
import AdminController from '../controllers/AdminController';
import { authenticate, authorizeRoles } from '../middlewares/auth';
import {
  validateCreateStaff,
  validateScreenCreate,
  validateSeatBulkCreate,
  validateUserRoleUpdate,
  validateUserStatusUpdate,
  validationHandler,
} from '../middlewares/validators';
import { USER_ROLES } from '../utils/constants';

const router = express.Router();

router.use(authenticate, authorizeRoles(USER_ROLES.ADMIN));

router.get('/dashboard', AdminController.getDashboard);
router.get('/finance', AdminController.getFinance);
router.get('/users', AdminController.listUsers);
router.post('/staff', validateCreateStaff, validationHandler, AdminController.createStaff);
router.patch('/users/:id/role', validateUserRoleUpdate, validationHandler, AdminController.updateUserRole);
router.patch('/users/:id/status', validateUserStatusUpdate, validationHandler, AdminController.updateUserStatus);
router.post('/cinemas/:cinemaId/screens', validateScreenCreate, validationHandler, AdminController.createScreen);
router.get('/screens/:screenId/seats', AdminController.getScreenSeats);
router.post(
  '/screens/:screenId/seats/bulk',
  validateSeatBulkCreate,
  validationHandler,
  AdminController.createSeatsBulk
);

export default router;
