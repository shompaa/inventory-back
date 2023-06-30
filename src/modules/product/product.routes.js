import express from "express";
import { check } from "express-validator";
import {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductsBySearch,
} from "./product.controller.js";
import {
  JWTValidation,
  Validation,
} from "../../middlewares/index.middleware.js";

const router = express.Router();

router.get("/", JWTValidation, getProducts);
router.get("/search/:search", JWTValidation, getProductsBySearch);
router.get("/:id", JWTValidation, getProduct);
router.post(
  "/",
  [
    JWTValidation,
    check("name", "Name is required").not().isEmpty(),
    check("brand", "Brand is required").not().isEmpty(),
    check("size", "Size is required").isNumeric(),
    check("price", "Price is required").isNumeric(),
    check("stock", "Stock is required").isNumeric(),
    Validation,
  ],
  addProduct
);
router.post(
  "/:id/stock",
  [
    JWTValidation,
    check("quantity", "Quantity is required").isNumeric(),
    check("action", "Action is required").isIn(["add", "remove"]),
    Validation,
  ],
  updateProductStock
);
router.put(
  "/:id",
  [
    JWTValidation,
    check("name", "Name is required").not().isEmpty(),
    check("brand", "Brand is required").not().isEmpty(),
    check("size", "Size is required").isNumeric(),
    check("price", "Price is required").isNumeric(),
    check("stock", "Stock is required").isNumeric(),
    Validation,
  ],
  updateProduct
);
router.delete("/:id", JWTValidation, deleteProduct);

export default router;
