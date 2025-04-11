import { Router } from "express";
import { createReports, getReports } from "../controllers/report.controller";

const reportRouter = Router();

reportRouter.get("/", getReports);
reportRouter.post("/", createReports);

export { reportRouter };
