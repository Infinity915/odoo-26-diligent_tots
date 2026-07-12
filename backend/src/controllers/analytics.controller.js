const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getDashboardKPIs = async (req, res, next) => {
  try {
    const [
      totalActiveVehicles,
      onTripVehicles,
      vehiclesInMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty
    ] = await prisma.$transaction([
      prisma.vehicle.count({
        where: { deletedAt: null, status: { not: 'RETIRED' } }
      }),
      prisma.vehicle.count({
        where: { deletedAt: null, status: 'ON_TRIP' }
      }),
      prisma.vehicle.count({
        where: { deletedAt: null, status: 'IN_SHOP' }
      }),
      prisma.trip.count({
        where: { deletedAt: null, status: 'DISPATCHED' }
      }),
      prisma.trip.count({
        where: { deletedAt: null, status: 'DRAFT' }
      }),
      prisma.driver.count({
        where: { deletedAt: null, status: 'ON_TRIP' }
      })
    ]);

    const fleetUtilization = totalActiveVehicles === 0 
      ? 0 
      : (onTripVehicles / totalActiveVehicles) * 100;

    res.json({
      success: true,
      data: {
        totalActiveVehicles,
        onTripVehicles,
        vehiclesInMaintenance,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilization
      }
    });
  } catch (error) {
    next(error);
  }
};

const getVehicleAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const vehicle = await prisma.vehicle.findFirst({ 
      where: { id, deletedAt: null },
      include: {
        trips: { where: { deletedAt: null } },
        maintenanceLogs: { where: { deletedAt: null } },
        fuelLogs: { where: { deletedAt: null } },
        expenses: { where: { deletedAt: null } }
      }
    });

    if (!vehicle) {
      const error = new Error('Vehicle not found or is deleted');
      error.status = 404;
      throw error;
    }

    let totalRevenue = 0;
    let totalDistance = 0;
    vehicle.trips.forEach(t => {
      totalRevenue += t.revenue;
      totalDistance += t.distance;
    });

    let totalMaintenance = 0;
    vehicle.maintenanceLogs.forEach(m => totalMaintenance += m.cost);

    let totalFuelCost = 0;
    let totalLiters = 0;
    vehicle.fuelLogs.forEach(f => {
      totalFuelCost += f.cost;
      totalLiters += f.liters;
    });

    let totalOtherExpenses = 0;
    vehicle.expenses.forEach(e => totalOtherExpenses += e.cost);

    const operationalCost = totalMaintenance + totalFuelCost + totalOtherExpenses;

    // Formula: (Total Revenue - Operational Cost) / Acquisition Cost
    let roi = 0;
    if (vehicle.acquisitionCost > 0) {
      roi = (totalRevenue - operationalCost) / vehicle.acquisitionCost;
    }

    // Fuel Efficiency (Distance / Fuel)
    let fuelEfficiency = 0;
    if (totalLiters > 0) {
      fuelEfficiency = totalDistance / totalLiters;
    }

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalMaintenance,
        totalFuelCost,
        totalOtherExpenses,
        operationalCost,
        acquisitionCost: vehicle.acquisitionCost,
        roi,
        fuelEfficiency,
        totalDistance,
        totalLiters
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardKPIs, getVehicleAnalytics };
