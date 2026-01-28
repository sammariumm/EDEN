import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "cultivating_paradise";

// Verify token
export function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }

        req.user = user;
        next();
    });
}

// Admin-only guard
export function requireAdmin(req, res, next) {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
}


