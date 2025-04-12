// src/services/kafka/kafkaToMongo.ts
import { Report } from "../../models/report";
import { kafka } from "./kafkaService";

export async function insertAggregatedReportsToMongo() {
  const mongoConsumer = kafka.consumer({ groupId: "iot-sensors-group" });
  await mongoConsumer.connect();
  await mongoConsumer.subscribe({ topic: "sensor-data", fromBeginning: false });

  const buffer: any[] = [];

  setInterval(async () => {
    if (buffer.length === 0) return;

    // Simple aggregation logic, e.g., average by sensor_id
    const aggregated: Record<string, { total: number; count: number }> = {};

    for (const item of buffer) {
      console.log("------- Kafka To Mongo Consumer-------------------------------");
      console.log(item);
      console.log("--------------------------------------------------------------");
      // const { sensor_type, value } = item;
      // if (!aggregated[sensor_type]) {
      //   aggregated[sensor_type] = { total: 0, count: 0 };
      // }
      // aggregated[sensor_type].total += value;
      // aggregated[sensor_type].count += 1;
    }

    for (const sensor_type in aggregated) {
      // const { total, count } = aggregated[sensor_type];
      // const avg = total / count;
      // await Report.insertOne({ sensor_type, avg, timestamp: new Date() });
    }

    buffer.length = 0;
  }, 5000);

  await mongoConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      buffer.push(data);
    },
  });
}
