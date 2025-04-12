import { createClient } from "@clickhouse/client";

export const clickhouse = createClient({
  url: "http://localhost:8123",
  username: "default",
  password: "secret",
  database: "default",
});
