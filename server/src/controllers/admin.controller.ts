import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Mentor from '../models/Mentor';
import LostItem from '../models/LostItem';
import FoundItem from '../models/FoundItem';
import Book from '../models/Book';
import Note from '../models/Note';
import StudyGroup from '../models/StudyGroup';
import Message from '../models/Message';
import ContactMessage from '../models/ContactMessage';
import Event from '../models/Event';
import AuditLog from '../models/AuditLog';
import SystemSetting from '../models/SystemSetting';
import { AuthRequest } from '../middlewares/auth';
import bcrypt from 'bcryptjs';

// Helper to log administrative actions
const logAdminAction = async (req: AuthRequest, action: string, resource: string, details?: any) => {
  try {
    if (req.user) {
      await AuditLog.create({
        actor: req.user._id,
        action,
        resource,
        details,
        ipAddress: req.ip
      });
    }
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
};

// --- Dashboard Analytics ---
export const getAdminStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const mentorCount = await User.countDocuments({ role: 'mentor' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    const totalLost = await LostItem.countDocuments();
    const totalFound = await FoundItem.countDocuments();
    const recoveredItemsCount = await FoundItem.countDocuments({ status: 'returned' });
    const recoveryRate = totalLost + totalFound > 0 
      ? Math.round((recoveredItemsCount / (totalLost + totalFound)) * 100) 
      : 0;

    const totalBooks = await Book.countDocuments();
    const availableBooks = await Book.countDocuments({ status: 'available' });

    const totalNotes = await Note.countDocuments();
    const totalGroups = await StudyGroup.countDocuments();
    const totalEvents = await Event.countDocuments();

    // Top active mentors
    const activeMentors = await Mentor.find()
      .populate('user', 'name email avatar')
      .sort({ rating: -1 })
      .limit(5);

    // Recent audit logs
    const recentLogs = await AuditLog.find()
      .populate('actor', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, students: studentCount, mentors: mentorCount, admins: adminCount },
        lostFound: { lost: totalLost, found: totalFound, recovered: recoveredItemsCount, recoveryRate },
        books: { total: totalBooks, available: availableBooks },
        notes: { total: totalNotes },
        groups: { total: totalGroups },
        events: { total: totalEvents }
      },
      activeMentors,
      recentLogs
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- User Management ---
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, status } = req.query;
    const query: any = {};

    if (role) query.role = role;
    if (status === 'verified') query.isVerified = true;
    if (status === 'unverified') query.isVerified = false;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, department, points, isVerified, badges } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent changing own role or metadata to avoid lockout
    const isSelf = user._id.toString() === req.user?._id.toString();

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined && !isSelf) user.role = role;
    if (department !== undefined) user.department = department;
    if (points !== undefined) user.points = points;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (badges !== undefined) user.badges = badges;

    await user.save();
    await logAdminAction(req, 'UPDATE_USER', `User ID: ${id}`, { name, email, role });

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const forcePasswordReset = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await logAdminAction(req, 'FORCE_PASSWORD_RESET', `User ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (id === req.user?._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Cleanup related mentor profile if any
    await Mentor.findOneAndDelete({ user: id });

    await logAdminAction(req, 'DELETE_USER', `User: ${user.email} (${id})`);
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Mentor Management ---
export const getAllMentors = async (req: AuthRequest, res: Response) => {
  try {
    const mentors = await Mentor.find().populate('user', 'name email avatar points');
    return res.status(200).json({ success: true, mentors });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveMentorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    const mentor = await Mentor.findById(id).populate('user');
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor profile not found' });

    // Update status or custom fields
    if (status === 'approved') {
      const u = mentor.user as any;
      if (u) {
        u.role = 'mentor';
        await u.save();
      }
    }

    await mentor.save();
    await logAdminAction(req, 'APPROVE_MENTOR', `Mentor ID: ${id}`, { status });
    return res.status(200).json({ success: true, message: `Mentor profile marked as ${status}`, mentor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeMentorProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const mentor = await Mentor.findByIdAndDelete(id);
    if (!mentor) return res.status(404).json({ success: false, message: 'Mentor not found' });

    // Revert user role to student
    await User.findByIdAndUpdate(mentor.user, { role: 'student' });

    await logAdminAction(req, 'REMOVE_MENTOR', `User ID: ${mentor.user}`);
    return res.status(200).json({ success: true, message: 'Mentor profile removed' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Lost & Found Management ---
export const getLostFoundItems = async (req: AuthRequest, res: Response) => {
  try {
    const lost = await LostItem.find().populate('reporter', 'name email');
    const found = await FoundItem.find().populate('reporter', 'name email');
    return res.status(200).json({ success: true, lost, found });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLostFoundItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id, type } = req.params; // type = 'lost' | 'found'
    const updateData = req.body;

    let item;
    if (type === 'lost') {
      item = await LostItem.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      item = await FoundItem.findByIdAndUpdate(id, updateData, { new: true });
    }

    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    await logAdminAction(req, 'UPDATE_LOSTFOUND_ITEM', `${type} item ID: ${id}`, updateData);
    return res.status(200).json({ success: true, item });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLostFoundItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id, type } = req.params;

    if (type === 'lost') {
      await LostItem.findByIdAndDelete(id);
    } else {
      await FoundItem.findByIdAndDelete(id);
    }

    await logAdminAction(req, 'DELETE_LOSTFOUND_ITEM', `${type} item ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Book Sharing Management ---
export const getBooks = async (req: AuthRequest, res: Response) => {
  try {
    const books = await Book.find().populate('donor', 'name email');
    return res.status(200).json({ success: true, books });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBook = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Book.findByIdAndDelete(id);
    await logAdminAction(req, 'DELETE_BOOK', `Book ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Book deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Notes Moderation ---
export const getNotes = async (req: AuthRequest, res: Response) => {
  try {
    const notes = await Note.find().populate('uploader', 'name email');
    return res.status(200).json({ success: true, notes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const approveNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const note = await Note.findById(id);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });

    // Custom approval/visibility status if required
    await note.save();
    await logAdminAction(req, 'APPROVE_NOTE', `Note ID: ${id}`, { approved });
    return res.status(200).json({ success: true, note });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Note.findByIdAndDelete(id);
    await logAdminAction(req, 'DELETE_NOTE', `Note ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Study Groups Management ---
export const getStudyGroups = async (req: AuthRequest, res: Response) => {
  try {
    const groups = await StudyGroup.find().populate('creator', 'name email');
    return res.status(200).json({ success: true, groups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStudyGroup = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await StudyGroup.findByIdAndDelete(id);
    await logAdminAction(req, 'DELETE_STUDYGROUP', `Group ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Study group deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Events Management ---
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, date, location } = req.body;
    const event = await Event.create({
      title,
      description,
      category,
      date: new Date(date),
      location,
      creator: req.user?._id
    });

    await logAdminAction(req, 'CREATE_EVENT', `Event ID: ${event._id}`, { title });
    return res.status(201).json({ success: true, event });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const event = await Event.findByIdAndUpdate(id, updateData, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    await logAdminAction(req, 'UPDATE_EVENT', `Event ID: ${id}`, updateData);
    return res.status(200).json({ success: true, event });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Event.findByIdAndDelete(id);
    await logAdminAction(req, 'DELETE_EVENT', `Event ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- System Settings ---
export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({});
    }
    return res.status(200).json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = new SystemSetting({});
    }

    const { platformName, theme, emailNotifications, twoFactorAuth, aiModelName } = req.body;
    if (platformName !== undefined) settings.platformName = platformName;
    if (theme !== undefined) settings.theme = theme;
    if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
    if (twoFactorAuth !== undefined) settings.twoFactorAuth = twoFactorAuth;
    if (aiModelName !== undefined) settings.aiModelName = aiModelName;

    await settings.save();
    await logAdminAction(req, 'UPDATE_SETTINGS', 'System Settings', { platformName, theme });
    return res.status(200).json({ success: true, settings });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- System Audit Logs ---
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.find()
      .populate('actor', 'name email role')
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, logs });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Database Export / Import ---
export const exportDatabase = async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find();
    const mentors = await Mentor.find();
    const lostItems = await LostItem.find();
    const foundItems = await FoundItem.find();
    const books = await Book.find();
    const notes = await Note.find();
    const studyGroups = await StudyGroup.find();
    const events = await Event.find();
    const auditLogs = await AuditLog.find();

    const backupData = {
      timestamp: new Date().toISOString(),
      collections: {
        users,
        mentors,
        lostItems,
        foundItems,
        books,
        notes,
        studyGroups,
        events,
        auditLogs
      }
    };

    await logAdminAction(req, 'EXPORT_DATABASE', 'Full Database Dump');
    return res.status(200).json({ success: true, backupData });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const importDatabase = async (req: AuthRequest, res: Response) => {
  try {
    const { backupData } = req.body;
    if (!backupData || !backupData.collections) {
      return res.status(400).json({ success: false, message: 'Invalid backup dataset payload structure' });
    }

    const { collections } = backupData;

    // Clear and restore collections in sequence
    if (collections.users) {
      await User.deleteMany({});
      await User.insertMany(collections.users);
    }
    if (collections.mentors) {
      await Mentor.deleteMany({});
      await Mentor.insertMany(collections.mentors);
    }
    if (collections.lostItems) {
      await LostItem.deleteMany({});
      await LostItem.insertMany(collections.lostItems);
    }
    if (collections.foundItems) {
      await FoundItem.deleteMany({});
      await FoundItem.insertMany(collections.foundItems);
    }
    if (collections.books) {
      await Book.deleteMany({});
      await Book.insertMany(collections.books);
    }
    if (collections.notes) {
      await Note.deleteMany({});
      await Note.insertMany(collections.notes);
    }
    if (collections.studyGroups) {
      await StudyGroup.deleteMany({});
      await StudyGroup.insertMany(collections.studyGroups);
    }
    if (collections.events) {
      await Event.deleteMany({});
      await Event.insertMany(collections.events);
    }

    await logAdminAction(req, 'IMPORT_DATABASE', 'Full Database Restoration');
    return res.status(200).json({ success: true, message: 'Database restored successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Lost & Found Approvals ---
export const approveLostItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const item = await LostItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Lost item not found' });
    item.status = 'approved';
    await item.save();
    await logAdminAction(req, 'APPROVE_LOST_ITEM', `Lost item ID: ${id}`);
    return res.status(200).json({ success: true, item, message: 'Lost item approved and published.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectLostItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const item = await LostItem.findById(id);
    if (!item) return res.status(404).json({ success: false, message: 'Lost item not found' });
    item.status = 'rejected';
    await item.save();
    await logAdminAction(req, 'REJECT_LOST_ITEM', `Lost item ID: ${id}`);
    return res.status(200).json({ success: true, item, message: 'Lost item rejected.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const confirmFoundItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const foundItem = await FoundItem.findById(id).populate('reporter');
    if (!foundItem) return res.status(404).json({ success: false, message: 'Found item not found' });
    foundItem.status = 'found';
    await foundItem.save();
    // If linked to a lost item, mark it as completed
    if (foundItem.lostItem) {
      await LostItem.findByIdAndUpdate(foundItem.lostItem, { status: 'completed' });
    }
    // Award 50 points to finder
    const finder: any = foundItem.reporter;
    if (finder && finder._id) {
      const finderUser = await (await import('../models/User')).default.findById(finder._id);
      if (finderUser) {
        finderUser.points += 50;
        if (finderUser.points >= 100 && !finderUser.badges.includes('Beginner Helper')) finderUser.badges.push('Beginner Helper');
        if (finderUser.points >= 300 && !finderUser.badges.includes('Active Contributor')) finderUser.badges.push('Active Contributor');
        if (finderUser.points >= 600 && !finderUser.badges.includes('Campus Hero')) finderUser.badges.push('Campus Hero');
        await finderUser.save();
      }
    }
    await logAdminAction(req, 'CONFIRM_FOUND_ITEM', `Found item ID: ${id}`);
    return res.status(200).json({ success: true, foundItem, message: 'Found item confirmed. Finder awarded 50 points.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// --- Contact Messages ---
export const getContactMessages = async (req: AuthRequest, res: Response) => {
  try {
    const messages = await ContactMessage.find().populate('sender', 'name email avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, messages });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const msg = await ContactMessage.findByIdAndUpdate(id, { isResolved: true }, { new: true });
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Contact message not found' });
    }

    await logAdminAction(req, 'RESOLVE_CONTACT_MESSAGE', `Contact Message ID: ${id}`);
    return res.status(200).json({ success: true, message: 'Message resolved successfully', msg });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
