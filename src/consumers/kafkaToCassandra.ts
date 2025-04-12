// src/services/kafka/kafkaToCassandra.ts
import { config } from "dotenv";
import { Client } from "cassandra-driver";
import { EachMessagePayload } from "kafkajs";
import { kafka } from "../kafka/kafkaService";

config();

const cassandraClient = new Client({
  contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || "localhost").split(","),
  localDataCenter: process.env.CASSANDRA_DATACENTER || "datacenter1",
  keyspace: "sensor_data",
});

async function insertSensorDataToCassandra() {
  await cassandraClient.connect();
  const cassandraConsumer = kafka.consumer({ groupId: "sensor-to-cassandra", heartbeatInterval: 0 });
  await cassandraConsumer.connect();
  await cassandraConsumer.subscribe({ topic: "sensor-data", fromBeginning: false });

  await cassandraConsumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      try {
        if (!message.value) return;
        const data = JSON.parse(message.value.toString());
        const query = `
          INSERT INTO sensor_readings (equipment_id, sensor_id, timestamp, value)
          VALUES (?, ?, ?, ?)
        `;
        const params = [data.equipment_id, data.sensor_id, new Date(data.timestamp), data.value];
        await cassandraClient.execute(query, params, { prepare: true });
        console.log("inserted to cassandra", data);
      } catch (error) {
        console.error("Error processing message. Skipping.", error);
        // Optional: Push message to a dead-letter topic
        // DO NOT LOSE ANY REQUEST
      }
    },
  });
}

insertSensorDataToCassandra().catch((error) => {
  console.error("❌ Error in Kafka-Cassandra consumer:", error);
});
