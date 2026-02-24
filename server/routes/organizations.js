const router = require('express').Router();
const {
  createOrganization,
  getAllOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization
} = require('../controllers/organizationController');
const { protect, superadminOnly, checkRole } = require('../middleware/auth');

// Superadmin: full CRUD
router.post('/', protect, superadminOnly, createOrganization);
router.get('/', protect, superadminOnly, getAllOrganizations);
router.delete('/:id', protect, superadminOnly, deleteOrganization);

// org_admin + superadmin: read & update their own org
router.get('/:id', protect, checkRole('org_admin', 'superadmin'), getOrganization);
router.put('/:id', protect, superadminOnly, updateOrganization);

module.exports = router;
