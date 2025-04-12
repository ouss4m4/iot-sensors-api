// src/services/kafkaService.ts
import { Kafka } from "kafkajs";

export const kafka = new Kafka({
  clientId: "sensor-service",
  brokers: ["localhost:9093"],
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

export async function sendSensorDataToKafka(sensorData: { equipment_id: string; sensor_type: string; value: string; timestamp: string }) {
  await producer.send({
    topic: "sensor-data",
    messages: [{ value: JSON.stringify(sensorData) }],
  });
  console.log("Sensor data sent to Kafka:", sensorData);
}
