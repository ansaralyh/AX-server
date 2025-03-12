import {z} from'zod';

// store
export const createUser = z.object ({
    name:z.string(),
    email: z.string(),
    password: z.string(),
    role:z.string()
})