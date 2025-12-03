const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (userPayload) => {
  // userPayload should include: userId, role, organization, permissions (optional), board (optional)
  const payload = {
    userId: userPayload.userId || userPayload.id,
    role: userPayload.role,
    organizationId: userPayload.organizationId || userPayload.organization,
    permissions: userPayload.permissions || []
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Helper: build JWT payload from a full User document
const buildPayloadFromUser = (userDoc) => {
  return {
    userId: userDoc._id,
    role: userDoc.role,
    organizationId: userDoc.organization,
    permissions: userDoc.permissions || []
  };
};

module.exports = { signToken, verifyToken, buildPayloadFromUser };
