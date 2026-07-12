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

    const [trips, total] = await prisma.$transaction([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        include: { vehicle: true, driver: true }
      }),
      prisma.trip.count({ where })
    ]);

    res.json({
      success: true,
      data: trips,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    next(error);
  }
};

const createDraft = async (req, res, next) => {
  try {
    const { vehicleId, cargoWeight } = req.body;
    
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null }
    });
    
    if (!vehicle) {
      const error = new Error('Vehicle not found or is deleted');
      error.status = 404;
      throw error;
    }
    
    if (cargoWeight > vehicle.capacity) {
      const error = new Error(`Cargo weight exceeds vehicle capacity of ${vehicle.capacity}`);
      error.status = 400;
      throw error;
    }

    const trip = await prisma.trip.create({
      data: { ...req.body, status: 'DRAFT' }
    });
    
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    next(error);
  }
};

const dispatchTrip = async (req, res, next) => {
  try {
    const tripId = req.params.id;
    
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: tripId, deletedAt: null },
        include: { driver: true, vehicle: true }
      });
      
      if (!trip) throw new Error('Trip not found or is deleted');
      if (trip.status !== 'DRAFT') throw new Error('Only DRAFT trips can be dispatched');

      if (trip.vehicle.status !== 'AVAILABLE' || trip.vehicle.deletedAt !== null) {
        throw new Error('Vehicle is not AVAILABLE or has been deleted');
      }
      
      if (trip.driver.status !== 'AVAILABLE' || trip.driver.deletedAt !== null) {
        throw new Error('Driver is not AVAILABLE or has been deleted');
      }
      
      if (new Date() > new Date(trip.driver.expiryDate)) {
        throw new Error('Driver license is expired');
      }

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: 'ON_TRIP' }
      });
      
      await tx.driver.update({
        where: { id: trip.driverId },
        data: { status: 'ON_TRIP' }
      });
      
      return tx.trip.update({
        where: { id: tripId },
        data: { status: 'DISPATCHED' }
      });
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    error.status = 400;
    next(error);
  }
};

const completeTrip = async (req, res, next) => {
  try {
    const tripId = req.params.id;
    const { revenue } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: tripId, deletedAt: null }
      });
      
      if (!trip) throw new Error('Trip not found or is deleted');
      if (trip.status !== 'DISPATCHED') throw new Error('Only DISPATCHED trips can be completed');
      
      await tx.vehicle.updateMany({
        where: { id: trip.vehicleId, deletedAt: null },
        data: {
          status: 'AVAILABLE',
          odometer: { increment: trip.distance }
        }
      });
      
      await tx.driver.updateMany({
        where: { id: trip.driverId, deletedAt: null },
        data: { status: 'AVAILABLE' }
      });
      
      return tx.trip.update({
        where: { id: tripId },
        data: { status: 'COMPLETED', revenue: revenue ?? trip.revenue }
      });
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    error.status = 400;
    next(error);
  }
};

const cancelTrip = async (req, res, next) => {
  try {
    const tripId = req.params.id;
    
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findFirst({
        where: { id: tripId, deletedAt: null }
      });
      
      if (!trip) throw new Error('Trip not found or is deleted');
      
      if (trip.status === 'DISPATCHED') {
        await tx.vehicle.updateMany({
          where: { id: trip.vehicleId, deletedAt: null },
          data: { status: 'AVAILABLE' }
        });
        await tx.driver.updateMany({
          where: { id: trip.driverId, deletedAt: null },
          data: { status: 'AVAILABLE' }
        });
      }
      
      return tx.trip.update({
        where: { id: tripId },
        data: { status: 'CANCELLED' }
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
    const trip = await prisma.trip.updateMany({
      where: { id: req.params.id, deletedAt: null },
      data: { deletedAt: new Date() }
    });

    if (trip.count === 0) {
      const error = new Error('Trip not found or already deleted');
      error.status = 404;
      throw error;
    }
    res.json({ success: true, data: { message: 'Trip successfully deleted' } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, createDraft, dispatchTrip, completeTrip, cancelTrip, softDelete };
