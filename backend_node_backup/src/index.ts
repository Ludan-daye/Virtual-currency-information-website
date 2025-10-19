import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { PORT } from "./config";
import { logger } from "./utils/logger";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use(routes);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API server listening on port ${PORT}`);
});
