import { Router } from "express";
import {
  getCoinHistory,
  getCoinsWithMetrics,
  getMarketOverview,
} from "../services/metricsService";
import { asyncHandler } from "../utils/asyncHandler";
import { SUPPORTED_TIMEFRAMES } from "../config";

const router = Router();

router.get(
  "/coins",
  asyncHandler(async (req, res) => {
    const ids = typeof req.query.ids === "string" ? req.query.ids.split(",") : undefined;
    const vsCurrency = typeof req.query.vs_currency === "string" ? req.query.vs_currency : undefined;

    const data = await getCoinsWithMetrics({
      ...(ids ? { ids } : {}),
      ...(vsCurrency ? { vsCurrency } : {}),
    });

    res.json(data);
  })
);

router.get(
  "/coins/:id/history",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const timeframeKey = (req.query.timeframe as string) || "30D";
    const vsCurrency = (req.query.vs_currency as string) || undefined;

    if (!id) {
      res.status(400).json({ message: "Coin id is required" });
      return;
    }

    if (!(timeframeKey in SUPPORTED_TIMEFRAMES)) {
      res.status(400).json({
        message: `Invalid timeframe "${timeframeKey}". Supported: ${Object.keys(SUPPORTED_TIMEFRAMES).join(", ")}`,
      });
      return;
    }

    const history = await getCoinHistory({
      id,
      timeframeKey: timeframeKey as keyof typeof SUPPORTED_TIMEFRAMES,
      ...(vsCurrency ? { vsCurrency } : {}),
    });

    res.json(history);
  })
);

router.get(
  "/market/overview",
  asyncHandler(async (req, res) => {
    const vsCurrency = (req.query.vs_currency as string) || undefined;
    const overview = await getMarketOverview(vsCurrency);
    res.json(overview);
  })
);

export default router;
