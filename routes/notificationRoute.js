import express from 'express';
import notificationController from '../controllers/notificationController.js';

const router = express.Router();

router.get('/getNotification/:userId', notificationController.getNotifications);
router.post('/', notificationController.createNotification); // Can be called internally, not exposed via API
router.patch('/:notificationId/read', notificationController.markAsRead);
// Route to set isNotified to true
router.patch('/:notificationId/set-is-notified', notificationController.setIsNotified);
// store token
router.put('/:id/token', notificationController.storeNotificationToken)

export default router;
