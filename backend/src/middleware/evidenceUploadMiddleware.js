import multer from "multer";

const maxSizeMB = Number(
  process.env.EVIDENCE_MAX_FILE_SIZE_MB || 50
);

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: maxSizeMB * 1024 * 1024
  }
});

const uploadEvidenceFile = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") {
        error.statusCode = 413;
        error.message = `File size cannot exceed ${maxSizeMB} MB`;
      } else {
        error.statusCode = 400;
      }

      return next(error);
    }

    next();
  });
};

export default uploadEvidenceFile;