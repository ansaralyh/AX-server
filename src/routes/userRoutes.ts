import express, { RequestHandler } from 'express';
import userController from '../controllers/userController';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validateRequest';
import { userValidation } from '../validations/userValidation';

const router = express.Router();

// Protected routes - Admin only
router.post(
    '/',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    validateRequest(userValidation.createUser) as RequestHandler,
    userController.createUser as RequestHandler
);

router.put(
    '/:id',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    validateRequest(userValidation.updateUser) as RequestHandler,
    userController.updateUser as RequestHandler
);

router.delete(
    '/:id',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    userController.deleteUser as RequestHandler
);

router.get(
    '/',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    userController.getAllUsers as RequestHandler
);

router.get(
    '/:id',
    isAuthenticated as RequestHandler,
    authorizeRoles('admin', 'super-admin') as RequestHandler,
    userController.getUserById as RequestHandler
);

// Password management routes
router.post(
    '/change-password',
    isAuthenticated as RequestHandler,
    validateRequest(userValidation.changePassword) as RequestHandler,
    userController.changePassword as RequestHandler
);

router.post(
    '/forgot-password',
    validateRequest(userValidation.forgotPassword) as RequestHandler,
    userController.forgotPassword as RequestHandler
);

router.post(
    '/reset-password/:token',
    validateRequest(userValidation.resetPassword) as RequestHandler,
    userController.resetPassword as RequestHandler
);

export default router;