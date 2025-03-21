import express, { RequestHandler } from 'express';
import driverController from '../controllers/driverController';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { driverValidation } from '../validations/driverValidation';

const router = express.Router();

// Public routes
router.post(
    '/apply',
    validateRequest(driverValidation.createApplication) as RequestHandler,
    driverController.createApplication as RequestHandler
);

// Protected routes - Admin only
router.get(
    '/',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    driverController.getAllApplications as RequestHandler
);

router.get(
    '/search',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    driverController.searchDrivers as RequestHandler
);

router.get(
    '/:id',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    driverController.getApplicationById as RequestHandler
);

router.put(
    '/:id',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    validateRequest(driverValidation.updateApplication) as RequestHandler,
    driverController.updateApplication as RequestHandler
);

router.put(
    '/:id/status',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    validateRequest(driverValidation.updateStatus) as RequestHandler,
    driverController.updateApplicationStatus as RequestHandler
);

router.put(
    '/:id/approve',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    validateRequest(driverValidation.approveApplication) as RequestHandler,
    driverController.approveApplication as RequestHandler
);

router.put(
    '/:id/reject',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    validateRequest(driverValidation.rejectApplication) as RequestHandler,
    driverController.rejectApplication as RequestHandler
);

router.delete(
    '/:id',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    driverController.deleteApplication as RequestHandler
);

export default router; 