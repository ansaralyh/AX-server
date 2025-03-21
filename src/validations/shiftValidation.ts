import { z } from 'zod';

const shiftValidation = {
    startShift: z.object({
        body: z.object({}).strict(),
        query: z.object({}).strict(),
        params: z.object({}).strict()
    }),

    endShift: z.object({
        body: z.object({}).strict(),
        query: z.object({}).strict(),
        params: z.object({
            shiftId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shift ID')
        })
    }),

    startBreak: z.object({
        body: z.object({
            type: z.enum(['rest', 'lunch', 'other'])
        }).strict(),
        query: z.object({}).strict(),
        params: z.object({
            shiftId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shift ID')
        })
    }),

    endBreak: z.object({
        body: z.object({}).strict(),
        query: z.object({}).strict(),
        params: z.object({
            shiftId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shift ID')
        })
    }),

    getActiveShift: z.object({
        body: z.object({}).strict(),
        query: z.object({}).strict(),
        params: z.object({}).strict()
    }),

    getShiftHistory: z.object({
        body: z.object({}).strict(),
        query: z.object({
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
            page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
            limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional()
        }),
        params: z.object({}).strict()
    }),

    getShiftStats: z.object({
        body: z.object({}).strict(),
        query: z.object({
            startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
            endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
        }),
        params: z.object({}).strict()
    }),

    getCurrentBreakStatus: z.object({
        body: z.object({}).strict(),
        query: z.object({}).strict(),
        params: z.object({
            shiftId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shift ID')
        })
    }),

    cancelShift: z.object({
        body: z.object({
            reason: z.string().min(1, 'Reason is required').max(500, 'Reason is too long')
        }).strict(),
        query: z.object({}).strict(),
        params: z.object({
            shiftId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid shift ID')
        })
    })
};

export default shiftValidation; 