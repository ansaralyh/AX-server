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
import User from "../models/userModel";

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
    this.changeApplicationStatus = this.changeApplicationStatus.bind(this);
    this.getAllDrivers = this.getAllDrivers.bind(this);
    this.getDriverById = this.getDriverById.bind(this);
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
      const { approvedBy } = req.body;

      const driver = await Driver.findById(id);
      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      // Check if user already exists with this email
      const existingUser = await User.findOne({ email: driver.emailAddress });
      if (existingUser) {
        this.sendError(
          res,
          400,
          "A user account already exists with this email"
        );
        return;
      }

      // Generate a random password
      const generatedPassword = this.generateRandomPassword();

      // Create new user account
      const userAccount = (await User.create({
        email: driver.emailAddress,
        password: generatedPassword,
        firstName: driver.fullName.split(" ")[0],
        lastName: driver.fullName.split(" ").slice(1).join(" "),
        role: "driver",
        phoneNumber: driver.phoneNumber,
      })) as { _id: Types.ObjectId; email: string; role: string };

      // Update driver status and link to user account
      driver.applicationStatus.status = "approved";
      driver.applicationStatus.isApproved = true;
      driver.userId = userAccount._id;
      await driver.save();

      // Send approval email with credentials
      /*
      await sendEmail({
        to: driver.emailAddress,
        subject: "Driver Application Approved - Your Login Credentials",
        text: `
Dear ${driver.fullName},

Congratulations! Your driver application has been approved. 

Here are your login credentials:
Email: ${driver.emailAddress}
Password: ${generatedPassword}

Please log in and change your password immediately for security purposes.

Best regards,
The Team
        `
      });
      */

      this.sendResponse(
        res,
        200,
        true,
        "Application approved and credentials sent to driver",
        {
          driver,
          userAccount: {
            id: userAccount._id,
            email: userAccount.email,
            role: userAccount.role,
          },
        }
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

      const driver = await Driver.findById(id);
      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      // Update driver status
      driver.applicationStatus.status = "rejected";
      driver.applicationStatus.isApproved = false;
      driver.applicationStatus.rejectionReason = rejectionReason;
      await driver.save();

      // Send rejection email
      /*
      await sendEmail({
        to: driver.emailAddress,
        subject: "Driver Application Rejected",
        text: `
Dear ${driver.fullName},

We regret to inform you that your driver application has been rejected.

Reason: ${rejectionReason}

If you have any questions, please feel free to contact us.

Best regards,
The Team
        `
      });
      */

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

  // Helper method to generate random password
  private generateRandomPassword(): string {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    console.log("password", password)
    return password;
  }

  // New method for changing application status
  async changeApplicationStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ["pending", "in_review", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        this.sendError(
          res,
          400,
          "Invalid status. Must be one of: pending, in_review, approved, rejected"
        );
        return;
      }

      // Validate ID
      if (!Types.ObjectId.isValid(id)) {
        this.sendError(res, 400, "Invalid driver ID format");
        return;
      }

      const driver = await Driver.findById(id);
      if (!driver) {
        this.sendError(res, 404, "Driver application not found");
        return;
      }

      let userAccount = null;
      let generatedPassword = "";

      // If status is being changed to approved, create user account
      if (status === "approved") {
        // Check if user already exists with this email
        const existingUser = await User.findOne({ email: driver.emailAddress });
        if (existingUser) {
          this.sendError(
            res,
            400,
            "A user account already exists with this email"
          );
          return;
        }

        // Generate password for new user
        generatedPassword = this.generateRandomPassword();

        // Create new user account
        userAccount = (await User.create({
          email: driver.emailAddress,
          password: generatedPassword,
          firstName: driver.fullName.split(" ")[0],
          lastName: driver.fullName.split(" ").slice(1).join(" "),
          role: "driver",
          phoneNumber: driver.phoneNumber,
        })) as { _id: Types.ObjectId; email: string; role: string };

        // Update driver with user reference
        driver.userId = userAccount._id;

        // Send credentials email
        await sendEmail({
          to: driver.emailAddress,
          subject: "Driver Application Approved - Your Login Credentials",
          text: `
Dear ${driver.fullName},

Congratulations! Your driver application has been approved. 

Here are your login credentials:
Email: ${driver.emailAddress}
Password: ${generatedPassword}

Please log in and change your password immediately for security purposes.

Best regards,
The Team
          `,
        });
      }

      // Update driver status
      driver.applicationStatus.status = status;
      driver.applicationStatus.isApproved = status === "approved";
      driver.applicationStatus.comments =
        status === "approved"
          ? "Application approved"
          : status === "rejected"
          ? "Application rejected"
          : driver.applicationStatus.comments;

      await driver.save();

      this.sendResponse(
        res,
        200,
        true,
        `Application status updated to ${status} successfully`,
        {
          driver,
          ...(userAccount && {
            userAccount: {
              id: userAccount._id,
              email: userAccount.email,
              role: userAccount.role,
            },
          }),
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getAllDrivers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const query: any = { 'applicationStatus.status': 'approved' };

      // Add search functionality
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { emailAddress: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const options = {
        page: Number(page),
        limit: Number(limit),
        sort: { createdAt: -1 }
      };

      const drivers = await Driver.find(query)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)
        .select('-password -documents -signature')
        .populate('userId', 'email role');

      const total = await Driver.countDocuments(query);

      this.sendResponse(res, 200, true, 'Drivers retrieved successfully', {
        drivers,
        pagination: {
          currentPage: options.page,
          totalPages: Math.ceil(total / options.limit),
          totalRecords: total,
          recordsPerPage: options.limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDriverById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!Types.ObjectId.isValid(id)) {
        this.sendError(res, 400, 'Invalid driver ID format');
        return;
      }

      const driver = await Driver.findById(id)
        .select('-password  -signature')
        .populate('userId', 'email role');

      if (!driver) {
        this.sendError(res, 404, 'Driver not found');
        return;
      }

      this.sendResponse(res, 200, true, 'Driver retrieved successfully', driver);
    } catch (error) {
      next(error);
    }
  }
}

export default new DriverController();
