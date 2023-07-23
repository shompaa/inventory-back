import createHttpError from "http-errors";
import {
  findProductById,
  subtractProductStock,
} from "../product/product.service.js";
import { db } from "../../database/config.js";
import { uuid } from "../../utils/index.js";

export const findSales = async ({ pageSize, startAt }) => {
  try {
    const ref = db.ref("/sales");
    let query = ref
      .orderByChild("date")
      .startAt(startAt)
      .limitToLast(pageSize + 1);
    const snapshot = await query.once("value");

    const sales = snapshot.val();
    if (!sales) {
      return {
        data: [],
        hasMore: false,
      };
    }

    const salesWithId = Object.entries(sales)
      .map(([id, sale]) => ({ ...sale, id }))
      .filter((sale) => sale.deleted !== true);
    salesWithId.reverse();

    return {
      data: salesWithId.slice(0, pageSize),
      hasMore: salesWithId.length > pageSize,
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
    const { total, products, user, voucher } = sale;
    const dateInChile = new Date().toLocaleString("en-US", {
      timeZone: "America/Santiago",
    });
    const date = new Date(dateInChile).toISOString();
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
        `Product total ${total} does not match with the calculated total ${totalNuevo}`
      );
    }

    const newSale = {
      orderId,
      voucher,
      seller: user,
      products: productDetails,
      total,
      date,
      deleted: false,
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
