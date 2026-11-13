import Case from "../models/Case.js";

export const createCase = async (req, res, next) => {
  try {
    const { title, description } = req.body;

    // Validate required fields
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

    // Create a new case
    const newCase = await Case.create({
      title: title.trim(),
      description: description.trim(),
      status: "Open",
      createdBy: req.user.userId,
      assignedTo: []
    });

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Case created successfully",
      case: {
        caseId: newCase.caseId,
        title: newCase.title,
        description: newCase.description,
        status: newCase.status,
        createdDate: newCase.createdDate,
        updatedDate: newCase.updatedDate,
        assignedTo: newCase.assignedTo
      }
    });

  } catch (error) {
    next(error);
  }
};