import { Router } from "express";
import { uploadCsv } from "../middleware/upload.middleware";
import { health, importCsv } from "../controllers/import.controller";

export const importRouter = Router();

importRouter.get("/health", health);
importRouter.post("/import", uploadCsv, importCsv);
