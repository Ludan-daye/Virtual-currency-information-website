import { Router } from "express";
import coinRoutes from "./coins";

const router = Router();

router.use("/api", coinRoutes);

export default router;
