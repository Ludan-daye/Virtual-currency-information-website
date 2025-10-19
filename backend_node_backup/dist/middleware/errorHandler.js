"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const logger_1 = require("../utils/logger");
const httpError_1 = require("../utils/httpError");
function errorHandler(err, req, res, _next) {
    const status = err instanceof httpError_1.HttpError ? err.status : 500;
    if (status >= 500) {
        logger_1.logger.error(`Unhandled error on ${req.method} ${req.url}`, err);
    }
    else {
        logger_1.logger.warn(`Request error on ${req.method} ${req.url}: ${err.message}`);
    }
    res.status(status).json({
        message: err.message || "Unexpected server error",
    });
}
//# sourceMappingURL=errorHandler.js.map