"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
}));
app.use(express_1.default.json());
app.get("/healthz", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});
app.use(routes_1.default);
app.use(errorHandler_1.errorHandler);
app.listen(config_1.PORT, () => {
    logger_1.logger.info(`API server listening on port ${config_1.PORT}`);
});
//# sourceMappingURL=index.js.map