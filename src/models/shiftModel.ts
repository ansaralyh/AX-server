import { Schema, model, Document, Types } from 'mongoose';

type BreakType = 'rest' | 'lunch' | 'other';

interface IBreak {
    type: BreakType;
    startTime: Date;
    endTime?: Date;
}

export interface IShift extends Document {
    driverId: Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'completed' | 'cancelled';
    breaks: IBreak[];
    currentBreak: IBreak | null;
    cancellationReason?: string;
    totalBreakTime?: number;
    createdAt: Date;
    updatedAt: Date;
}

const breakSchema = new Schema({
    type: {
        type: String,
        enum: ['rest', 'lunch', 'other'],
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date
    }
}, { _id: false });

const shiftSchema = new Schema({
    driverId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
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

}, {
    timestamps: true
});

// Indexes for efficient querying
shiftSchema.index({ driverId: 1, startTime: -1 });
shiftSchema.index({ driverId: 1, status: 1 });

// Calculate total break time before saving
shiftSchema.pre<IShift>('save', function(next) {
    if (this.breaks && this.breaks.length > 0) {
        this.totalBreakTime = this.breaks.reduce((total: number, breakPeriod: IBreak) => {
            if (breakPeriod.endTime) {
                return total + (breakPeriod.endTime.getTime() - breakPeriod.startTime.getTime()) / (1000 * 60); // Convert to minutes
            }
            return total;
        }, 0);
    }
    next();
});

const Shift = model<IShift>('Shift', shiftSchema);

export default Shift; 