const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };

    const [fuelLogs, total] = await prisma.$transaction([
      prisma.fuelLog.findMany({
        where,
        skip,
        take: limit,
        include: { vehicle: true },
        orderBy: { loggedAt: 'desc' }
      }),
      prisma.fuelLog.count({ where })
    ]);

    res.json({
      success: true,
      data: fuelLogs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { vehicleId, liters, cost } = req.body;

    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null }
    });

    if (!vehicle) {
      const error = new Error('Vehicle not found or is deleted');
      error.status = 404;
      throw error;
    }

    const fuelLog = await prisma.fuelLog.create({
      data: { vehicleId, liters, cost, loggedAt: new Date() }
    });

    res.status(201).json({ success: true, data: fuelLog });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create };
