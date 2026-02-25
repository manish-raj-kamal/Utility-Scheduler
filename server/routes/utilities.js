const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('../controllers/utilityController');
const { protect, adminOnly, checkOrganizationMembership } = require('../middleware/auth');

router.get('/', protect, checkOrganizationMembership, getAll);
router.get('/:id', protect, checkOrganizationMembership, getById);
router.post('/', protect, adminOnly, checkOrganizationMembership, create);
router.put('/:id', protect, adminOnly, checkOrganizationMembership, update);
router.delete('/:id', protect, adminOnly, checkOrganizationMembership, remove);

module.exports = router;
