import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import lostfoundRoutes from './routes/lostfound.routes';
import mentorshipRoutes from './routes/mentorship.routes';
import booksRoutes from './routes/books.routes';
import notesRoutes from './routes/notes.routes';
import studygroupRoutes from './routes/studygroup.routes';
import campusRoutes from './routes/campus.routes';
import uploadRoutes from './routes/upload.routes';
import adminRoutes from './routes/admin.routes';
import path from 'path';

const app = express();

// Security and basic middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' })); // Allow all in dev mode
app.use(express.json());

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 200, // Limit each IP to 200 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/lostfound', lostfoundRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/studygroup', studygroupRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);


// Base route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Smart Campus Connect API Server Online' });
});

// Error handling fallback
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

export default app;
