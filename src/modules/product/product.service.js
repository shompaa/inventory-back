/**
 * @typedef {Object} Perfume
 * @property {string} id
 * @property {string} name
 * @property {string} brand
 * @property {number} size
 * @property {number} price
 * @property {number} stock
 * @property {string} imageUrl
 * @property {string} description
 */

import { db } from "../../database/config.js";
import createHttpError from "http-errors";

export const findProducts = async ({ from, limit }) => {
  try {
    const ref = db.ref("/products");
    let query = ref.orderByKey();

    if (from) {
      query = query.startAt(from);
    }

    query = query.limitToFirst(limit);

    const snapshot = await query.once("value");
    const products = snapshot.val();

    const productsWithId = Object.entries(products).map(([id, product]) => {
      return { ...product, id };
    });

    return {
      data: productsWithId,
      total: productsWithId.length,
    };
  } catch (error) {
    throw error;
  }
};

export const findProductsBySearchParam = async ({ searchParam, limit }) => {
  try {
    const ref = db.ref("/products");
    const snapshot = await ref.once("value");
    const products = snapshot.val();

    const productsWithId = Object.entries(products).map(([id, product]) => {
      return { ...product, id };
    });

    const filteredProducts = productsWithId.filter(
      (product) =>
        product.name.toLowerCase().includes(searchParam.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchParam.toLowerCase())
    );

    if (!filteredProducts) {
      return {
        data: [],
        total: 0,
      };
    }

    return {
      data: filteredProducts.slice(0, limit),
      total: filteredProducts.length,
    };
  } catch (error) {
    throw error;
  }
};

export const findProductById = async (id) => {
  try {
    const ref = db.ref(`/products/${id}`);
    const snapshot = await ref.once("value");
    const product = snapshot.val();

    if (product) {
      return { id, ...product };
    } else {
      throw new createHttpError(404, "Product not found");
    }
  } catch (error) {
    throw error;
  }
};

export const createProduct = async (productData) => {
  try {
    const { user, ...product } = productData;
    product.isDeleted = false;
    const productsRef = db.ref("/products");
    const newProductRef = productsRef.push();
    await newProductRef.set(product);

    return { ...product, id: newProductRef.key };
  } catch (error) {
    throw error;
  }
};

export const editProduct = async (id, productData) => {
  try {
    const { user, ...product } = productData;

    const productRef = db.ref("/products/" + id);
    const snapshot = await productRef.once("value");
    const existingProduct = snapshot.val();

    if (!existingProduct) {
      throw new createHttpError(404, "Product not found");
    }

    const updates = {
      ...product,
      name: product.name || existingProduct.name,
      description: product?.description || existingProduct?.description,
      brand: product.brand || existingProduct.brand,
      size: product.size || existingProduct.size,
      price: product.price || existingProduct.price,
      stock: product.stock || existingProduct.stock,
      imageUrl: product?.imageUrl || existingProduct?.imageUrl,
      isDeleted: false,
    };

    await productRef.update(updates);

    const updatedSnapshot = await productRef.once("value");
    return { id, ...updatedSnapshot.val() };
  } catch (error) {
    throw error;
  }
};

export const removeProduct = async (id) => {
  try {
    const productRef = db.ref("/products/" + id);
    const snapshot = await productRef.once("value");
    const product = snapshot.val();

    if (!product) {
      throw new Error("Product not found");
    }

    await productRef.update({
      isDeleted: true,
    });

    const updatedSnapshot = await productRef.once("value");
    return { id, ...updatedSnapshot.val() };
  } catch (error) {
    throw error;
  }
};

export const addProductStock = async (id, quantityToAdd) => {
  try {
    const productRef = db.ref("/products/" + id);
    const snapshot = await productRef.once("value");
    const product = snapshot.val();

    if (!product) {
      throw new Error("Product not found");
    }

    const updatedStock = product.stock + quantityToAdd;

    await productRef.update({
      stock: updatedStock,
    });

    const updatedSnapshot = await productRef.once("value");
    return { id, ...updatedSnapshot.val() };
  } catch (error) {
    throw error;
  }
};

export const subtractProductStock = async (id, quantityToSubtract) => {
  try {
    const productRef = db.ref("/products/" + id);
    const snapshot = await productRef.once("value");
    const product = snapshot.val();

    if (!product) {
      throw new Error("Product not found");
    }

    const updatedStock = product.stock - quantityToSubtract;

    if (updatedStock < 0) {
      throw new Error("Insufficient product stock");
    }

    await productRef.update({
      stock: updatedStock,
    });

    const updatedSnapshot = await productRef.once("value");
    return { id, ...updatedSnapshot.val() };
  } catch (error) {
    throw error;
  }
};

export const findProductsWithLowStock = async ({ limit }) => {
  try {
    const ref = db.ref("/products");
    const snapshot = await ref.limitToFirst(limit).once("value");
    const products = snapshot.val();

    const productsWithId = Object.entries(products).map(([id, product]) => {
      return { ...product, id };
    });

    const filteredProducts = productsWithId.filter(
      (product) => product.stock <= 8
    );

    if (!filteredProducts) {
      return {
        data: [],
        total: 0,
      };
    }

    return {
      data: filteredProducts,
      total: filteredProducts.length,
    };
  } catch (error) {
    throw error;
  }
};

