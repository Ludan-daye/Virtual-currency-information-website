import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";
import { HttpError } from "../utils/httpError";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) {
    logger.error(`Unhandled error on ${req.method} ${req.url}`, err);
  } else {
    logger.warn(`Request error on ${req.method} ${req.url}: ${err.message}`);
  }

  res.status(status).json({
    message: err.message || "Unexpected server error",
  });
}
