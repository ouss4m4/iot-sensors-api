import { Client } from "cassandra-driver";

const client = new Client({
  contactPoints: (process.env.CASSANDRA_CONTACT_POINTS || "localhost").split(","),
  localDataCenter: process.env.CASSANDRA_DATACENTER || "datacenter1",
  keyspace: "sensor_data",
});

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      return;
    } catch (err: any) {
      console.error(`❌ Cassandra connection failed (attempt ${i + 1}/${retries}): ${err?.message ?? ""}`);
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function initCassandraSchema() {
  await connectWithRetry();

  await client.execute(`
    CREATE KEYSPACE IF NOT EXISTS sensor_data
    WITH replication = {
      'class': 'SimpleStrategy',
      'replication_factor': 1
    };
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS sensor_readings (
      equipment_id TEXT,
      sensor_id TEXT,
      timestamp TIMESTAMP,
      value TEXT,
      PRIMARY KEY ((equipment_id), sensor_id, timestamp)
    ) WITH CLUSTERING ORDER BY (sensor_id ASC, timestamp DESC);
  `);

  console.log("✅ Cassandra schema initialized.");
}

export { client, initCassandraSchema };
