import { Request, Response } from "express";
import { Report } from "../models/report";

export const createReports = async (req: Request, res: Response): Promise<void> => {
  const { stat_date, stat_min, sensor_id, equipment_id, min, max, avg, sensor_type } = req.body;

  if (!stat_date || !stat_min || !sensor_id || !equipment_id || !min || !max || !avg || !sensor_type) {
    res.status(400).json({ error: "missing params" });
    return;
  }

  const report = new Report(req.body);
  await report.save();
  // const reports = await Report.cre(query);
  res.status(200).json(report);
};

export const getReports = async (req: Request, res: Response) => {
  const { equipment_id, sensor_type, date } = req.query;

  const query: any = {};
  if (equipment_id) query.equipment_id = equipment_id;
  if (sensor_type) query.sensor_type = sensor_type;
  if (date) query.stat_date = date;

  const reports = await Report.find(query);
  res.json(reports);
};
