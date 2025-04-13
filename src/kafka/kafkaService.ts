import { config } from "dotenv";
import { Kafka, logLevel } from "kafkajs";
config();

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || "sensor-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  logLevel: logLevel.WARN, // Reduce noise, only log warnings
});

export const producer = kafka.producer({
  retry: {
    initialRetryTime: 100,
    retries: 3,
    factor: 2, // Exponential backoff
    multiplier: 1.5,
  },
});

(async () => {
  try {
    await producer.connect();
    console.log("✅ Kafka producer connected");

    process.on("SIGINT", async () => {
      console.log("🔄 Shutting down Kafka producer...");
      try {
        await producer.disconnect();
        console.log("✅ Kafka producer disconnected");
      } catch (error) {
        console.error("❌ Error during Kafka producer shutdown:", error);
      }
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Kafka producer connection failed:", error);
    process.exit(1);
  }
})();

export async function sendSensorDataToKafka(sensorData: {
  equipment_id: string;
  sensor_id: string;
  sensor_type: number;
  value: string;
  timestamp: string;
}) {
  try {
    await producer.send({
      topic: "sensor-data",
      messages: [
        {
          value: JSON.stringify(sensorData),
          key: `${sensorData.equipment_id}:${sensorData.sensor_id}`, // Optional: for partition routing
        },
      ],
    });
    console.log(`✅ Sensor data sent: ${sensorData.sensor_id} @ ${sensorData.timestamp}`);
  } catch (error) {
    console.error(`❌ Failed to send sensor data: ${JSON.stringify(sensorData)}`, error);
    // Optionally, you could implement a fallback mechanism here
    // Like writing to a local file or using a dead-letter queue
    throw error; // Re-throw to allow caller to handle
  }
}
