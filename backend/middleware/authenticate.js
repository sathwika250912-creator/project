const { verifyToken } = require('../utils/jwtUtil');
const User = require('../models/User');
const Organization = require('../models/Organization');

/**
 * Authentication middleware
 * - Verifies JWT from Authorization header
 * - Attaches decoded token payload to req.tokenPayload
 * - Loads full user document to req.user (without password)
 * - Loads user's organization to req.organization
 */
module.exports = async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });

    req.tokenPayload = decoded; // { userId, role, organizationId, permissions }

    // Load user from DB and attach (exclude password)
    const user = await User.findById(decoded.userId).select('-password').lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isActive) return res.status(403).json({ error: 'User is disabled' });

    req.user = user;

    // Load organization if available
    if (user.organization) {
      const org = await Organization.findById(user.organization).lean();
      if (org) req.organization = org;
    }

    next();
  } catch (err) {
    console.error('Authentication error', err);
    res.status(500).json({ error: 'Authentication failure' });
  }
};
