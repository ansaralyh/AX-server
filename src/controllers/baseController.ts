import { Request, Response } from 'express';

export class BaseController {
    protected sendResponse(res: Response, statusCode: number, success: boolean, message: string, data?: any): void {
        res.status(statusCode).json({
            success,
            message,
            data
        });
    }

    protected sendError(res: Response, statusCode: number, message: string, errors?: any): void {
        res.status(statusCode).json({
            success: false,
            message,
            errors
        });
    }
} 