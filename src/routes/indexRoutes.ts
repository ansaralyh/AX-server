import express, { Router } from 'express';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import driverRoutes from './driverRoutes';

const router: Router = express.Router();

router.use('/user', userRoutes);
router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);

export default router;