// src/routes/ingestRoutes.ts
import { Router } from "express";
import { sendSensorDataToKafka } from "../services/kafka/kafkaService";

const ingestRouter = Router();

ingestRouter.get("/", async (req, res) => {
  try {
    const { sensor_id = "", equipment_id = "", sensor_type = null, value = null } = req.query as { [key: string]: string };
    if (!equipment_id || !sensor_id || !sensor_type || !value) {
      res.status(400).json({ error: "missing params" });
      return;
    }

    const timestamp = new Date().toUTCString();
    await sendSensorDataToKafka({ equipment_id, sensor_type, value, timestamp });
    res.status(202).json({ message: "Data queued successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to queue data" });
  }
});

export { ingestRouter };
