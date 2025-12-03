const express = require('express');
const router = express.Router();
const { auth, restrictTo, checkOrgAccess } = require('../middleware/auth');
const Organization = require('../models/Organization');

// Protect all routes after this middleware
router.use(auth);

// Only admins can create organizations
router.post('/', restrictTo('admin', 'superadmin'), async (req, res) => {
  try {
    const { name, domain } = req.body;
    
    // Check if organization with this domain already exists
    const existingOrg = await Organization.findOne({ domain });
    if (existingOrg) {
      return res.status(400).json({
        status: 'error',
        message: 'Organization with this domain already exists'
      });
    }

    const organization = await Organization.create({
      name,
      domain,
      createdBy: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        organization
      }
    });
  } catch (err) {
    console.error('Error creating organization:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create organization'
    });
  }
});

// Only organization admins can get organization details
router.get('/:id', 
  restrictTo('admin', 'superadmin'),
  checkOrgAccess(Organization),
  async (req, res) => {
    res.json({
      status: 'success',
      data: {
        organization: req.resource
      }
    });
  }
);

// Only superadmins can update any organization
router.patch('/:id', 
  restrictTo('superadmin'),
  checkOrgAccess(Organization),
  async (req, res) => {
    try {
      const organization = await Organization.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true
        }
      );

      res.json({
        status: 'success',
        data: {
          organization
        }
      });
    } catch (err) {
      console.error('Error updating organization:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update organization'
      });
    }
  }
);

// Only superadmins can delete organizations
router.delete('/:id', 
  restrictTo('superadmin'),
  checkOrgAccess(Organization),
  async (req, res) => {
    try {
      await Organization.findByIdAndDelete(req.params.id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (err) {
      console.error('Error deleting organization:', err);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete organization'
      });
    }
  }
);

module.exports = router;
