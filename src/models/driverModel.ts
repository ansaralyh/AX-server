import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";

interface IDriverDocuments {
  cdlDocument?: string;
  medicalCertificate?: string;
  drivingRecord?: string;
  socialSecurityCard?: string;
  profilePhoto?: string;
}

// TypeScript interface for driver document
interface IDriver extends Document {
  // Applicant Information
  fullName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  emailAddress: string;
  password?: string;

  // Current Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };

  // Legal Information
  isLegallyAuthorized: boolean;
  hasBeenConvicted: boolean;
  convictionExplanation?: string;

  // CDL Information
  cdl: {
    number: string;
    state: string;
    expirationDate: Date;
  };

  // Employment History
  employmentHistory: Array<{
    companyName: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    reasonForLeaving?: string;
  }>;

  // Driving History
  drivingHistory: {
    accidents: Array<{
      date: Date;
      description: string;
      atFault: boolean;
    }>;
    violations: Array<{
      date: Date;
      description: string;
      points: number;
    }>;
  };

  // References
  references: Array<{
    name: string;
    relationship: string;
    phoneNumber: string;
    email: string;
  }>;

  // Document Uploads
  documents: IDriverDocuments;

  // Application Status
  applicationStatus: {
    status: 'pending' | 'in_review' | 'approved' | 'rejected';
    reviewStatus?: string;
    backgroundCheckCompleted?: boolean;
    interviewScheduled?: boolean;
    interviewDate?: Date;
    hiringStatus?: string;
    comments?: string;
    isApproved?: boolean;
    rejectionReason?: string;
  };

  // Consent
  hasAgreedToTerms: boolean;
  signature: string;
  signatureDate: Date;

  userId?: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    // Applicant Information
    fullName: {
      type: String,
      required: [true, 'Full name is required']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required']
    },
    emailAddress: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      select: false
    },

    // Current Address
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required']
      },
      city: {
        type: String,
        required: [true, 'City is required']
      },
      state: {
        type: String,
        required: [true, 'State is required']
      },
      zipCode: {
        type: String,
        required: [true, 'ZIP code is required']
      }
    },

    // Legal Information
    isLegallyAuthorized: { type: Boolean, required: true },
    hasBeenConvicted: { type: Boolean, required: true },
    convictionExplanation: { type: String },

    // CDL Information
    cdl: {
      number: {
        type: String,
        required: [true, 'CDL number is required']
      },
      state: {
        type: String,
        required: [true, 'CDL state is required']
      },
      expirationDate: {
        type: Date,
        required: [true, 'CDL expiration date is required']
      }
    },

    // Employment History
    employmentHistory: [
      {
        companyName: String,
        position: String,
        startDate: Date,
        endDate: Date,
        reasonForLeaving: String
      }
    ],

    // Driving History
    drivingHistory: {
      accidents: [
        {
          date: Date,
          description: String,
          atFault: Boolean
        }
      ],
      violations: [
        {
          date: Date,
          description: String,
          points: Number
        }
      ]
    },

    // References
    references: [
      {
        name: String,
        relationship: String,
        phoneNumber: String,
        email: String
      }
    ],

    // Document Uploads
    documents: {
      cdlDocument: String,
      medicalCertificate: String,
      drivingRecord: String,
      socialSecurityCard: String,
      profilePhoto: String
    },

    // Application Status
    applicationStatus: {
      status: {
        type: String,
        enum: ['pending', 'in_review', 'approved', 'rejected'],
        default: 'pending'
      },
      reviewStatus: String,
      backgroundCheckCompleted: Boolean,
      interviewScheduled: Boolean,
      interviewDate: Date,
      hiringStatus: String,
      comments: String,
      isApproved: {
        type: Boolean,
        default: false
      },
      rejectionReason: String
    },

    // Consent
    hasAgreedToTerms: {
      type: Boolean,
      required: [true, 'Agreement to terms is required']
    },
    signature: {
      type: String,
      required: [true, 'Signature is required']
    },
    signatureDate: {
      type: Date,
      required: [true, 'Signature date is required']
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      sparse: true
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving if modified
driverSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password!, 10);
  }
  next();
});

const Driver = mongoose.model<IDriver>("Driver", driverSchema);

export default Driver;
