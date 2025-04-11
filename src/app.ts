import express from "express";
import mongoose from "mongoose";
import { equipmentRouter } from "./routes/equipment.routes";
import { sensorRouter } from "./routes/sensor.routes";
import { reportRouter } from "./routes/report.routes";

const app = express();
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/sensors");

app.use("/api/equipment", equipmentRouter);
app.use("/api/sensors", sensorRouter);
app.use("/api/reports", reportRouter);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
