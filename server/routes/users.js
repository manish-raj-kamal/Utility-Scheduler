const router = require('express').Router();
const multer = require('multer');
const {
	getAllUsers,
	updateUser,
	deleteUser,
	updateMyProfile,
	uploadMyAvatar,
	deleteMyAccount
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (_req, file, cb) => {
		const ok = /^image\//.test(file.mimetype);
		cb(ok ? null : new Error('Only image files are allowed'), ok);
	}
});

router.put('/me', protect, updateMyProfile);
router.post('/me/avatar', protect, upload.single('avatar'), uploadMyAvatar);
router.delete('/me', protect, deleteMyAccount);

router.get('/', protect, adminOnly, getAllUsers);
router.put('/:id', protect, adminOnly, updateUser);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
