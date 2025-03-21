export type BreakType = 'rest' | 'lunch' | 'other';

export interface ShiftStats {
    totalShifts: number;
    totalHours: number;
    averageShiftDuration: number;
    totalBreakTime: number;
}

export interface BreakStatus {
    isOnBreak: boolean;
    currentBreak: {
        type: BreakType;
        startTime: Date;
        endTime?: Date;
    } | null;
    breakHistory: {
        type: BreakType;
        startTime: Date;
        endTime?: Date;
    }[];
}

export interface ShiftHistoryResponse {
    shifts: {
        _id: string;
        driverId: string;
        startTime: Date;
        endTime?: Date;
        status: 'active' | 'completed' | 'cancelled';
        breaks: {
            type: BreakType;
            startTime: Date;
            endTime?: Date;
        }[];
        currentBreak: {
            type: BreakType;
            startTime: Date;
            endTime?: Date;
        } | null;
        cancellationReason?: string;
        totalBreakTime: number;
        createdAt: Date;
        updatedAt: Date;
    }[];
    total: number;
    page: number;
    totalPages: number;
} 