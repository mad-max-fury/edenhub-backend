import { Request, Response } from "express";
import catchAsync from "../utils/error.utils";
import * as adService from "../services/ad.service";
import {
  getPaginationMetadata,
  IPaginationQuery,
} from "../utils/pagination.utils";

export const createAdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const ad = await adService.createAd(req.body);
    res.status(201).json({
      status: "success",
      message: "Ad created successfully",
      data: ad,
    });
  },
);

export const getAdsHandler = catchAsync(async (req: Request, res: Response) => {
  const query: IPaginationQuery = {
    pageNumber: parseInt(req.query.pageNumber as string) || 1,
    pageSize: parseInt(req.query.pageSize as string) || 20,
    searchTerm: req.query.searchTerm as string,
  };

  const { ads, totalCount } = await adService.getAllAds(query);
  const metadata = getPaginationMetadata(
    totalCount,
    query.pageNumber,
    query.pageSize,
  );

  res.status(200).json({
    status: "success",
    message: "Ads retrieved successfully",
    data: { data: ads, metadata },
  });
});

export const getActiveAdsHandler = catchAsync(
  async (req: Request, res: Response) => {
    const ads = await adService.getActiveAds(req.query.placement as string);
    res.status(200).json({
      status: "success",
      message: "Active ads retrieved successfully",
      data: ads,
    });
  },
);

export const getAdByIdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const ad = await adService.getAdWithProducts(req.params.id);
    res.status(200).json({
      status: "success",
      message: "Ad retrieved successfully",
      data: ad,
    });
  },
);

export const updateAdHandler = catchAsync(
  async (req: Request, res: Response) => {
    const ad = await adService.updateAd(req.params.id, req.body);
    res.status(200).json({
      status: "success",
      message: "Ad updated successfully",
      data: ad,
    });
  },
);

export const deleteAdHandler = catchAsync(
  async (req: Request, res: Response) => {
    await adService.deleteAd(req.params.id);
    res.status(204).json({ status: "success", data: null });
  },
);
