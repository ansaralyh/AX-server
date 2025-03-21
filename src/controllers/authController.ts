import { Request, Response, NextFunction } from 'express';
import { BaseController } from './baseController';
import User from '../models/userModel';
import Driver from '../models/driverModel';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';

class AuthController extends BaseController {
    async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                this.sendError(res, 401, 'Invalid credentials');
                return;
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                this.sendError(res, 401, 'Invalid credentials');
                return;
            }

            const token = jwt.sign(
                { id: user._id, role: user.role },
                config.jwtSecret,
                { expiresIn: '24h' }
            );

            this.sendResponse(res, 200, true, 'Login successful', {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async driverLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            const driver = await Driver.findOne({ 
                emailAddress: email,
                'applicationStatus.isApproved': true 
            }).select('+password');

            if (!driver || !driver.password) {
                this.sendError(res, 401, 'Invalid credentials or application not approved');
                return;
            }

            const isPasswordValid = await bcrypt.compare(password, driver.password);
            if (!isPasswordValid) {
                this.sendError(res, 401, 'Invalid credentials');
                return;
            }

            const token = jwt.sign(
                { id: driver._id, role: 'driver' },
                config.jwtSecret,
                { expiresIn: '24h' }
            );

            this.sendResponse(res, 200, true, 'Login successful', {
                token,
                driver: {
                    id: driver._id,
                    email: driver.emailAddress,
                    fullName: driver.fullName,
                    role: 'driver'
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            let user;
            
            if (req.user.role === 'driver') {
                user = await Driver.findById(req.user.id).select('-password');
            } else {
                user = await User.findById(req.user.id).select('-password');
            }

            if (!user) {
                this.sendError(res, 404, 'User not found');
                return;
            }

            this.sendResponse(res, 200, true, 'Profile retrieved successfully', user);
        } catch (error) {
            next(error);
        }
    }

    async createDefaultAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { secretKey } = req.body;

            if (secretKey !== config.setupSecretKey) {
                this.sendError(res, 403, 'Invalid setup secret key');
                return;
            }

            const existingAdmin = await User.findOne({ role: 'super-admin' });
            if (existingAdmin) {
                this.sendError(res, 400, 'Default admin already exists');
                return;
            }

            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await User.create({
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'super-admin',
                firstName: 'Admin',
                lastName: 'User'
            });

            this.sendResponse(res, 201, true, 'Default admin created successfully', {
                id: admin._id,
                email: admin.email,
                role: admin.role
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController(); 