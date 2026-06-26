import { Router, Response } from 'express';
import Mentor from '../models/Mentor';
import Session from '../models/Session';
import User from '../models/User';
import { protect, AuthRequest } from '../middlewares/auth';

const router = Router();

// Create/Update Mentor Profile
router.post('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { bio, department, subjects, skills, availability } = req.body;
    let mentor = await Mentor.findOne({ user: req.user?._id });

    if (mentor) {
      mentor.bio = bio;
      mentor.department = department;
      mentor.subjects = subjects;
      mentor.skills = skills;
      mentor.availability = availability;
      await mentor.save();
    } else {
      mentor = await Mentor.create({
        user: req.user?._id,
        bio,
        department,
        subjects,
        skills,
        availability
      });

      // Update role to mentor
      if (req.user) {
        req.user.role = 'mentor';
        await req.user.save();
      }
    }

    return res.status(200).json({ success: true, mentor });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// List all Mentors
router.get('/mentors', async (req, res) => {
  try {
    const { department, subject } = req.query;
    const query: any = {};
    if (department) query.department = department;
    if (subject) query.subjects = { $in: [subject] };

    const mentors = await Mentor.find(query)
      .populate('user', 'name email avatar')
      .sort({ rating: -1 });

    return res.status(200).json({ success: true, mentors });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Request Mentorship Session
router.post('/request-session', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { mentorId, subject, date, timeSlot, notes } = req.body;
    const session = await Session.create({
      mentor: mentorId,
      student: req.user?._id,
      subject,
      date: new Date(date),
      timeSlot,
      notes,
      status: 'pending'
    });

    return res.status(201).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get User's Sessions (Both Mentor and Student roles)
router.get('/sessions', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401);
    const mentorProfile = await Mentor.findOne({ user: req.user._id });

    const studentSessions = await Session.find({ student: req.user._id })
      .populate({ path: 'mentor', populate: { path: 'user', select: 'name email avatar' } })
      .sort({ date: -1 });

    let mentorSessions: any[] = [];
    if (mentorProfile) {
      mentorSessions = await Session.find({ mentor: mentorProfile._id })
        .populate('student', 'name email avatar')
        .sort({ date: -1 });
    }

    return res.status(200).json({ success: true, studentSessions, mentorSessions });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update Session Status
router.put('/session/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { status, whatsappGroupLink, whatsappNumber } = req.body;
    const session = await Session.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = status;
    if (status === 'accepted') {
      if (!whatsappGroupLink && !whatsappNumber) {
        return res.status(400).json({ success: false, message: 'At least one valid communication method (WhatsApp Group Link or Contact Number) must be provided.' });
      }
      session.whatsappGroupLink = whatsappGroupLink || undefined;
      session.whatsappNumber = whatsappNumber || undefined;
      // Keep meetingLink as a backup mockup link
      session.meetingLink = `https://meet.google.com/campus-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
    }

    await session.save();

    // Reward points for mentor if completed
    if (status === 'completed') {
      const mProfile = await Mentor.findById(session.mentor).populate('user');
      if (mProfile && mProfile.user) {
        const u: any = mProfile.user;
        u.points += 30; // 30 points for completing a mentoring session
        if (u.points >= 300 && !u.badges.includes('Elite Mentor')) {
          u.badges.push('Elite Mentor');
        }
        await u.save();
      }
    }

    return res.status(200).json({ success: true, session });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
