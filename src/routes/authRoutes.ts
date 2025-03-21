import express from 'express';
import authController from '../controllers/authController';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { authValidation } from '../validations/authValidation';

const router = express.Router();

// Public routes
router.post(
    '/admin/login',
    validateRequest(authValidation.login),
    authController.adminLogin
);

router.post(
    '/driver/login',
    validateRequest(authValidation.login),
    authController.driverLogin
);

// Protected routes
router.get(
    '/profile',
    isAuthenticated,
    authController.getProfile
);

// Admin only routes
router.post(
    '/create-default-admin',
    validateRequest(authValidation.createDefaultAdmin),
    authController.createDefaultAdmin
);

export default router; 