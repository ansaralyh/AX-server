import Vehicle from '../models/vehicleModel';
import { ILocation } from '../types';
import { BaseError } from '../utils/baseError';

class VehicleService {
    async createVehicle(
        type: string,
        model: string,
        licensePlate: string,
        fuelCapacity: number
    ) {
        // Generate unique vehicle ID
        const vehicleId = `VEH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create vehicle
        const vehicle = await Vehicle.create({
            vehicleId,
            type,
            model,
            licensePlate,
            fuelCapacity,
            currentFuel: fuelCapacity, // Start with full tank
            status: 'available'
        });

        return vehicle;
    }

    async updateLocation(vehicleId: string, longitude: number, latitude: number) {
        const vehicle = await Vehicle.findOne({ vehicleId });
        if (!vehicle) {
            throw new BaseError('Vehicle not found', 404);
        }

        await vehicle.updateLocation(longitude, latitude);
        return vehicle;
    }

    async updateFuelLevel(vehicleId: string, fuelAmount: number) {
        const vehicle = await Vehicle.findOne({ vehicleId });
        if (!vehicle) {
            throw new BaseError('Vehicle not found', 404);
        }

        await vehicle.updateFuelLevel(fuelAmount);
        return vehicle;
    }

    async findNearbyVehicles(
        longitude: number,
        latitude: number,
        maxDistance: number = 5000 // 5km default
    ) {
        return Vehicle.findNearby(longitude, latitude, maxDistance);
    }

    async getAvailableVehicles(type?: string) {
        const query: any = { status: 'available' };
        if (type) {
            query.type = type;
        }
        return Vehicle.find(query);
    }

    async setVehicleStatus(
        vehicleId: string,
        status: 'available' | 'in-use' | 'maintenance'
    ) {
        const vehicle = await Vehicle.findOne({ vehicleId });
        if (!vehicle) {
            throw new BaseError('Vehicle not found', 404);
        }

        vehicle.status = status;
        await vehicle.save();
        return vehicle;
    }

    async getVehicleLocation(vehicleId: string): Promise<ILocation | null> {
        const vehicle = await Vehicle.findOne({ vehicleId });
        if (!vehicle) {
            throw new BaseError('Vehicle not found', 404);
        }

        return vehicle.currentLocation || null;
    }

    async getVehicleStats(vehicleId: string) {
        const vehicle = await Vehicle.findOne({ vehicleId });
        if (!vehicle) {
            throw new BaseError('Vehicle not found', 404);
        }

        return {
            status: vehicle.status,
            fuelLevel: {
                current: vehicle.currentFuel,
                capacity: vehicle.fuelCapacity,
                percentage: (vehicle.currentFuel / vehicle.fuelCapacity) * 100
            },
            lastMaintenance: vehicle.lastMaintenance,
            location: vehicle.currentLocation
        };
    }

    async searchVehicles(
        query: string,
        page: number = 1,
        limit: number = 10
    ) {
        const skip = (page - 1) * limit;

        const vehicles = await Vehicle.find({
            $or: [
                { vehicleId: { $regex: query, $options: 'i' } },
                { licensePlate: { $regex: query, $options: 'i' } },
                { type: { $regex: query, $options: 'i' } },
                { model: { $regex: query, $options: 'i' } }
            ]
        })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Vehicle.countDocuments({
            $or: [
                { vehicleId: { $regex: query, $options: 'i' } },
                { licensePlate: { $regex: query, $options: 'i' } },
                { type: { $regex: query, $options: 'i' } },
                { model: { $regex: query, $options: 'i' } }
            ]
        });

        return {
            vehicles,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async deleteVehicle(vehicleId: string) {
        const vehicle = await Vehicle.findOne({ vehicleId });
        if (!vehicle) {
            throw new BaseError('Vehicle not found', 404);
        }

        if (vehicle.status === 'in-use') {
            throw new BaseError('Cannot delete vehicle that is in use', 400);
        }

        await vehicle.deleteOne();
        return { message: 'Vehicle deleted successfully' };
    }
}

export default new VehicleService(); 