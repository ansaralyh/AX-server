import { z } from 'zod';

// Common schemas
const addressSchema = z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required')
});

const cdlSchema = z.object({
    licenseNumber: z.string().min(1, 'License number is required'),
    stateIssued: z.string().min(1, 'State issued is required'),
    expirationDate: z.string().datetime(),
    endorsements: z.object({
        tanker: z.boolean({coerce:true}),
        hazmat: z.boolean({coerce:true}),
        doubleTriples: z.boolean(),
        other: z.string().optional()
    }),
    yearsOfExperience: z.number().min(0)
});

const employmentHistorySchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    positionHeld: z.string().min(1, 'Position is required'),
    fromDate: z.string().datetime(),
    toDate: z.string().datetime(),
    reasonForLeaving: z.string().min(1, 'Reason for leaving is required')
});

const referenceSchema = z.object({
    name: z.string().min(1, 'Reference name is required'),
    relationship: z.string().min(1, 'Relationship is required'),
    phoneNumber: z.string().min(1, 'Phone number is required')
});

// Validation schemas for different operations
export const driverValidation = {
    createApplication: z.object({
        body: z.object({
            fullName: z.string().min(1, 'Full name is required'),
            dateOfBirth: z.string().datetime(),
            phoneNumber: z.string().min(1, 'Phone number is required'),
            emailAddress: z.string().email('Invalid email address'),
            address: addressSchema,
            isLegallyAuthorized: z.boolean({coerce:true}),
            hasBeenConvicted: z.boolean({coerce:true}),
            convictionExplanation: z.string().optional(),
            cdl: cdlSchema,
            employmentHistory: z.array(employmentHistorySchema).min(1, 'At least one employment history entry is required'),
            drivingHistory: z.object({
                hadAccidents: z.boolean({coerce:true}),
                accidentDetails: z.string().optional(),
                hadViolations: z.boolean({coerce:true}),
                violationDetails: z.string().optional()
            }),
            references: z.array(referenceSchema).min(2, 'At least two references are required'),
            documents: z.object({
                driversLicense: z.string().min(1, 'Driver\'s license document is required'),
                nationalIdOrPassport: z.string().min(1, 'National ID or passport document is required'),
                recentPhotograph: z.string().min(1, 'Recent photograph is required'),
                medicalCertificate: z.string().min(1, 'Medical certificate is required')
            }),
            hasAgreedToTerms: z.literal(true, {
                errorMap: () => ({ message: 'You must agree to the terms and conditions' })
            }),
            signature: z.string().min(1, 'Signature is required'),
            signatureDate: z.string().datetime()
        })
    }),

    updateApplication: z.object({
        params: z.object({
            id: z.string().min(1, 'Driver ID is required')
        }),
        body: z.object({
            fullName: z.string().optional(),
            phoneNumber: z.string().optional(),
            emailAddress: z.string().email('Invalid email address').optional(),
            address: addressSchema.optional(),
            cdl: cdlSchema.optional(),
            employmentHistory: z.array(employmentHistorySchema).optional(),
            references: z.array(referenceSchema).optional()
        })
    }),

    updateStatus: z.object({
        params: z.object({
            id: z.string().min(1, 'Driver ID is required')
        }),
        body: z.object({
            isReviewed: z.boolean().optional(),
            isBackgroundCheckCompleted: z.boolean().optional(),
            isInterviewScheduled: z.boolean().optional(),
            isHired: z.boolean({coerce:true}).optional(),
            comments: z.string().optional()
        })
    }),

    approveApplication: z.object({
        params: z.object({
            id: z.string().min(1, 'Driver ID is required')
        }),
        body: z.object({
            approvedBy: z.string().min(1, 'Approved by is required')
        })
    }),

    rejectApplication: z.object({
        params: z.object({
            id: z.string().min(1, 'Driver ID is required')
        }),
        body: z.object({
            rejectionReason: z.string().min(1, 'Rejection reason is required')
        })
    })
}; 