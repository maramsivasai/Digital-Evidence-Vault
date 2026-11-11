
import User from "../models/User.js";
import { hashPassword } from "../utils/passwordUtils.js";

const allowedRoles = [
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
];

export const createUser = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // 1. Check required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required"
            });
        }

        // 2. Validate email format
        const normalizedEmail = email.trim().toLowerCase();
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(normalizedEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address"
            });
        }

        // 3. Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters"
            });
        }

        // 4. Validate role
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        // 5. Check whether email already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists"
            });
        }

        // 6. Hash the password
        const passwordHash = await hashPassword(password);

        // 7. Create the user
        const newUser = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role
        });

        // 8. Return safe user information
        return res.status(201).json({
            success: true,
            message: "User account created successfully",
            user: {
                userId: newUser.userId,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isActive: newUser.isActive,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        next(error);
    }
};
