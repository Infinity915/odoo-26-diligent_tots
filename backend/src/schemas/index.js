const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

const vehicleSchema = z.object({
  regNumber: z.string().trim().min(1),
  model: z.string().trim().min(1),
  type: z.string().trim().min(1),
  capacity: z.number().positive(),
  odometer: z.number().nonnegative(),
  acquisitionCost: z.number().positive(),
  imageUrl: z.string().trim().optional(),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED']),
});

const driverSchema = z.object({
  name: z.string().trim().min(1),
  licenseNumber: z.string().trim().min(1),
  category: z.string().trim().min(1),
  contactNumber: z.string().trim().min(1),
  expiryDate: z.string().trim().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid Date' }),
  safetyScore: z.number().min(0).max(100),
  status: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED']),
});

const tripSchema = z.object({
  source: z.string().trim().min(1),
  destination: z.string().trim().min(1),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  cargoWeight: z.number().positive(),
  distance: z.number().positive(),
  revenue: z.number().nonnegative().optional(),
});

const maintenanceSchema = z.object({
  issue: z.string().trim().min(1),
  cost: z.number().nonnegative(),
  vehicleId: z.string().uuid(),
});

const fuelLogSchema = z.object({
  liters: z.number().positive(),
  cost: z.number().nonnegative(),
  vehicleId: z.string().uuid(),
});

const expenseSchema = z.object({
  vehicleId: z.string().uuid(),
  cost: z.number().nonnegative(),
  description: z.string().trim().min(1),
  type: z.string().trim().min(1),
  date: z.string().trim().refine((date) => !isNaN(Date.parse(date)), { message: 'Invalid Date' }).optional(),
});

module.exports = {
  loginSchema,
  vehicleSchema,
  driverSchema,
  tripSchema,
  maintenanceSchema,
  fuelLogSchema,
  expenseSchema
};
