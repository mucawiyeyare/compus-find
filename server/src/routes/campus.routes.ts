import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import LostItem from '../models/LostItem';
import FoundItem from '../models/FoundItem';
import Book from '../models/Book';
import Note from '../models/Note';
import StudyGroup from '../models/StudyGroup';
import Session from '../models/Session';
import Event from '../models/Event';
import { explainConcept, generateQuiz, createStudyPlan, analyzeResume } from '../services/ai.service';

const router = Router();

// AI endpoints
router.post('/ai/explain', protect, async (req, res) => {
  try {
    const { concept } = req.body;
    const explanation = await explainConcept(concept);
    return res.status(200).json({ success: true, explanation });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/ai/quiz', protect, async (req, res) => {
  try {
    const { subject } = req.body;
    const quiz = await generateQuiz(subject);
    return res.status(200).json({ success: true, quiz });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/ai/study-plan', protect, async (req, res) => {
  try {
    const { goal, hours } = req.body;
    const plan = await createStudyPlan(goal, hours);
    return res.status(200).json({ success: true, plan });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/ai/analyze-resume', protect, async (req, res) => {
  try {
    const { resumeText } = req.body;
    const review = await analyzeResume(resumeText);
    return res.status(200).json({ success: true, review });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Events & Announcements
router.post('/events', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, date, location } = req.body;
    const event = await Event.create({
      creator: req.user?._id,
      title,
      description,
      category,
      date: new Date(date),
      location
    });

    return res.status(201).json({ success: true, event });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/events', async (req, res) => {
  try {
    const events = await Event.find().populate('creator', 'name avatar').sort({ date: 1 });
    return res.status(200).json({ success: true, events });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find().select('name avatar points role department badges').sort({ points: -1 }).limit(10);
    return res.status(200).json({ success: true, users });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Analytics Dashboard Statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const lostResolved = await FoundItem.countDocuments({ status: 'returned' });
    const sharedBooks = await Book.countDocuments();
    const notesShared = await Note.countDocuments();
    const studyGroups = await StudyGroup.countDocuments();
    const totalSessions = await Session.countDocuments();

    // Generate mock graph data points
    const engagementMetrics = [
      { month: 'Jan', activeUsers: Math.min(100, totalUsers * 5), resourcesShared: 12 },
      { month: 'Feb', activeUsers: Math.min(250, totalUsers * 8), resourcesShared: 25 },
      { month: 'Mar', activeUsers: Math.min(480, totalUsers * 12), resourcesShared: 64 },
      { month: 'Apr', activeUsers: Math.min(850, totalUsers * 16), resourcesShared: 110 },
      { month: 'May', activeUsers: Math.min(1200, totalUsers * 22), resourcesShared: 145 },
      { month: 'Jun', activeUsers: Math.min(1800, totalUsers * 25), resourcesShared: 210 }
    ];

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        lostResolved,
        sharedBooks,
        notesShared,
        studyGroups,
        totalSessions
      },
      engagementMetrics
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
