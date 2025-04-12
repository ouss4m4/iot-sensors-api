import { config } from "dotenv";
import express, { Response, Request } from "express";
import mongoose from "mongoose";
import { equipmentRouter } from "./routes/equipment.routes";
import { sensorRouter } from "./routes/sensor.routes";
import { reportRouter } from "./routes/report.routes";
import { initCassandraSchema, client } from "./cassandra/cassandra";
import { ingestRouter } from "./routes/ingest.routes";

config();
const app = express();
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sensors";
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.use("/api/equipment", equipmentRouter);
app.use("/api/sensors", sensorRouter);
app.use("/api/reports", reportRouter);
app.use("/api/metrics", ingestRouter);
app.use("/api/requests", async (_: Request, res: Response) => {
  const data = await client.execute(`SELECT * FROM sensor_readings`);
  res.json(data.rows);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
  await initCassandraSchema();
  console.log(`✨ Server running on http://localhost:${PORT}`);
});

// Graceful shutdown handlers
// import { gracefulShutdown } from "./utils/shutdown";

// process.on("SIGTERM", () => gracefulShutdown({ server }));
