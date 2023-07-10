import {
  findSales,
  findSaleById,
  createSale,
  removeSale,
} from "./sale.service.js";

export const getSales = async (req, res) => {
  const startAt = req.query.startAt || null;
  const pageSize = Number(req.query.pageSize) || 10;
  const { data, hasMore } = await findSales({ pageSize, startAt });

  res.status(200).json({
    data,
    hasMore,
  });
};

export const getSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await findSaleById(id);
    res.status(200).json({ data });
  } catch (error) {
    next(error);
  }
};

export const addSale = async (req, res, next) => {
  try {
    const data = await createSale(req.body);
    res.status(201).json({
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSale = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await removeSale(id);
    res.status(200).json({
      data,
    });
  } catch (error) {
    next(error);
  }
};
