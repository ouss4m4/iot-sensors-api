import { config } from "dotenv";
import { Kafka } from "kafkajs";
config();

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "sensor-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

export const producer = kafka.producer();
(async () => {
  process.on("SIGINT", async () => {
    console.log("Shutting down gracefully...");
    await producer.disconnect();
    process.exit(0);
  });

  await producer.connect();
})();

export async function sendSensorDataToKafka(sensorData: {
  equipment_id: string;
  sensor_id: string;
  sensor_type: number;
  value: string;
  timestamp: string;
}) {
  await producer.send({
    topic: "sensor-data",
    messages: [{ value: JSON.stringify(sensorData) }],
  });
  console.log("Sensor data sent to Kafka:", sensorData);
}
