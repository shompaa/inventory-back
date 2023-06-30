import { findSales, findSaleById, createSale, removeSale } from "./sale.service.js";

export const getSales = async (req, res) => {
  const from = Number(req.query.from) || 0;
  const limit = Number(req.query.limit) || 5;
  const { data, total } = await findSales({ from, limit });

  res.status(200).json({
    data,
    total,
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
