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

    const [logs, total] = await prisma.$transaction([
      prisma.maintenanceLog.findMany({
        where,
        skip,
        take: limit,
        include: { vehicle: true }
      }),
      prisma.maintenanceLog.count({ where })
    ]);

    res.json({
      success: true,
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { vehicleId } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.findFirst({
        where: { id: vehicleId, deletedAt: null }
      });
      
      if (!vehicle) {
        throw new Error('Vehicle not found or is deleted');
      }

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: 'IN_SHOP' }
      });

      return tx.maintenanceLog.create({
        data: { ...req.body, status: 'ACTIVE' }
      });
    });
    
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    error.status = 400;
    next(error);
  }
};

const close = async (req, res, next) => {
  try {
    const logId = req.params.id;
    
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.maintenanceLog.findFirst({
        where: { id: logId, deletedAt: null }
      });
      
      if (!log) throw new Error('Maintenance log not found or is deleted');
      if (log.status === 'CLOSED') throw new Error('Log is already closed');

      const vehicle = await tx.vehicle.findFirst({
        where: { id: log.vehicleId, deletedAt: null }
      });
      
      if (vehicle && vehicle.status !== 'RETIRED') {
        await tx.vehicle.update({
          where: { id: log.vehicleId },
          data: { status: 'AVAILABLE' }
        });
      }

      return tx.maintenanceLog.update({
        where: { id: logId },
        data: { status: 'CLOSED' }
      });
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    error.status = 400;
    next(error);
  }
};

const softDelete = async (req, res, next) => {
  try {
    const log = await prisma.maintenanceLog.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    if (log.count === 0) {
      const error = new Error('Maintenance log not found or already deleted');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: { message: 'Maintenance log successfully deleted' } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, close, softDelete };
