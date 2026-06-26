import { Router, Response } from 'express';
import Note from '../models/Note';
import { protect, AuthRequest } from '../middlewares/auth';

const router = Router();

// Upload Note
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, fileUrl, fileType } = req.body;
    const note = await Note.create({
      uploader: req.user?._id,
      title,
      description,
      category,
      fileUrl,
      fileType: fileType || 'pdf'
    });

    // Award sharing points
    if (req.user) {
      req.user.points += 15;
      await req.user.save();
    }

    return res.status(201).json({ success: true, note });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get Notes
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const notes = await Note.find(query).populate('uploader', 'name email avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, notes });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Increment download count
router.post('/:id/download', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    note.downloadsCount += 1;
    await note.save();

    return res.status(200).json({ success: true, note });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
