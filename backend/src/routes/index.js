const express = require('express');
const router = express.Router();

const { validate } = require('../middlewares/validate.middleware');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const schemas = require('../schemas');

const authController = require('../controllers/auth.controller');
const vehicleController = require('../controllers/vehicle.controller');
const driverController = require('../controllers/driver.controller');
const tripController = require('../controllers/trip.controller');
const maintenanceController = require('../controllers/maintenance.controller');
const expenseController = require('../controllers/expense.controller');
const fuelLogController = require('../controllers/fuellog.controller');
const analyticsController = require('../controllers/analytics.controller');

// Health check
router.get('/health', (req, res) => res.json({ status: 'OK' }));

// Auth
router.post('/auth/login', validate(schemas.loginSchema), authController.login);
router.post('/auth/google', authController.googleLogin);

// Vehicles
router.get('/vehicles', authenticate, vehicleController.getAll);
router.get('/vehicles/:id', authenticate, vehicleController.getById);
router.post('/vehicles', authorizeRoles('FLEET_MANAGER'), validate(schemas.vehicleSchema), vehicleController.create);
router.put('/vehicles/:id', authorizeRoles('FLEET_MANAGER'), vehicleController.update);
router.delete('/vehicles/:id', authorizeRoles('FLEET_MANAGER'), vehicleController.softDelete);

// Drivers
router.get('/drivers', authenticate, driverController.getAll);
router.get('/drivers/:id', authenticate, driverController.getById);
router.post('/drivers', authorizeRoles('SAFETY_OFFICER'), validate(schemas.driverSchema), driverController.create);
router.put('/drivers/:id', authorizeRoles('SAFETY_OFFICER'), driverController.update);
router.delete('/drivers/:id', authorizeRoles('SAFETY_OFFICER'), driverController.softDelete);

// Trips
router.get('/trips', authenticate, tripController.getAll);
router.post('/trips/draft', authorizeRoles('DISPATCHER'), validate(schemas.tripSchema), tripController.createDraft);
router.post('/trips/:id/dispatch', authorizeRoles('DISPATCHER'), tripController.dispatchTrip);
router.post('/trips/:id/complete', authorizeRoles('DISPATCHER'), tripController.completeTrip);
router.post('/trips/:id/cancel', authorizeRoles('DISPATCHER'), tripController.cancelTrip);

// Maintenance
router.get('/maintenance', authenticate, maintenanceController.getAll);
router.post('/maintenance', authorizeRoles('FLEET_MANAGER'), validate(schemas.maintenanceSchema), maintenanceController.create);
router.put('/maintenance/:id/close', authorizeRoles('FLEET_MANAGER'), maintenanceController.close);

// Fuel Logs
router.get('/fuel-logs', authenticate, fuelLogController.getAll);
router.post('/fuel-logs', authorizeRoles('FINANCIAL_ANALYST'), validate(schemas.fuelLogSchema), fuelLogController.create);

// Expenses
router.get('/expenses', authenticate, expenseController.getAll);
router.post('/expenses', authorizeRoles('FINANCIAL_ANALYST'), validate(schemas.expenseSchema), expenseController.create);

// Analytics
router.get('/analytics/dashboard', authenticate, analyticsController.getDashboardKPIs);
router.get('/analytics/vehicles/:id', authenticate, analyticsController.getVehicleAnalytics);
router.get('/analytics/maintenance-metrics', authenticate, analyticsController.getMaintenanceMetrics);
router.get('/analytics/recent-trips', authenticate, analyticsController.getRecentTrips);

module.exports = router;
