import { Request, Response, NextFunction } from 'express';
import { BaseController } from './baseController';
import User from '../models/userModel';
import Driver from '../models/driverModel';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { BaseError } from '../utils/baseError';

class AuthController extends BaseController {
    constructor() {
        super();
        // Bind methods to ensure 'this' context
        this.adminLogin = this.adminLogin.bind(this);
        this.driverLogin = this.driverLogin.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.createDefaultAdmin = this.createDefaultAdmin.bind(this);
    }

    async adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;
            
            // console.log('Login attempt for email:', email);

            const user = await User.findOne({ email }).select('+password');
            if (!user) {
                console.log('User not found');
                this.sendError(res, 401, 'Invalid credentials');
                return;
            }

            console.log('User found:', {
                id: user._id,
                email: user.email,
                role: user.role
            });

            const isPasswordValid = await user.comparePassword(password);
            console.log('Password valid:', isPasswordValid);

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
            console.error('Login error:', error);
            next(error);
        }
    }

    async driverLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body;

            // Find driver by email
            const driver = await Driver.findOne({ email });
            if (!driver) {
                throw new BaseError('Invalid credentials', 401);
            }

            // Check if driver is approved
            if (driver.applicationStatus !== 'approved') {
                throw new BaseError('Your application is not yet approved', 403);
            }

            // Find associated user account
            const user = await User.findOne({ email });
            if (!user) {
                throw new BaseError('User account not found', 401);
            }

            // Verify password
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                throw new BaseError('Invalid credentials', 401);
            }

            // Generate JWT token
            const token = jwt.sign(
                { id: driver._id, role: 'driver' },
                config.jwtSecret,
                { expiresIn: '7d' }
            );

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(200).json({
                success: true,
                token,
                driver: {
                    _id: driver._id,
                    name: driver.name,
                    email: driver.email,
                    phone: driver.phone,
                    applicationStatus: driver.applicationStatus
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
            
            // Debug logging
            console.log('Received secretKey:', secretKey);
            console.log('Config setupSecretKey:', config.setupSecretKey);

            if (secretKey !== config.setupSecretKey) {
                this.sendError(res, 403, 'Invalid setup secret key');
                return;
            }

            // First, delete any existing admin
            await User.deleteMany({ role: 'super-admin' });

            // Create new admin with known password
            const password = 'admin123';
            console.log('Creating admin with password:', password);

            const admin = await User.create({
                email: 'admin@example.com',
                password: password,  // Let the schema middleware hash it
                role: 'super-admin',
                firstName: 'Admin',
                lastName: 'User'
            });

            console.log('Admin created successfully:', {
                id: admin._id,
                email: admin.email,
                role: admin.role
            });

            this.sendResponse(res, 201, true, 'Default admin created successfully', {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                message: 'Use password: admin123 to login'
            });
        } catch (error) {
            console.error('Error in createDefaultAdmin:', error);
            next(error);
        }
    }

    async adminLogout(req: Request, res: Response): Promise<void> {
        try {
            res.clearCookie('token', {
                httpOnly: true,
                secure: false, // change to true in production
                sameSite: 'lax',
            });
    
            res.status(200).json({
                message: 'Logout successful',
            });
        } catch (error) {
            console.error("Logout error:", error);
            res.status(500).json({
                message: 'Internal server error',
            });
        }
    }
    
    
}

export default new AuthController(); 