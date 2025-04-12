import express from "express";
import mongoose from "mongoose";
import { equipmentRouter } from "./routes/equipment.routes";
import { sensorRouter } from "./routes/sensor.routes";
import { reportRouter } from "./routes/report.routes";
import { initCassandraSchema } from "./config/cassandra";
import { insertAggregatedReportsToMongo } from "./services/kafka/kafkaToMongo";
import { insertSensorDataToCassandra } from "./services/kafka/kafkaToCassandra";
import { ingestRouter } from "./routes/ingest.routes";

const app = express();
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/sensors");

app.use("/api/equipment", equipmentRouter);
app.use("/api/sensors", sensorRouter);
app.use("/api/reports", reportRouter);
app.use("/api/metrics", ingestRouter);

// src/app.ts

// Start Kafka consumer (side-effect)
insertAggregatedReportsToMongo().catch(console.error);
insertSensorDataToCassandra().catch(console.error);

app.listen(3000, async () => {
  await initCassandraSchema();
  // inside your main bootstrap:
  console.log("Server running on http://localhost:3000");
});
