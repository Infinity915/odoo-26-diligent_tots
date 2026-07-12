const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false, 
      error: { code: 'UNAUTHORIZED', details: 'Access denied. No valid token provided.' } 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_hackathon_key');
    req.user = decoded;
    next();
  } catch (ex) {
    return res.status(401).json({ 
      success: false, 
      error: { code: 'UNAUTHORIZED', details: 'Invalid or expired token.' } 
    });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return [
    authenticate,
    (req, res, next) => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false, 
          error: { code: 'FORBIDDEN', details: 'You do not have the required role to perform this action.' } 
        });
      }
      next();
    }
  ];
};

module.exports = { authenticate, authorizeRoles };
