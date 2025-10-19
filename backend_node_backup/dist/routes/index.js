"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coins_1 = __importDefault(require("./coins"));
const router = (0, express_1.Router)();
router.use("/api", coins_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map