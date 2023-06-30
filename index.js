import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./src/utils/index.js";
import { usersRouter } from "./src/modules/user/index.js";
import { authRouter } from "./src/modules/auth/index.js";
import { productsRouter } from "./src/modules/product/index.js";
import { salesRouter } from "./src/modules/sale/index.js";


const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Welcome to server");
});

app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/sales", salesRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
