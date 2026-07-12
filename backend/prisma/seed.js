const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('password123', 10);
  
  const roles = [
    { email: 'dispatcher@transitops.com', role: 'DISPATCHER' },
    { email: 'safety@transitops.com', role: 'SAFETY_OFFICER' },
    { email: 'finance@transitops.com', role: 'FINANCIAL_ANALYST' }
  ];

  const adminUser = await prisma.user.upsert({
    where: { email: 'fleet@transitops.com' },
    update: {},
    create: {
      email: 'fleet@transitops.com',
      password: passwordHash,
      role: 'FLEET_MANAGER'
    }
  });

  for (const r of roles) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: { email: r.email, password: passwordHash, role: r.role }
    });
  }

  const vehiclesData = [
    { regNumber: 'VAN-001', model: 'Ford Transit', type: 'Van', capacity: 1000, odometer: 15000, acquisitionCost: 35000, status: 'AVAILABLE' },
    { regNumber: 'VAN-002', model: 'Ford Transit', type: 'Van', capacity: 1000, odometer: 12000, acquisitionCost: 35000, status: 'ON_TRIP' },
    { regNumber: 'TRK-101', model: 'Volvo FH16', type: 'Truck', capacity: 20000, odometer: 150000, acquisitionCost: 120000, status: 'AVAILABLE' },
    { regNumber: 'TRK-102', model: 'Volvo FH16', type: 'Truck', capacity: 20000, odometer: 160000, acquisitionCost: 120000, status: 'IN_SHOP' },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const created = await prisma.vehicle.upsert({
      where: { regNumber: v.regNumber },
      update: {},
      create: v
    });
    vehicles.push(created);
  }

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1);

  const driversData = [
    { name: 'Alice Smith', licenseNumber: 'LIC-001', category: 'C', contactNumber: '555-0101', expiryDate: futureDate, safetyScore: 98, status: 'AVAILABLE' },
    { name: 'Bob Jones', licenseNumber: 'LIC-002', category: 'C', contactNumber: '555-0102', expiryDate: futureDate, safetyScore: 95, status: 'ON_TRIP' },
    { name: 'Diana Prince', licenseNumber: 'LIC-004', category: 'B', contactNumber: '555-0104', expiryDate: pastDate, safetyScore: 90, status: 'AVAILABLE' }, 
    { name: 'Eve Davis', licenseNumber: 'LIC-005', category: 'B', contactNumber: '555-0105', expiryDate: futureDate, safetyScore: 40, status: 'SUSPENDED' }, 
  ];

  const drivers = [];
  for (const d of driversData) {
    const created = await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: d
    });
    drivers.push(created);
  }

  const trk101 = vehicles.find(v => v.regNumber === 'TRK-101');
  const driverAlice = drivers.find(d => d.licenseNumber === 'LIC-001');

  if (trk101 && driverAlice) {
    await prisma.trip.create({
      data: {
        source: 'Warehouse A',
        destination: 'Store B',
        vehicleId: trk101.id,
        driverId: driverAlice.id,
        cargoWeight: 15000,
        distance: 500,
        status: 'COMPLETED',
        revenue: 2500.00
      }
    });

    await prisma.fuelLog.create({
      data: {
        liters: 150,
        cost: 225.00,
        vehicleId: trk101.id,
        loggedAt: new Date(Date.now() - 86400000)
      }
    });

    await prisma.expense.create({
      data: {
        vehicleId: trk101.id,
        cost: 45.00,
        description: 'Interstate Highway Toll',
        type: 'TOLL',
        date: new Date()
      }
    });
  }

  const van002 = vehicles.find(v => v.regNumber === 'VAN-002');
  const driverBob = drivers.find(d => d.licenseNumber === 'LIC-002');

  if (van002 && driverBob) {
    await prisma.trip.create({
      data: {
        source: 'Depot C',
        destination: 'Customer D',
        vehicleId: van002.id,
        driverId: driverBob.id,
        cargoWeight: 800,
        distance: 120,
        status: 'DISPATCHED',
        revenue: 400.00
      }
    });
  }

  const trk102 = vehicles.find(v => v.regNumber === 'TRK-102');
  if (trk102) {
    await prisma.maintenanceLog.create({
      data: {
        issue: 'Engine Overhaul',
        cost: 3500.00,
        status: 'ACTIVE',
        vehicleId: trk102.id
      }
    });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
