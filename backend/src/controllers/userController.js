import User from "../models/User.js";
import { hashPassword } from "../utils/passwordUtils.js";

const allowedRoles = [
    "administrator",
    "investigation_officer",
    "forensic_analyst",
    "authorized_reviewer"
];

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);

    res.status(500).json({
      message: "Failed to retrieve users",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      message: "User retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);

    res.status(500).json({
      message: "Failed to retrieve user",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "isActive must be a boolean value",
      });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    res.status(500).json({
      message: "Failed to update user status",
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        message: "Name, email, and role are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Validate role
    const allowedRoles = [
      "administrator",
      "investigation_officer",
      "forensic_analyst",
      "authorized_reviewer",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Check if email is already used by another user
    const existingEmail = await User.findOne({ email });

    if (existingEmail && existingEmail.userId !== userId) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    user.name = name.trim();
    user.email = email.trim().toLowerCase();
    user.role = role;

    await user.save();

    res.status(200).json({
      message: "User updated successfully",
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);

    res.status(500).json({
      message: "Failed to update user",
    });
  }
};

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