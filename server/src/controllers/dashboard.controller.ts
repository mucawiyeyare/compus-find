import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { dashboardService } from '../services/dashboard.service';
import Notification from '../models/Notification';
import Message from '../models/Message';
import Book from '../models/Book';
import Event from '../models/Event';
import StudyGroup from '../models/StudyGroup';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const stats = await dashboardService.getStats(req.user.id, req.user.role);
    return res.status(200).json({ success: true, stats });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardCharts = async (req: AuthRequest, res: Response) => {
  try {
    const charts = await dashboardService.getCharts();
    return res.status(200).json({ success: true, charts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await dashboardService.getRecentActivities();
    return res.status(200).json({ success: true, activities });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);
    return res.status(200).json({ success: true, notifications });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardMessages = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    // Fetch last 10 messages sent to the user or from group chats they are in
    const userGroups = await StudyGroup.find({ members: req.user._id }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    const messages = await Message.find({
      $or: [
        { receiver: req.user._id },
        { studyGroup: { $in: groupIds } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('sender', 'name avatar');

    return res.status(200).json({ success: true, messages });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardBooks = async (req: AuthRequest, res: Response) => {
  try {
    const books = await Book.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .limit(10);
    return res.status(200).json({ success: true, books });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find({ date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(10);
    return res.status(200).json({ success: true, events });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardStudyGroups = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const studyGroups = await StudyGroup.find({ members: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(10);
    return res.status(200).json({ success: true, studyGroups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
