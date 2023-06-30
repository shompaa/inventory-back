import createHttpError from "http-errors";
import {
  findProductById,
  subtractProductStock,
} from "../product/product.service.js";
import { db } from "../../database/config.js";
import { uuid } from "../../utils/index.js";

export const findSales = async ({ limit }) => {
  try {
    const ref = db.ref("/sales");
    const snapshot = await ref.orderByKey().limitToFirst(limit).once("value");
    const sales = snapshot.val();

    if (!sales) {
      return {
        data: [],
        total: 0,
      };
    }

    const salesWithId = Object.entries(sales).map(([id, sale]) => ({
      ...sale,
      id,
    }));

    return {
      data: salesWithId,
      total: salesWithId.length,
    };
  } catch (error) {
    throw error;
  }
};

export const findSaleById = async (id) => {
  try {
    const ref = db.ref(`/sales/${id}`);
    const snapshot = await ref.once("value");
    const sale = snapshot.val();

    if (sale) {
      return { id, ...sale };
    } else {
      throw new createHttpError(404, "Sale not found");
    }
  } catch (error) {
    throw error;
  }
};

export const createSale = async (sale) => {
  try {
    const { total, products, user } = sale;
    const date = new Date().toISOString();
    let totalNuevo = 0;
    let productDetails = [];
    const orderId = uuid();

    for (const product of products) {
      const foundProduct = await findProductById(product.id);
      if (!foundProduct) {
        throw new Error(`Product with id ${product.id} not found`);
      }

      const productTotal = foundProduct.price * product.quantity;
      totalNuevo += productTotal;

      await subtractProductStock(product.id, product.quantity);

      productDetails.push({
        product: foundProduct,
        quantity: product.quantity,
        total: productTotal,
        deleted: false,
      });
    }

    if (totalNuevo !== total) {
      throw new createHttpError(
        `Product total ${product.total} does not match with the calculated total ${productTotal}`
      );
    }

    const newSale = {
      orderId,
      seller: user,
      products: productDetails,
      total,
      date,
    };

    const newSaleRef = db.ref("/sales").push();
    await newSaleRef.set(newSale);

    return { ...newSale, id: newSaleRef.key };
  } catch (error) {
    throw error;
  }
};

export const removeSale = async (id) => {
  try {
    const saleRef = db.ref("/sales/" + id);
    const snapshot = await saleRef.once("value");
    const sale = snapshot.val();

    if (!sale) {
      throw new Error("Sale not found");
    }

    await saleRef.update({
      deleted: true,
      deletedAt: Date.now(),
    });

    const updatedSnapshot = await saleRef.once("value");
    return { id, ...updatedSnapshot.val() };
  } catch (error) {
    throw error;
  }
};
