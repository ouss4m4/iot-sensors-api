import { config } from "dotenv";
import mongoose from "mongoose";
import { Consumer, EachMessagePayload } from "kafkajs";
import { kafka } from "../kafka/kafkaService";
import { Report } from "../models/report";

config();

async function insertAggregatedReportsToMongo() {
  console.log("Kafka Mongo consumer started...");
  mongoConsumer = kafka.consumer({
    groupId: "sensor-to-mongo",
    heartbeatInterval: 0,
  });
  await mongoConsumer.connect();
  await mongoConsumer.subscribe({ topic: "sensor-data", fromBeginning: false });
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sensors";
  await mongoose.connect(MONGODB_URI);
  const buffer: any[] = [];

  // Run every minute
  bufferInterval = setInterval(async () => {
    if (buffer.length === 0) return;

    const now = new Date();
    const stat_date = now.toISOString().split("T")[0]; // e.g., "2025-04-12"
    const stat_hour = now.toISOString().slice(11, 14) + "00"; // e.g., "10:04"

    // equipemId_sensorId is the group
    const grouped: Record<
      string,
      {
        stat_date: string;
        stat_hour: string;
        sensor_id: string;
        equipment_id: string;
        sensor_type: string;
        values: number[];
      }
    > = {};

    for (const item of buffer) {
      const { sensor_id, equipment_id, sensor_type = 1, value } = item;

      const key = `${stat_date}${stat_hour}${equipment_id}:${sensor_id}`;
      if (!grouped[key]) {
        grouped[key] = {
          stat_date,
          stat_hour,
          sensor_id,
          equipment_id,
          sensor_type,
          values: [],
        };
      }

      grouped[key].values.push(Number(value));
    }

    const reportDocs = Object.values(grouped).map((group) => {
      const { values, sensor_id, equipment_id, sensor_type } = group;
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      return {
        sensor_id,
        equipment_id,
        sensor_type,
        avg,
        min,
        max,
        stat_date,
        stat_hour,
        created_at: now,
      };
    });

    for (const report of reportDocs) {
      const { equipment_id, sensor_id, sensor_type, avg, min, max, stat_date, stat_hour, created_at } = report;

      const filter = { equipment_id, sensor_id, stat_date, stat_hour };

      const update = {
        $inc: {
          total_avg: avg * 1,
          count: 1,
        },
        $min: { min },
        $max: { max },
        $setOnInsert: {
          equipment_id,
          sensor_id,
          sensor_type,
          stat_date,
          stat_hour,
          created_at,
        },
      };

      await Report.updateOne(filter, update, { upsert: true });
    }

    buffer.length = 0;
  }, 60_000); // run per minute. aggregate per hour

  await mongoConsumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      try {
        if (!message.value) return;
        const data = JSON.parse(message.value.toString());
        buffer.push(data);
        console.log(`event received. adding to batch. size now ${buffer.length}`);
      } catch (err) {
        console.error("Error in mongo consumer. Skipping message.", err);
      }
    },
  });
}

let mongoConsumer: Consumer;
let bufferInterval: NodeJS.Timeout;

async function shutdown() {
  console.log("⏳ Shutting down Kafka-Mongo consumer...");
  try {
    if (bufferInterval) {
      clearInterval(bufferInterval);
      console.log("✅ Buffer interval cleared");
    }
    if (mongoConsumer) {
      await mongoConsumer.disconnect();
      console.log("✅ Kafka-Mongo consumer disconnected");
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    }
  } catch (error) {
    console.error("❌ Error during Kafka-Mongo consumer shutdown:", error);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

insertAggregatedReportsToMongo().catch((error) => {
  console.error("❌ Error in Kafka-Mongo consumer:", error);
  // process.exit(1);
});
