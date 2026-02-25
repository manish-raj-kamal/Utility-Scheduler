const router = require('express').Router();
const {
  createOrganization,
  createSelfOrganization,
  getAllOrganizations,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  searchOrganizations,
  joinWithKey,
  requestToJoin,
  getMyJoinRequests,
  getPendingJoinRequests,
  reviewJoinRequest,
  regenerateJoinKey
} = require('../controllers/organizationController');
const { protect, superadminOnly, checkRole } = require('../middleware/auth');

router.get('/search', protect, searchOrganizations);
router.post('/join', protect, joinWithKey);
router.post('/join-requests', protect, requestToJoin);
router.post('/self-create', protect, createSelfOrganization);
router.get('/join-requests/me', protect, getMyJoinRequests);
router.get('/join-requests/pending', protect, checkRole('org_admin', 'superadmin'), getPendingJoinRequests);
router.patch('/join-requests/:requestId', protect, checkRole('org_admin', 'superadmin'), reviewJoinRequest);
router.post('/join-key/regenerate', protect, checkRole('org_admin', 'superadmin'), regenerateJoinKey);

// Superadmin: full CRUD
router.post('/', protect, superadminOnly, createOrganization);
router.get('/', protect, superadminOnly, getAllOrganizations);
router.delete('/:id', protect, superadminOnly, deleteOrganization);
router.post('/:id/join-key/regenerate', protect, superadminOnly, regenerateJoinKey);

// org_admin + superadmin: read & update their own org
router.get('/:id', protect, checkRole('org_admin', 'superadmin'), getOrganization);
router.put('/:id', protect, superadminOnly, updateOrganization);

module.exports = router;
