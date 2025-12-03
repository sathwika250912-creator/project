const express = require('express');
const { login, register, getMe } = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and create an organization
 * @access  Public
 * @body    {string} name - User's full name
 * @body    {string} email - User's email
 * @body    {string} password - User's password (min 8 chars)
 * @body    {string} organizationName - Name of the organization
 * @body    {string} domain - Organization domain (must be unique)
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    {string} email - User's email
 * @body    {string} password - User's password
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user's profile
 * @access  Private
 * @header  Authorization: Bearer <token>
 */
router.get('/me', auth, getMe);

module.exports = router;
