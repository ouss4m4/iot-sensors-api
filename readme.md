# High Traffic Ingestion API

sample API for a system where sensors are put on equipments to transmit data to API.

Complexity with this stype of setup is the huge traffic that sensors send
and with every new equipement (clients can have a fleet) hundreds of sensors are added

## Solution

- Cassandra to store the raw request (for reconsiliation, archive)
- MongoDb to store the Sensor and the Equipment Models. with the Report
- Kafka to ingest traffic load.
- group of consumers for EachMessage to direct inserts to Cassanda
- group of consumers to aggregate a group of request into a report. to MONGO
- ETL to datawarehouse for OLAP
