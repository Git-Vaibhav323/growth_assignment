import multer from "multer";
import { config } from "../config";

/**
 * Memory storage: the file never touches disk, which is what makes this
 * service safely stateless (fits Render/Railway's ephemeral filesystems and
 * needs no cleanup). Validated primarily by extension rather than the
 * browser-reported mimetype, since browsers/OSes report inconsistent
 * mimetypes for .csv (text/csv, application/vnd.ms-excel, application/csv...).
 */
export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      cb(new Error("Only .csv files are supported."));
      return;
    }
    cb(null, true);
  },
}).single("file");
