module.exports = {
  apps: [
    {
      name: "api",
      script: "build/app.js",
      interpreter: "node",
      exec_mode: "cluster",
      watch: false,
      instances: 2,
    },
    {
      name: "mongo-consumer",
      script: "build/consumers/kafkaToMongo.js",
      interpreter: "node",
      exec_mode: "fork",
      watch: false,
      instances: 2,
    },
    {
      name: "cassandra-consumer",
      script: "build/consumers/kafkaToCassandra.js",
      interpreter: "node",
      exec_mode: "fork",
      instances: 3,
      watch: false,
    },
  ],
};
