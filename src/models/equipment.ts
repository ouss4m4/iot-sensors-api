import mongoose from "mongoose";

export interface IEquipment extends Document {
  name: string;
  client_id: string;
  created_at: Date;
}

const equipmentSchema = new mongoose.Schema<IEquipment>({
  name: { type: String, required: true },
  client_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const Equipment = mongoose.model<IEquipment>("Equipment", equipmentSchema);
