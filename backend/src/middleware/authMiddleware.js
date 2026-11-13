import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Step 1: Check the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required"
      });
    }

    // Step 2: Extract the JWT token
    const token = authHeader.split(" ")[1];

    // Step 3: Verify the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Step 4: Find the user in MongoDB
    const user = await User.findOne({
      userId: decoded.userId
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found"
      });
    }

    // Step 5: Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is disabled"
      });
    }

    // Step 6: Attach authenticated user information
    req.user = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Step 7: Allow the request to continue
    next();

  } catch (error) {

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token"
      });
    }

    next(error);
  }
};

export default authMiddleware;