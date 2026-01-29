import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";
import orderRoutes from "./routes/ordersRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



// JSON body (still needed for auth routes)
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../public")));

// Serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/requests', requestRoutes);
app.use('/orders', orderRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
