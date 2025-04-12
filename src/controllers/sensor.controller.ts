import { Request, Response } from "express";
import { Sensor } from "../models/sensor";
import { Equipment } from "../models/equipment";

export const createSensor = async (req: Request, res: Response): Promise<void> => {
  try {
    const equipment = await Equipment.findOne({ _id: req.body.equipment_id });

    if (!equipment) {
      res.status(404).json({ error: "Equipment not found" });
      return;
    }
    const sensor = new Sensor(req.body);
    await sensor.save();
    res.status(201).json(sensor);
  } catch (err) {
    res.status(400).json({ error: err });
  }
};

export const getSensors = async (_: Request, res: Response) => {
  const sensors = await Sensor.find();
  res.json(sensors);
};
