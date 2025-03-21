import { Types } from 'mongoose';
import Shift, { IShift } from '../models/shiftModel';
import { AppError } from '../utils/appError';
import { BreakType } from '../types/shift';

class ShiftService {
    async startShift(driverId: string): Promise<IShift> {
        // Check if driver already has an active shift
        const activeShift = await Shift.findOne({
            driverId,
            endTime: null,
            status: 'active'
        });

        if (activeShift) {
            throw new AppError('Driver already has an active shift', 400);
        }

        // Create new shift
        const shift = await Shift.create({
            driverId,
            startTime: new Date(),
            status: 'active'
        });

        return shift;
    }

    async endShift(shiftId: string): Promise<IShift> {
        const shift = await Shift.findById(shiftId);

        if (!shift) {
            throw new AppError('Shift not found', 404);
        }

        if (shift.status !== 'active') {
            throw new AppError('Shift is not active', 400);
        }

        if (shift.currentBreak) {
            throw new AppError('Cannot end shift while on break', 400);
        }

        shift.endTime = new Date();
        shift.status = 'completed';
        await shift.save();

        return shift;
    }

    async startBreak(shiftId: string, type: BreakType): Promise<IShift> {
        const shift = await Shift.findById(shiftId);

        if (!shift) {
            throw new AppError('Shift not found', 404);
        }

        if (shift.status !== 'active') {
            throw new AppError('Shift is not active', 400);
        }

        if (shift.currentBreak) {
            throw new AppError('Already on break', 400);
        }

        shift.currentBreak = {
            type,
            startTime: new Date()
        };

        shift.breaks.push(shift.currentBreak);
        await shift.save();

        return shift;
    }

    async endBreak(shiftId: string): Promise<IShift> {
        const shift = await Shift.findById(shiftId);

        if (!shift) {
            throw new AppError('Shift not found', 404);
        }

        if (!shift.currentBreak) {
            throw new AppError('No active break found', 400);
        }

        const currentBreakIndex = shift.breaks.findIndex(
            (b) => !b.endTime && b.type === shift.currentBreak?.type
        );

        if (currentBreakIndex === -1) {
            throw new AppError('Break record not found', 500);
        }

        shift.breaks[currentBreakIndex].endTime = new Date();
        shift.currentBreak = null;
        await shift.save();

        return shift;
    }

    async getActiveShift(driverId: string): Promise<IShift | null> {
        return Shift.findOne({
            driverId,
            endTime: null,
            status: 'active'
        });
    }

    async getShiftHistory(
        driverId: string,
        startDate: Date,
        endDate: Date,
        page: number = 1,
        limit: number = 10
    ): Promise<{ shifts: IShift[]; total: number; page: number; totalPages: number }> {
        const query = {
            driverId,
            startTime: { $gte: startDate, $lte: endDate }
        };

        const total = await Shift.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        const shifts = await Shift.find(query)
            .sort({ startTime: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return {
            shifts,
            total,
            page,
            totalPages
        };
    }

    async getShiftStats(
        driverId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        totalShifts: number;
        totalHours: number;
        averageShiftDuration: number;
        totalBreakTime: number;
    }> {
        const shifts = await Shift.find({
            driverId,
            startTime: { $gte: startDate, $lte: endDate },
            status: { $in: ['completed', 'cancelled'] }
        });

        let totalHours = 0;
        let totalBreakTime = 0;

        shifts.forEach((shift) => {
            if (shift.endTime) {
                const shiftDuration = shift.endTime.getTime() - shift.startTime.getTime();
                totalHours += shiftDuration;

                shift.breaks.forEach((breakPeriod) => {
                    if (breakPeriod.endTime) {
                        totalBreakTime += breakPeriod.endTime.getTime() - breakPeriod.startTime.getTime();
                    }
                });
            }
        });

        // Convert to hours
        totalHours = totalHours / (1000 * 60 * 60);
        const averageShiftDuration = shifts.length > 0 ? totalHours / shifts.length : 0;
        totalBreakTime = totalBreakTime / (1000 * 60 * 60);

        return {
            totalShifts: shifts.length,
            totalHours,
            averageShiftDuration,
            totalBreakTime
        };
    }

    async getCurrentBreakStatus(shiftId: string): Promise<{
        isOnBreak: boolean;
        currentBreak: IShift['currentBreak'];
        breakHistory: IShift['breaks'];
    }> {
        const shift = await Shift.findById(shiftId);

        if (!shift) {
            throw new AppError('Shift not found', 404);
        }

        return {
            isOnBreak: !!shift.currentBreak,
            currentBreak: shift.currentBreak,
            breakHistory: shift.breaks
        };
    }

    async cancelShift(shiftId: string, reason: string): Promise<IShift> {
        const shift = await Shift.findById(shiftId);

        if (!shift) {
            throw new AppError('Shift not found', 404);
        }

        if (shift.status !== 'active') {
            throw new AppError('Only active shifts can be cancelled', 400);
        }

        shift.status = 'cancelled';
        shift.endTime = new Date();
        shift.cancellationReason = reason;
        await shift.save();

        return shift;
    }
}

export default new ShiftService(); 