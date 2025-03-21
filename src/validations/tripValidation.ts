import { z } from 'zod';

const locationSchema = z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([
        z.number().min(-180).max(180), // longitude
        z.number().min(-90).max(90)    // latitude
    ])
});

export const tripValidation = {
    createTrip: z.object({
        body: z.object({
            vehicleId: z.string(),
            startLocation: locationSchema,
            endLocation: locationSchema,
            route: z.array(locationSchema),
            startTime: z.string().datetime(),
            estimatedDistance: z.number().min(0),
            estimatedEarnings: z.number().min(0)
        })
    }),

    startTrip: z.object({
        params: z.object({
            tripId: z.string()
        })
    }),

    completeTrip: z.object({
        params: z.object({
            tripId: z.string()
        }),
        body: z.object({
            actualDistance: z.number().min(0),
            fuelUsed: z.number().min(0),
            finalRoute: z.array(locationSchema)
        })
    }),

    cancelTrip: z.object({
        params: z.object({
            tripId: z.string()
        }),
        body: z.object({
            reason: z.string().min(1)
        })
    }),

    getDriverTrips: z.object({
        query: z.object({
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional()
        })
    }),

    rateTrip: z.object({
        params: z.object({
            tripId: z.string()
        }),
        body: z.object({
            rating: z.number().min(1).max(5),
            feedback: z.string().optional()
        })
    })
}; 