const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

// Middleware to verify JWT and set req.user
const auth = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2) Verify token
    const { valid, decoded, error } = await verifyToken(token);
    
    if (!valid || error) {
      return res.status(401).json({
        status: 'error',
        message: error || 'Invalid token or user no longer exists'
      });
    }

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // 4) Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed. Please log in again.'
    });
  }
};

// Middleware to restrict routes to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// Middleware to enforce organization-level access control
const checkOrgAccess = (Model) => {
  return async (req, res, next) => {
    try {
      const resource = await Model.findById(req.params.id);
      
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: 'Resource not found'
        });
      }

      // Check if the resource's organization matches the user's organization
      if (resource.organization && resource.organization.toString() !== req.user.organization.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to access this resource'
        });
      }

      // If we get here, the user has access to the resource
      req.resource = resource;
      next();
    } catch (err) {
      console.error('Organization access check failed:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to verify resource access'
      });
    }
  };
};

module.exports = {
  auth,
  restrictTo,
  checkOrgAccess
};
