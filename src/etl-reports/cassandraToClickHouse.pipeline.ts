import { client as cassandraClient, initCassandraSchema } from "../cassandra/cassandra";
import { clickhouse } from "../clickhouse/clickhouse";

function getTimeRange() {
  const now = new Date();
  const isZeroMinute = now.getMinutes() === 0;

  const start = new Date(now);
  start.setMinutes(0, 0, 0);

  const end = new Date(now);
  end.setMinutes(59, 59, 999);

  if (isZeroMinute) {
    start.setHours(start.getHours() - 1);
    end.setHours(end.getHours() - 1);
  }

  return { start, end };
}

function formatClickhouseDate(date: Date): string {
  return date.toISOString().replace("T", " ").split(".")[0]; // "2025-04-12 17:00:00"
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

async function runETL() {
  const { start, end } = getTimeRange();

  const query = `
    SELECT sensor_id, equipment_id, value, timestamp
    FROM sensor_readings
    WHERE timestamp >= ? AND timestamp <= ?
    ALLOW FILTERING
  `;
  await initCassandraSchema();
  const result = await cassandraClient.execute(query, [start, end], {
    prepare: true,
  });

  const readings = result.rows;
  const grouped = new Map<
    string,
    {
      sensor_id: string;
      equipment_id: string;
      sensor_type: string;
      values: number[];
    }
  >();

  for (const row of readings) {
    const key = `${row.sensor_id}-${row.equipment_id}-${row.sensor_type ?? 1}`;
    const group = grouped.get(key) || {
      sensor_id: row.sensor_id,
      equipment_id: row.equipment_id,
      sensor_type: "1",
      values: [] as number[],
    };
    group.values.push(row.value);
    grouped.set(key, group);
  }

  const stat_hour = start.getHours().toString().padStart(2, "0") + ":00";
  const stat_date = formatDate(start);

  const rows = Array.from(grouped.values()).map((group) => {
    const min = Math.min(...group.values);
    const max = Math.max(...group.values);
    const avg = group.values.reduce((a, b) => a + b, 0) / group.values.length;

    return {
      sensor_id: group.sensor_id,
      equipment_id: group.equipment_id,
      sensor_type: group.sensor_type,
      min,
      max,
      avg,
      stat_date,
      stat_hour,
      created_at: formatClickhouseDate(new Date()), // <- formatted string!
    };
  });

  if (rows.length === 0) {
    console.log("No data to insert.");
    return;
  }

  await clickhouse.insert({
    table: "reports",
    values: rows,
    format: "JSONEachRow",
  });

  console.log(`ETL completed. Inserted ${rows.length} rows.`);
}

runETL().catch((err) => {
  console.error("ETL failed:", err);
  process.exit(1);
});
