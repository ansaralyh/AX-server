import { z } from 'zod';

export const authValidation = {
    login: z.object({
        body: z.object({
            email: z.string().email('Invalid email address'),
            password: z.string().min(6, 'Password must be at least 6 characters long')
        })
    }),

    createDefaultAdmin: z.object({
        body: z.object({
            secretKey: z.string().min(1, 'Setup secret key is required')
        })
    })
}; 