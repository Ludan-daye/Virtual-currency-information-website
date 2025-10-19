"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const metricsService_1 = require("../services/metricsService");
const asyncHandler_1 = require("../utils/asyncHandler");
const config_1 = require("../config");
const router = (0, express_1.Router)();
router.get("/coins", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const ids = typeof req.query.ids === "string" ? req.query.ids.split(",") : undefined;
    const vsCurrency = typeof req.query.vs_currency === "string" ? req.query.vs_currency : undefined;
    const data = await (0, metricsService_1.getCoinsWithMetrics)({
        ...(ids ? { ids } : {}),
        ...(vsCurrency ? { vsCurrency } : {}),
    });
    res.json(data);
}));
router.get("/coins/:id/history", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const timeframeKey = req.query.timeframe || "30D";
    const vsCurrency = req.query.vs_currency || undefined;
    if (!id) {
        res.status(400).json({ message: "Coin id is required" });
        return;
    }
    if (!(timeframeKey in config_1.SUPPORTED_TIMEFRAMES)) {
        res.status(400).json({
            message: `Invalid timeframe "${timeframeKey}". Supported: ${Object.keys(config_1.SUPPORTED_TIMEFRAMES).join(", ")}`,
        });
        return;
    }
    const history = await (0, metricsService_1.getCoinHistory)({
        id,
        timeframeKey: timeframeKey,
        ...(vsCurrency ? { vsCurrency } : {}),
    });
    res.json(history);
}));
router.get("/market/overview", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const vsCurrency = req.query.vs_currency || undefined;
    const overview = await (0, metricsService_1.getMarketOverview)(vsCurrency);
    res.json(overview);
}));
exports.default = router;
//# sourceMappingURL=coins.js.map