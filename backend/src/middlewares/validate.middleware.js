const rateLimit = require('express-rate-limit');

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({ 
      success: false, 
      error: { 
        code: 'VALIDATION_ERROR', 
        details: err.errors 
      } 
    });
  }
};

// Rate Limiters
const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      details: 'Too many requests from this IP, please try again after 15 minutes.'
    }
  }
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs for sensitive routes
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      details: 'Too many requests to strict endpoints from this IP, please try again after 15 minutes.'
    }
  }
});

module.exports = { validate, standardLimiter, strictLimiter };
