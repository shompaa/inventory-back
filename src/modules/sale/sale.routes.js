import express from "express";
import { check } from "express-validator";
import {
    getSales,
    getSale,
    addSale,
    deleteSale,
} from "./sale.controller.js";
import {
  JWTValidation,
  Validation,
} from "../../middlewares/index.middleware.js";

const router = express.Router();

router.get("/", JWTValidation, getSales);
router.get("/:id", JWTValidation, getSale);
router.post(
  "/",
  [
    JWTValidation,
    check("products", "Products are required").not().isEmpty(),
    Validation,
  ],
  addSale
);
router.delete("/:id", JWTValidation, deleteSale);

export default router;
