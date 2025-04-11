// src/config/cassandra.ts (or src/cassandra/client.ts)
import { Client } from "cassandra-driver";

const client = new Client({
  contactPoints: ["cassandra"],
  localDataCenter: "DC1",
  keyspace: "sensor_data",
});

export async function initCassandraSchema() {
  await client.connect();

  await client.execute(`
    CREATE KEYSPACE IF NOT EXISTS sensor_data
    WITH replication = {
      'class': 'SimpleStrategy',
      'replication_factor': 1
    };
  `);

  await client.execute(`USE sensor_data`);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      equipment_id TEXT,
      sensor_id TEXT,
      timestamp TIMESTAMP,
      value DOUBLE,
      PRIMARY KEY ((equipment_id), sensor_id, timestamp)
    ) WITH CLUSTERING ORDER BY (sensor_id ASC, timestamp DESC);
  `);

  console.log("✅ Cassandra schema initialized.");
}

export { client };
