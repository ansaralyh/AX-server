import express, { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import driverRoutes from './driverRoutes';
import shiftRoutes from './shiftRoutes';

const router: Router = express.Router();

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);
router.use('/shifts', shiftRoutes);

export default router;