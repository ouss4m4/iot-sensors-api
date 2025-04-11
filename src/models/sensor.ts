import mongoose from "mongoose";

export interface ISensor extends Document {
  equipment_id: string;
  type: number;
  unit: string;
  created_at: Date;
}

const sensorSchema = new mongoose.Schema<ISensor>({
  equipment_id: { type: String, ref: "Equipment", required: true },
  type: { type: Number, required: true },
  unit: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const Sensor = mongoose.model<ISensor>("Sensor", sensorSchema);
