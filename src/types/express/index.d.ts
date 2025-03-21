import { Types } from 'mongoose';

declare global {
    namespace Express {
        interface User {
            _id: Types.ObjectId;
            driverId: string;
            role: string;
        }
    }
} 