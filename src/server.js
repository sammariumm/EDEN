/**
 * This file serves as the main entry point for the Express server. 
 * sets up middleware, routes, and serves static files.
 * this is also responsible for listening on the specified port.
 */

import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

// Import route modules that handle different API endpoints
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import orderRoutes from "./routes/ordersRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";

// creates an instance of an Express application
const app = express();

// use port from environment variables or default to 3000
const PORT = process.env.PORT || 3000;

/**
 * These 2 lines of code converts the ES module URL to file path for __dirname equivalent.
 * 
 * import.meta.url gives full URL of the current ES module, eg.: file:///C:/EDEN/src/server.js
 * fileURLToPath converts it to a normal path string: C:\EDEN\src\server.js
 * __dirname gets the directory name from that path: C:\EDEN\src\server.js => C:\EDEN\src
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * JSON body (still needed for auth routes)
 * Specifically, these two lines allow the server to parse incoming requests with JSON payloads
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve uploaded images / static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount route modules to handle specific paths
app.use('/auth', authRoutes);             // for authentication; during login and register
app.use('/users', userRoutes);            // authenticates the JWT token; returns user info if the token is valid
app.use('/requests', requestRoutes);      // for handling requests from requests table (show, accept, reject, etc.)
app.use('/orders', orderRoutes);          // handles checkout; sends receipt email
app.use('/', applicationRoutes);          // for job applications (submit, view, etc.)

// serves default route to serve login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

// start the express server on the specified port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
