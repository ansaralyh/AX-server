import { Request, Response, NextFunction } from 'express';
import { BaseController } from './baseController';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';
import { config } from '../config';

class UserController extends BaseController {
    async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { firstName, lastName, email, password, role, phoneNumber } = req.body;

            const existingUser = await User.findOne({ email });
            if (existingUser) {
                this.sendError(res, 400, 'User with this email already exists');
                return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
                phoneNumber
            });

            this.sendResponse(res, 201, true, 'User created successfully', {
                id: user._id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            });
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;
            const updateData = req.body;

            const user = await User.findById(id);
            if (!user) {
                this.sendError(res, 404, 'User not found');
                return;
            }

            if (updateData.email && updateData.email !== user.email) {
                const existingUser = await User.findOne({ email: updateData.email });
                if (existingUser) {
                    this.sendError(res, 400, 'Email already in use');
                    return;
                }
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                this.sendError(res, 404, 'User not found');
                return;
            }

            this.sendResponse(res, 200, true, 'User updated successfully', {
                id: updatedUser._id,
                email: updatedUser.email,
                role: updatedUser.role,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                this.sendError(res, 404, 'User not found');
                return;
            }

            await User.findByIdAndDelete(id);

            this.sendResponse(res, 200, true, 'User deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const users = await User.find().select('-password');

            this.sendResponse(res, 200, true, 'Users retrieved successfully', users);
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { id } = req.params;

            const user = await User.findById(id).select('-password');
            if (!user) {
                this.sendError(res, 404, 'User not found');
                return;
            }

            this.sendResponse(res, 200, true, 'User retrieved successfully', user);
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user.id;

            const user = await User.findById(userId);
            if (!user) {
                this.sendError(res, 404, 'User not found');
                return;
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                this.sendError(res, 401, 'Current password is incorrect');
                return;
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
            await user.save();

            this.sendResponse(res, 200, true, 'Password changed successfully');
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                this.sendError(res, 404, 'User not found');
                return;
            }

            // Generate reset token
            const resetToken = user.getResetPasswordToken();
            await user.save();

            // TODO: Send reset email with token
            // For now, just return the token in the response
            this.sendResponse(res, 200, true, 'Password reset token generated', {
                resetToken
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { token } = req.params;
            const { password } = req.body;

            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpire: { $gt: Date.now() }
            });

            if (!user) {
                this.sendError(res, 400, 'Invalid or expired reset token');
                return;
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            this.sendResponse(res, 200, true, 'Password reset successfully');
        } catch (error) {
            next(error);
        }
    }
}

export default new UserController();