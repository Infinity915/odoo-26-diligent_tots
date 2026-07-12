const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const where = { deletedAt: null };
    if (req.query.status) {
      where.status = req.query.status;
    }

    const [drivers, total] = await prisma.$transaction([
      prisma.driver.findMany({ where, skip, take: limit }),
      prisma.driver.count({ where })
    ]);

    res.json({
      success: true,
      data: drivers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const driver = await prisma.driver.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });
    if (!driver) {
      const error = new Error('Driver not found');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body, expiryDate: new Date(req.body.expiryDate) };
    const driver = await prisma.driver.create({ data });
    res.status(201).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    
    const driver = await prisma.driver.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data
    });
    
    if (driver.count === 0) {
      const error = new Error('Driver not found or already deleted');
      error.status = 404;
      throw error;
    }

    const updatedDriver = await prisma.driver.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: updatedDriver });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const driver = await prisma.driver.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    if (driver.count === 0) {
      const error = new Error('Driver not found or already deleted');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: { message: 'Driver successfully deleted' } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, softDelete };
