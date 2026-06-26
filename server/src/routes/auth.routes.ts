import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { protect, AuthRequest } from '../middlewares/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkeyforcampusconnect';

import Mentor from '../models/Mentor';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, avatar, bio, skills } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    if (role === 'mentor') {
      if (!avatar) {
        return res.status(400).json({ success: false, message: 'Profile image is mandatory for mentors.' });
      }
      if (!bio || !bio.trim()) {
        return res.status(400).json({ success: false, message: 'Short bio is required for mentors.' });
      }
      if (!skills || !skills.trim()) {
        return res.status(400).json({ success: false, message: 'Skills are required for mentors.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      department,
      avatar: avatar || undefined,
      isVerified: true
    });

    if (role === 'mentor') {
      const parsedSkills = typeof skills === 'string'
        ? skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : Array.isArray(skills) ? skills : [];

      await Mentor.create({
        user: user._id,
        bio,
        department: department || 'Computer Science',
        skills: parsedSkills,
        subjects: parsedSkills,
        availability: [{ day: 'Monday', slots: ['10:00 AM', '02:00 PM'] }]
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ success: true, token, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({ success: true, token, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get profile
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  return res.status(200).json({ success: true, user: req.user });
});

// Award points / gamification helper endpoint
router.post('/award-points', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { points, action } = req.body;
    if (!req.user) return res.status(401);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.points += points;

    // Badge triggers
    if (user.points >= 100 && !user.badges.includes('Beginner Helper')) {
      user.badges.push('Beginner Helper');
    }
    if (user.points >= 300 && !user.badges.includes('Active Contributor')) {
      user.badges.push('Active Contributor');
    }
    if (user.points >= 600 && !user.badges.includes('Campus Hero')) {
      user.badges.push('Campus Hero');
    }

    await user.save();
    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update Profile (Avatar)
router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { avatar } = req.body;
    if (!req.user) return res.status(401);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    await user.save();

    return res.status(200).json({ success: true, user });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

