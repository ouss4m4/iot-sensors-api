// src/services/kafkaService.js
import { Kafka } from "kafkajs";
import cassandra from "cassandra-driver";

const kafka = new Kafka({
  clientId: "sensor-service",
  brokers: ["kafka:9093"],
});

const client = new cassandra.Client({
  contactPoints: ["cassandra"],
  localDataCenter: "DC1",
  keyspace: "sensor_data",
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "sensor-group" });

async function sendSensorDataToKafka(sensorData: any) {
  await producer.connect();
  await producer.send({
    topic: "sensor-data",
    messages: [{ value: JSON.stringify(sensorData) }],
  });
  console.log("Sensor data sent to Kafka");
  console.log(sensorData);
}

async function consumeSensorData() {
  await consumer.connect();
  await consumer.subscribe({ topic: "sensor-data", fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        console.error("Received message with null value");
        return;
      }
      const sensorData = JSON.parse(message.value.toString());
      const query = "INSERT INTO sensor_data (id, equipment_id, sensor_type, value, timestamp) VALUES (?, ?, ?, ?, ?)";
      const params = [
        cassandra.types.Uuid.random(),
        sensorData.equipment_id,
        sensorData.sensor_type,
        sensorData.value,
        sensorData.timestamp,
      ];
      await client.execute(query, params, { prepare: true });
      console.log("Sensor data saved to Cassandra");
    },
  });
}

module.exports = { sendSensorDataToKafka, consumeSensorData };
