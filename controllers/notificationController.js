import Notification from '../models/notificationModel.js';

const notificationController = {
    
  createNotification: async (recipient, sender, type, message, relatedObject, relatedModel) => {
    try {
      const notification = new Notification({
        recipient,
        sender,
        type,
        message,
        relatedObject,
        relatedModel,
      });
      await notification.save();
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
};

export default notificationController;
