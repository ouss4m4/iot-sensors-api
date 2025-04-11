import { Router } from "express";
import { createSensor, getSensors } from "../controllers/sensor.controller";

const sensorRouter = Router();

sensorRouter.post("/", createSensor);
sensorRouter.get("/", getSensors);

export { sensorRouter };
