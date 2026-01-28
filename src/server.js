import express from 'express';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import requestRoutes from './routes/requestRoutes.js';

// port to open server
const app = express();
const PORT = process.env.PORT || 3000;

// get file path from url of the current module
const __filename = fileURLToPath(import.meta.url);

// get directory name from file path
const __dirname = dirname(__filename);

// MIDDLEWARE ==========================================

// parse json request body
app.use(express.json());


// serve all files from the public folder as static assets
// find public dir by traversing up one level from src dir
app.use(express.static(path.join(__dirname, '../public')));

// serve the html file from the public dir
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'login.html'));
})

// use the routes
app.use(authRoutes);
app.use(userRoutes);
app.use(requestRoutes);

// open and show what port the server is running on
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});