import { z } from 'zod';

export const userValidation = {
    createUser: z.object({
        body: z.object({
            firstName: z.string().min(1, 'First name is required'),
            lastName: z.string().min(1, 'Last name is required'),
            email: z.string().email('Invalid email address'),
            password: z.string().min(6, 'Password must be at least 6 characters long'),
            role: z.enum(['admin', 'super-admin']).optional(),
            phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').optional()
        })
    }),

    updateUser: z.object({
        params: z.object({
            id: z.string().min(1, 'User ID is required')
        }),
        body: z.object({
            firstName: z.string().min(1, 'First name is required').optional(),
            lastName: z.string().min(1, 'Last name is required').optional(),
            email: z.string().email('Invalid email address').optional(),
            phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').optional(),
            role: z.enum(['admin', 'super-admin']).optional()
        })
    }),

    changePassword: z.object({
        body: z.object({
            currentPassword: z.string().min(6, 'Current password is required'),
            newPassword: z.string().min(6, 'New password must be at least 6 characters long')
        })
    }),

    forgotPassword: z.object({
        body: z.object({
            email: z.string().email('Invalid email address')
        })
    }),

    resetPassword: z.object({
        params: z.object({
            token: z.string().min(1, 'Reset token is required')
        }),
        body: z.object({
            password: z.string().min(6, 'Password must be at least 6 characters long')
        })
    })
}; 