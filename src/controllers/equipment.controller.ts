import { Request, Response } from "express";
import { Equipment } from "../models/equipment";

export const createEquipment = async (req: Request, res: Response) => {
  try {
    const equipment = new Equipment(req.body);
    // equipment.create
    await equipment.save();
    res.status(201).json(equipment);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
};

export const getAllEquipment = async (_: Request, res: Response) => {
  const equipment = await Equipment.find();
  res.json(equipment);
};
