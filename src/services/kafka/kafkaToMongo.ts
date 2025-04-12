import { Report } from "../../models/report";
import { kafka } from "./kafkaService";

async function insertAggregatedReportsToMongo() {
  console.log("Kafka Mongo consumer started...");
  const mongoConsumer = kafka.consumer({ groupId: "iot-sensors-group" });
  await mongoConsumer.connect();
  await mongoConsumer.subscribe({ topic: "sensor-data", fromBeginning: false });

  const buffer: any[] = [];

  // Run every minute
  setInterval(async () => {
    if (buffer.length === 0) return;

    const now = new Date();
    const stat_date = now.toISOString().split("T")[0]; // e.g., "2025-04-12"
    const stat_min = now.toISOString().slice(11, 16); // e.g., "10:04"

    // equipemId_sensorId is the group
    const grouped: Record<
      string,
      {
        sensor_id: string;
        equipment_id: string;
        sensor_type: string;
        values: number[];
      }
    > = {};

    for (const item of buffer) {
      const { sensor_id, equipment_id, sensor_type, value } = item;

      const key = `${equipment_id}:${sensor_id}`;
      if (!grouped[key]) {
        grouped[key] = {
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
        stat_min,
        created_at: now,
      };
    });

    if (reportDocs.length > 0) {
      await Report.insertMany(reportDocs);
      console.log("Inserted aggregated reports:", reportDocs);
    }

    buffer.length = 0;
  }, 60_000); // once per minute

  await mongoConsumer.run({
    eachMessage: async ({ message }) => {
      try {
        if (!message.value) return;
        const data = JSON.parse(message.value.toString());
        buffer.push(data);
      } catch (err) {
        console.error("Error in mongo consumer. Skipping message.", err);
      }
    },
  });
}

insertAggregatedReportsToMongo();
