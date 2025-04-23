import { Request, Response, NextFunction } from "express";
import { BaseController } from "./baseController";
import Driver from "../models/driverModel";
import { Types, SortOrder } from "mongoose";
import catchAsyncErrors from "../middleware/catchAsyncErrors";
import { emailService } from "../utils/emailService";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "../utils/email";
import multer from "multer";
import path from "path";
import fs from "fs";

// Extend Express namespace to include Multer types
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      }
    }
  }
}

// Define interface for multer request
interface MulterRequest extends Request {
  files?: {
    [fieldname: string]: Express.Multer.File[];
  };
}

class DriverController extends BaseController {
  // Create a new driver application
  constructor() {
    super();
    // Bind all methods that are used as route handlers
    this.createApplication = this.createApplication.bind(this);
    this.getAllApplications = this.getAllApplications.bind(this);
    this.getApplicationById = this.getApplicationById.bind(this);
    this.updateApplication = this.updateApplication.bind(this);
    this.updateApplicationStatus = this.updateApplicationStatus.bind(this);
    this.deleteApplication = this.deleteApplication.bind(this);
    this.searchDrivers = this.searchDrivers.bind(this);
    this.approveApplication = this.approveApplication.bind(this);
    this.rejectApplication = this.rejectApplication.bind(this);
  }
  async createApplication(
    req: MulterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const applicationData = req.body;

      // Handle file uploads
      const files = req.files;
      const documents: any = {};

      if (files) {
        // Process each uploaded file
        Object.keys(files).forEach((fieldName) => {
          const file = files[fieldName][0];
          if (file) {
            // Store the relative path in the documents object
            const relativePath = path.relative(process.cwd(), file.path);
            documents[fieldName] = relativePath;
          }
        });
      }

      // Add document paths to application data
      applicationData.documents = documents;

      // Set initial application status
      applicationData.applicationStatus = {
        status: "pending",
        isApproved: false,
      };

      // Create the driver application
      const driver = await Driver.create(applicationData);

      this.sendResponse(
        res,
        201,
        true,
        "Driver application submitted successfully",
        driver
      );
    } catch (error) {
      // If there's an error, clean up any uploaded files
      if (req.files) {
        Object.values(req.files).forEach((fileArray) => {
          fileArray.forEach((file) => {
            try {
              fs.unlinkSync(file.path);
            } catch (err) {
              console.error("Error cleaning up file:", err);
            }
          });
        });
      }
      next(error);
    }
  }

  // Get all driver applications with optional filters
  async getAllApplications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // console.log("✅ getAllApplications called");
    // console.log("👉 Query params:", req.query);
    try {
      const {
        isHired,
        isReviewed,
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const query: any = {};

      // Add filters if provided
      if (isHired !== undefined) {
        query["applicationStatus.isHired"] = isHired === "true";
      }
      if (isReviewed !== undefined) {
        query["applicationStatus.isReviewed"] = isReviewed === "true";
      }

      const options = {
        page: Number(page),
        limit: Number(limit),
        sort: { [sortBy as string]: sortOrder === "desc" ? -1 : 1 } as {
          [key: string]: SortOrder;
        },
      };

      const drivers = await Driver.find(query)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit);

      const total = await Driver.countDocuments(query);
      this.sendResponse(res, 200, true, "Applications retrieved successfully", {
        data: drivers,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalRecords: total,
          recordsPerPage: options.limit,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single driver application by ID
  async getApplicationById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        this.sendError(res, 400, "Invalid driver ID format");
        return;
      }

      const driver = await Driver.findById(id);

      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      this.sendResponse(
        res,
        200,
        true,
        "Application retrieved successfully",
        driver
      );
    } catch (error) {
      next(error);
    }
  }

  // Update driver application
  async updateApplication(
    req: MulterRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!Types.ObjectId.isValid(id)) {
        this.sendError(res, 400, "Invalid driver ID format");
        return;
      }

      // Handle file uploads if any
      const files = req.files;
      if (files) {
        updateData.documents = updateData.documents || {};
        Object.keys(files).forEach((fieldName) => {
          updateData.documents[fieldName] = files[fieldName][0].path;
        });
      }

      const driver = await Driver.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      this.sendResponse(
        res,
        200,
        true,
        "Application updated successfully",
        driver
      );
    } catch (error) {
      next(error);
    }
  }

  // Update application status
  async updateApplicationStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const statusUpdate = req.body;

      const driver = await Driver.findByIdAndUpdate(
        id,
        { $set: { applicationStatus: statusUpdate } },
        { new: true }
      );

      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      this.sendResponse(
        res,
        200,
        true,
        "Application status updated successfully",
        driver
      );
    } catch (error) {
      next(error);
    }
  }

  // Delete driver application
  async deleteApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        this.sendError(res, 400, "Invalid driver ID format");
        return;
      }

      const driver = await Driver.findByIdAndDelete(id);

      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      // Delete associated files
      if (driver.documents) {
        Object.values(driver.documents).forEach((filePath) => {
          if (filePath && typeof filePath === "string") {
            try {
              require("fs").unlinkSync(filePath);
            } catch (err) {
              console.error("Error deleting file:", err);
            }
          }
        });
      }

      this.sendResponse(
        res,
        200,
        true,
        "Driver application deleted successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  // Search drivers by various criteria
  async searchDrivers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        fullName,
        emailAddress,
        cdlNumber,
        state,
        page = 1,
        limit = 10,
      } = req.query;

      const query: any = {};

      if (fullName) {
        query.fullName = { $regex: fullName, $options: "i" };
      }
      if (emailAddress) {
        query.emailAddress = { $regex: emailAddress, $options: "i" };
      }
      if (cdlNumber) {
        query["cdl.licenseNumber"] = { $regex: cdlNumber, $options: "i" };
      }
      if (state) {
        query["address.state"] = { $regex: state, $options: "i" };
      }

      const options = {
        page: Number(page),
        limit: Number(limit),
      };

      const drivers = await Driver.find(query)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit);

      const total = await Driver.countDocuments(query);

      this.sendResponse(
        res,
        200,
        true,
        "Search results retrieved successfully",
        {
          data: drivers,
          pagination: {
            currentPage: options.page,
            totalPages: Math.ceil(total / options.limit),
            totalRecords: total,
            recordsPerPage: options.limit,
          },
        }
      );
    } catch (error) {
      next(error);
    }
  }

  // Approve driver application
  async approveApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { name, comments } = req.body;

      const driver = await Driver.findByIdAndUpdate(
        id,
        {
          $set: {
            "applicationStatus.status": "approved",
            "applicationStatus.isApproved": true,
            "applicationStatus.comments": comments,
          },
        },
        { new: true }
      );

      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      // Send approval email with credentials
      await sendEmail({
        to: driver.emailAddress,
        subject: "Driver Application Approved",
        text: `Dear ${driver.fullName},\n\nYour driver application has been approved. You can now log in to your account.\n\nBest regards,\nThe Team`,
      });

      this.sendResponse(
        res,
        200,
        true,
        "Application approved and credentials sent to driver",
        driver
      );
    } catch (error) {
      next(error);
    }
  }

  // Reject driver application
  async rejectApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;

      if (!Types.ObjectId.isValid(id)) {
        this.sendError(res, 400, "Invalid driver ID format");
        return;
      }

      if (!rejectionReason) {
        this.sendError(res, 400, "Rejection reason is required");
        return;
      }

      const driver = await Driver.findByIdAndUpdate(
        id,
        {
          $set: {
            "applicationStatus.status": "rejected",
            "applicationStatus.isApproved": false,
            "applicationStatus.rejectionReason": rejectionReason,
          },
        },
        { new: true }
      );

      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      // Send rejection email
      await sendEmail({
        to: driver.emailAddress,
        subject: "Driver Application Rejected",
        text: `Dear ${driver.fullName},\n\nWe regret to inform you that your driver application has been rejected.\nReason: ${rejectionReason}\n\nBest regards,\nThe Team`,
      });

      this.sendResponse(
        res,
        200,
        true,
        "Application rejected and notification sent to driver",
        driver
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new DriverController();
