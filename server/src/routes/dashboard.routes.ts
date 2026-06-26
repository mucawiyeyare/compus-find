import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { validateChartQuery } from '../validations/dashboard.validation';
import {
  getDashboardStats,
  getDashboardCharts,
  getRecentActivities,
  getDashboardNotifications,
  getDashboardMessages,
  getDashboardBooks,
  getDashboardEvents,
  getDashboardStudyGroups
} from '../controllers/dashboard.controller';

const router = Router();

router.get('/stats', protect, getDashboardStats);
router.get('/charts', protect, validateChartQuery, getDashboardCharts);
router.get('/recent-activities', protect, getRecentActivities);
router.get('/notifications', protect, getDashboardNotifications);
router.get('/messages', protect, getDashboardMessages);
router.get('/books', protect, getDashboardBooks);
router.get('/events', protect, getDashboardEvents);
router.get('/study-groups', protect, getDashboardStudyGroups);

export default router;
