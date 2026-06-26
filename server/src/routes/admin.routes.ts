import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import {
  getAdminStats,
  getAllUsers,
  updateUserProfile,
  forcePasswordReset,
  deleteUser,
  getAllMentors,
  approveMentorProfile,
  removeMentorProfile,
  getLostFoundItems,
  updateLostFoundItem,
  deleteLostFoundItem,
  approveLostItem,
  rejectLostItem,
  confirmFoundItem,
  getContactMessages,
  resolveContactMessage,
  getBooks,
  deleteBook,
  getNotes,
  approveNote,
  deleteNote,
  getStudyGroups,
  deleteStudyGroup,
  createEvent,
  updateEvent,
  deleteEvent,
  getSettings,
  updateSettings,
  getAuditLogs,
  exportDatabase,
  importDatabase,
  getReportTrends
} from '../controllers/admin.controller';

const router = Router();

// Secure all admin routes
router.use(protect);
router.use(authorize('admin'));

// Stats & logs
router.get('/stats', getAdminStats);
router.get('/report-trends', getReportTrends);
router.get('/logs', getAuditLogs);

// Users
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserProfile);
router.post('/users/:id/reset-password', forcePasswordReset);
router.delete('/users/:id', deleteUser);

// Mentors
router.get('/mentors', getAllMentors);
router.put('/mentors/:id/approve', approveMentorProfile);
router.delete('/mentors/:id', removeMentorProfile);

// Lost & Found
router.get('/lostfound', getLostFoundItems);
router.put('/lostfound/:id/approve-lost', approveLostItem);
router.put('/lostfound/:id/reject-lost', rejectLostItem);
router.put('/lostfound/:id/confirm-found', confirmFoundItem);
router.put('/lostfound/:id/:type', updateLostFoundItem);
router.delete('/lostfound/:id/:type', deleteLostFoundItem);

// Contact messages
router.get('/contact-messages', getContactMessages);
router.put('/contact-messages/:id/resolve', resolveContactMessage);

// Books
router.get('/books', getBooks);
router.delete('/books/:id', deleteBook);

// Notes
router.get('/notes', getNotes);
router.put('/notes/:id/approve', approveNote);
router.delete('/notes/:id', deleteNote);

// Study Groups
router.get('/groups', getStudyGroups);
router.delete('/groups/:id', deleteStudyGroup);

// Events
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// Settings & DB Utilities
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/db/export', exportDatabase);
router.post('/db/import', importDatabase);

export default router;
