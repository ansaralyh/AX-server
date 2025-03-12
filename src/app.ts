import express from "express";
import { connectToDb } from "./config/db";
import dotenv from "dotenv";
import errorMiddleware from "./middlewares/error";
import bodyParser from "body-parser";
import indexRoutes from './routes/indexRoutes'


//Dotenv configuration
dotenv.config();

const app = express();
app.use(bodyParser.json());

// Routes 


//midleware
app.use(errorMiddleware);

// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error(`Error: ${err.message}`);
  console.error(`Shutting down the server due to uncaught exception`);
  process.exit(1);
});
// routes
app.use("/api/v1", indexRoutes);


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
