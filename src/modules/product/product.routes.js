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
  getProductsWithLowStock,
  getProductsPaginated,
} from "./product.controller.js";
import {
  JWTValidation,
  RoleValidation,
  Validation,
} from "../../middlewares/index.middleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "src/uploads/"); // Aquí puedes cambiar a tu directorio de destino
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage, dest: "uploads/" });

router.get("/", JWTValidation, getProducts);
router.get("/paginated", JWTValidation, getProductsPaginated);
router.get("/search/:search", JWTValidation, getProductsBySearch);
router.get(
  "/low-stock",
  [JWTValidation, RoleValidation],
  getProductsWithLowStock
);
router.get("/:id", JWTValidation, getProduct);
router.post(
  "/",
  upload.single("image"),
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
