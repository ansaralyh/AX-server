import Trip, { ITrip, ILocation } from '../models/tripModel';
import Vehicle from '../models/vehicleModel';
import Shift from '../models/shiftModel';
import { BaseError } from '../utils/baseError';
import mongoose, { Types } from 'mongoose';
import { AppError } from '../utils/appError';

class TripService {
    async createTrip(
        driverId: string,
        vehicleId: string,
        startLocation: ILocation,
        endLocation: ILocation,
        route: ILocation[],
        startTime: Date,
        estimatedDistance: number,
        estimatedEarnings: number
    ) {
        // Check if driver has active shift
        const activeShift = await Shift.findOne({
            driverId,
            endTime: null,
            status: 'active'
        });
        if (!activeShift) {
            throw new BaseError('Driver must start a shift before starting a trip', 400);
        }

        // Check if vehicle is available
        const vehicle = await Vehicle.findById(vehicleId);
        if (!vehicle || vehicle.status !== 'available') {
            throw new BaseError('Vehicle is not available', 400);
        }

        // Generate unique trip ID
        const tripId = `TRIP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create trip
        const trip = await Trip.create({
            tripId,
            driverId,
            vehicleId,
            startLocation,
            endLocation,
            route,
            startTime,
            distance: estimatedDistance,
            earnings: estimatedEarnings,
            status: 'scheduled'
        });

        // Update vehicle status
        vehicle.status = 'in-use';
        await vehicle.save();

        return trip;
    }

    async startTrip(driverId: string, tripData: Partial<ITrip>): Promise<ITrip> {
        // Check if driver has an active shift
        const activeShift = await Shift.findOne({
            driverId,
            endTime: null,
            status: 'active'
        });

        if (!activeShift) {
            throw new AppError('No active shift found. Please start a shift before starting a trip.', 400);
        }

        // Check if driver already has an active trip
        const activeTrip = await Trip.findOne({
            driverId,
            status: 'active'
        });

        if (activeTrip) {
            throw new AppError('Driver already has an active trip', 400);
        }

        // Create new trip
        const trip = await Trip.create({
            ...tripData,
            driverId,
            startTime: new Date(),
            status: 'active'
        });

        return trip;
    }

    async completeTrip(tripId: string, completionData: {
        endLocation: ILocation;
        distance: number;
        fare: number;
    }): Promise<ITrip> {
        const trip = await Trip.findById(tripId);

        if (!trip) {
            throw new AppError('Trip not found', 404);
        }

        if (trip.status !== 'active') {
            throw new AppError('Trip is not active', 400);
        }

        // Update trip with completion data
        trip.endLocation = completionData.endLocation;
        trip.endTime = new Date();
        trip.distance = completionData.distance;
        trip.fare = completionData.fare;
        trip.status = 'completed';

        await trip.save();

        return trip;
    }

    async cancelTrip(tripId: string, reason: string): Promise<ITrip> {
        const trip = await Trip.findById(tripId);

        if (!trip) {
            throw new AppError('Trip not found', 404);
        }

        if (trip.status !== 'active') {
            throw new AppError('Trip is not active', 400);
        }

        trip.status = 'cancelled';
        trip.cancellationReason = reason;
        trip.endTime = new Date();
        await trip.save();

        return trip;
    }

    async getDriverTrips(
        driverId: string,
        startDate: Date,
        endDate: Date,
        page: number = 1,
        limit: number = 10
    ): Promise<{ trips: ITrip[]; total: number; page: number; totalPages: number }> {
        const query = {
            driverId,
            startTime: { $gte: startDate, $lte: endDate }
        };

        const total = await Trip.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const trips = await Trip.find(query)
            .sort({ startTime: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return {
            trips,
            total,
            page,
            totalPages
        };
    }

    async getDriverStats(
        driverId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalTrips: number;
        completedTrips: number;
        cancelledTrips: number;
        totalDistance: number;
        totalEarnings: number;
        averageRating: number;
    }> {
        const stats = await Trip.aggregate([
            {
                $match: {
                    driverId: new Types.ObjectId(driverId),
                    startTime: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTrips: { $sum: 1 },
                    completedTrips: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    },
                    cancelledTrips: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0]
                        }
                    },
                    totalDistance: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, '$distance', 0]
                        }
                    },
                    totalEarnings: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0]
                        }
                    },
                    totalRating: {
                        $sum: {
                            $cond: [{ $ne: ['$rating', null] }, '$rating', 0]
                        }
                    },
                    ratedTrips: {
                        $sum: {
                            $cond: [{ $ne: ['$rating', null] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        const defaultStats = {
            totalTrips: 0,
            completedTrips: 0,
            cancelledTrips: 0,
            totalDistance: 0,
            totalEarnings: 0,
            averageRating: 0
        };

        if (stats.length === 0) return defaultStats;

        const result = stats[0];
        return {
            ...result,
            averageRating: result.ratedTrips > 0 ? result.totalRating / result.ratedTrips : 0
        };
    }

    async rateTrip(tripId: string, rating: number, review?: string): Promise<ITrip> {
        if (rating < 1 || rating > 5) {
            throw new AppError('Rating must be between 1 and 5', 400);
        }

        const trip = await Trip.findById(tripId);

        if (!trip) {
            throw new AppError('Trip not found', 404);
        }

        if (trip.status !== 'completed') {
            throw new AppError('Only completed trips can be rated', 400);
        }

        if (trip.rating) {
            throw new AppError('Trip has already been rated', 400);
        }

        trip.rating = rating;
        if (review) trip.review = review;
        await trip.save();

        return trip;
    }
}

export default new TripService(); 