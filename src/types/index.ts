import { Types } from 'mongoose';

// Common interfaces for the application

// Geolocation types
export interface ILocation {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
}

// Vehicle types
export interface IVehicle {
    vehicleId: string;
    type: string;
    model: string;
    licensePlate: string;
    status: 'available' | 'in-use' | 'maintenance';
    currentLocation?: ILocation;
    lastMaintenance: Date;
    fuelCapacity: number;
    currentFuel: number;
}

// Trip types
export interface ITrip {
    tripId: string;
    driverId: Types.ObjectId;
    vehicleId: Types.ObjectId;
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    startLocation: ILocation;
    endLocation: ILocation;
    startTime: Date;
    endTime?: Date;
    distance: number;
    route: ILocation[];
    rating?: number;
    feedback?: string;
    fuelUsed?: number;
    earnings: number;
}

// Shift types
export interface IShift {
    shiftId: string;
    driverId: Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'completed' | 'cancelled';
    breaks: IBreak[];
    totalDistance: number;
    totalTrips: number;
    earnings: number;
}

export interface IBreak {
    startTime: Date;
    endTime?: Date;
    type: 'rest' | 'lunch' | 'other';
    duration: number; // in minutes
}

// Performance types
export interface IPerformanceMetrics {
    totalTrips: number;
    averageRating: number;
    totalDistance: number;
    onTimePerformance: number;
    fuelEfficiency: number;
    totalEarnings: number;
    safetyScore: number;
}

// Route types
export interface IRoute {
    routeId: string;
    waypoints: ILocation[];
    estimatedDistance: number;
    estimatedDuration: number;
    trafficConditions: 'light' | 'moderate' | 'heavy';
    restrictions?: string[];
}

// Maintenance types
export interface IMaintenance {
    maintenanceId: string;
    vehicleId: Types.ObjectId;
    type: 'scheduled' | 'repair' | 'emergency';
    description: string;
    date: Date;
    cost: number;
    status: 'pending' | 'in-progress' | 'completed';
    notes?: string;
} 