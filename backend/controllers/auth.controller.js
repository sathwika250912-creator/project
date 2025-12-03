const { signToken } = require('../utils/jwt');
const User = require('../models/User');
const Organization = require('../models/Organization');

// Helper to create and sign JWT token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user);
  
  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// @desc    Register a new user (with organization creation for the first admin)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, organizationName, domain } = req.body;

    // Check if organization with this domain already exists
    const existingOrg = await Organization.findOne({ domain });
    if (existingOrg) {
      return res.status(400).json({
        status: 'error',
        message: 'Organization with this domain already exists'
      });
    }

    // Create new organization
    const organization = await Organization.create({
      name: organizationName,
      domain,
      subscription: 'free'
    });

    // Create new user (first user is an admin)
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin',
      organization: organization._id,
      permissions: ['all']
    });

    createSendToken(user, 201, res);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // 2) Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // 3) If everything ok, send token to client
    createSendToken(user, 200, res);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to log in',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// @desc    Get current user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  getMe
};
