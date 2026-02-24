const router = require('express').Router();
const { getAll, getById, create, update, remove } = require('../controllers/utilityController');
const { protect, adminOnly, checkOrganizationAccess } = require('../middleware/auth');

router.get('/', protect, checkOrganizationAccess, getAll);
router.get('/:id', protect, checkOrganizationAccess, getById);
router.post('/', protect, adminOnly, checkOrganizationAccess, create);
router.put('/:id', protect, adminOnly, checkOrganizationAccess, update);
router.delete('/:id', protect, adminOnly, checkOrganizationAccess, remove);

module.exports = router;
