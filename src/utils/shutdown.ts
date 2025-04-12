import { Server } from "http";
import mongoose from "mongoose";
import { client as cassandraClient } from "../cassandra/cassandra";
import { producer, kafka } from "../kafka/kafkaService";

type ShutdownOptions = {
  server?: Server;
  exitProcess?: boolean;
};

export async function gracefulShutdown(options: ShutdownOptions = { exitProcess: true }) {
  console.log("\n🔄 Graceful shutdown initiated...");

  try {
    // Shutdown Express server
    if (options.server) {
      await new Promise<void>((resolve, reject) => {
        options.server?.close((err) => {
          if (err) {
            console.error("❌ Error closing Express server:", err);
            reject(err);
          } else {
            console.log("✅ Express server closed");
            resolve();
          }
        });
      });
    }

    // Shutdown MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log("✅ MongoDB connection closed");
    }

    // Shutdown Cassandra
    await cassandraClient.shutdown();
    console.log("✅ Cassandra connection closed");

    // Shutdown Kafka
    await producer.disconnect();
    await kafka.logger().info("✅ Kafka producer disconnected");

    console.log("✅ Graceful shutdown completed");

    if (options.exitProcess) {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error during graceful shutdown:", error);
    process.exit(1);
  }
}
