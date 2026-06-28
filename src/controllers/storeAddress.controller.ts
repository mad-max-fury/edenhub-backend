import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import StoreAddressModel from "../models/storeAddress.model";
import { validateAndGetCode } from "../services/shipping.service";
import AppError from "../errors/appError";

export const listHandler = catchAsync(async (_req: Request, res: Response) => {
  const addresses = await StoreAddressModel.find().sort({ isDefault: -1, createdAt: -1 }).lean();
  res.json({ status: "success", data: addresses });
});

export const createHandler = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, address, city, state, country, postalCode, isDefault } = req.body;

  const fullAddress = `${address}, ${city}, ${state}, ${country || "Nigeria"}`;
  const { addressCode } = await validateAndGetCode({ name, email, phone, address: fullAddress });

  if (isDefault) {
    await StoreAddressModel.updateMany({}, { isDefault: false });
  }

  const doc = await StoreAddressModel.create({
    name, email, phone, address, city, state,
    country: country || "Nigeria", postalCode,
    addressCode: String(addressCode),
    isDefault: !!isDefault,
  });

  res.status(201).json({ status: "success", data: doc });
});

export const updateHandler = catchAsync(async (req: Request, res: Response) => {
  const { name, email, phone, address, city, state, country, postalCode, isDefault } = req.body;
  const doc = await StoreAddressModel.findById(req.params.id);
  if (!doc) throw new AppError("Address not found", 404);

  const fullAddress = `${address || doc.address}, ${city || doc.city}, ${state || doc.state}, ${country || doc.country}`;
  const { addressCode } = await validateAndGetCode({
    name: name || doc.name,
    email: email || doc.email,
    phone: phone || doc.phone,
    address: fullAddress,
  });

  if (isDefault) {
    await StoreAddressModel.updateMany({ _id: { $ne: doc._id } }, { isDefault: false });
  }

  Object.assign(doc, {
    ...(name && { name }), ...(email && { email }), ...(phone && { phone }),
    ...(address && { address }), ...(city && { city }), ...(state && { state }),
    ...(country && { country }), ...(postalCode !== undefined && { postalCode }),
    addressCode: String(addressCode),
    ...(isDefault !== undefined && { isDefault }),
  });
  await doc.save();

  res.json({ status: "success", data: doc });
});

export const deleteHandler = catchAsync(async (req: Request, res: Response) => {
  const doc = await StoreAddressModel.findByIdAndDelete(req.params.id);
  if (!doc) throw new AppError("Address not found", 404);
  res.status(204).json({ status: "success" });
});

export const setDefaultHandler = catchAsync(async (req: Request, res: Response) => {
  await StoreAddressModel.updateMany({}, { isDefault: false });
  const doc = await StoreAddressModel.findByIdAndUpdate(req.params.id, { isDefault: true }, { new: true });
  if (!doc) throw new AppError("Address not found", 404);
  res.json({ status: "success", data: doc });
});
