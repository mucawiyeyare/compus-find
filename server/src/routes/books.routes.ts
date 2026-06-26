import { Router, Response } from 'express';
import Book from '../models/Book';
import { protect, AuthRequest } from '../middlewares/auth';

const router = Router();

// Create Book
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { title, author, category, description, coverImage } = req.body;
    const book = await Book.create({
      owner: req.user?._id,
      title,
      author,
      category,
      description,
      coverImage
    });

    // Award sharing points
    if (req.user) {
      req.user.points += 20;
      await req.user.save();
    }

    return res.status(201).json({ success: true, book });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get all Books
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query: any = {};
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query).populate('owner', 'name email avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, books });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Reserve Book
router.put('/:id/reserve', protect, async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.status !== 'available') {
      return res.status(400).json({ success: false, message: 'Book is not available for reservation' });
    }

    book.status = 'reserved';
    book.reservedBy = req.user?._id as any;
    await book.save();

    return res.status(200).json({ success: true, book });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Collected Book (Completing the handoff)
router.put('/:id/collect', protect, async (req: AuthRequest, res: Response) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Only original owner can mark as collected
    if (book.owner.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only book owner can mark as collected' });
    }

    book.status = 'collected';
    await book.save();

    return res.status(200).json({ success: true, book });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
