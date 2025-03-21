import mongoose, { Schema, Document, Model } from 'mongoose';
import { IVehicle, ILocation } from '../types';

export interface IVehicleDocument extends Omit<Document, 'model'>, IVehicle {
    updateLocation(longitude: number, latitude: number): Promise<void>;
    updateFuelLevel(fuelAmount: number): Promise<void>;
}

interface IVehicleModel extends Model<IVehicleDocument> {
    findAvailable(): Promise<IVehicleDocument[]>;
    findNearby(longitude: number, latitude: number, maxDistance?: number): Promise<IVehicleDocument[]>;
}

const locationSchema = new Schema<ILocation>({
    type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
    },
    coordinates: {
        type: [Number],
        required: true,
        validate: {
            validator: (coords: number[]) => coords.length === 2,
            message: 'Coordinates must be [longitude, latitude]'
        }
    }
});

const vehicleSchema = new Schema<IVehicleDocument>({
    vehicleId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    licensePlate: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['available', 'in-use', 'maintenance'],
        default: 'available'
    },
    currentLocation: {
        type: locationSchema,
        required: false
    },
    lastMaintenance: {
        type: Date,
        required: true,
        default: Date.now
    },
    fuelCapacity: {
        type: Number,
        required: true
    },
    currentFuel: {
        type: Number,
        required: true,
        validate: {
            validator: function(this: IVehicleDocument, fuel: number) {
                return fuel <= this.fuelCapacity;
            },
            message: 'Current fuel cannot exceed fuel capacity'
        }
    }
}, {
    timestamps: true
});

// Index for geospatial queries
vehicleSchema.index({ currentLocation: '2dsphere' });

// Methods
vehicleSchema.methods.updateLocation = async function(
    longitude: number,
    latitude: number
): Promise<void> {
    this.currentLocation = {
        type: 'Point',
        coordinates: [longitude, latitude]
    };
    await this.save();
};

vehicleSchema.methods.updateFuelLevel = async function(
    fuelAmount: number
): Promise<void> {
    if (fuelAmount > this.fuelCapacity) {
        throw new Error('Fuel amount cannot exceed capacity');
    }
    this.currentFuel = fuelAmount;
    await this.save();
};

// Statics
vehicleSchema.statics.findAvailable = function() {
    return this.find({ status: 'available' });
};

vehicleSchema.statics.findNearby = function(
    longitude: number,
    latitude: number,
    maxDistance: number = 5000 // 5km default
) {
    return this.find({
        currentLocation: {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: maxDistance
            }
        },
        status: 'available'
    });
};

const Vehicle = mongoose.model<IVehicleDocument, IVehicleModel>('Vehicle', vehicleSchema);

export default Vehicle; 