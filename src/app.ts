import express, { Response, Request } from "express";
import mongoose from "mongoose";
import { equipmentRouter } from "./routes/equipment.routes";
import { sensorRouter } from "./routes/sensor.routes";
import { reportRouter } from "./routes/report.routes";
import { initCassandraSchema, client } from "./config/cassandra";
import { ingestRouter } from "./routes/ingest.routes";

const app = express();
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/sensors");

app.use("/api/equipment", equipmentRouter);
app.use("/api/sensors", sensorRouter);
app.use("/api/reports", reportRouter);
app.use("/api/metrics", ingestRouter);
app.use("/api/requests", async (_: Request, res: Response) => {
  const data = await client.execute(`SELECT * FROM sensor_readings`);
  res.json(data.rows);
});

// src/app.ts

// Start Kafka consumer (side-effect)

app.listen(3000, async () => {
  await initCassandraSchema();
  // inside your main bootstrap:
  console.log("Server running on http://localhost:3000");
});
