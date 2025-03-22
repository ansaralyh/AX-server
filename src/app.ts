import express from "express";
import { connectToDb } from "./config/db";
import dotenv from "dotenv";
import errorMiddleware from "./middleware/error";
import bodyParser from "body-parser";
import indexRoutes from './routes/indexRoutes'
import cors from 'cors';

//Dotenv configuration
dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Default to Vite's default port
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Routes 
app.use("/api/v1", indexRoutes);

//error middleware
app.use(errorMiddleware);

// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Error: ${err.message}`);
  console.error(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});

// Establishing the server
const server = app.listen(process.env.PORT, () => {
  console.log(`Server listening to PORT ${process.env.PORT}`);
});

// Database connection
connectToDb()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process if DB connection fails
  });

// Handling unhandled promise rejections
process.on("unhandledRejection", (err: unknown) => {
  if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("Unhandled rejection occurred:", err);
  }

  console.error(`Shutting down the server due to unhandled promise rejection`);
  server.close(() => {
    process.exit(1);
  });
});
