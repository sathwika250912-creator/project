const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Organization = require('../models/Organization');

// GET /api/orgs/:orgId/data
// Accessible by: users from the same organization, board_admins for the board, and superadmin
router.get('/orgs/:orgId/data', auth, async (req, res) => {
  try {
    const { orgId } = req.params;
    const user = req.user; // populated by auth middleware (full user doc)

    const org = await Organization.findById(orgId).lean();
    if (!org) return res.status(404).json({ status: 'error', message: 'Organization not found' });

    // superadmin bypass
    if (user.role === 'superadmin') return res.json({ orgId: org._id, name: org.name, message: `Superadmin access to ${org.name}` });

    // direct org match
    if (user.organization && user.organization.toString() === org._id.toString()) {
      return res.json({ orgId: org._id, name: org.name, message: `Organization member access to ${org.name}` });
    }

    // board_admin: allow if user's organization.board === org.board
    if (user.role === 'board_admin') {
      // load user's org board from DB if not populated
      const userOrg = await Organization.findById(user.organization).lean();
      if (userOrg && userOrg.board && org.board && userOrg.board.toString() === org.board.toString()) {
        return res.json({ orgId: org._id, name: org.name, message: `Board admin access to ${org.name}` });
      }
    }

    return res.status(403).json({ status: 'error', message: 'Forbidden: organization mismatch' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// GET /api/boards/:boardId/organizations
// Only board_admin and superadmin can list organizations under a board
router.get('/boards/:boardId/organizations', auth, async (req, res) => {
  try {
    const { boardId } = req.params;
    const user = req.user;

    if (user.role !== 'board_admin' && user.role !== 'superadmin') {
      return res.status(403).json({ status: 'error', message: 'Forbidden: board admin only' });
    }

    const orgs = await Organization.find({ board: boardId }).lean();
    res.json({ boardId, organizations: orgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

module.exports = router;
