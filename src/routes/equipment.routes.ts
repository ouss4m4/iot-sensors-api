import { Router } from "express";
import { createEquipment, getAllEquipment } from "../controllers/equipment.controller";

const equipmentRouter = Router();

equipmentRouter.post("/", createEquipment);
equipmentRouter.get("/", getAllEquipment);

export { equipmentRouter };
