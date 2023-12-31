import {
  findProducts,
  findProductById,
  createProduct,
  editProduct,
  removeProduct,
  addProductStock,
  subtractProductStock,
  findProductsBySearchParam,
  findProductsWithLowStock,
  findProductsPaginated,
} from "./product.service.js";

export const getProducts = async (req, res) => {
  const from = Number(req.query.from) || null;
  const limit = Number(req.query.limit) || 10;
  const { data, total } = await findProducts({ from, limit });

  res.status(200).json({
    data,
    total,
  });
};

export const getProductsPaginated = async (req, res) => {
  let startAt = Number(req.query.startAt);
  startAt = isNaN(startAt) || startAt < 0 ? null : startAt;
  let pageSize = Number(req.query.pageSize);
  pageSize = isNaN(pageSize) || pageSize <= 0 ? 5 : pageSize;
  const {
    data,
    hasMore,
    startAt: start,
  } = await findProductsPaginated({ pageSize, startAt });

  res.status(200).json({
    data,
    hasMore,
    startAt: start,
  });
};

export const getProductsBySearch = async (req, res) => {
  const from = Number(req.query.from) || 0;
  const limit = Number(req.query.limit) || 10;
  const searchParam = req.params.search?.toString() || "";
  const { data, total } = await findProductsBySearchParam({
    searchParam,
    limit,
  });

  res.status(200).json({
    data,
    total,
  });
};

export const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await findProductById(id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const { body, file } = req;
    const data = await createProduct(body, file);
    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { file } = req;
    const { id } = req.params;
    const product = await editProduct(id, req.body, file);
    res.status(200).json({
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = await removeProduct(id);
    res.status(200).json({
      data: email,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProductStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, action } = req.body;
    let product;

    if (action === "add") {
      product = await addProductStock(id, quantity);
    }

    if (action === "remove") {
      product = await subtractProductStock(id, quantity);
    }

    res.status(200).json({
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductsWithLowStock = async (req, res, next) => {
  try {
    // const from = Number(req.query.from) || 0;
    const limit = Number(req.query.limit) || 10;
    const { data } = await findProductsWithLowStock({ limit });

    const productsWithLowStock = data.filter((product) => product.stock < 5);

    res.status(200).json({
      data: productsWithLowStock,
      total: productsWithLowStock.length,
    });
  } catch (error) {
    next(error);
  }
};
