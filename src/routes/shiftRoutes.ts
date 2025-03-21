import { Router } from 'express';
import shiftController from '../controllers/shiftController';
import { validateRequest } from '../middleware/validateRequest';
import shiftValidation from '../validations/shiftValidation';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import { RequestHandler } from 'express';

const router = Router();

// Apply authentication middleware to all routes
router.use(isAuthenticated as RequestHandler);

// Driver shift management
router.post(
    '/start',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.startShift),
    shiftController.startShift
);

router.put(
    '/:shiftId/end',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.endShift),
    shiftController.endShift
);

router.post(
    '/:shiftId/break/start',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.startBreak),
    shiftController.startBreak
);

router.put(
    '/:shiftId/break/end',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.endBreak),
    shiftController.endBreak
);

router.get(
    '/active',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.getActiveShift),
    shiftController.getActiveShift
);

router.get(
    '/history',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.getShiftHistory),
    shiftController.getShiftHistory
);

router.get(
    '/stats',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.getShiftStats),
    shiftController.getShiftStats
);

router.get(
    '/:shiftId/break/status',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.getCurrentBreakStatus),
    shiftController.getCurrentBreakStatus
);

router.put(
    '/:shiftId/cancel',
    authorizeRoles('driver') as RequestHandler,
    validateRequest(shiftValidation.cancelShift),
    shiftController.cancelShift
);

export default router; 