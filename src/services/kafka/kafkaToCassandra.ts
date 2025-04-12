// src/services/kafka/kafkaToCassandra.ts
import { kafka } from "./kafkaService";
import { Client } from "cassandra-driver";

const cassandraClient = new Client({
  contactPoints: ["localhost"],
  localDataCenter: "datacenter1",
  keyspace: "sensor_data",
});

async function insertSensorDataToCassandra() {
  await cassandraClient.connect();
  const cassandraConsumer = kafka.consumer({ groupId: "sensor-to-cassandra", heartbeatInterval: 1 });
  await cassandraConsumer.connect();
  await cassandraConsumer.subscribe({ topic: "sensor-data", fromBeginning: false });

  await cassandraConsumer.run({
    eachMessage: async ({ message }) => {
      try {
        console.log("*********** KAFKA TO CASANDRA******************");
        if (!message.value) return;
        const data = JSON.parse(message.value.toString());
        const query = `
          INSERT INTO sensor_readings (equipment_id, sensor_id, timestamp, value)
          VALUES (?, ?, ?, ?)
        `;
        const params = [data.equipment_id, data.sensor_id, new Date(data.timestamp), data.value];
        await cassandraClient.execute(query, params, { prepare: true });
        console.log("Sensor data written to Cassandra:", data);
      } catch (error) {
        console.error("Error processing message. Skipping.", error);
        // Optional: Push message to a dead-letter topic
      }
    },
  });
}

insertSensorDataToCassandra();
