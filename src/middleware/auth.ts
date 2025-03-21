import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import { BaseError } from '../utils/baseError';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

// Verify JWT token
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new BaseError('Please login to access this resource', 401);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            throw new BaseError('User not found', 401);
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Authorize roles
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new BaseError('Please login to access this resource', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new BaseError(`Role (${req.user.role}) is not allowed to access this resource`, 403));
        }

        next();
    };
}; 