import NotificationService from '../services/notification.service.js';
import { successResponse } from '../utils/response.util.js';

class NotificationController {
  async getAll(req, res, next) {
    try {
      const notifications = await NotificationService.getAll(req.user._id);
      return successResponse(res, 'Notifications retrieved', notifications);
    } catch (error) {
      next(error);
    }
  }

  async getUnread(req, res, next) {
    try {
      const notifications = await NotificationService.getUnread(req.user._id);
      return successResponse(res, 'Unread notifications retrieved', notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id, req.user._id);
      return successResponse(res, 'Notification marked as read', notification);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await NotificationService.markAllAsRead(req.user._id);
      return successResponse(res, 'All notifications marked as read', null);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await NotificationService.delete(req.params.id, req.user._id);
      return successResponse(res, 'Notification deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
