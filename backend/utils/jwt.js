const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organization,
      permissions: user.permissions || []
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'your-app-name'
    }
  );
};

const verifyToken = async (token) => {
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      throw new Error('User no longer exists');
    }

    // Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      throw new Error('User recently changed password. Please log in again.');
    }

    return {
      valid: true,
      decoded,
      user: currentUser
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message
    };
  }
};

// Add method to User model to check if password was changed after token was issued
User.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

module.exports = {
  signToken,
  verifyToken
};
