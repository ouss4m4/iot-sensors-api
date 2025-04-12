// src/services/kafka/kafkaToCassandra.ts
import { Client } from "cassandra-driver";
import { kafka } from "./kafkaService";

const cassandraClient = new Client({
  contactPoints: ["cassandra"],
  localDataCenter: "datacenter1",
  keyspace: "sensor_data",
});

export async function insertSensorDataToCassandra() {
  await cassandraClient.connect();
  const cassandraConsumer = kafka.consumer({ groupId: "sensor-to-cassandra" });
  await cassandraConsumer.connect();
  await cassandraConsumer.subscribe({ topic: "sensor-data", fromBeginning: false });

  await cassandraConsumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const data = JSON.parse(message.value.toString());
      const query = `
        INSERT INTO sensor_readings (equipment_id, sensor_id, timestamp, value)
        VALUES (?, ?, ?, ?)
      `;
      const params = [data.equipment_id, data.sensor_type, new Date(data.timestamp), data.value];
      await cassandraClient.execute(query, params, { prepare: true });
      console.log("Sensor data written to Cassandra:", data);
    },
  });
}
