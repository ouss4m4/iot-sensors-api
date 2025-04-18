import mongoose, { Schema, Document } from "mongoose";

export interface IReport {
  sensor_id: string;
  equipment_id: string;
  sensor_type: string;
  total_avg: number;
  count: number;
  min: number;
  max: number;
  stat_date: string;
  stat_hour: string;
  created_at: Date;
}
export interface IReportDocument extends IReport, Document {}

const reportSchema = new Schema<IReportDocument>({
  sensor_id: { type: String, required: true },
  equipment_id: { type: String, required: true },
  sensor_type: { type: String, required: true },

  total_avg: { type: Number, required: true },
  count: { type: Number, required: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },

  stat_date: { type: String, required: true },
  stat_hour: { type: String, required: true },

  created_at: { type: Date, default: Date.now },
});

export const Report = mongoose.model<IReportDocument>("Report", reportSchema);
