import { Request, Response, NextFunction } from 'express';
import { BaseController } from './baseController';
import shiftService from '../services/shiftService';
import { AppError } from '../utils/appError';

class ShiftController extends BaseController {
    async startShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.driverId) {
                throw new AppError('Driver ID not found', 400);
            }
            const shift = await shiftService.startShift(req.user.driverId);
            this.sendResponse(res, 201, true, 'Shift started successfully', shift);
        } catch (error) {
            next(error);
        }
    }

    async endShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { shiftId } = req.params;
            const shift = await shiftService.endShift(shiftId);
            this.sendResponse(res, 200, true, 'Shift ended successfully', shift);
        } catch (error) {
            next(error);
        }
    }

    async startBreak(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { shiftId } = req.params;
            const { type } = req.body;
            const shift = await shiftService.startBreak(shiftId, type);
            this.sendResponse(res, 200, true, 'Break started successfully', shift);
        } catch (error) {
            next(error);
        }
    }

    async endBreak(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { shiftId } = req.params;
            const shift = await shiftService.endBreak(shiftId);
            this.sendResponse(res, 200, true, 'Break ended successfully', shift);
        } catch (error) {
            next(error);
        }
    }

    async getActiveShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.driverId) {
                throw new AppError('Driver ID not found', 400);
            }
            const shift = await shiftService.getActiveShift(req.user.driverId);
            this.sendResponse(res, 200, true, 'Active shift retrieved successfully', shift);
        } catch (error) {
            next(error);
        }
    }

    async getShiftHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.driverId) {
                throw new AppError('Driver ID not found', 400);
            }

            const { startDate, endDate, page, limit } = req.query;

            // Validate dates
            const parsedStartDate = new Date(startDate as string);
            const parsedEndDate = new Date(endDate as string);

            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                throw new AppError('Invalid date format', 400);
            }

            // Validate pagination parameters
            const parsedPage = page ? parseInt(page as string) : undefined;
            const parsedLimit = limit ? parseInt(limit as string) : undefined;

            if (page && isNaN(parsedPage as number)) {
                throw new AppError('Invalid page number', 400);
            }

            if (limit && isNaN(parsedLimit as number)) {
                throw new AppError('Invalid limit number', 400);
            }

            const history = await shiftService.getShiftHistory(
                req.user.driverId,
                parsedStartDate,
                parsedEndDate,
                parsedPage,
                parsedLimit
            );

            this.sendResponse(res, 200, true, 'Shift history retrieved successfully', history);
        } catch (error) {
            next(error);
        }
    }

    async getShiftStats(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.driverId) {
                throw new AppError('Driver ID not found', 400);
            }

            const { startDate, endDate } = req.query;

            // Validate dates
            const parsedStartDate = new Date(startDate as string);
            const parsedEndDate = new Date(endDate as string);

            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                throw new AppError('Invalid date format', 400);
            }

            const stats = await shiftService.getShiftStats(
                req.user.driverId,
                parsedStartDate,
                parsedEndDate
            );

            this.sendResponse(res, 200, true, 'Shift stats retrieved successfully', stats);
        } catch (error) {
            next(error);
        }
    }

    async getCurrentBreakStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { shiftId } = req.params;
            const status = await shiftService.getCurrentBreakStatus(shiftId);
            this.sendResponse(res, 200, true, 'Break status retrieved successfully', status);
        } catch (error) {
            next(error);
        }
    }

    async cancelShift(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { shiftId } = req.params;
            const { reason } = req.body;
            const shift = await shiftService.cancelShift(shiftId, reason);
            this.sendResponse(res, 200, true, 'Shift cancelled successfully', shift);
        } catch (error) {
            next(error);
        }
    }
}

export default new ShiftController(); 