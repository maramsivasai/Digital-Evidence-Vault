const allowedRoles = [
  "administrator",
  "investigation_officer",
  "forensic_analyst",
  "authorized_reviewer"
];

const authorizeRoles = (...roles) => {
  // Validate the configured roles
  const invalidRoles = roles.filter(
    (role) => !allowedRoles.includes(role)
  );

  if (invalidRoles.length > 0) {
    throw new Error(
      `Invalid role configuration: ${invalidRoles.join(", ")}`
    );
  }

  return (req, res, next) => {
    // Check whether authentication middleware ran first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required"
      });
    }

    // Check whether the user's role is permitted
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action"
      });
    }

    // Allow the request to continue
    next();
  };
};

export default authorizeRoles;