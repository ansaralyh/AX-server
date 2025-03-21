import { Request, Response, NextFunction } from 'express';
import { BaseController } from './baseController';
import tripService from '../services/tripService';
import { AppError } from '../utils/appError';

class TripController extends BaseController {
    async createTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { driverId } = req.user;
            const {
                vehicleId,
                startLocation,
                endLocation,
                route,
                startTime,
                estimatedDistance,
                estimatedEarnings
            } = req.body;

            const trip = await tripService.createTrip(
                driverId,
                vehicleId,
                startLocation,
                endLocation,
                route,
                new Date(startTime),
                estimatedDistance,
                estimatedEarnings
            );

            this.sendResponse(res, 201, true, 'Trip created successfully', trip);
        } catch (error) {
            next(error);
        }
    }

    async startTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.driverId) {
                throw new AppError('Driver ID not found', 400);
            }

            const trip = await tripService.startTrip(req.user.driverId, req.body);
            this.sendResponse(res, 201, true, 'Trip started successfully', trip);
        } catch (error) {
            next(error);
        }
    }

    async completeTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { tripId } = req.params;
            const { endLocation, distance, fare } = req.body;

            const trip = await tripService.completeTrip(tripId, {
                endLocation,
                distance,
                fare
            });

            this.sendResponse(res, 200, true, 'Trip completed successfully', trip);
        } catch (error) {
            next(error);
        }
    }

    async cancelTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { tripId } = req.params;
            const { reason } = req.body;

            const trip = await tripService.cancelTrip(tripId, reason);
            this.sendResponse(res, 200, true, 'Trip cancelled successfully', trip);
        } catch (error) {
            next(error);
        }
    }

    async getDriverTrips(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            const trips = await tripService.getDriverTrips(
                req.user.driverId,
                parsedStartDate,
                parsedEndDate,
                parsedPage,
                parsedLimit
            );

            this.sendResponse(res, 200, true, 'Driver trips retrieved successfully', trips);
        } catch (error) {
            next(error);
        }
    }

    async getDriverStats(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            const stats = await tripService.getDriverStats(
                req.user.driverId,
                parsedStartDate,
                parsedEndDate
            );

            this.sendResponse(res, 200, true, 'Driver stats retrieved successfully', stats);
        } catch (error) {
            next(error);
        }
    }

    async rateTrip(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { tripId } = req.params;
            const { rating, review } = req.body;

            const trip = await tripService.rateTrip(tripId, rating, review);
            this.sendResponse(res, 200, true, 'Trip rated successfully', trip);
        } catch (error) {
            next(error);
        }
    }
}

export default new TripController(); 