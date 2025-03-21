import { Schema, model, Document, Types } from 'mongoose';

export interface ILocation {
    type: 'Point';
    coordinates: [number, number];
}

export interface ITrip extends Document {
    driverId: Types.ObjectId;
    startLocation: ILocation;
    endLocation?: ILocation;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'completed' | 'cancelled';
    distance?: number;
    fare?: number;
    rating?: number;
    review?: string;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const locationSchema = new Schema<ILocation>({
    type: {
        type: String,
        enum: ['Point'],
        required: true
    },
    coordinates: {
        type: [Number],
        required: true,
        validate: {
            validator: (coordinates: number[]) => coordinates.length === 2 &&
                coordinates[0] >= -180 && coordinates[0] <= 180 &&
                coordinates[1] >= -90 && coordinates[1] <= 90,
            message: 'Invalid coordinates. Must be [longitude, latitude] within valid ranges.'
        }
    }
}, { _id: false });

const tripSchema = new Schema<ITrip>({
    driverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    startLocation: {
        type: locationSchema,
        required: true
    },
    endLocation: {
        type: locationSchema
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active',
        required: true,
        index: true
    },
    distance: {
        type: Number,
        min: 0
    },
    fare: {
        type: Number,
        min: 0
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        maxlength: 500
    },
    cancellationReason: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
tripSchema.index({ driverId: 1, startTime: -1 });
tripSchema.index({ status: 1 });
tripSchema.index({ startLocation: '2dsphere' });
tripSchema.index({ endLocation: '2dsphere' });

const Trip = model<ITrip>('Trip', tripSchema);

export default Trip; 