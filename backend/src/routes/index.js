const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const schemas = require('../schemas');

const authController = require('../controllers/auth.controller');
const vehicleController = require('../controllers/vehicle.controller');
const driverController = require('../controllers/driver.controller');
const tripController = require('../controllers/trip.controller');
const maintenanceController = require('../controllers/maintenance.controller');
const expenseController = require('../controllers/expense.controller');
const analyticsController = require('../controllers/analytics.controller');

// Health check
router.get('/health', (req, res) => res.json({ status: 'OK' }));

// Auth
router.post('/auth/login', validate(schemas.loginSchema), authController.login);

// Vehicles
router.get('/vehicles', authenticate, vehicleController.getAll);
router.get('/vehicles/:id', authenticate, vehicleController.getById);
router.post('/vehicles', authorizeRoles('FLEET_MANAGER', 'Admin'), validate(schemas.vehicleSchema), vehicleController.create);
router.put('/vehicles/:id', authorizeRoles('FLEET_MANAGER', 'Admin'), vehicleController.update);
router.delete('/vehicles/:id', authorizeRoles('FLEET_MANAGER', 'Admin'), vehicleController.softDelete);

// Drivers
router.get('/drivers', authenticate, driverController.getAll);
router.get('/drivers/:id', authenticate, driverController.getById);
router.post('/drivers', authorizeRoles('SAFETY_OFFICER', 'Admin'), validate(schemas.driverSchema), driverController.create);
router.put('/drivers/:id', authorizeRoles('SAFETY_OFFICER', 'Admin'), driverController.update);
router.delete('/drivers/:id', authorizeRoles('SAFETY_OFFICER', 'Admin'), driverController.softDelete);

// Trips
router.get('/trips', authenticate, tripController.getAll);
router.post('/trips/draft', authorizeRoles('DISPATCHER', 'Admin'), validate(schemas.tripSchema), tripController.createDraft);
router.post('/trips/:id/dispatch', authorizeRoles('DISPATCHER', 'Admin'), tripController.dispatchTrip);
router.post('/trips/:id/complete', authorizeRoles('DISPATCHER', 'Admin'), tripController.completeTrip);
router.post('/trips/:id/cancel', authorizeRoles('DISPATCHER', 'Admin'), tripController.cancelTrip);

// Maintenance
router.get('/maintenance', authenticate, maintenanceController.getAll);
router.post('/maintenance', authorizeRoles('FLEET_MANAGER', 'Admin'), validate(schemas.maintenanceSchema), maintenanceController.create);
router.put('/maintenance/:id/close', authorizeRoles('FLEET_MANAGER', 'Admin'), maintenanceController.close);

// Expenses
router.get('/expenses', authenticate, expenseController.getAll);
router.post('/expenses/fuel', authorizeRoles('FINANCIAL_ANALYST', 'Admin'), validate(schemas.fuelLogSchema), expenseController.create);

// Analytics
router.get('/analytics/dashboard', authenticate, analyticsController.getDashboardKPIs);
router.get('/analytics/vehicles/:id', authenticate, analyticsController.getVehicleAnalytics);

module.exports = router;
