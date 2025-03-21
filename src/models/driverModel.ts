import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

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
    zip: string;
  };

  // Legal Information
  isLegallyAuthorized: boolean;
  hasBeenConvicted: boolean;
  convictionExplanation?: string;

  // CDL Information
  cdl: {
    licenseNumber: string;
    stateIssued: string;
    expirationDate: Date;
    endorsements: {
      tanker: boolean;
      hazmat: boolean;
      doubleTriples: boolean;
      other?: string;
    };
    yearsOfExperience: number;
  };

  // Employment History
  employmentHistory: [
    {
      companyName: string;
      positionHeld: string;
      fromDate: Date;
      toDate: Date;
      reasonForLeaving: string;
    }
  ];

  // Driving History
  drivingHistory: {
    hadAccidents: boolean;
    accidentDetails?: string;
    hadViolations: boolean;
    violationDetails?: string;
  };

  // References
  references: [
    {
      name: string;
      relationship: string;
      phoneNumber: string;
    }
  ];

  // Document Uploads
  documents: {
    driversLicense: string; // URL/path to stored document
    nationalIdOrPassport: string;
    recentPhotograph: string;
    medicalCertificate: string;
  };

  // Application Status
  applicationStatus: {
    isApproved: boolean;
    approvedAt?: Date;
    approvedBy?: string;
    rejectionReason?: string;
    isReviewed: boolean;
    isBackgroundCheckCompleted: boolean;
    isInterviewScheduled: boolean;
    isHired: boolean;
    comments?: string;
  };

  // Consent
  hasAgreedToTerms: boolean;
  signature: string;
  signatureDate: Date;

  createdAt: Date;
  updatedAt: Date;
}

const driverSchema = new mongoose.Schema(
  {
    // Applicant Information
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    phoneNumber: { type: String, required: true },
    emailAddress: { type: String, required: true, unique: true },
    password: { type: String, select: false },

    // Current Address
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zip: { type: String, required: true },
    },

    // Legal Information
    isLegallyAuthorized: { type: Boolean, required: true },
    hasBeenConvicted: { type: Boolean, required: true },
    convictionExplanation: { type: String },

    // CDL Information
    cdl: {
      licenseNumber: { type: String, required: true },
      stateIssued: { type: String, required: true },
      expirationDate: { type: Date, required: true },
      endorsements: {
        tanker: { type: Boolean, default: false },
        hazmat: { type: Boolean, default: false },
        doubleTriples: { type: Boolean, default: false },
        other: { type: String },
      },
      yearsOfExperience: { type: Number, required: true },
    },

    // Employment History
    employmentHistory: [
      {
        companyName: { type: String, required: true },
        positionHeld: { type: String, required: true },
        fromDate: { type: Date, required: true },
        toDate: { type: Date, required: true },
        reasonForLeaving: { type: String, required: true },
      },
    ],

    // Driving History
    drivingHistory: {
      hadAccidents: { type: Boolean, required: true },
      accidentDetails: { type: String },
      hadViolations: { type: Boolean, required: true },
      violationDetails: { type: String },
    },

    // References
    references: [
      {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phoneNumber: { type: String, required: true },
      },
    ],

    // Document Uploads
    documents: {
      driversLicense: { type: String, required: true },
      nationalIdOrPassport: { type: String, required: true },
      recentPhotograph: { type: String, required: true },
      medicalCertificate: { type: String, required: true },
    },

    // Application Status
    applicationStatus: {
      isApproved: { type: Boolean, default: false },
      approvedAt: { type: Date },
      approvedBy: { type: String },
      rejectionReason: { type: String },
      isReviewed: { type: Boolean, default: false },
      isBackgroundCheckCompleted: { type: Boolean, default: false },
      isInterviewScheduled: { type: Boolean, default: false },
      isHired: { type: Boolean, default: false },
      comments: { type: String },
    },

    // Consent
    hasAgreedToTerms: { type: Boolean, required: true },
    signature: { type: String, required: true },
    signatureDate: { type: Date, required: true },
  },
  {
    timestamps: true,
  }
);

const Driver = mongoose.model<IDriver>("Driver", driverSchema);

export default Driver;
