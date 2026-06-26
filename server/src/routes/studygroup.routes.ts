import { Router, Response } from 'express';
import StudyGroup from '../models/StudyGroup';
import { protect, AuthRequest } from '../middlewares/auth';

const router = Router();

// Create Study Group
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, subject } = req.body;
    const group = await StudyGroup.create({
      creator: req.user?._id,
      name,
      description,
      subject,
      members: [req.user?._id]
    });

    if (req.user) {
      req.user.points += 10;
      await req.user.save();
    }

    return res.status(201).json({ success: true, group });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// List Study Groups
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const groups = await StudyGroup.find(query)
      .populate('creator', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, groups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Join Group
router.post('/:id/join', protect, async (req: AuthRequest, res: Response) => {
  try {
    const group = await StudyGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Study group not found' });
    }

    if (group.members.includes(req.user?._id as any)) {
      return res.status(400).json({ success: false, message: 'You are already a member' });
    }

    group.members.push(req.user?._id as any);
    await group.save();

    return res.status(200).json({ success: true, group });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Add Task to Group
router.post('/:id/task', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { title, assignedTo } = req.body;
    const group = await StudyGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    group.tasks.push({ title, status: 'pending', assignedTo });
    await group.save();

    return res.status(200).json({ success: true, group });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
