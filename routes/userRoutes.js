import express from 'express';
import userController from '../controllers/userController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(userController.registerUser).get(protect, admin, userController.getUsers);
router.post('/login', userController.authUser);
router.route('/profile').get(protect, userController.getUserProfile).put(protect, userController.updateUserProfile);
router.route('/:id')
  .delete(protect, admin, userController.deleteUser)
  .get(protect, admin, userController.getUserById)
  .put(protect, admin, userController.updateUser);

export default router;
