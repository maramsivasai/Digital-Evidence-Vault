import Case from "../models/Case.js";
import User from "../models/User.js";

// POST /api/cases
// Create a new case
export const createCase = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      !title.trim() ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Case title and description are required"
      });
    }

    const newCase = await Case.create({
      title: title.trim(),
      description: description.trim(),
      status: "Open",
      createdBy: req.user.userId,
      assignedTo: []
    });

    return res.status(201).json({
      success: true,
      message: "Case created successfully",
      case: newCase
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/cases
// Search and retrieve cases
export const getCases = async (req, res, next) => {
  try {
    const { caseId, title, status, startDate, endDate } = req.query;

    const filter = {};

    if (caseId) {
      filter.caseId = caseId;
    }

    if (title) {
      filter.title = {
        $regex: title,
        $options: "i"
      };
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date"
          });
        }

        filter.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date"
          });
        }

        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }

      if (
        filter.createdAt.$gte &&
        filter.createdAt.$lte &&
        filter.createdAt.$gte > filter.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date"
        });
      }
    }

    const cases = await Case.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: cases.length,
      cases
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/cases/:caseId
// Retrieve one case
export const getCaseById = async (req, res, next) => {
  try {
    const foundCase = await Case.findOne({
      caseId: req.params.caseId
    });

    if (!foundCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }

    return res.status(200).json({
      success: true,
      case: foundCase
    });
  } catch (error) {
    next(error);
  }
};


// PUT /api/cases/:caseId
// Update permitted case information
export const updateCase = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Case title cannot be empty"
        });
      }

      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Case description cannot be empty"
        });
      }

      updates.description = description.trim();
    }

    if (status !== undefined) {
      if (typeof status !== "string" || !status.trim()) {
        return res.status(400).json({
          success: false,
          message: "Case status cannot be empty"
        });
      }

      updates.status = status.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one permitted field to update"
      });
    }

    const updatedCase = await Case.findOneAndUpdate(
      { caseId: req.params.caseId },
      { $set: updates },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Case updated successfully",
      case: updatedCase
    });
  } catch (error) {
    next(error);
  }
};


// PATCH /api/cases/:caseId/assign
// Assign personnel to a case
export const assignCase = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (typeof userId !== "string" || !userId.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid user ID is required"
      });
    }

    const user = await User.findOne({
      userId: userId.trim(),
      isActive: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Active user not found"
      });
    }

    const updatedCase = await Case.findOneAndUpdate(
      { caseId: req.params.caseId },
      { $addToSet: { assignedTo: user.userId } },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User assigned to case successfully",
      case: updatedCase
    });
  } catch (error) {
    next(error);
  }
};