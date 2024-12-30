import Notification from '../models/notificationModel.js';
import User from '../models/user.js';
import { sendPushNotification } from '../utils/pushNotification.js';

const notificationController = {

  createNotification: async (recipient, sender, type, message, relatedObject, relatedModel) => {
    try {
      const user = await User.findById(recipient)
      const notification = new Notification({
        recipient,
        sender,
        type,
        message,
        relatedObject,
        relatedModel,
      });
      await notification.save();
      try {
        await sendPushNotification(user.pushToken, notification);
      } catch (pushError) {
        console.error('Error sending push notification:', pushError);
      }
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Error creating notification');
    }
  },

  getNotifications: async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await Notification.find({ recipient: userId }).sort('-createdAt');
      res.status(200).json(notifications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  markAsRead: async (req, res) => {
    try {
      const { notificationId } = req.params;
      await Notification.findByIdAndUpdate(notificationId, { read: true });
      res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  setIsNotified: async (req, res) => {
    try {
      const { notificationId } = req.params;

      // Find the notification and update its isNotified field
      const updatedNotification = await Notification.findByIdAndUpdate(
        notificationId,
        { isNotified: true },
        { new: true }
      );

      if (!updatedNotification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      res.status(200).json({ message: 'Notification marked as notified', notification: updatedNotification });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  storeNotificationToken: async (req, res) => {
    try {
      const userId = req.params.id;
      const { pushToken } = req.body;
      

      if (!pushToken) {
        return res.status(400).json({ error: 'Push Token is required' });
      }

      // Update the user's pushToken
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { pushToken: pushToken },
        { new: true } // Return the updated document
      );

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({ message: 'Push Token Stored successfully' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

};

export default notificationController;
