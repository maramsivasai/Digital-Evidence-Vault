
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { comparePassword } from "../utils/passwordUtils.js";

export const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // 2. Find user and explicitly retrieve password hash
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+passwordHash");

        // 3. Validate account credentials
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 4. Check whether account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: "This account is disabled"
            });
        }

        // 5. Compare entered password with stored hash
        const isPasswordCorrect = await comparePassword(
            password,
            user.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // 6. Generate JWT token
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        const token = jwt.sign(
            {
                userId: user.userId,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1d"
            }
        );
        console.log(token)
        
        // 7. Return successful login response
        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};