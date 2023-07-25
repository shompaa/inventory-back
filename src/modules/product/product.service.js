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

import { db, storage } from "../../database/config.js";
import createHttpError from "http-errors";
import fs from "fs";

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

    const filteredProducts = productsWithId.filter(product => !product.isDeleted);

    return {
      data: filteredProducts,
      total: filteredProducts.length,
    };
  } catch (error) {
    throw error;
  }
};


export const findProductsPaginated = async ({ pageSize, startAt }) => {
  try {
    const ref = db.ref("/products");
    let query = ref.orderByKey();

    if (startAt) {
      query = query.startAt(startAt);
    }

    const snapshot = await query.limitToFirst(pageSize + 1).once("value");

    const products = snapshot.val();

    if (!products) {
      return {
        data: [],
        hasMore: false,
      };
    }

    const productsWithId = Object.entries(products)
      .map(([id, product]) => ({ ...product, id }))
      .filter((product) => product.deleted !== true);

    let nextPageStartAt = null;
    if (productsWithId.length > pageSize) {
      nextPageStartAt = productsWithId[productsWithId.length - 1].id;
      productsWithId.pop();
    }

    return {
      data: productsWithId,
      hasMore: nextPageStartAt !== null,
      startAt: nextPageStartAt,
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

export const createProduct = async (productData, file) => {
  try {
    const { user, ...product } = productData;
    product.isDeleted = false;

    if (file) {
      const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const uniqueName = Date.now() + "-" + file.originalname;
      const fileUpload = bucket.file(uniqueName);

      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      const streamPromise = new Promise((resolve, reject) => {
        blobStream.on("error", (error) => {
          reject(new createHttpError(404, `Bucket not found, ${error}`));
        });

        blobStream.on("finish", async () => {
          await fileUpload.makePublic();

          const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;

          product.imageUrl = url;

          const productsRef = db.ref("/products");
          const newProductRef = productsRef.push();
          await newProductRef.set(product);

          fs.unlink(file.path, (err) => {
            if (err) {
              console.error(`Failed to delete local image.${err}`);
            } else {
              console.log("Local image was deleted");
            }
          });

          resolve({ ...product, id: newProductRef.key });
        });
      });

      fs.createReadStream(file.path).pipe(blobStream);

      return await streamPromise;
    } else {
      product.imageUrl = productData.imageUrl || null;

      const productsRef = db.ref("/products");
      const newProductRef = productsRef.push();
      await newProductRef.set(product);

      return { ...product, id: newProductRef.key };
    }
  } catch (error) {
    throw error;
  }
};

export const editProduct = async (id, productData, file) => {
  try {
    const { user, ...product } = productData;

    const productRef = db.ref("/products/" + id);
    const snapshot = await productRef.once("value");
    const existingProduct = snapshot.val();

    if (!existingProduct) {
      throw new createHttpError(404, "Product not found");
    }

    if (file) {
      const bucket = storage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const uniqueName = Date.now() + "-" + file.originalname;
      const fileUpload = bucket.file(uniqueName);

      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      const streamPromise = new Promise((resolve, reject) => {
        blobStream.on("error", (error) => {
          reject(new createHttpError(404, `Bucket not found, ${error}`));
        });

        blobStream.on("finish", async () => {
          await fileUpload.makePublic();
        
          const url = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
        
          product.imageUrl = url;
        
          await productRef.update(product);
        
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error(`Failed to delete local image.${err}`);
            } else {
              console.log("Local image was deleted");
            }
          });
        
          resolve({ ...product, id: productRef.key });

        });
      });

      fs.createReadStream(file.path).pipe(blobStream);

      return await streamPromise;
    } else {
      product.imageUrl = productData.imageUrl || existingProduct?.imageUrl;
    }

    const updates = {
      ...product,
      name: product.name || existingProduct.name,
      description: product?.description || existingProduct?.description,
      brand: product.brand || existingProduct.brand,
      size: product.size || existingProduct.size,
      price: product.price || existingProduct.price,
      stock: product.stock || existingProduct.stock,
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
