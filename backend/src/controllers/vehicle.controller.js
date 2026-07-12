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

    const [vehicles, total] = await prisma.$transaction([
      prisma.vehicle.findMany({ where, skip, take: limit }),
      prisma.vehicle.count({ where })
    ]);

    res.json({
      success: true,
      data: vehicles,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, deletedAt: null }
    });
    if (!vehicle) {
      const error = new Error('Vehicle not found');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.create({
      data: req.body
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: req.body
    });
    
    if (vehicle.count === 0) {
      const error = new Error('Vehicle not found or already deleted');
      error.status = 404;
      throw error;
    }

    const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
    res.json({ success: true, data: updatedVehicle });
  } catch (error) {
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    if (vehicle.count === 0) {
      const error = new Error('Vehicle not found or already deleted');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: { message: 'Vehicle successfully deleted' } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, softDelete };
