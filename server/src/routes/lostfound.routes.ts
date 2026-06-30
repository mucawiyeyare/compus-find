import { Router, Response } from 'express';
import LostItem from '../models/LostItem';
import FoundItem from '../models/FoundItem';
import ContactMessage from '../models/ContactMessage';
import { protect, AuthRequest } from '../middlewares/auth';
import { matchLostFound } from '../services/ai.service';

const router = Router();

// ── LOST ITEMS ──────────────────────────────────────────

// Create a lost item report (auto-published immediately, no admin approval needed)
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
      status: 'lost' // Auto-published immediately — no admin approval required
    });
    return res.status(201).json({ success: true, lostItem });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get all active lost items (public) — ONLY 'lost' status items are shown.
// Items with status 'found_pending', 'found', 'completed', or 'cancelled' are hidden from the board.
router.get('/lost', async (req, res) => {
  try {
    const { category, search } = req.query;
    // Strictly only show items that are still actively lost and unclaimed
    const query: any = { status: 'lost' };
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

// Submit a found item report.
// If linked to a lost item (lostItemId), that LostItem is immediately moved to
// 'found_pending' so it is removed from the public board right away.
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

    // ─── KEY CHANGE ───────────────────────────────────────────────────────────
    // If this found report is linked to a specific lost item, immediately update
    // that LostItem's status to 'found_pending' so it disappears from the public
    // board. It will remain accessible in the student's own history (/my-lost)
    // and in the admin panel, but NOT on the Home page.
    if (lostItemId) {
      await LostItem.findByIdAndUpdate(lostItemId, { status: 'found_pending' });
    }
    // ─────────────────────────────────────────────────────────────────────────

    return res.status(201).json({ success: true, foundItem });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Found/claimed items are NOT shown publicly — they only appear in each student's own dashboard history.
// This route is kept for backward-compatibility but returns an empty result for the public board.
router.get('/found', async (req, res) => {
  try {
    // Found items are private — visible only to the reporter via /my-found.
    // Return empty array so the public board never shows found/claimed items.
    return res.status(200).json({ success: true, items: [] });
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
