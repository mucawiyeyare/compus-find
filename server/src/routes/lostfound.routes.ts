import { Router, Response } from 'express';
import LostItem from '../models/LostItem';
import FoundItem from '../models/FoundItem';
import ContactMessage from '../models/ContactMessage';
import { protect, AuthRequest } from '../middlewares/auth';
import { matchLostFound } from '../services/ai.service';

const router = Router();

// ── LOST ITEMS ──────────────────────────────────────────

// Create a lost item report (status: pending, awaiting admin approval)
router.post('/lost', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, location, dateLost, image, images, contact } = req.body;
    const lostItem = await LostItem.create({
      reporter: req.user?._id,
      title,
      description,
      category,
      location,
      contact,
      dateLost: new Date(dateLost),
      image,
      images: images || (image ? [image] : []),
      status: 'pending'
    });
    return res.status(201).json({ success: true, lostItem });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get all approved lost items (public)
router.get('/lost', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query: any = { status: 'approved' };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    const items = await LostItem.find(query).populate('reporter', 'name email avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get authenticated user's own lost items (all statuses)
router.get('/my-lost', protect, async (req: AuthRequest, res: Response) => {
  try {
    const items = await LostItem.find({ reporter: req.user?._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── FOUND ITEMS ──────────────────────────────────────────

// Create a found item report (status: found_pending, awaiting admin approval)
router.post('/found', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, category, location, dateFound, image, images, lostItemId } = req.body;
    const claimVerificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const foundItem = await FoundItem.create({
      reporter: req.user?._id,
      lostItem: lostItemId || undefined,
      title,
      description,
      category,
      location,
      dateFound: new Date(dateFound),
      image,
      images: images || (image ? [image] : []),
      claimVerificationCode,
      status: 'found_pending'
    });
    return res.status(201).json({ success: true, foundItem });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get all confirmed found items (public)
router.get('/found', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query: any = { status: 'found' };
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    const items = await FoundItem.find(query).populate('reporter', 'name email avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get authenticated user's own found item reports
router.get('/my-found', protect, async (req: AuthRequest, res: Response) => {
  try {
    const items = await FoundItem.find({ reporter: req.user?._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, items });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── CLAIM VERIFICATION ──────────────────────────────────────────

router.post('/verify-claim', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { foundItemId, verificationCode } = req.body;
    const found = await FoundItem.findById(foundItemId);
    if (!found) return res.status(404).json({ success: false, message: 'Found item not found' });
    if (found.claimVerificationCode !== verificationCode) {
      return res.status(400).json({ success: false, message: 'Invalid verification handoff code' });
    }
    found.status = 'returned';
    found.claimedBy = req.user?._id as any;
    await found.save();
    return res.status(200).json({ success: true, message: 'Item claimed successfully', found });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ── CONTACT ADMIN ──────────────────────────────────────────

router.post('/contact-admin', protect, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    const contactMsg = await ContactMessage.create({
      sender: req.user?._id,
      name: name || req.user?.name,
      email: email || req.user?.email,
      subject,
      message
    });
    return res.status(201).json({ success: true, contactMsg });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
