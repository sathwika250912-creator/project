/**
 * authorizeOrg - middleware factory to enforce organization-level access.
 * Usage examples:
 *  - app.get('/api/orgs/:orgId/data', authenticate, authorizeOrg('params.orgId'))
 *  - app.get('/api/resources/:id', authenticate, authorizeOrg((req) => req.resource.organization))
 *
 * Rules:
 *  - If user.role === 'superadmin' => allow
 *  - If user.role === 'board_admin' and user's organization.board === resourceBoardId => allow
 *  - If user's organization._id equals resourceOrgId => allow
 *  - Otherwise 403
 */

const mongoose = require('mongoose');

module.exports = function authorizeOrg(extractor) {
  return async function (req, res, next) {
    try {
      // Resolve resourceOrgId using extractor
      let resourceOrgId = null;
      if (typeof extractor === 'string') {
        // dot-path from req, e.g. 'params.orgId' or 'body.organizationId'
        const parts = extractor.split('.');
        let val = req;
        for (const p of parts) {
          if (val == null) break;
          val = val[p];
        }
        resourceOrgId = val;
      } else if (typeof extractor === 'function') {
        resourceOrgId = await extractor(req);
      }

      if (!resourceOrgId) return res.status(400).json({ error: 'Organization id could not be determined for authorization' });

      // Normalize to string id
      const resourceOrgIdStr = (resourceOrgId instanceof mongoose.Types.ObjectId) ? resourceOrgId.toString() : String(resourceOrgId);

      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthenticated' });

      // superadmin bypass
      if (user.role === 'superadmin') return next();

      // Direct org match
      if (user.organization && user.organization.toString() === resourceOrgIdStr) return next();

      // board_admin: if user's organization has a board and resource org belongs to same board
      if (user.role === 'board_admin' && req.organization && req.organization.board) {
        // req.organization is the user's org; but we need resource org's board - try to read from req (extractor could provide boardId)
        // If extractor provided a board id directly, compare
        const resourceBoardId = req.params.boardId || req.body.boardId || req.query.boardId || null;
        if (resourceBoardId && req.organization.board && req.organization.board.toString() === resourceBoardId.toString()) return next();
      }

      return res.status(403).json({ error: 'Forbidden: organization mismatch' });
    } catch (err) {
      console.error('authorizeOrg error', err);
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};
