import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middlewares/auth';
import { validateFile } from '../middlewares/fileValidation.middleware';
import {
  uploadImage,
  uploadImages,
  uploadDocument,
  uploadVideo,
  deleteMedia,
  getMediaById,
  getUserMedia
} from '../controllers/upload.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload endpoints
router.post('/image', protect, upload.single('file'), validateFile('image'), uploadImage);
router.post('/images', protect, upload.array('files', 10), validateFile('images'), uploadImages);
router.post('/document', protect, upload.single('file'), validateFile('document'), uploadDocument);
router.post('/video', protect, upload.single('file'), validateFile('video'), uploadVideo);

// Management endpoints
router.delete('/:id', protect, deleteMedia);
router.get('/:id', protect, getMediaById);
router.get('/user/:userId', protect, getUserMedia);

export default router;
