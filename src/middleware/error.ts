import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  // Wrong MongoDB ID error
  if (err.name === "CastError") {
    const message = `Resource not found: ${err.path}`;
    error = new ErrorHandler(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    error = new ErrorHandler(message, 400);
  }

  // JSON Web Token error
  if (err.name === "JsonWebTokenError") {
    const message = "JSON Web Token is invalid. Try again.";
    error = new ErrorHandler(message, 400);
  }

  // JSON Web Token expired error
  if (err.name === "TokenExpiredError") {
    const message = "JSON Web Token has expired. Try again.";
    error = new ErrorHandler(message, 400);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message,
  });
};

export default errorMiddleware;
